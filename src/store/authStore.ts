import { create } from 'zustand';
import { AuthError, Session, User, Subscription } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

async function ensureProfile(user: User) {
  const metadata = user.user_metadata ?? {};
  const username = typeof metadata.username === 'string' ? metadata.username.trim() : '';
  const email = user.email?.trim().toLowerCase();

  if (!username || !email) {
    return;
  }

  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      username,
      email,
    },
    { onConflict: 'id' }
  );

  if (error) {
    throw error;
  }
}

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  initialize: () => void;
  signOut: () => Promise<AuthError | null>;
}

// Module-level ref — prevents duplicate subscriptions on re-renders / fast refresh
let authSubscription: Subscription | null = null;

async function resolveValidSession(session: Session | null) {
  if (!session) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    await supabase.auth.signOut();
    return null;
  }

  return session;
}

async function resolveAuthenticatedUser(session: Session | null) {
  const validSession = await resolveValidSession(session);

  if (!validSession?.user) {
    return null;
  }

  try {
    await ensureProfile(validSession.user);
    return validSession;
  } catch {
    await supabase.auth.signOut();
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,

  initialize: () => {
    if (authSubscription) return;

    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (error) {
          set({ session: null, user: null, isLoading: false });
          return;
        }
        const authenticatedSession = await resolveAuthenticatedUser(session);

        set({
          session: authenticatedSession,
          user: authenticatedSession?.user ?? null,
          isLoading: false,
        });
      })
      .catch(() => {
        set({ session: null, user: null, isLoading: false });
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authenticatedSession = await resolveAuthenticatedUser(session);

      set({
        session: authenticatedSession,
        user: authenticatedSession?.user ?? null,
        isLoading: false,
      });
    });

    authSubscription = subscription;
  },

  signOut: async () => {
    // Supabase v2 clears the local session before the server call, so the
    // onAuthStateChange(SIGNED_OUT) listener fires regardless of server errors.
    // Return the error rather than throwing so callers aren't misled into
    // thinking the user is still signed in when they aren't.
    const { error } = await supabase.auth.signOut();
    return error;
  },
}));
