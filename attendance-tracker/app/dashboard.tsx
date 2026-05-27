import { router } from 'expo-router';

import DashboardScreen from '@/screens/DashboardScreen';
import { useAttendance } from '@/contexts/AttendanceContext';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardRoute() {
  const { resetAttendance } = useAttendance();
  const { clearSession } = useAuth();

  return (
    <DashboardScreen
      onLogout={() => {
        resetAttendance();
        clearSession();
        router.replace('/');
      }}
    />
  );
}
