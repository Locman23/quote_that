import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

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
    <View style={styles.container}>
      <Text style={styles.title}>Join Group</Text>
      <Text style={styles.subtitle}>Enter a join code to become a member of an existing group.</Text>

      <Controller
        control={control}
        name="joinCode"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Join Code"
            autoCapitalize="characters"
            autoCorrect={false}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.joinCode ? <Text style={styles.errorText}>{errors.joinCode.message}</Text> : null}

      <Button
        title={isSubmitting ? 'Joining group...' : 'Join Group'}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: {
    color: '#555555',
    fontSize: 15,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: '#B00020',
    fontSize: 13,
    marginTop: -6,
    marginBottom: 2,
  },
});