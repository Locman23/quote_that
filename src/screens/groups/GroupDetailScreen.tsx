import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { deleteOwnQuote, listQuotesForGroup } from '../../lib/quotes';
import { supabase } from '../../lib/supabase';
import { useGroupMembershipGuard } from '../../utils/useGroupMembershipGuard';
import { useAuthStore } from '../../store/authStore';
import type { QuoteRecord } from '../../types';
import { getQuoteMutationErrorMessage } from '../quotes/quoteForm';
import CircleIconButton from '../../components/CircleIconButton';
import QuoteCard from '../../components/QuoteCard';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupDetail'>;

const ACCENT = '#6DBF8A';

function formatCreatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleString();
}

export default function GroupDetailScreen({ route, navigation }: Props) {
  const { groupId, groupName, newQuote, refreshNonce } = route.params;
  const groupAccess = useGroupMembershipGuard(groupId, groupName);
  const resolvedGroupName = groupAccess.groupName ?? groupName;
  const user = useAuthStore((state) => state.user);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(true);
  const [isRefreshingQuotes, setIsRefreshingQuotes] = useState(false);
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);
  const [quotesErrorMessage, setQuotesErrorMessage] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);

  useEffect(() => {
    if (!newQuote) {
      return;
    }

    setQuotes((currentQuotes) => {
      const withoutDuplicate = currentQuotes.filter((quote) => quote.id !== newQuote.id);
      return [newQuote, ...withoutDuplicate];
    });
  }, [newQuote]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadQuotes() {
        if (!groupAccess.hasAccess) {
          if (isActive) {
            setQuotes([]);
            setQuotesErrorMessage(null);
            setIsLoadingQuotes(false);
            setIsRefreshingQuotes(false);
          }
          return;
        }

        const shouldShowFullScreenLoader = quotes.length === 0;

        if (shouldShowFullScreenLoader) {
          setIsLoadingQuotes(true);
        } else {
          setIsRefreshingQuotes(true);
        }

        setQuotesErrorMessage(null);

        if (!isActive) {
          return;
        }

        try {
          const data = await listQuotesForGroup(groupId);

          if (!isActive) {
            return;
          }

          setQuotes(data);
          setIsLoadingQuotes(false);
          setIsRefreshingQuotes(false);
        } catch (_error) {
          setQuotes([]);
          setQuotesErrorMessage('Unable to load quotes right now. Please try again.');
          setIsLoadingQuotes(false);
          setIsRefreshingQuotes(false);
        }
      }

      void loadQuotes();

      return () => {
        isActive = false;
      };
    }, [groupAccess.hasAccess, groupId, refreshNonce])
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadJoinCode() {
        if (!groupAccess.hasAccess) {
          if (isActive) {
            setJoinCode(null);
          }
          return;
        }

        const { data, error } = await supabase
          .from('groups')
          .select('join_code')
          .eq('id', groupId)
          .maybeSingle();

        if (!isActive) {
          return;
        }

        if (error || !data?.join_code) {
          setJoinCode(null);
          return;
        }

        setJoinCode(data.join_code);
      }

      void loadJoinCode();

      return () => {
        isActive = false;
      };
    }, [groupAccess.hasAccess, groupId, refreshNonce])
  );

  const handleDeleteQuote = useCallback(
    async (quote: QuoteRecord) => {
      if (!user) {
        Alert.alert('Delete Quote Error', 'You must be signed in to delete a quote.');
        return;
      }

      try {
        setDeletingQuoteId(quote.id);
        await deleteOwnQuote({
          groupId,
          quoteId: quote.id,
          userId: user.id,
        });

        setQuotes((currentQuotes) => currentQuotes.filter((currentQuote) => currentQuote.id !== quote.id));
      } catch (error) {
        Alert.alert('Delete Quote Error', getQuoteMutationErrorMessage('delete', error));
      } finally {
        setDeletingQuoteId(null);
      }
    },
    [groupId, user]
  );

  const confirmDeleteQuote = useCallback(
    (quote: QuoteRecord) => {
      Alert.alert('Delete Quote', 'This will permanently remove your quote from the group.', [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void handleDeleteQuote(quote);
          },
        },
      ]);
    },
    [handleDeleteQuote]
  );

  if (groupAccess.isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.stateText}>Checking group access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!groupAccess.hasAccess) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{groupAccess.errorMessage}</Text>
          <CircleIconButton icon="⌂" accessibilityLabel="Back to home" onPress={() => navigation.navigate('Groups')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <CircleIconButton icon="⌂" accessibilityLabel="Back to home" onPress={() => navigation.navigate('Groups')} />
          <Text style={styles.groupTitle} numberOfLines={1}>{resolvedGroupName}</Text>
          <View style={styles.headerActions}>
            <CircleIconButton
              icon={isRefreshingQuotes ? '…' : '↻'}
              accessibilityLabel="Refresh quotes"
              onPress={() => navigation.setParams({ refreshNonce: Date.now() })}
            />
            <CircleIconButton
              icon="＋"
              filled
              accessibilityLabel="Add quote"
              onPress={() => navigation.navigate('CreateQuote', { groupId, groupName: resolvedGroupName })}
            />
          </View>
        </View>

        <Text style={styles.groupSubtitle}>
          {joinCode ? `Join Code: ${joinCode}` : 'Join Code unavailable'}
        </Text>

        {isRefreshingQuotes ? (
          <View style={styles.inlineRefreshState}>
            <ActivityIndicator size="small" color={ACCENT} />
            <Text style={styles.inlineRefreshText}>Refreshing quotes...</Text>
          </View>
        ) : null}

        {isLoadingQuotes ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={styles.stateText}>Loading quotes...</Text>
          </View>
        ) : quotesErrorMessage ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{quotesErrorMessage}</Text>
          </View>
        ) : quotes.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>No quotes yet. Add the first one for this group.</Text>
          </View>
        ) : (
          <FlatList
            data={quotes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isOwnQuote = item.created_by === user?.id;
              const isDeletingThisQuote = deletingQuoteId === item.id;

              return (
                <View>
                  <QuoteCard
                    quotedPersonName={item.quoted_person_name}
                    content={item.content}
                    context={item.context ?? undefined}
                    createdAt={item.created_at}
                    isEdited={item.updated_at !== item.created_at}
                  />
                  {isOwnQuote ? (
                    <View style={styles.quoteActions}>
                      <Pressable
                        style={styles.quoteActionButton}
                        onPress={() =>
                          navigation.navigate('EditQuote', {
                            groupId,
                            groupName: resolvedGroupName,
                            quote: item,
                          })
                        }
                        disabled={isDeletingThisQuote}
                      >
                        <Text style={styles.quoteActionText}>Edit</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.quoteActionButton, styles.quoteDangerButton]}
                        onPress={() => confirmDeleteQuote(item)}
                        disabled={isDeletingThisQuote}
                      >
                        <Text style={[styles.quoteActionText, styles.quoteDangerText]}>
                          {isDeletingThisQuote ? 'Deleting...' : 'Delete'}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  groupTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  groupSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#777777',
    textAlign: 'center',
    marginTop: -8,
  },
  headerActions: { flexDirection: 'row', gap: 10 },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  inlineRefreshState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineRefreshText: {
    fontSize: 14,
    color: '#777777',
  },
  stateText: { fontSize: 15, color: '#777777', textAlign: 'center' },
  errorText: { fontSize: 15, color: '#B00020', textAlign: 'center' },
  listContent: { gap: 12, paddingBottom: 12 },
  quoteActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  quoteActionButton: {
    borderWidth: 1.5,
    borderColor: ACCENT,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  quoteDangerButton: {
    borderColor: '#E5B7BD',
  },
  quoteActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: ACCENT,
  },
  quoteDangerText: {
    color: '#B00020',
  },
});