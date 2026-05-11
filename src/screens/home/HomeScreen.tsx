import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../components/AppButton';
import QuoteCard from '../../components/QuoteCard';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { colors, radius, spacing, typography } from '../../theme';
import type { QuoteRecord } from '../../types';

type MembershipRow = {
  group_id: string;
  group: { id: string; name: string } | { id: string; name: string }[] | null;
};

type QuoteRowWithGroup = QuoteRecord & {
  group: { name: string } | { name: string }[] | null;
};

type FeedQuote = QuoteRecord & {
  groupName?: string;
};

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const [quotes, setQuotes] = useState<FeedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadFeed = useCallback(async (refresh = false) => {
    if (!user) {
      setQuotes([]);
      setErrorMessage('You need to be signed in to view your feed.');
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage(null);

    try {
      const { data: memberships, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id, group:groups(id, name)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (membershipError) {
        throw membershipError;
      }

      const membershipRows = (memberships ?? []) as MembershipRow[];
      const groups = membershipRows
        .map((row) => {
          const group = Array.isArray(row.group) ? row.group[0] : row.group;

          if (!group) {
            return null;
          }

          return {
            id: group.id,
            name: group.name,
          };
        })
        .filter((group): group is { id: string; name: string } => group !== null);

      if (groups.length === 0) {
        setQuotes([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const groupNameById = new Map(groups.map((group) => [group.id, group.name]));
      const groupIds = groups.map((group) => group.id);

      const { data: quoteRows, error: quoteError } = await supabase
        .from('quotes')
        .select('id, group_id, created_by, quoted_person_name, content, context, created_at, updated_at, group:groups(name)')
        .in('group_id', groupIds)
        .order('created_at', { ascending: false })
        .limit(100);

      if (quoteError) {
        throw quoteError;
      }

      const nextQuotes = ((quoteRows ?? []) as QuoteRowWithGroup[])
        .map((quote) => {
          const group = Array.isArray(quote.group) ? quote.group[0] : quote.group;

          return {
            id: quote.id,
            group_id: quote.group_id,
            created_by: quote.created_by,
            quoted_person_name: quote.quoted_person_name,
            content: quote.content,
            context: quote.context,
            created_at: quote.created_at,
            updated_at: quote.updated_at,
            groupName: group?.name ?? groupNameById.get(quote.group_id),
          } satisfies FeedQuote;
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setQuotes(nextQuotes);
    } catch (_error) {
      setQuotes([]);
      setErrorMessage('Unable to load your feed right now. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadFeed(false);
    }, [loadFeed])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.appTitle}>Quote That</Text>
          <Text style={styles.greetingText}>
            {`Hey ${typeof user?.user_metadata?.username === 'string'
              ? user.user_metadata.username
              : 'there'}`}
          </Text>
          <Text style={styles.subtitle}>A calm stream of recent quotes from your groups.</Text>

          <AppButton
            title="Add quote"
            onPress={() => Alert.alert('Coming soon', 'Creating a quote from Home will be added soon.')}
          />
        </View>

        <Text style={styles.sectionHeading}>Recent quotes</Text>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.text} />
            <Text style={styles.centerText}>Loading feed...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <AppButton title="Try again" variant="secondary" onPress={() => void loadFeed(false)} />
          </View>
        ) : quotes.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.centerText}>No quotes yet from your groups.</Text>
          </View>
        ) : (
          <FlatList
            data={quotes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => void loadFeed(true)}
                tintColor={colors.text}
              />
            }
            renderItem={({ item }) => (
              <QuoteCard
                quotedPersonName={item.quoted_person_name}
                content={item.content}
                context={item.context ?? undefined}
                createdAt={item.created_at}
                groupName={item.groupName}
                isEdited={item.updated_at !== item.created_at}
              />
            )}
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
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  appTitle: {
    ...typography.caption,
    color: colors.mutedText,
    letterSpacing: 0.7,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  greetingText: {
    ...typography.largeTitle,
    color: colors.text,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.body,
    color: colors.mutedText,
  },
  sectionHeading: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700',
    marginTop: 2,
  },
  listContent: {
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  centerText: {
    ...typography.body,
    color: colors.mutedText,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
});
