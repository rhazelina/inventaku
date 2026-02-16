import { useContext } from "react";
import AuthContext, { type AuthContextType } from "./AuthContext";

/**
 * Main hook to access auth state and methods
 */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

/**
 * Convenience hook for protected components/routes
 */
export function useProtected(requiredRole?: string) {
  const auth = useAuth();
  
  if (auth.booting) {
    return { loading: true, hasAccess: false, auth };
  }
  
  if (!auth.isAuthed) {
    return { loading: false, hasAccess: false, auth };
  }
  
  if (requiredRole && !auth.hasRole(requiredRole)) {
    return { loading: false, hasAccess: false, auth };
  }
  
  return { loading: false, hasAccess: true, auth };
}
