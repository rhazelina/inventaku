import { createContext } from "react";

export interface User {
  id: string;
  username: string;
  name?: string;
  email?: string;
  role: string;
  permissions?: string[];
  [key: string]: any;
}

export interface AuthContextType {
  booting: boolean;
  user: User | null;
  isAuthed: boolean;
  loading: boolean;
  error: string | null;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  login: (credentials: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  updateProfile: (updates: Partial<User>) => User | undefined;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  userPermissions?: string[];
  isAdmin: boolean;
  isOperator: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export default AuthContext;
