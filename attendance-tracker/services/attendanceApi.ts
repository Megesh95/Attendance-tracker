import axios from 'axios';

import { API_BASE_URL } from '@/constants/api';

export type AttendanceResponse = {
  success: boolean;
  message: string;
};

export async function punchOfficeAttendance(
  latitude: number,
  longitude: number
): Promise<AttendanceResponse> {
  const { data } = await axios.post<AttendanceResponse>(
    `${API_BASE_URL}/api/attendance/office`,
    { latitude, longitude },
    {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    }
  );

  return data;
}
