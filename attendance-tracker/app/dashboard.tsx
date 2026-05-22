import { router } from 'expo-router';

import DashboardScreen from '@/screens/DashboardScreen';
import { useAttendance } from '@/contexts/AttendanceContext';

export default function DashboardRoute() {
  const { resetAttendance } = useAttendance();

  return (
    <DashboardScreen
      onLogout={() => {
        resetAttendance();
        router.replace('/');
      }}
    />
  );
}
