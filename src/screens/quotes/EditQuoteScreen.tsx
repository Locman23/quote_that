import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { updateOwnQuote } from '../../lib/quotes';
import { useAuthStore } from '../../store/authStore';
import { RootStackParamList } from '../../types/navigation';
import { useGroupMembershipGuard } from '../../utils/useGroupMembershipGuard';
import {
  getQuoteMutationErrorMessage,
  quoteFormSchema,
  type QuoteFormData,
} from './quoteForm';

type Props = NativeStackScreenProps<RootStackParamList, 'EditQuote'>;

export default function EditQuoteScreen({ route, navigation }: Props) {
  const { groupId, groupName, quote } = route.params;
  const user = useAuthStore((state) => state.user);
  const groupAccess = useGroupMembershipGuard(groupId, groupName);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      content: quote.content,
      quotedPersonName: quote.quoted_person_name,
      context: quote.context ?? '',
    },
  });

  const onSubmit = async (values: QuoteFormData) => {
    try {
      if (!user) {
        throw new Error('You must be signed in to update a quote.');
      }

      if (quote.created_by !== user.id) {
        throw new Error('You can only edit quotes you created.');
      }

      if (!groupAccess.hasAccess) {
        throw new Error('You no longer have access to this group.');
      }

      await updateOwnQuote({
        groupId,
        quoteId: quote.id,
        userId: user.id,
        values,
      });

      navigation.navigate('GroupDetail', {
        groupId,
        groupName: groupAccess.groupName ?? groupName ?? 'Group',
        refreshNonce: Date.now(),
      });
    } catch (error) {
      Alert.alert('Edit Quote Error', getQuoteMutationErrorMessage('update', error));
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
        <Button
          title="Back to Group"
          onPress={() =>
            navigation.navigate('GroupDetail', {
              groupId,
              groupName: groupAccess.groupName ?? groupName ?? 'Group',
              refreshNonce: Date.now(),
            })
          }
        />
      </View>
    );
  }

  if (!user || quote.created_by !== user.id) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorText}>You can only edit quotes you created.</Text>
        <Button
          title="Back to Group"
          onPress={() =>
            navigation.navigate('GroupDetail', {
              groupId,
              groupName: groupAccess.groupName ?? groupName ?? 'Group',
              refreshNonce: Date.now(),
            })
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Quote</Text>
      <Text style={styles.subtitle}>Updating a quote in {groupAccess.groupName}</Text>

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
        title={isSubmitting ? 'Saving changes...' : 'Save Changes'}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 10 },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
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