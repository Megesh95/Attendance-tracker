import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAuthErrorMessage, login } from '@/services/authApi';

type LoginSession = {
  employeeId: number;
  name: string;
  email: string;
  role: string;
  referenceImagePath: string | null;
};

type LoginScreenProps = {
  onLoginSuccess?: (session: LoginSession) => void;
};

export default function LoginScreen({
  onLoginSuccess,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      Alert.alert('Validation', 'Please enter email and password');
      return;
    }

    try {
      setIsLoading(true);
      const result = await login(trimmedEmail, password);

      if (!result.success || !result.employeeId) {
        Alert.alert('Login Failed', result.message ?? 'Invalid credentials');
        return;
      }

      onLoginSuccess?.({
        employeeId: result.employeeId,
        name: result.name ?? 'Employee',
        email: result.email ?? trimmedEmail,
        role: result.role ?? 'Employee',
        referenceImagePath:
          result.referenceImagePath ?? null,
      });
    } catch (error) {
      Alert.alert('Login Failed', getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>
              Attendance Tracker
            </Text>

            <Text style={styles.subtitle}>
              Employee Login
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Email
              </Text>

              <TextInput
                style={styles.input}
                placeholder="you@company.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Password
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              activeOpacity={0.9}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F7',
  },

  flex: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  header: {
    marginBottom: 40,
  },

  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 8,
    letterSpacing: -1,
  },

  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },

  form: {
    width: '100%',
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 10,
  },

  input: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111111',
  },

  button: {
    height: 56,
    backgroundColor: '#111827',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});