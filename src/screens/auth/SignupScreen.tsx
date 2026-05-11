import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
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

const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(24, 'Username must be 24 characters or fewer')
      .regex(/^[a-zA-Z0-9_]+$/, 'Use only letters, numbers, and underscores'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

const ACCENT = '#6DBF8A';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

function getSignupErrorMessage(error: unknown): string {
  const fallbackMessage = 'Signup failed. Please try again.';

  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const message = error.message.toLowerCase();

  if (message.includes('username already taken') || message.includes('profiles_username_key')) {
    return 'That username is already taken.';
  }

  if (message.includes('already registered') || message.includes('already exists')) {
    return 'An account with this email already exists.';
  }

  if (message.includes('row-level security') || message.includes('jwt')) {
    return 'Account created, but profile setup was blocked by permissions. Check your email verification settings and try again.';
  }

  return error.message;
}

export default function SignupScreen({ navigation }: Props) {
  const authError = useAuthStore((state) => state.authError);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: SignupFormData) => {
    try {
      clearAuthError();

      const username = values.username.trim();
      const email = values.email.trim().toLowerCase();

      const { data: isUsernameAvailable, error: usernameLookupError } = await supabase.rpc(
        'is_username_available',
        { candidate_username: username }
      );

      if (usernameLookupError) {
        throw usernameLookupError;
      }

      if (!isUsernameAvailable) {
        throw new Error('Username already taken.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: values.password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) {
        throw error;
      }

      const userId = data.user?.id;

      if (!userId) {
        throw new Error('Account was created, but user details were not returned.');
      }

      if (data.session) {
        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            id: userId,
            username,
            email,
          },
          { onConflict: 'id' }
        );

        if (profileError) {
          await supabase.auth.signOut();

          const profileMessage = profileError.message.toLowerCase();

          if (profileMessage.includes('username') || profileMessage.includes('profiles_username_key')) {
            throw new Error('Username already taken.');
          }

          throw new Error('Account was created, but profile setup failed. Please try again.');
        }
      }

      const successMessage = data.session
        ? 'Your account has been created. You can now log in.'
        : 'Your account has been created. Check your email to confirm your account, then log in. Your profile will be completed after you sign in.';

      Alert.alert('Success', successMessage);

      if (!data.session) {
        navigation.navigate('Login');
      }
    } catch (error) {
      const message = getSignupErrorMessage(error);
      Alert.alert('Signup Error', message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Quote That and start sharing moments.</Text>

          {authError ? <Text style={styles.authErrorBanner}>{authError}</Text> : null}

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
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email.message}</Text> : null}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#AAAAAA"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.password ? <Text style={styles.errorText}>{errors.password.message}</Text> : null}

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#AAAAAA"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.confirmPassword ? (
            <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
          ) : null}

          <AppButton
            title="Create Account"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
          />

          <AppButton
            variant="secondary"
            title="Back to Login"
            onPress={() => navigation.goBack()}
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
    backgroundColor: '#F5F6FA',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
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
  authErrorBanner: {
    color: '#B00020',
    backgroundColor: '#FDECEC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: ACCENT,
  },
  secondaryBtnText: {
    color: ACCENT,
    fontWeight: '700',
    fontSize: 15,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});