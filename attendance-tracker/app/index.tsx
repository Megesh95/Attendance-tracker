import { router } from 'expo-router';

import LoginScreen from '@/screens/LoginScreen';

export default function LoginRoute() {
  return (
    <LoginScreen
      onLoginSuccess={() => router.replace('/dashboard')}
    />
  );
}
