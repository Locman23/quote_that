import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import CircleIconButton from '../../components/CircleIconButton';

const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Group name must be at least 3 characters')
    .max(40, 'Group name must be 40 characters or fewer'),
});

type CreateGroupFormData = z.infer<typeof createGroupSchema>;
type Props = NativeStackScreenProps<RootStackParamList, 'CreateGroup'>;

const ACCENT = '#6DBF8A';

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
          <CircleIconButton icon="⌂" accessibilityLabel="Back to home" onPress={() => navigation.navigate('Groups')} />
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Create Group</Text>
          <Text style={styles.subtitle}>Give your group a name and we will generate a join code for you.</Text>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Group Name"
                placeholderTextColor="#AAAAAA"
                autoCapitalize="words"
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name.message}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryBtn, isSubmitting && styles.disabledBtn]}
            activeOpacity={0.8}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={styles.primaryBtnText}>Create Group</Text>
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
  container: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subtitle: {
    color: '#777777',
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#1A1A1A',
    fontSize: 15,
  },
  errorText: {
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