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

function getProfileBootstrapErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'We could not finish loading your profile. Please sign in again.';
  }

  const message = error.message.toLowerCase();

  if (message.includes('username') || message.includes('profiles_username_key')) {
    return 'We could not finish loading your profile because that username is already in use.';
  }

  if (message.includes('row-level security') || message.includes('jwt')) {
    return 'We could not finish loading your profile because access was denied. Check your Supabase auth settings and try again.';
  }

  return 'We could not finish loading your profile. Please sign in again.';
}

type ResolvedAuthState = {
  session: Session | null;
  authError: string | null;
};

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  authError: string | null;
  initialize: () => void;
  clearAuthError: () => void;
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
    return {
      session: null,
      authError: null,
    } satisfies ResolvedAuthState;
  }

  try {
    await ensureProfile(validSession.user);
    return {
      session: validSession,
      authError: null,
    } satisfies ResolvedAuthState;
  } catch (error) {
    await supabase.auth.signOut();
    return {
      session: null,
      authError: getProfileBootstrapErrorMessage(error),
    } satisfies ResolvedAuthState;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  authError: null,

  initialize: () => {
    if (authSubscription) return;

    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (error) {
          set({ session: null, user: null, isLoading: false, authError: null });
          return;
        }
        const resolvedAuthState = await resolveAuthenticatedUser(session);

        set((state) => ({
          session: resolvedAuthState.session,
          user: resolvedAuthState.session?.user ?? null,
          isLoading: false,
          authError:
            resolvedAuthState.authError
            ?? (resolvedAuthState.session ? null : state.authError),
        }));
      })
      .catch(() => {
        set({ session: null, user: null, isLoading: false, authError: null });
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const resolvedAuthState = await resolveAuthenticatedUser(session);

      set((state) => ({
        session: resolvedAuthState.session,
        user: resolvedAuthState.session?.user ?? null,
        isLoading: false,
        authError:
          resolvedAuthState.authError
          ?? (resolvedAuthState.session ? null : state.authError),
      }));
    });

    authSubscription = subscription;
  },

  clearAuthError: () => {
    set({ authError: null });
  },

  signOut: async () => {
    set({ authError: null });

    // Supabase v2 clears the local session before the server call, so the
    // onAuthStateChange(SIGNED_OUT) listener fires regardless of server errors.
    // Return the error rather than throwing so callers aren't misled into
    // thinking the user is still signed in when they aren't.
    const { error } = await supabase.auth.signOut();
    return error;
  },
}));
