import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import AppButton from '../../components/AppButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useGroupMembershipGuard } from '../../utils/useGroupMembershipGuard';
import { createQuote } from '../../lib/quotes';
import { useAuthStore } from '../../store/authStore';
import {
  getQuoteMutationErrorMessage,
  quoteFormSchema,
  type QuoteFormData,
} from './quoteForm';
import CircleIconButton from '../../components/CircleIconButton';
import { colors, radius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateQuote'>;

const ACCENT = '#6DBF8A';

export default function CreateQuoteScreen({ route, navigation }: Props) {
  const { groupId, groupName } = route.params;
  const groupAccess = useGroupMembershipGuard(groupId);
  const user = useAuthStore((state) => state.user);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      content: '',
      quotedPersonName: '',
      context: '',
    },
  });

  const onSubmit = async (values: QuoteFormData) => {
    try {
      if (!user) {
        throw new Error('You must be signed in to add a quote.');
      }

      if (!groupAccess.hasAccess) {
        throw new Error('You no longer have access to this group.');
      }

      const data = await createQuote({
        groupId,
        userId: user.id,
        values,
      });

      reset();
      navigation.replace('GroupDetail', {
        groupId,
        groupName: groupAccess.groupName ?? groupName ?? 'Group',
        refreshNonce: Date.now(),
        newQuote: data,
      });
    } catch (error) {
      Alert.alert('Create Quote Error', getQuoteMutationErrorMessage('create', error));
    }
  };

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
        <View style={styles.topRow}>
          <CircleIconButton
            icon="‹"
            accessibilityLabel="Back to group"
            onPress={() =>
              navigation.navigate('GroupDetail', {
                groupId,
                groupName: groupAccess.groupName ?? groupName ?? 'Group',
                refreshNonce: Date.now(),
              })
            }
          />
          <CircleIconButton icon="⌂" accessibilityLabel="Back to home" onPress={() => navigation.navigate('Groups')} />
        </View>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Capture the quote</Text>
          <Text style={styles.subtitle}>{groupAccess.groupName ?? groupName ?? 'Group'}</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.quoteInputWrap}>
            <Text style={styles.openingMark}>"</Text>

            <Controller
              control={control}
              name="content"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.quoteInput}
                  placeholder="Write the quote exactly as it was said..."
                  placeholderTextColor={colors.mutedText}
                  multiline
                  textAlignVertical="top"
                  autoCorrect
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </View>
          {errors.content ? <Text style={styles.fieldErrorText}>{errors.content.message}</Text> : null}

          <Controller
            control={control}
            name="quotedPersonName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Who said it"
                placeholderTextColor={colors.mutedText}
                autoCapitalize="words"
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.quotedPersonName ? <Text style={styles.fieldErrorText}>{errors.quotedPersonName.message}</Text> : null}

          <Controller
            control={control}
            name="context"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Context (optional)"
                placeholderTextColor={colors.mutedText}
                autoCapitalize="sentences"
                autoCorrect
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.context ? <Text style={styles.fieldErrorText}>{errors.context.message}</Text> : null}

          <AppButton
            title="Save Quote"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerBlock: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  formCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  title: {
    ...typography.largeTitle,
    color: colors.text,
    fontSize: 34,
    lineHeight: 38,
  },
  subtitle: {
    ...typography.body,
    color: colors.mutedText,
  },
  quoteInputWrap: {
    position: 'relative',
  },
  openingMark: {
    position: 'absolute',
    top: 2,
    left: 14,
    fontSize: 52,
    lineHeight: 52,
    color: colors.border,
    zIndex: 1,
  },
  quoteInput: {
    ...typography.subtitle,
    backgroundColor: colors.softAccent,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    color: colors.text,
    minHeight: 210,
    textAlignVertical: 'top',
  },
  input: {
    ...typography.body,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 6,
    paddingVertical: spacing.sm + 4,
    color: colors.text,
  },
  stateText: { ...typography.body, color: colors.mutedText, textAlign: 'center' },
  errorText: { ...typography.body, color: colors.danger, textAlign: 'center' },
  fieldErrorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: -2,
    marginBottom: 2,
    paddingLeft: 4,
  },
});