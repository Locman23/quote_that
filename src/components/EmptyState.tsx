import { StyleSheet, Text, View } from 'react-native';
import AppButton from './AppButton';
import { colors, radius, spacing, typography } from '../theme';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const action = actionLabel && onAction
    ? { label: actionLabel, onPress: onAction }
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {action ? (
          <AppButton title={action.label} variant="secondary" onPress={action.onPress} />
        ) : null}
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
    color: colors.mutedText,
    textAlign: 'center',
  },
});
