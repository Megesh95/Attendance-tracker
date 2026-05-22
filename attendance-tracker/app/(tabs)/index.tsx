import { useState } from 'react';
import LoginScreen from '@/screens/LoginScreen';
import DashboardScreen from '@/screens/DashboardScreen';

export default function HomeScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (isLoggedIn) {
    return <DashboardScreen onLogout={() => setIsLoggedIn(false)} />;
  }

  return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
}