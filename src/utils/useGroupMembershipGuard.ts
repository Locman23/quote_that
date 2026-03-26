import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

type GroupAccessState = {
  groupName: string | null;
  isLoading: boolean;
  hasAccess: boolean;
  errorMessage: string | null;
};

export function useGroupMembershipGuard(groupId: string, fallbackGroupName?: string) {
  const user = useAuthStore((state) => state.user);
  const [state, setState] = useState<GroupAccessState>({
    groupName: fallbackGroupName ?? null,
    isLoading: true,
    hasAccess: false,
    errorMessage: null,
  });

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function verifyGroupAccess() {
        if (!user) {
          if (isActive) {
            setState({
              groupName: fallbackGroupName ?? null,
              isLoading: false,
              hasAccess: false,
              errorMessage: 'You must be signed in to view this group.',
            });
          }
          return;
        }

        setState((currentState) => ({
          ...currentState,
          groupName: currentState.groupName ?? fallbackGroupName ?? null,
          isLoading: true,
          errorMessage: null,
        }));

        const { data, error } = await supabase
          .from('group_members')
          .select('group:groups(id, name)')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!isActive) {
          return;
        }

        if (error) {
          setState({
            groupName: fallbackGroupName ?? null,
            isLoading: false,
            hasAccess: false,
            errorMessage: 'We could not verify your access to this group right now.',
          });
          return;
        }

        const group = Array.isArray(data?.group) ? data.group[0] : data?.group;

        if (!group) {
          setState({
            groupName: fallbackGroupName ?? null,
            isLoading: false,
            hasAccess: false,
            errorMessage: 'You no longer have access to this group.',
          });
          return;
        }

        setState({
          groupName: group.name,
          isLoading: false,
          hasAccess: true,
          errorMessage: null,
        });
      }

      void verifyGroupAccess();

      return () => {
        isActive = false;
      };
    }, [fallbackGroupName, groupId, user])
  );

  return state;
}