import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../components/AppButton';
import { colors, radius, spacing, typography } from '../../theme';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Home</Text>
        <Text style={styles.subtitle}>Your quote feed will appear here soon.</Text>

        <View style={styles.feedCard}>
          <Text style={styles.feedHeading}>Coming Soon</Text>
          <Text style={styles.feedText}>Recent quotes from your groups will show up in this space.</Text>
        </View>

        <AppButton
          title="Create a quote later"
          variant="secondary"
          onPress={() => Alert.alert('Coming soon', 'Quote creation from Home will be added soon.')}
        />
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
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.body,
    color: colors.mutedText,
  },
  feedCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  feedHeading: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '600',
  },
  feedText: {
    ...typography.body,
    color: colors.mutedText,
  },
});
