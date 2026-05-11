import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../components/AppButton';
import { useAuthStore } from '../../store/authStore';
import { colors, radius, spacing, typography } from '../../theme';

export default function SettingsTabScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const username = typeof user?.user_metadata?.username === 'string'
    ? user.user_metadata.username.trim()
    : '';
  const email = user?.email?.trim() ?? '';

  const handleLogout = async () => {
    const error = await signOut();

    if (error) {
      Alert.alert('Logout Warning', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your account</Text>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.profileLabel}>Profile</Text>
          <Text style={styles.profileHeadline}>
            {username || email || 'Your account'}
          </Text>

          {username ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Username</Text>
              <Text style={styles.infoValue}>{username}</Text>
            </View>
          ) : null}

          {email ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Email</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          ) : null}

          {!username && !email ? (
            <Text style={styles.fallbackText}>No profile details are available right now.</Text>
          ) : null}
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Account actions</Text>
          <Text style={styles.actionsSubtitle}>You can sign out from this device at any time.</Text>
          <AppButton title="Log Out" variant="danger" onPress={() => void handleLogout()} />
        </View>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.lg,
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
  profileCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  profileLabel: {
    ...typography.label,
    color: colors.mutedText,
    textTransform: 'uppercase',
  },
  profileHeadline: {
    ...typography.title,
    color: colors.text,
    fontWeight: '700',
  },
  infoRow: {
    backgroundColor: colors.softAccent,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 6,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  infoKey: {
    ...typography.caption,
    color: colors.mutedText,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
  },
  fallbackText: {
    ...typography.body,
    color: colors.mutedText,
  },
  actionsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  actionsTitle: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700',
  },
  actionsSubtitle: {
    ...typography.body,
    color: colors.mutedText,
  },
});
