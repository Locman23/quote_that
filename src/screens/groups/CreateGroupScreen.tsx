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

const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Group name must be at least 3 characters')
    .max(40, 'Group name must be 40 characters or fewer'),
});

type CreateGroupFormData = z.infer<typeof createGroupSchema>;
type Props = NativeStackScreenProps<RootStackParamList, 'CreateGroup'>;

function getCreateGroupErrorMessage(error: unknown) {
  const fallbackMessage = 'Unable to create the group right now.';

  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message).toLowerCase();

    if (message.includes('signed in')) {
      return 'You must be signed in to create a group.';
    }

    return String(error.message) || fallbackMessage;
  }

  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const message = error.message.toLowerCase();

  if (message.includes('signed in')) {
    return 'You must be signed in to create a group.';
  }

  return error.message || fallbackMessage;
}

export default function CreateGroupScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (values: CreateGroupFormData) => {
    try {
      if (!user) {
        throw new Error('You must be signed in to create a group.');
      }

      const groupName = values.name.trim();
      const { data, error } = await supabase.rpc('create_group_with_admin_membership', {
        group_name: groupName,
      });

      if (error) {
        throw error;
      }

      const createdGroup = data?.[0];

      if (!createdGroup) {
        throw new Error('Unable to create the group right now.');
      }

      navigation.replace('GroupDetail', {
        groupId: createdGroup.id,
        groupName: createdGroup.name,
      });
    } catch (error) {
      Alert.alert('Create Group Error', getCreateGroupErrorMessage(error));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <CircleIconButton icon="⌂" accessibilityLabel="Back to groups" onPress={() => navigation.navigate('Groups')} />
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Create a group</Text>
          <Text style={styles.subtitle}>Start a shared space for quotes. We will generate a join code you can share.</Text>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Group name</Text>

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.name ? styles.inputError : null]}
                  placeholder="e.g. Saturday Dinner Quotes"
                  placeholderTextColor={colors.mutedText}
                  autoCapitalize="words"
                  autoCorrect={false}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name.message}</Text> : null}
          </View>

          <View style={styles.actionsBlock}>
            <AppButton
              title={isSubmitting ? 'Creating...' : 'Create Group'}
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