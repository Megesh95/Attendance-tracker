import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type AttendanceContextValue = {
  attendanceStatus: string;
  attendanceInfo: string;
  attendanceHistory: string[];
  markOfficeCheckIn: () => void;
  markOffSiteCheckIn: () => void;
  resetAttendance: () => void;
};

const initialInfo =
  'Your attendance for today has not been marked yet.';

const AttendanceContext = createContext<AttendanceContextValue | null>(
  null
);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [attendanceStatus, setAttendanceStatus] =
    useState('Not Checked In');
  const [attendanceInfo, setAttendanceInfo] = useState(initialInfo);
  const [attendanceHistory, setAttendanceHistory] = useState<string[]>(
    []
  );

  const addCheckIn = useCallback((label: 'Office' | 'Off-Site') => {
    const currentTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setAttendanceStatus('Checked In');
    setAttendanceInfo(`${currentTime} • ${label}`);
    setAttendanceHistory((prev) => [
      `${currentTime} • ${label}`,
      ...prev,
    ]);
  }, []);

  const markOfficeCheckIn = useCallback(
    () => addCheckIn('Office'),
    [addCheckIn]
  );

  const markOffSiteCheckIn = useCallback(
    () => addCheckIn('Off-Site'),
    [addCheckIn]
  );

  const resetAttendance = useCallback(() => {
    setAttendanceStatus('Not Checked In');
    setAttendanceInfo(initialInfo);
    setAttendanceHistory([]);
  }, []);

  const value = useMemo(
    () => ({
      attendanceStatus,
      attendanceInfo,
      attendanceHistory,
      markOfficeCheckIn,
      markOffSiteCheckIn,
      resetAttendance,
    }),
    [
      attendanceStatus,
      attendanceInfo,
      attendanceHistory,
      markOfficeCheckIn,
      markOffSiteCheckIn,
      resetAttendance,
    ]
  );

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error(
      'useAttendance must be used within AttendanceProvider'
    );
  }
  return context;
}
