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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const ACCENT = '#6DBF8A';

function getLoginErrorMessage(error: unknown): string {
  const fallbackMessage = 'Login failed. Please try again.';

  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }

  if (message.includes('email not confirmed')) {
    return 'Please confirm your email before logging in.';
  }

  return error.message;
}

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const authError = useAuthStore((state) => state.authError);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormData) => {
    try {
      clearAuthError();

      const { error } = await supabase.auth.signInWithPassword({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      Alert.alert('Login Error', getLoginErrorMessage(error));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Quote That</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to access your groups and quotes.</Text>

          {authError ? <Text style={styles.authErrorBanner}>{authError}</Text> : null}

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

          <AppButton
            title="Login"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
          />

          <AppButton
            variant="secondary"
            title="Go to Signup"
            onPress={() => navigation.navigate('Signup')}
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
    gap: 14,
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
    textAlign: 'center',
    fontSize: 48,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
    color: '#1A1A1A',
    textShadowColor: ACCENT + '66',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#777777',
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