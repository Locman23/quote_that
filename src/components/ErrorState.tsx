import { StyleSheet, Text, View } from 'react-native';
import AppButton from './AppButton';
import { colors, radius, spacing, typography } from '../theme';

interface ErrorStateProps {
  title: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title,
  message,
  retryLabel = 'Try again',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {onRetry ? <AppButton title={retryLabel} variant="secondary" onPress={onRetry} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '700',
  },
  message: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
});
