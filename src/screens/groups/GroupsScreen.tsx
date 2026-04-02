import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [quickQuote, setQuickQuote] = useState('');

  const usernameInitial =
    (typeof user?.user_metadata?.username === 'string'
      ? user.user_metadata.username[0]
      : user?.email?.[0] ?? '?'
    ).toUpperCase();

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
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.avatar}>
          <Text style={styles.avatarText}>{usernameInitial}</Text>
        </Pressable>
        <Pressable style={styles.settingsBtn}>
          <Text style={styles.settingsIcon}>⚙︎</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <>
            <View style={styles.quickCard}>
              <TextInput
                style={styles.quickInput}
                placeholder="Quick Quote That..."
                placeholderTextColor="#AAAAAA"
                value={quickQuote}
                onChangeText={setQuickQuote}
                multiline
              />
              <View style={styles.quickCardFooter}>
                <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={ACCENT} />
              <Text style={styles.stateText}>Loading your groups…</Text>
            </View>
          </>
        ) : errorMessage ? (
          <>
            <View style={styles.quickCard}>
              <TextInput
                style={styles.quickInput}
                placeholder="Quick Quote That..."
                placeholderTextColor="#AAAAAA"
                value={quickQuote}
                onChangeText={setQuickQuote}
                multiline
              />
              <View style={styles.quickCardFooter}>
                <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.centerState}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          </>
        ) : groups.length === 0 ? (
          <>
            <View style={styles.quickCard}>
              <TextInput
                style={styles.quickInput}
                placeholder="Quick Quote That..."
                placeholderTextColor="#AAAAAA"
                value={quickQuote}
                onChangeText={setQuickQuote}
                multiline
              />
              <View style={styles.quickCardFooter}>
                <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.centerState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.stateText}>You haven't joined any groups yet.</Text>
              <View style={styles.emptyActions}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('CreateGroup')}
                >
                  <Text style={styles.primaryBtnText}>Create Group</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('JoinGroup')}
                >
                  <Text style={styles.secondaryBtnText}>Join Group</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <FlatList
            ListHeaderComponent={
              <>
                <View style={styles.quickCard}>
                  <TextInput
                    style={styles.quickInput}
                    placeholder="Quick Quote That..."
                    placeholderTextColor="#AAAAAA"
                    value={quickQuote}
                    onChangeText={setQuickQuote}
                    multiline
                  />
                  <View style={styles.quickCardFooter}>
                    <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
                      <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.sectionTitle}>My Groups</Text>
              </>
            }
            data={groups}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.groupCard, pressed && styles.groupCardPressed]}
                onPress={() =>
                  navigation.navigate('GroupDetail', {
                    groupId: item.id,
                    groupName: item.name,
                  })
                }
              >
                <View style={styles.groupCardLeft}>
                  <View style={styles.groupIcon}>
                    <Text style={styles.groupIconText}>{item.name[0]?.toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.groupName}>{item.name}</Text>
                    <Text style={styles.groupMeta}>Code: {item.join_code}</Text>
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            )}
            ListFooterComponent={
              <View style={styles.listFooterActions}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('CreateGroup')}
                >
                  <Text style={styles.primaryBtnText}>Create Group</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('JoinGroup')}
                >
                  <Text style={styles.secondaryBtnText}>Join Group</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const ACCENT = '#6DBF8A';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 24,
    color: '#333',
  },
  emptyIcon: {
    fontSize: 48,
  },
  chevron: {
    fontSize: 24,
    color: '#CCCCCC',
    lineHeight: 28,
  },

  /* Content */
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  /* Quick Quote Card */
  quickCard: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  quickInput: {
    backgroundColor: '#F5F6FA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  quickCardFooter: {
    alignItems: 'flex-end',
  },
  addBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  /* My Groups */
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },

  /* States */
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 40,
  },
  stateText: {
    fontSize: 15,
    color: '#777777',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#B00020',
    textAlign: 'center',
  },

  /* Group list */
  listContent: {
    gap: 12,
    paddingBottom: 24,
    flexGrow: 1,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  groupCardPressed: {
    opacity: 0.85,
  },
  groupCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  groupIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: ACCENT + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: ACCENT,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  groupMeta: {
    fontSize: 13,
    color: '#999999',
    marginTop: 2,
  },

  /* Buttons */
  emptyActions: {
    gap: 10,
    marginTop: 8,
    width: '100%',
    paddingHorizontal: 20,
  },
  listFooterActions: {
    gap: 10,
    marginTop: 16,
  },
  primaryBtn: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: ACCENT,
  },
  secondaryBtnText: {
    color: ACCENT,
    fontWeight: '700',
    fontSize: 15,
  },
});