import { useEffect, useRef, useState, useCallback, useMemo, type ReactNode } from "react";
import { apiMe, apiLogin, apiLogout } from "../lib/api";
import AuthContext, { type User } from "./AuthContext";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const ran = useRef(false);
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user from storage on mount
  useEffect(() => {
    const loadStoredUser = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          return;
        }
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem("user");
      }
    };

    // Keep optimistic render from local storage, but always verify with backend
    // to prevent redirect loops when cookie session has expired.
    loadStoredUser();

    if (ran.current) return;
    ran.current = true;

    const fetchUser = async () => {
      try {
        const res: any = await apiMe();
        if (res?.user) {
          setUser(res.user);
          localStorage.setItem("user", JSON.stringify(res.user));
        } else {
          setUser(null);
          localStorage.removeItem("user");
        }
      } catch (e) {
        console.error("Auth initialization error:", e);
        setUser(null);
        localStorage.removeItem("user");
      } finally {
        setBooting(false);
      }
    };

    fetchUser();
  }, []);

  const hasRole = useCallback((requiredRole: string) => {
    if (!user?.role || !requiredRole) return false;

    const roleHierarchy: Record<string, string[]> = {
      admin: ["admin", "operator", "employee"],
      operator: ["operator", "employee"],
      employee: ["employee"],
    };

    const userRole = String(user.role).toLowerCase();
    const required = String(requiredRole).toLowerCase();

    return roleHierarchy[userRole]?.includes(required) || false;
  }, [user]);

  const hasAnyRole = useCallback((roles: string[]) => {
    if (!user?.role || !Array.isArray(roles)) return false;
    return roles.some(role => hasRole(role));
  }, [user, hasRole]);

  const hasAllRoles = useCallback((roles: string[]) => {
    if (!user?.role || !Array.isArray(roles)) return false;
    return roles.every(role => hasRole(role));
  }, [user, hasRole]);

  const login = useCallback(async (credentials: any) => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await apiLogin(credentials);
      if (response?.user) {
        setUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));
        return { success: true, data: response };
      } else {
        throw new Error(response?.message || "Invalid login response");
      }
    } catch (error: any) {
      console.error("Login error details:", error);
      let errorMessage = "Login failed. Please check your credentials.";
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await apiLogout();
    } catch (error) {
      console.warn("Logout API call failed:", error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("rememberUsername");
      setUser(null);
      setError(null);
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response: any = await apiMe();
      if (response?.user) {
        const updatedUser = { ...user, ...response.user } as User;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return updatedUser;
      } else {
        setUser(null);
        localStorage.removeItem("user");
        throw new Error("User session expired");
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      logout();
      throw error;
    }
  }, [user, logout]);

  const updateProfile = useCallback((updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    return updatedUser;
  }, [user]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const contextValue = useMemo(() => ({
    booting,
    user,
    isAuthed: !!user,
    loading,
    error,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    login,
    logout,
    refreshUser,
    updateProfile,
    userId: user?.id,
    userName: user?.name || user?.username,
    userEmail: user?.email,
    userRole: user?.role,
    userPermissions: user?.permissions || [],
    isAdmin: hasRole('admin'),
    isOperator: hasRole('operator'),
    isEmployee: hasRole('employee'),
  }), [
    booting,
    user,
    loading,
    error,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    login,
    logout,
    refreshUser,
    updateProfile,
  ]);

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
