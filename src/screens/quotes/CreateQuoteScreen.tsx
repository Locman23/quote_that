import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ActivityIndicator,
  Alert,
  Button,
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useGroupMembershipGuard } from '../../utils/useGroupMembershipGuard';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const createQuoteSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Quote text is required')
    .max(280, 'Quote text must be 280 characters or fewer'),
  quotedPersonName: z
    .string()
    .trim()
    .min(1, 'Who said it is required')
    .max(60, 'Name must be 60 characters or fewer'),
  context: z
    .string()
    .trim()
    .max(120, 'Context must be 120 characters or fewer')
    .optional(),
});

type CreateQuoteFormData = z.infer<typeof createQuoteSchema>;

function getCreateQuoteErrorMessage(error: unknown) {
  const fallbackMessage = 'Unable to create the quote right now.';

  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message).toLowerCase();

    if (message.includes('signed in')) {
      return 'You must be signed in to add a quote.';
    }

    if (message.includes('access')) {
      return 'You no longer have access to this group.';
    }

    return String(error.message) || fallbackMessage;
  }

  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  return error.message || fallbackMessage;
}

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
  } = useForm<CreateQuoteFormData>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: {
      content: '',
      quotedPersonName: '',
      context: '',
    },
  });

  const onSubmit = async (values: CreateQuoteFormData) => {
    try {
      if (!user) {
        throw new Error('You must be signed in to add a quote.');
      }

      if (!groupAccess.hasAccess) {
        throw new Error('You no longer have access to this group.');
      }

      const { data, error } = await supabase
        .from('quotes')
        .insert({
          group_id: groupId,
          created_by: user.id,
          quoted_person_name: values.quotedPersonName.trim(),
          content: values.content.trim(),
          context: values.context?.trim() || null,
        })
        .select('id, quoted_person_name, content, context, created_at')
        .single();

      if (error) {
        throw error;
      }

      reset();
      navigation.navigate('GroupDetail', {
        groupId,
        groupName: groupAccess.groupName ?? groupName ?? 'Group',
        refreshNonce: Date.now(),
        newQuote: data,
      });
    } catch (error) {
      Alert.alert('Create Quote Error', getCreateQuoteErrorMessage(error));
    }
  };

  if (groupAccess.isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" />
        <Text style={styles.stateText}>Checking group access...</Text>
      </View>
    );
  }

  if (!groupAccess.hasAccess) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorText}>{groupAccess.errorMessage}</Text>
        <Button title="Back to Groups" onPress={() => navigation.navigate('Groups')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Quote</Text>
      <Text style={styles.subtitle}>Adding to {groupAccess.groupName}</Text>

      <Controller
        control={control}
        name="content"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Quote text"
            multiline
            textAlignVertical="top"
            autoCorrect
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.content ? <Text style={styles.errorText}>{errors.content.message}</Text> : null}

      <Controller
        control={control}
        name="quotedPersonName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Who said it"
            autoCapitalize="words"
            autoCorrect={false}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.quotedPersonName ? <Text style={styles.errorText}>{errors.quotedPersonName.message}</Text> : null}

      <Controller
        control={control}
        name="context"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Context (optional)"
            autoCapitalize="sentences"
            autoCorrect
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.context ? <Text style={styles.errorText}>{errors.context.message}</Text> : null}

      <Button
        title={isSubmitting ? 'Saving quote...' : 'Save Quote'}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 10 },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 16, color: '#555555', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  multilineInput: {
    minHeight: 120,
  },
  stateText: { fontSize: 16, color: '#444444', textAlign: 'center' },
  errorText: { fontSize: 16, color: '#B00020', textAlign: 'center' },
});