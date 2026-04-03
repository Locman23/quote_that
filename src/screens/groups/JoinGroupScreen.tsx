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

const joinGroupSchema = z.object({
  joinCode: z
    .string()
    .trim()
    .min(6, 'Join code must be at least 6 characters')
    .max(12, 'Join code must be 12 characters or fewer'),
});

type JoinGroupFormData = z.infer<typeof joinGroupSchema>;
type Props = NativeStackScreenProps<RootStackParamList, 'JoinGroup'>;

const ACCENT = '#6DBF8A';

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
          <CircleIconButton icon="⌂" accessibilityLabel="Back to home" onPress={() => navigation.navigate('Groups')} />
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Join Group</Text>
          <Text style={styles.subtitle}>Enter a join code to become a member of an existing group.</Text>

          <Controller
            control={control}
            name="joinCode"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Join Code"
                placeholderTextColor="#AAAAAA"
                autoCapitalize="characters"
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.joinCode ? <Text style={styles.errorText}>{errors.joinCode.message}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryBtn, isSubmitting && styles.disabledBtn]}
            activeOpacity={0.8}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={styles.primaryBtnText}>Join Group</Text>
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