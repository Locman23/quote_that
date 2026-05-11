import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  ScrollView,
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

const ACCENT = '#6DBF8A';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const profileSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(24, 'Username must be 24 characters or fewer')
      .regex(/^[a-zA-Z0-9_]+$/, 'Use only letters, numbers, and underscores'),
    email: z.string().email('Please enter a valid email address'),
    newPassword: z.string(),
    confirmNewPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    const hasPasswordInput = data.newPassword.length > 0 || data.confirmNewPassword.length > 0;

    if (!hasPasswordInput) {
      return;
    }

    if (data.newPassword.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password must be at least 8 characters',
        path: ['newPassword'],
      });
    }

    if (data.newPassword !== data.confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmNewPassword'],
      });
    }
  });

type ProfileFormData = z.infer<typeof profileSchema>;

function getProfileUpdateErrorMessage(error: unknown) {
  const fallbackMessage = 'Could not update your profile. Please try again.';

  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const message = error.message.toLowerCase();

  if (message.includes('username') && message.includes('taken')) {
    return 'That username is already taken.';
  }

  if (message.includes('duplicate key') || message.includes('profiles_username_key')) {
    return 'That username is already taken.';
  }

  if (message.includes('email') && (message.includes('exists') || message.includes('registered'))) {
    return 'That email is already in use.';
  }

  return error.message || fallbackMessage;
}

export default function ProfileScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const {
    control,
    getValues,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      email: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  useEffect(() => {
    const email = user?.email?.trim().toLowerCase() ?? '';
    const usernameFromMetadata =
      typeof user?.user_metadata?.username === 'string' ? user.user_metadata.username.trim() : '';

    reset({
      username: usernameFromMetadata,
      email,
      newPassword: '',
      confirmNewPassword: '',
    });
  }, [reset, user]);

  const updateProfile = handleSubmit(async (values) => {
    if (!user) {
      Alert.alert('Update Profile', 'You must be signed in to update your profile.');
      return;
    }

    setIsUpdatingProfile(true);

    try {
      const username = values.username.trim();
      const email = values.email.trim().toLowerCase();
      const currentUsername =
        typeof user.user_metadata?.username === 'string' ? user.user_metadata.username.trim() : '';
      const currentEmail = user.email?.trim().toLowerCase() ?? '';
      const hasUsernameChanged = username !== currentUsername;
      const hasEmailChanged = email !== currentEmail;

      if (hasUsernameChanged) {
        const { data: isAvailable, error: usernameLookupError } = await supabase.rpc('is_username_available', {
          candidate_username: username,
        });

        if (usernameLookupError) {
          throw usernameLookupError;
        }

        if (!isAvailable) {
          throw new Error('Username already taken.');
        }
      }

      if (hasUsernameChanged || hasEmailChanged) {
        const { error: authUpdateError } = await supabase.auth.updateUser({
          email: hasEmailChanged ? email : undefined,
          data: {
            ...(user.user_metadata ?? {}),
            username,
          },
        });

        if (authUpdateError) {
          throw authUpdateError;
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ username, email })
          .eq('id', user.id);

        if (profileError) {
          throw profileError;
        }
      }

      reset({
        username,
        email,
        newPassword: '',
        confirmNewPassword: '',
      });

      if (hasEmailChanged) {
        Alert.alert('Profile Updated', 'Profile updated. Check your email to confirm the new address if required.');
      } else {
        Alert.alert('Profile Updated', 'Your profile has been updated.');
      }
    } catch (error) {
      Alert.alert('Update Profile Error', getProfileUpdateErrorMessage(error));
    } finally {
      setIsUpdatingProfile(false);
    }
  });

  const updatePassword = handleSubmit(async (values) => {
    if (!user) {
      Alert.alert('Update Password', 'You must be signed in to update your password.');
      return;
    }

    if (!values.newPassword) {
      Alert.alert('Update Password', 'Enter a new password first.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: values.newPassword });

      if (error) {
        throw error;
      }

      reset({
        ...getValues(),
        newPassword: '',
        confirmNewPassword: '',
      });

      Alert.alert('Password Updated', 'Your password has been updated.');
    } catch (error) {
      Alert.alert('Update Password Error', getProfileUpdateErrorMessage(error));
    } finally {
      setIsUpdatingPassword(false);
    }
  });

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const error = await signOut();

      if (error) {
        Alert.alert('Logout Warning', error.message);
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <CircleIconButton icon="⌂" filled accessibilityLabel="Back to home" onPress={() => navigation.navigate('Groups')} />
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account details</Text>

          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#AAAAAA"
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.username ? <Text style={styles.errorText}>{errors.username.message}</Text> : null}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#AAAAAA"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email.message}</Text> : null}

          <AppButton
            title="Update Profile"
            onPress={() => void updateProfile()}
            loading={isUpdatingProfile}
            disabled={isUpdatingProfile || isUpdatingPassword || isLoggingOut}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Password</Text>

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor="#AAAAAA"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword.message}</Text> : null}

          <Controller
            control={control}
            name="confirmNewPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                placeholderTextColor="#AAAAAA"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.confirmNewPassword ? <Text style={styles.errorText}>{errors.confirmNewPassword.message}</Text> : null}

          <AppButton
            title="Update Password"
            onPress={() => void updatePassword()}
            loading={isUpdatingPassword}
            disabled={isUpdatingProfile || isUpdatingPassword || isLoggingOut}
          />
        </View>

        <AppButton
          variant="danger"
          title="Log Out"
          onPress={() => void handleLogout()}
          loading={isLoggingOut}
          disabled={isUpdatingProfile || isUpdatingPassword || isLoggingOut}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
  },
  card: {
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
    fontSize: 14,
    color: '#777777',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
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
  logoutBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5B7BD',
    backgroundColor: '#FFFFFF',
  },
  logoutBtnText: {
    color: '#B00020',
    fontWeight: '700',
    fontSize: 15,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
