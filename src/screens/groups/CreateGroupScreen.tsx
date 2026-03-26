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
    <View style={styles.container}>
      <Text style={styles.title}>Create Group</Text>
      <Text style={styles.subtitle}>Give your group a name and we will generate a join code for you.</Text>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Group Name"
            autoCapitalize="words"
            autoCorrect={false}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.name ? <Text style={styles.errorText}>{errors.name.message}</Text> : null}

      <Button
        title={isSubmitting ? 'Creating group...' : 'Create Group'}
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