import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
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
        <View style={styles.card}>
          <Text style={styles.title}>Create Quote</Text>
          <Text style={styles.subtitle}>Adding to {groupAccess.groupName}</Text>

          <Controller
            control={control}
            name="content"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Quote text"
                placeholderTextColor="#AAAAAA"
                multiline
                textAlignVertical="top"
                autoCorrect
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.content ? <Text style={styles.fieldErrorText}>{errors.content.message}</Text> : null}

          <Controller
            control={control}
            name="quotedPersonName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Who said it"
                placeholderTextColor="#AAAAAA"
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
                placeholderTextColor="#AAAAAA"
                autoCapitalize="sentences"
                autoCorrect
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.context ? <Text style={styles.fieldErrorText}>{errors.context.message}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryBtn, isSubmitting && styles.disabledBtn]}
            activeOpacity={0.8}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={styles.primaryBtnText}>Save Quote</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  card: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 14, color: '#777777', marginBottom: 4 },
  input: {
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#1A1A1A',
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 120,
  },
  stateText: { fontSize: 15, color: '#777777', textAlign: 'center' },
  errorText: { fontSize: 15, color: '#B00020', textAlign: 'center' },
  fieldErrorText: {
    color: '#B00020',
    fontSize: 13,
    marginTop: -6,
    marginBottom: 2,
  },
  primaryBtn: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});