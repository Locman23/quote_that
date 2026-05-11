import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../components/AppButton';
import { useAuthStore } from '../../store/authStore';
import { colors, radius, spacing, typography } from '../../theme';

export default function SettingsTabScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  const handleLogout = async () => {
    const error = await signOut();

    if (error) {
      Alert.alert('Logout Warning', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Basic account actions</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Signed in as</Text>
          <Text style={styles.value}>{user?.email ?? 'Unknown account'}</Text>
        </View>

        <AppButton title="Log Out" variant="danger" onPress={() => void handleLogout()} />
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
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.mutedText,
  },
  value: {
    ...typography.body,
    color: colors.text,
  },
});
