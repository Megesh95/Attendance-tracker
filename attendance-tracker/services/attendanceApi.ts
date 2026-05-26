import axios from 'axios';

import { API_BASE_URL } from '@/constants/api';
import { DEFAULT_EMPLOYEE_ID } from '@/constants/employee';

export type AttendanceResponse = {
  success: boolean;
  message: string;
};

export type OfficeAttendanceRequest = {
  employeeId: number;
  latitude: number;
  longitude: number;
  attendanceType?: string;
};

export async function punchOfficeAttendance(
  latitude: number,
  longitude: number,
  employeeId: number = DEFAULT_EMPLOYEE_ID,
  attendanceType: string = 'Office'
): Promise<AttendanceResponse> {
  const body: OfficeAttendanceRequest = {
    employeeId,
    latitude,
    longitude,
    attendanceType,
  };

  const { data } = await axios.post<AttendanceResponse>(
    `${API_BASE_URL}/api/attendance/office`,
    body,
    {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    }
  );

  return data;
}
