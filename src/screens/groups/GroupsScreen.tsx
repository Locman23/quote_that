import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
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
import { createQuote } from '../../lib/quotes';
import { useAuthStore } from '../../store/authStore';
import GroupCard from '../../components/GroupCard';

const ACCENT = '#6DBF8A';

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
  const [selectingGroup, setSelectingGroup] = useState(false);
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);
  const [quotedPerson, setQuotedPerson] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canAdd = quickQuote.trim().length > 0;

  function handleAddPress() {
    if (canAdd) {
      Keyboard.dismiss();
      setSelectingGroup(true);
    }
  }

  function handleCancelSelect() {
    setSelectingGroup(false);
  }

  function handleGroupTapped(groupId: string) {
    setPendingGroupId(groupId);
    setSelectingGroup(false);
  }

  function handleDismissNamePrompt() {
    setPendingGroupId(null);
    setQuotedPerson('');
    setSelectingGroup(true);
  }

  async function handleConfirmSave() {
    if (!user || !pendingGroupId) return;
    Keyboard.dismiss();
    setIsSaving(true);
    try {
      await createQuote({
        groupId: pendingGroupId,
        userId: user.id,
        values: {
          content: quickQuote.trim(),
          quotedPersonName: quotedPerson.trim(),
        },
      });
      setPendingGroupId(null);
      setQuotedPerson('');
      setQuickQuote('');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not save quote. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  const usernameInitial =
    (typeof user?.user_metadata?.username === 'string'
      ? user.user_metadata.username[0]
      : user?.email?.[0] ?? '?'
    ).toUpperCase();

  function handleOpenSettings() {
    const parentNavigation = navigation.getParent();

    if (parentNavigation) {
      parentNavigation.navigate('SettingsTab' as never);
      return;
    }

    navigation.navigate('Settings');
  }

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
      <View
        style={[styles.header, selectingGroup && styles.dimmed]}
        pointerEvents={selectingGroup ? 'none' : 'auto'}
      >
        <Pressable style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.avatarText}>{usernameInitial}</Text>
        </Pressable>
        <Pressable style={styles.settingsBtn} onPress={handleOpenSettings}>
          <Text style={styles.settingsIcon}>⚙︎</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* ── Quick Quote Card ── */}
        <View style={styles.quickCard}>
          <View
            pointerEvents={selectingGroup ? 'none' : 'auto'}
            style={[styles.quickInputs, selectingGroup && styles.dimmed]}
          >
            <TextInput
              style={styles.quickInput}
              placeholder="Quick Quote That..."
              placeholderTextColor="#AAAAAA"
              value={quickQuote}
              onChangeText={setQuickQuote}
              multiline
            />
          </View>
          <View style={styles.quickCardFooter}>
            {selectingGroup ? (
              <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.8} onPress={handleCancelSelect}>
                <Text style={styles.cancelBtnText}>✕</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.addBtn, !canAdd && styles.addBtnDisabled]}
                activeOpacity={0.8}
                onPress={handleAddPress}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Groups section ── */}
        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={styles.stateText}>Loading your groups…</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : groups.length === 0 ? (
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
        ) : (
          <FlatList
            ListHeaderComponent={
              <>
                <Text style={styles.sectionTitle}>My Groups</Text>
                {selectingGroup && (
                  <Text style={styles.selectHint}>Tap a group to save your quote</Text>
                )}
              </>
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
                  if (isSaving) {
                    return;
                  }

                  if (selectingGroup) {
                    handleGroupTapped(item.id);
                    return;
                  }

                  navigation.navigate('GroupDetail', {
                    groupId: item.id,
                    groupName: item.name,
                  });
                }}
              />
            )}
            ListFooterComponent={
              !selectingGroup ? (
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
              ) : null
            }
          />
        )}
      </View>

      {/* ── "Who said it?" bottom sheet ── */}
      <Modal
        visible={pendingGroupId !== null}
        transparent
        animationType="slide"
        onRequestClose={handleDismissNamePrompt}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleDismissNamePrompt} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Who said it?</Text>
          <Text style={styles.sheetSubtitle}>Add the name of the person being quoted</Text>
          <TextInput
            style={styles.sheetInput}
            placeholder="e.g. John Smith"
            placeholderTextColor="#AAAAAA"
            value={quotedPerson}
            onChangeText={setQuotedPerson}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => { if (quotedPerson.trim()) void handleConfirmSave(); }}
          />
          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={[styles.secondaryBtn, styles.sheetConfirmBtn]}
              activeOpacity={0.8}
              onPress={handleDismissNamePrompt}
            >
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, styles.sheetConfirmBtn, (!quotedPerson.trim() || isSaving) && styles.addBtnDisabled]}
              activeOpacity={0.8}
              onPress={() => void handleConfirmSave()}
              disabled={!quotedPerson.trim() || isSaving}
            >
              {isSaving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.primaryBtnText}>Save Quote</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
  quickInputs: {
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
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '700',
    lineHeight: 20,
  },

  /* My Groups */
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  selectHint: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: '600',
    marginBottom: 12,
  },
  dimmed: {
    opacity: 0.3,
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

  /* "Who said it?" modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: -4,
  },
  sheetInput: {
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  sheetConfirmBtn: {
    flex: 1,
  },
});