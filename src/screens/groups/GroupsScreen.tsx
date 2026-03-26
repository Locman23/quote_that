import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

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

  useEffect(() => {
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
        setErrorMessage(error.message);
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
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Groups</Text>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" />
          <Text style={styles.stateText}>Loading your groups...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>You have not joined any groups yet.</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.groupCard}
              onPress={() =>
                navigation.navigate('GroupDetail', {
                  groupId: item.id,
                  groupName: item.name,
                })
              }
            >
              <Text style={styles.groupName}>{item.name}</Text>
              <Text style={styles.groupMeta}>Join code: {item.join_code}</Text>
            </Pressable>
          )}
        />
      )}

      <View style={styles.actions}>
        <Button title="Create Group" onPress={() => navigation.navigate('CreateGroup')} />
        <Button title="Join Group" onPress={() => navigation.navigate('JoinGroup')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 16,
  },
  title: { fontSize: 24, fontWeight: '700' },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  stateText: {
    fontSize: 16,
    color: '#444444',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#B00020',
    textAlign: 'center',
  },
  listContent: {
    gap: 12,
  },
  groupCard: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  groupMeta: {
    fontSize: 14,
    color: '#555555',
  },
  actions: {
    gap: 12,
  },
});