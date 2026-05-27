import axios, { isAxiosError } from 'axios';

import { API_BASE_URL } from '@/constants/api';

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  employeeId?: number;
  name?: string;
  email?: string;
  role?: string;
  referenceImagePath?: string | null;
};

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const { data } = await axios.post<LoginResponse>(
    `${API_BASE_URL}/api/auth/login`,
    { email, password },
    {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    }
  );

  return data;
}

export async function registerFace(
  employeeId: number,
  selfieUri: string
): Promise<LoginResponse> {
  const formData = new FormData();

  formData.append('employeeId', String(employeeId));
  // Expo Camera returns a file:// URI in most cases; RN FormData accepts it.
  formData.append(
    'selfie',
    {
      uri: selfieUri,
      type: 'image/jpeg',
      name: 'selfie.jpg',
    } as any
  );

  const { data } = await axios.post<LoginResponse>(
    `${API_BASE_URL}/api/auth/register-face`,
    formData,
    {
      timeout: 15000,
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );

  return data;
}

export function getAuthErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string })?.message ??
      (error.response ? 'Invalid credentials' : 'Network error')
    );
  }

  return 'Something went wrong. Please try again.';
}

