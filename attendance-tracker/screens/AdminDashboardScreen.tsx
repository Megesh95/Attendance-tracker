import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { useAuth } from '@/contexts/AuthContext';
import { getAdminDashboardData, getExportAttendanceUrl, type EmployeeWithAttendances, type AttendanceRecord } from '@/services/adminApi';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { colors } from '@/constants/colors';

export default function AdminDashboardScreen() {
  const { clearSession, employeeName } = useAuth();
  const [employees, setEmployees] = useState<EmployeeWithAttendances[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithAttendances | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getAdminDashboardData();
      if (result.success) {
        setEmployees(result.data);
      } else {
        setError('Failed to load data');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (type: 'today' | 'history', employeeId?: number) => {
    try {
      setIsLoading(true);
      let dateParam = undefined;
      if (type === 'today') {
        dateParam = new Date().toISOString().split('T')[0];
      }

      const url = getExportAttendanceUrl(searchQuery, departmentFilter, dateParam, employeeId);
      const filename = `Attendance_${type}_${Date.now()}.xlsx`;
      const file = new File(Paths.document, filename);

      await File.downloadFileAsync(url, file);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri);
      } else {
        alert('Sharing is not available on this device');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    router.replace('/');
  };

  // Helper to check if employee has attendance today
  const isPresentToday = (attendances: AttendanceRecord[]) => {
    const today = new Date().toDateString();
    return attendances.some(
      (a) => new Date(a.punchTime).toDateString() === today
    );
  };

  // Derived metrics
  const { totalEmployees, presentToday, absentToday, attendancePercent } = useMemo(() => {
    const total = employees.length;
    if (total === 0) return { totalEmployees: 0, presentToday: 0, absentToday: 0, attendancePercent: 0 };
    
    const present = employees.filter(e => isPresentToday(e.attendances)).length;
    const absent = total - present;
    const percent = Math.round((present / total) * 100);

    return {
      totalEmployees: total,
      presentToday: present,
      absentToday: absent,
      attendancePercent: percent,
    };
  }, [employees]);

  // Filtered list
  const filteredEmployees = useMemo(() => {
    let result = employees;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(query));
    }
    if (departmentFilter.trim()) {
      const dept = departmentFilter.toLowerCase();
      result = result.filter(e => e.role.toLowerCase().includes(dept));
    }
    return result;
  }, [employees, searchQuery, departmentFilter]);

  const renderEmployeeRow = ({ item }: { item: EmployeeWithAttendances }) => {
    const present = isPresentToday(item.attendances);

    return (
      <View style={styles.tableRow}>
        <Text style={[styles.cell, styles.cellId]}>{item.id}</Text>
        <Text style={[styles.cell, styles.cellName]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.cell, styles.cellDept]} numberOfLines={1}>{item.role}</Text>
        <View style={styles.cellStatus}>
          <View style={[styles.statusBadge, present ? styles.statusPresent : styles.statusAbsent]}>
            <Text style={[styles.statusText, present ? styles.statusTextPresent : styles.statusTextAbsent]}>
              {present ? 'Present' : 'Absent'}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.cellView} 
          onPress={() => setSelectedEmployee(item)}
        >
          <IconSymbol name="eye" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Attendance Tracker - Admin Dashboard</Text>
          <Text style={styles.subtitle}>Welcome, {employeeName}</Text>
          <Text style={styles.dateText}>{currentDate}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{totalEmployees}</Text>
          <Text style={styles.metricLabel}>Total Employees</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: colors.success }]}>{presentToday}</Text>
          <Text style={styles.metricLabel}>Present Today</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: colors.danger }]}>{absentToday}</Text>
          <Text style={styles.metricLabel}>Absent</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: colors.primary }]}>{attendancePercent}%</Text>
          <Text style={styles.metricLabel}>Attendance %</Text>
        </View>
      </View>

      {/* Search Bar & Filters */}
      <View style={styles.filterContainer}>
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Name..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.searchContainer}>
          <IconSymbol name="building.2" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Filter Dept..."
            placeholderTextColor={colors.textMuted}
            value={departmentFilter}
            onChangeText={setDepartmentFilter}
          />
        </View>
      </View>

      <View style={styles.exportButtonsContainer}>
        <TouchableOpacity style={styles.exportButton} onPress={() => handleDownload('today')}>
          <IconSymbol name="arrow.down.doc" size={16} color={colors.primaryContrast} />
          <Text style={styles.exportButtonText}>Export Today</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportButton} onPress={() => handleDownload('history')}>
          <IconSymbol name="arrow.down.doc.fill" size={16} color={colors.primaryContrast} />
          <Text style={styles.exportButtonText}>Export History</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Employee List</Text>

      {/* Table */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.headerCell, styles.cellId]}>ID</Text>
          <Text style={[styles.headerCell, styles.cellName]}>Name</Text>
          <Text style={[styles.headerCell, styles.cellDept]}>Department</Text>
          <Text style={[styles.headerCell, styles.cellStatus]}>Today's Status</Text>
          <Text style={[styles.headerCell, styles.cellView]}>View</Text>
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredEmployees}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderEmployeeRow}
            contentContainerStyle={styles.tableListContent}
            refreshing={isLoading}
            onRefresh={loadData}
          />
        )}
      </View>

      {/* Detail Modal */}
      <Modal
        visible={selectedEmployee !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedEmployee(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{selectedEmployee?.name}'s Attendance</Text>
              <TouchableOpacity style={styles.modalExportButton} onPress={() => handleDownload('history', selectedEmployee?.id)}>
                <IconSymbol name="arrow.down.doc.fill" size={14} color={colors.primary} />
                <Text style={styles.modalExportButtonText}>Export Records</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setSelectedEmployee(null)} style={styles.closeButton}>
              <IconSymbol name="xmark" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedEmployee?.attendances.length === 0 ? (
              <Text style={styles.noAttendance}>No attendance records found.</Text>
            ) : (
              selectedEmployee?.attendances.map((attendance) => (
                <View key={attendance.id} style={styles.attendanceCard}>
                  <View style={styles.attendanceHeader}>
                    <Text style={styles.attendanceDate}>
                      {new Date(attendance.punchTime).toLocaleString()}
                    </Text>
                    <View style={styles.attendanceStatusBadge}>
                      <Text style={styles.attendanceStatusText}>{attendance.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.attendanceDetail}>Type: {attendance.attendanceType}</Text>
                  <Text style={styles.attendanceDetail}>Face Verified: {attendance.faceVerified ? 'Yes' : 'No'}</Text>
                  <Text style={styles.attendanceDetail}>Location Verified: {attendance.locationVerified ? 'Yes' : 'No'}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 16,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exportButtonsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  exportButtonText: {
    color: colors.primaryContrast,
    fontSize: 14,
    fontWeight: '600',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.borderMuted,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tableListContent: {
    paddingBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  cell: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  cellId: {
    flex: 0.5,
    textAlign: 'center',
  },
  cellName: {
    flex: 1.5,
  },
  cellDept: {
    flex: 1.5,
  },
  cellStatus: {
    flex: 1.5,
    alignItems: 'center',
  },
  cellView: {
    flex: 0.5,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPresent: {
    backgroundColor: colors.successBg,
  },
  statusAbsent: {
    backgroundColor: colors.dangerBg,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextPresent: {
    color: colors.successDark,
  },
  statusTextAbsent: {
    color: colors.dangerDark,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: colors.primaryContrast,
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalExportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  modalExportButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  attendanceCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
    paddingBottom: 8,
  },
  attendanceDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  attendanceStatusBadge: {
    backgroundColor: colors.borderMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  attendanceStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  attendanceDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  noAttendance: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 40,
  },
});

