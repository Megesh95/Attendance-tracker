import axios, { isAxiosError } from 'axios';

import { API_BASE_URL } from '@/constants/api';
import { DEFAULT_EMPLOYEE_ID } from '@/constants/employee';

export type AttendanceResponse = {
  success: boolean;
  message: string;
};

export type PunchOfficeWithSelfieParams = {
  employeeId?: number;
  latitude: number;
  longitude: number;
  selfieUri: string;
  attendanceType?: string;
};

export async function punchOfficeAttendanceWithSelfie(
  params: PunchOfficeWithSelfieParams
): Promise<AttendanceResponse> {
  const {
    employeeId = DEFAULT_EMPLOYEE_ID,
    latitude,
    longitude,
    selfieUri,
    attendanceType = 'Office',
  } = params;

  const formData = new FormData();
  formData.append('employeeId', String(employeeId));
  formData.append('latitude', String(latitude));
  formData.append('longitude', String(longitude));
  formData.append('attendanceType', attendanceType);

  formData.append(
    'selfie',
    {
      uri: selfieUri,
      type: 'image/jpeg',
      name: 'selfie.jpg',
    } as any
  );

  const { data } = await axios.post<AttendanceResponse>(
    `${API_BASE_URL}/api/attendance/office`,
    formData,
    {
      timeout: 30000,
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );

  return data;
}

export function getAttendanceErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string })?.message ??
      (error.response ? 'Attendance failed' : 'Network error')
    );
  }
  return 'Something went wrong. Please try again.';
}

export type AttendanceRecord = {
  punchTime: string;
  attendanceType: string;
};

export type HistoryResponse = {
  success: boolean;
  data: AttendanceRecord[];
};

export async function getAttendanceHistory(
  employeeId: number = DEFAULT_EMPLOYEE_ID
): Promise<HistoryResponse> {
  const { data } = await axios.get<HistoryResponse>(
    `${API_BASE_URL}/api/attendance/history/${employeeId}`,
    { timeout: 10000 }
  );
  return data;
}

