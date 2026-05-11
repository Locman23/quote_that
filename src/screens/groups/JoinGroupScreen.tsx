import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AppButton from '../../components/AppButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import CircleIconButton from '../../components/CircleIconButton';
import { colors, radius, spacing, typography } from '../../theme';

const joinGroupSchema = z.object({
  joinCode: z
    .string()
    .trim()
    .min(6, 'Join code must be at least 6 characters')
    .max(12, 'Join code must be 12 characters or fewer'),
});

type JoinGroupFormData = z.infer<typeof joinGroupSchema>;
type Props = NativeStackScreenProps<RootStackParamList, 'JoinGroup'>;

function getJoinGroupErrorMessage(error: unknown) {
  const fallbackMessage = 'Unable to join the group right now.';

  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message).toLowerCase();

    if (message.includes('no rows')) {
      return 'No group was found for that join code.';
    }

    if (message.includes('duplicate') || message.includes('unique')) {
      return 'You are already a member of this group.';
    }

    if (message.includes('signed in')) {
      return 'You must be signed in to join a group.';
    }

    return String(error.message) || fallbackMessage;
  }

  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  return error.message || fallbackMessage;
}

export default function JoinGroupScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JoinGroupFormData>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: {
      joinCode: '',
    },
  });

  const onSubmit = async (values: JoinGroupFormData) => {
    try {
      if (!user) {
        throw new Error('You must be signed in to join a group.');
      }

      const joinCode = values.joinCode.trim().toUpperCase();
      const { data: groups, error: lookupError } = await supabase.rpc('find_group_by_join_code', {
        candidate_join_code: joinCode,
      });

      if (lookupError) {
        throw lookupError;
      }

      const group = groups?.[0];

      if (!group) {
        throw new Error('No rows found');
      }

      const { error: membershipError } = await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user.id,
        role: 'member',
      });

      if (membershipError) {
        throw membershipError;
      }

      navigation.replace('GroupDetail', {
        groupId: group.id,
        groupName: group.name,
      });
    } catch (error) {
      Alert.alert('Join Group Error', getJoinGroupErrorMessage(error));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <CircleIconButton icon="⌂" accessibilityLabel="Back to groups" onPress={() => navigation.navigate('Groups')} />
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Join a group</Text>
          <Text style={styles.subtitle}>Enter a join code to join an existing group and start sharing quotes.</Text>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Join code</Text>

            <Controller
              control={control}
              name="joinCode"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.joinCode ? styles.inputError : null]}
                  placeholder="e.g. QTHAT7"
                  placeholderTextColor={colors.mutedText}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.joinCode ? <Text style={styles.errorText}>{errors.joinCode.message}</Text> : null}
          </View>

          <View style={styles.actionsBlock}>
            <AppButton
              title={isSubmitting ? 'Joining...' : 'Join Group'}
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          </View>

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
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
    marginTop: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    ...typography.largeTitle,
    color: colors.text,
    fontSize: 34,
    lineHeight: 38,
  },
  subtitle: {
    ...typography.body,
    color: colors.mutedText,
    marginTop: -spacing.xs,
  },
  fieldBlock: {
    gap: spacing.xs,
  },
  label: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700',
  },
  input: {
    ...typography.body,
    backgroundColor: colors.softAccent,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.sm + 6,
    color: colors.text,
    letterSpacing: 0.5,
  },
  inputError: {
    borderColor: '#D65A55',
    borderWidth: 1.5,
  },
  errorText: {
    ...typography.caption,
    color: '#9E2E2A',
    backgroundColor: '#FDF1F0',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#F5C6C4',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  actionsBlock: {
    marginTop: spacing.xs,
  },
});