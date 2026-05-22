import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useAttendance } from '@/contexts/AttendanceContext';

type DashboardScreenProps = {
  onLogout?: () => void;
};

export default function DashboardScreen({
  onLogout,
}: DashboardScreenProps) {
  const {
    attendanceStatus,
    attendanceInfo,
    attendanceHistory,
    markOffSiteCheckIn,
  } = useAttendance();

  const currentHour = new Date().getHours();

  const greeting =
    currentHour < 12
      ? 'Good Morning'
      : currentHour < 18
        ? 'Good Afternoon'
        : 'Good Evening';

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handlePunchOffice = () => {
    router.push('/office-punch');
  };

  const handlePunchOffSite = () => {
    markOffSiteCheckIn();
    Alert.alert(
      'Attendance',
      'Off-site attendance marked successfully'
    );
  };

  const isCheckedIn = attendanceStatus === 'Checked In';

  const handleAttendanceHistory = () => {
    Alert.alert(
      'Attendance History',
      attendanceHistory.length === 0
        ? 'No attendance records yet'
        : attendanceHistory.join('\n')
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>Employee</Text>
            <Text style={styles.date}>{today}</Text>
          </View>

          <View
            style={[
              styles.statusCard,
              isCheckedIn
                ? styles.statusCardCheckedIn
                : styles.statusCardNotCheckedIn,
            ]}
          >
            <Text style={styles.statusLabel}>Today&apos;s Status</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  isCheckedIn
                    ? styles.statusDotCheckedIn
                    : styles.statusDotNotCheckedIn,
                ]}
              />
              <Text
                style={[
                  styles.statusValue,
                  isCheckedIn
                    ? styles.statusValueCheckedIn
                    : styles.statusValueNotCheckedIn,
                ]}
              >
                {attendanceStatus}
              </Text>
            </View>
            <Text style={styles.statusSubtext}>{attendanceInfo}</Text>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handlePunchOffice}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>
                Punch From Office
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handlePunchOffSite}
              activeOpacity={0.9}
            >
              <Text style={styles.secondaryButtonText}>
                Punch Off-Site
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleAttendanceHistory}
              activeOpacity={0.9}
            >
              <Text style={styles.secondaryButtonText}>
                Attendance History
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Recent Activity</Text>

            {attendanceHistory.length === 0 ? (
              <Text style={styles.emptySubtitle}>
                No attendance records yet
              </Text>
            ) : (
              attendanceHistory.map((item, index) => (
                <View key={`${item}-${index}`} style={styles.historyItem}>
                  <Text style={styles.historyText}>{item}</Text>
                </View>
              ))
            )}
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => onLogout?.()}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F7',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    marginBottom: 40,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 6,
  },
  name: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 8,
  },
  date: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  statusCard: {
    borderRadius: 18,
    padding: 22,
    marginBottom: 28,
    borderWidth: 1,
  },
  statusCardNotCheckedIn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  statusCardCheckedIn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotNotCheckedIn: {
    backgroundColor: '#DC2626',
  },
  statusDotCheckedIn: {
    backgroundColor: '#059669',
  },
  statusValue: {
    fontSize: 26,
    fontWeight: '700',
  },
  statusValueNotCheckedIn: {
    color: '#DC2626',
  },
  statusValueCheckedIn: {
    color: '#059669',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  section: {
    marginBottom: 28,
  },
  primaryButton: {
    height: 58,
    backgroundColor: '#111827',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 58,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  historyItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyText: {
    fontSize: 14,
    color: '#374151',
  },
  logoutButton: {
    marginTop: 'auto',
    marginBottom: 20,
    alignItems: 'center',
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
});
