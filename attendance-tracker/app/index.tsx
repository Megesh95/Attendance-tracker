import { router } from 'expo-router';

import LoginScreen from '@/screens/LoginScreen';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginRoute() {
  const { setSession } = useAuth();
  return (
    <LoginScreen
      onLoginSuccess={(session) => {
        setSession(session);
        if (session.role === 'Admin') {
          router.replace('/admin-dashboard');
        } else if (!session.referenceImagePath) {
          router.replace('/register-face');
        } else {
          router.replace('/dashboard');
        }
      }}
    />
  );
}
