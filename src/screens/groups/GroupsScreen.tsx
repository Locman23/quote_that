import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import AppButton from '../../components/AppButton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import GroupCard from '../../components/GroupCard';
import LoadingState from '../../components/LoadingState';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Groups'>;

type GroupListItem = {
  id: string;
  name: string;
  join_code: string;
};

export default function GroupsScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user);
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadGroups() {
        if (!user) {
          if (isActive) {
            setGroups([]);
            setErrorMessage('You need to be signed in to view groups.');
            setIsLoading(false);
          }
          return;
        }

        setIsLoading(true);
        setErrorMessage(null);

        const { data, error } = await supabase
          .from('group_members')
          .select('group:groups(id, name, join_code)')
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false });

        if (!isActive) {
          return;
        }

        if (error) {
          setGroups([]);
          setErrorMessage('Unable to load your groups right now. Please try again.');
          setIsLoading(false);
          return;
        }

        const nextGroups = (data ?? [])
          .map((item) => {
            const group = Array.isArray(item.group) ? item.group[0] : item.group;

            if (!group) {
              return null;
            }

            return {
              id: group.id,
              name: group.name,
              join_code: group.join_code,
            } satisfies GroupListItem;
          })
          .filter((group): group is GroupListItem => group !== null);

        setGroups(nextGroups);
        setIsLoading(false);
      }

      void loadGroups();

      return () => {
        isActive = false;
      };
    }, [user])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Groups</Text>
          <Text style={styles.subtitle}>Create and manage your quote circles.</Text>
        </View>

        {isLoading ? (
          <LoadingState message="Loading your groups..." />
        ) : errorMessage ? (
          <ErrorState title="Could not load groups" message={errorMessage} />
        ) : groups.length === 0 ? (
          <View style={styles.emptyStateWrap}>
            <EmptyState
              title="No groups yet"
              message="You have not joined any groups yet. Create one or join with a code to get started."
            />
            <View style={styles.emptyActions}>
              <AppButton title="Create Group" onPress={() => navigation.navigate('CreateGroup')} />
              <AppButton title="Join Group" variant="secondary" onPress={() => navigation.navigate('JoinGroup')} />
            </View>
          </View>
        ) : (
          <FlatList
            ListHeaderComponent={
              <Text style={styles.sectionTitle}>My Groups</Text>
            }
            data={groups}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <GroupCard
                name={item.name}
                joinCode={item.join_code}
                onPress={() => {
                  navigation.navigate('GroupDetail', {
                    groupId: item.id,
                    groupName: item.name,
                  });
                }}
              />
            )}
            ListFooterComponent={
              <View style={styles.listFooterActions}>
                <AppButton title="Create Group" onPress={() => navigation.navigate('CreateGroup')} />
                <AppButton title="Join Group" variant="secondary" onPress={() => navigation.navigate('JoinGroup')} />
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  headerBlock: {
    gap: spacing.xs,
  },
  title: {
    ...typography.largeTitle,
    color: colors.text,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.body,
    color: colors.mutedText,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  emptyStateWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  listContent: {
    gap: spacing.xs,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  emptyActions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  listFooterActions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});