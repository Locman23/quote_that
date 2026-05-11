import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  ScrollView,
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
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import { colors, radius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateQuote'>;

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
        <View style={styles.stateWrap}>
          <LoadingState message="Checking group access..." />
        </View>
      </SafeAreaView>
    );
  }

  if (!groupAccess.hasAccess) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.stateWrap}>
          <ErrorState
            title="Access denied"
            message={groupAccess.errorMessage ?? 'You no longer have access to this group.'}
          />
          <CircleIconButton icon="⌂" accessibilityLabel="Back to groups" onPress={() => navigation.navigate('Groups')} />
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
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Capture the quote</Text>
            <Text style={styles.subtitle}>{groupAccess.groupName ?? groupName ?? 'Group'}</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.fieldLabel}>What did they say?</Text>
            <View style={styles.quoteInputWrap}>
              <Text style={styles.openingMark}>“</Text>

              <Controller
                control={control}
                name="content"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.quoteInput, errors.content ? styles.inputErrorBorder : null]}
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

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Who said it?</Text>
              <Controller
                control={control}
                name="quotedPersonName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.quotedPersonName ? styles.inputErrorBorder : null]}
                    placeholder="Name"
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
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.secondaryFieldLabel}>Context</Text>
              <Controller
                control={control}
                name="context"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.contextInput, errors.context ? styles.inputErrorBorder : null]}
                    placeholder="Optional background or situation"
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
            </View>
          </View>

          <View style={styles.actionsBlock}>
            <AppButton
              title={isSubmitting ? 'Saving...' : 'Save Quote'}
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          </View>
        </ScrollView>
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
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerBlock: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + 2,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  stateWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.largeTitle,
    color: colors.text,
    fontSize: 36,
    lineHeight: 40,
  },
  subtitle: {
    ...typography.body,
    color: colors.mutedText,
  },
  fieldBlock: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700',
  },
  secondaryFieldLabel: {
    ...typography.body,
    color: colors.mutedText,
    fontWeight: '600',
  },
  quoteInputWrap: {
    position: 'relative',
  },
  openingMark: {
    position: 'absolute',
    top: 8,
    left: 12,
    fontSize: 72,
    lineHeight: 72,
    color: '#D9D1C4',
    zIndex: 1,
  },
  quoteInput: {
    ...typography.subtitle,
    backgroundColor: colors.softAccent,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md + 2,
    paddingTop: spacing.xxl + spacing.xs,
    paddingBottom: spacing.md + 2,
    color: colors.text,
    minHeight: 260,
    textAlignVertical: 'top',
  },
  input: {
    ...typography.body,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.sm + 6,
    color: colors.text,
  },
  contextInput: {
    ...typography.body,
    backgroundColor: '#F7F4EE',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#ECE5D8',
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.sm + 6,
    color: colors.mutedText,
  },
  inputErrorBorder: {
    borderColor: '#D65A55',
    borderWidth: 1.5,
  },
  fieldErrorText: {
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
    paddingHorizontal: spacing.xs,
  },
});