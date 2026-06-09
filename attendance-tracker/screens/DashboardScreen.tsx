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
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/colors';
import { getAttendanceHistory } from '@/services/attendanceApi';
import { useEffect } from 'react';

const MAX_RECENT_ACTIVITY = 5;

type DashboardScreenProps = {
  onLogout?: () => void;
};

type ActivityStyle = {
  dot: object;
  pill: object;
  pillText: object;
};

function getActivityStyle(entry: string): ActivityStyle {
  if (entry.includes('Office')) {
    return {
      dot: { backgroundColor: colors.accent.office },
      pill: { backgroundColor: colors.accent.officeBg },
      pillText: { color: colors.successDark },
    };
  }
  if (entry.includes('Off-Site')) {
    return {
      dot: { backgroundColor: colors.accent.offSite },
      pill: { backgroundColor: colors.accent.offSiteBg },
      pillText: { color: colors.accent.offSite },
    };
  }
  return {
    dot: { backgroundColor: colors.textMuted },
    pill: { backgroundColor: colors.borderMuted },
    pillText: { color: colors.textSecondary },
  };
}

function parseActivityEntry(entry: string) {
  const parts = entry.split('•').map((p) => p.trim());
  return {
    time: parts[0] ?? entry,
    type: parts[1] ?? 'Attendance',
  };
}

export default function DashboardScreen({
  onLogout,
}: DashboardScreenProps) {
  const {
    attendanceStatus,
    attendanceInfo,
    attendanceHistory,
    setHistory,
    setTodayStatus,
  } = useAttendance();

  const { employeeName, employeeId } = useAuth();

  useEffect(() => {
    if (employeeId) {
      getAttendanceHistory(employeeId)
        .then((response) => {
          if (response.success && response.data) {
            let latestTodayRecord: string | null = null;
            const formattedHistory = response.data.map(
              (record) => {
                const date = new Date(record.punchTime);
                const now = new Date();
                const timeStr = date.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                
                if (date.toDateString() === now.toDateString()) {
                  if (!latestTodayRecord) {
                    latestTodayRecord = `${timeStr} • ${record.attendanceType}`;
                  }
                  return `${timeStr} • ${record.attendanceType}`;
                } else {
                  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                  return `${dateStr}, ${timeStr} • ${record.attendanceType}`;
                }
              }
            );
            setHistory(formattedHistory);
            
            if (latestTodayRecord) {
              setTodayStatus('Checked In', latestTodayRecord);
            }
          }
        })
        .catch((error) => {
          console.error('Failed to fetch attendance history', error);
        });
    }
  }, [employeeId, setHistory, setTodayStatus]);

  const isCheckedIn = attendanceStatus === 'Checked In';
  const recentActivity = attendanceHistory.slice(0, MAX_RECENT_ACTIVITY);
  const hasMoreHistory = attendanceHistory.length > MAX_RECENT_ACTIVITY;

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
    router.push('/offsite-punch');
  };

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
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>Attendance</Text>
            </View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>
              {employeeName ?? 'Employee'}
            </Text>
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

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handlePunchOffice}
              activeOpacity={0.9}
            >
              <View style={styles.buttonAccentOffice} />
              <Text style={styles.primaryButtonText}>Punch From Office</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handlePunchOffSite}
              activeOpacity={0.9}
            >
              <View style={styles.buttonAccentOffSite} />
              <Text style={styles.secondaryButtonText}>Punch Off-Site</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, styles.historyButton]}
              onPress={handleAttendanceHistory}
              activeOpacity={0.9}
            >
              <Text style={styles.secondaryButtonText}>
                View Full History
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityTitle}>Recent Activity</Text>
              {recentActivity.length > 0 && (
                <View style={styles.activityCountPill}>
                  <Text style={styles.activityCountText}>
                    {Math.min(
                      attendanceHistory.length,
                      MAX_RECENT_ACTIVITY
                    )}
                    {hasMoreHistory ? ` of ${attendanceHistory.length}` : ''}
                  </Text>
                </View>
              )}
            </View>

            {recentActivity.length === 0 ? (
              <View style={styles.emptyActivity}>
                <Text style={styles.emptySubtitle}>
                  No attendance records yet
                </Text>
                <Text style={styles.emptyHint}>
                  Punch in from office or off-site to see activity here
                </Text>
              </View>
            ) : (
              <>
                {recentActivity.map((item, index) => {
                  const { time, type } = parseActivityEntry(item);
                  const accent = getActivityStyle(item);
                  const isLast = index === recentActivity.length - 1;

                  return (
                    <View
                      key={`${item}-${index}`}
                      style={[
                        styles.historyItem,
                        isLast && styles.historyItemLast,
                      ]}
                    >
                      <View style={[styles.historyDot, accent.dot]} />
                      <View style={styles.historyContent}>
                        <Text style={styles.historyTime}>{time}</Text>
                        <View style={[styles.historyPill, accent.pill]}>
                          <Text style={[styles.historyPillText, accent.pillText]}>
                            {type}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
                {hasMoreHistory && (
                  <TouchableOpacity
                    onPress={handleAttendanceHistory}
                    activeOpacity={0.85}
                    style={styles.viewMoreButton}
                  >
                    <Text style={styles.viewMoreText}>
                      View {attendanceHistory.length - MAX_RECENT_ACTIVITY}{' '}
                      more
                    </Text>
                  </TouchableOpacity>
                )}
              </>
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  greeting: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 14,
    color: colors.textMuted,
  },
  statusCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  statusCardNotCheckedIn: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  statusCardCheckedIn: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
    backgroundColor: colors.danger,
  },
  statusDotCheckedIn: {
    backgroundColor: colors.success,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statusValueNotCheckedIn: {
    color: colors.danger,
  },
  statusValueCheckedIn: {
    color: colors.success,
  },
  statusSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  actionsCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 24,
  },
  primaryButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  buttonAccentOffice: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.accent.office,
  },
  primaryButtonText: {
    color: colors.primaryContrast,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 54,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  buttonAccentOffSite: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.accent.offSite,
  },
  historyButton: {
    marginBottom: 0,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  activityCountPill: {
    backgroundColor: colors.borderMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyActivity: {
    paddingVertical: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
    gap: 12,
  },
  historyItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  historyTime: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  historyPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  historyPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewMoreButton: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  logoutText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
