import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type AuthSession = {
  employeeId: number;
  name: string;
  email: string;
  role: string;
  referenceImagePath: string | null;
};

type AuthContextValue = {
  employeeId: number | null;
  employeeName: string | null;
  employeeEmail: string | null;
  employeeRole: string | null;
  referenceImagePath: string | null;
  setSession: (session: AuthSession) => void;
  setReferenceImagePath: (path: string | null) => void;
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [employeeEmail, setEmployeeEmail] = useState<string | null>(null);
  const [employeeRole, setEmployeeRole] = useState<string | null>(null);
  const [referenceImagePath, setReferenceImagePath] = useState<string | null>(
    null
  );

  const setSession = useCallback((session: AuthSession) => {
    setEmployeeId(session.employeeId);
    setEmployeeName(session.name);
    setEmployeeEmail(session.email);
    setEmployeeRole(session.role);
    setReferenceImagePath(session.referenceImagePath);
  }, []);

  const clearSession = useCallback(() => {
    setEmployeeId(null);
    setEmployeeName(null);
    setEmployeeEmail(null);
    setEmployeeRole(null);
    setReferenceImagePath(null);
  }, []);

  const value = useMemo(
    () => ({
      employeeId,
      employeeName,
      employeeEmail,
      employeeRole,
      referenceImagePath,
      setSession,
      setReferenceImagePath,
      clearSession,
    }),
    [
      employeeId,
      employeeName,
      employeeEmail,
      employeeRole,
      referenceImagePath,
      setSession,
      clearSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

