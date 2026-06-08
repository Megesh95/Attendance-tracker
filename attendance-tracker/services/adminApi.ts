import { API_BASE_URL } from '@/constants/api';

export type AdminDashboardData = {
  success: boolean;
  data: EmployeeWithAttendances[];
};

export type EmployeeWithAttendances = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  attendances: AttendanceRecord[];
};

export type AttendanceRecord = {
  id: number;
  punchTime: string;
  attendanceType: string;
  status: string;
  locationVerified: boolean;
  faceVerified: boolean;
  latitude: number | null;
  longitude: number | null;
  confidenceScore: number | null;
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const url = `${API_BASE_URL}/api/admin/dashboard-data`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('getAdminDashboardData error:', error);
    throw error;
  }
}

export function getExportAttendanceUrl(
  search?: string,
  department?: string,
  date?: string,
  employeeId?: number
): string {
  const url = new URL(`${API_BASE_URL}/api/admin/export`);
  if (search) url.searchParams.append('search', search);
  if (department) url.searchParams.append('department', department);
  if (date) url.searchParams.append('date', date);
  if (employeeId) url.searchParams.append('employeeId', employeeId.toString());
  return url.toString();
}
