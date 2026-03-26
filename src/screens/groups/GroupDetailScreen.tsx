import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  View,
  Text,
  Button,
  StyleSheet,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useGroupMembershipGuard } from '../../utils/useGroupMembershipGuard';
import { supabase } from '../../lib/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupDetail'>;

type QuoteListItem = {
  id: string;
  quoted_person_name: string;
  content: string;
  context: string | null;
  created_at: string;
};

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
  const [quotes, setQuotes] = useState<QuoteListItem[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(true);
  const [isRefreshingQuotes, setIsRefreshingQuotes] = useState(false);
  const [quotesErrorMessage, setQuotesErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: groupAccess.groupName ?? groupName,
    });
  }, [groupAccess.groupName, groupName, navigation]);

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

        const { data, error } = await supabase
          .from('quotes')
          .select('id, quoted_person_name, content, context, created_at')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false });

        if (!isActive) {
          return;
        }

        if (error) {
          setQuotes([]);
          setQuotesErrorMessage('Unable to load quotes right now. Please try again.');
          setIsLoadingQuotes(false);
          setIsRefreshingQuotes(false);
          return;
        }

        setQuotes(data ?? []);
        setIsLoadingQuotes(false);
        setIsRefreshingQuotes(false);
      }

      void loadQuotes();

      return () => {
        isActive = false;
      };
    }, [groupAccess.hasAccess, groupId, refreshNonce])
  );

  if (groupAccess.isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" />
        <Text style={styles.stateText}>Checking group access...</Text>
      </View>
    );
  }

  if (!groupAccess.hasAccess) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorText}>{groupAccess.errorMessage}</Text>
        <Button title="Back to Groups" onPress={() => navigation.navigate('Groups')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          title={isRefreshingQuotes ? 'Refreshing...' : 'Refresh'}
          onPress={() => navigation.setParams({ refreshNonce: Date.now() })}
          disabled={isRefreshingQuotes}
        />
        <Button
          title="Add Quote"
          onPress={() => navigation.navigate('CreateQuote', { groupId, groupName: groupAccess.groupName ?? groupName })}
        />
      </View>

      {isRefreshingQuotes ? (
        <View style={styles.inlineRefreshState}>
          <ActivityIndicator size="small" />
          <Text style={styles.inlineRefreshText}>Refreshing quotes...</Text>
        </View>
      ) : null}

      {isLoadingQuotes ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" />
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
          renderItem={({ item }) => (
            <View style={styles.quoteCard}>
              <Text style={styles.quotePerson}>{item.quoted_person_name}</Text>
              <Text style={styles.quoteContent}>{item.content}</Text>
              {item.context ? <Text style={styles.quoteContext}>{item.context}</Text> : null}
              <Text style={styles.quoteMeta}>{formatCreatedAt(item.created_at)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, gap: 16 },
  header: { gap: 12 },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  inlineRefreshState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineRefreshText: {
    fontSize: 14,
    color: '#555555',
  },
  stateText: { fontSize: 16, color: '#444444', textAlign: 'center' },
  errorText: { fontSize: 16, color: '#B00020', textAlign: 'center' },
  listContent: { gap: 12, paddingBottom: 12 },
  quoteCard: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  quotePerson: { fontSize: 18, fontWeight: '700' },
  quoteContent: { fontSize: 16, color: '#111111' },
  quoteContext: { fontSize: 14, color: '#555555' },
  quoteMeta: { fontSize: 12, color: '#777777' },
});