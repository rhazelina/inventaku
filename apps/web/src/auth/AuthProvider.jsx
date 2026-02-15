// src/auth/AuthProvider.jsx
import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { apiMe, apiLogin, apiLogout } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const ran = useRef(false);
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user from storage on mount
  useEffect(() => {
    const loadStoredUser = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          return true;
        }
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem("user");
      }
      return false;
    };

    if (loadStoredUser()) {
      setBooting(false);
      return;
    }

    if (ran.current) return;
    ran.current = true;

    const fetchUser = async () => {
      try {
        const res = await apiMe();
        console.log("API /auth/me response:", res);
        
        // Your Hono backend returns { user: { ... } } or { user: null }
        if (res?.user) {
          setUser(res.user);
          localStorage.setItem("user", JSON.stringify(res.user));
        } else {
          // No user data returned
          setUser(null);
          localStorage.removeItem("user");
        }
      } catch (e) {
        console.error("Auth initialization error:", e);
        // Clear on any error
        setUser(null);
        localStorage.removeItem("user");
      } finally {
        setBooting(false);
      }
    };

    fetchUser();
  }, []);

const hasRole = useCallback((requiredRole) => {
  if (!user?.role || !requiredRole) return false;

  const roleHierarchy = {
    admin: ["admin", "operator", "employee"],
    operator: ["operator", "employee"],
    employee: ["employee"],
  };

  const userRole = String(user.role).toLowerCase();
  const required = String(requiredRole).toLowerCase();

  return roleHierarchy[userRole]?.includes(required) || false;
}, [user]);


  // Check if user has at least one of the required roles
  const hasAnyRole = useCallback((roles) => {
    if (!user?.role || !Array.isArray(roles)) return false;
    return roles.some(role => hasRole(role));
  }, [user, hasRole]);

  // Check if user has all of the required roles
  const hasAllRoles = useCallback((roles) => {
    if (!user?.role || !Array.isArray(roles)) return false;
    return roles.every(role => hasRole(role));
  }, [user, hasRole]);

  // Login function - Updated for Hono response format
  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiLogin(credentials);
      console.log("Login API response:", response);
      
      // Your Hono backend returns { user: { ... } } on successful login
      if (response?.user) {
        setUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));
        return { success: true, data: response };
      } else {
        // Backend should have returned error, but just in case
        throw new Error(response?.message || "Invalid login response");
      }
    } catch (error) {
      console.error("Login error details:", error);
      
      // Extract error message from Hono response format
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

  // Logout function
  const logout = useCallback(async () => {
    setLoading(true);
    
    try {
      await apiLogout();
    } catch (error) {
      console.warn("Logout API call failed:", error);
      // Continue with client-side logout even if API fails
    } finally {
      // Clear local storage
      localStorage.removeItem("user");
      localStorage.removeItem("rememberUsername");
      
      // Clear state
      setUser(null);
      setError(null);
      setLoading(false);
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const response = await apiMe();
      if (response?.user) {
        const updatedUser = { ...user, ...response.user };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return updatedUser;
      } else {
        // No user returned (logged out)
        setUser(null);
        localStorage.removeItem("user");
        throw new Error("User session expired");
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      // If refresh fails, logout
      logout();
      throw error;
    }
  }, [user, logout]);

  // Update user profile
  const updateProfile = useCallback((updates) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    return updatedUser;
  }, [user]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Memoized context value
  const contextValue = useMemo(() => ({
    // State
    booting,
    user,
    isAuthed: !!user,
    loading,
    error,
    
    // User role methods
    hasRole,
    hasAnyRole,
    hasAllRoles,
    
    // Auth methods
    login,
    logout,
    refreshUser,
    updateProfile,
    
    // User info helpers
    userId: user?.id,
    userName: user?.name || user?.username,
    userEmail: user?.email,
    userRole: user?.role,
    userPermissions: user?.permissions || [],
    
    // Quick role checks
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

  // Show loading screen while booting
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

// Convenience hook for protected components
export function useProtected(requiredRole) {
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

// HOC for role-based access control
export function withRole(Component, requiredRole) {
  return function WithRoleComponent(props) {
    const { hasAccess, loading } = useProtected(requiredRole);
    
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    if (!hasAccess) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="mx-auto w-16 h-16 flex items-center justify-center bg-red-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page.
              {requiredRole && ` Required role: ${requiredRole}`}
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}

// // auth/AuthProvider.jsx
// import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
// import { apiMe, apiLogin, apiLogout } from "../lib/api";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const ran = useRef(false);
//   const [booting, setBooting] = useState(true);
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Load user from storage on mount
//   useEffect(() => {
//     const loadStoredUser = () => {
//       try {
//         const storedUser = localStorage.getItem("user");
//         const token = localStorage.getItem("token");
        
//         if (storedUser && token) {
//           const parsedUser = JSON.parse(storedUser);
//           setUser(parsedUser);
//           return true;
//         }
//       } catch (e) {
//         console.error("Failed to parse stored user:", e);
//         localStorage.removeItem("user");
//         localStorage.removeItem("token");
//       }
//       return false;
//     };

//     if (loadStoredUser()) {
//       setBooting(false);
//       return;
//     }

//     if (ran.current) return;
//     ran.current = true;

//     const fetchUser = async () => {
//       try {
//         const res = await apiMe();
//         if (res?.user) {
//           setUser(res.user);
//           localStorage.setItem("user", JSON.stringify(res.user));
//           if (res.token) {
//             localStorage.setItem("token", res.token);
//           }
//         }
//       } catch (e) {
//         // Clear invalid tokens
//         if (e.response?.status === 401) {
//           localStorage.removeItem("token");
//           localStorage.removeItem("user");
//         } else {
//           console.error("Auth initialization error:", e);
//         }
//         setUser(null);
//       } finally {
//         setBooting(false);
//       }
//     };

//     fetchUser();
//   }, []);

//   // Safe role checking function
//   const hasRole = useCallback((requiredRole) => {
//     if (!user?.role || !requiredRole) return false;
    
//     const roleHierarchy = {
//       'admin': ['admin', 'operator', 'employee'],
//       'operator': ['operator', 'employee'],
//       'employee': ['employee']
//     };
    
//     const userRole = user.role.toLowerCase();
//     const requiredRoleLower = requiredRole.toLowerCase();
    
//     return roleHierarchy[requiredRoleLower]?.includes(userRole) || false;
//   }, [user]);

//   // Check if user has at least one of the required roles
//   const hasAnyRole = useCallback((roles) => {
//     if (!user?.role || !Array.isArray(roles)) return false;
//     return roles.some(role => hasRole(role));
//   }, [user, hasRole]);

//   // Check if user has all of the required roles
//   const hasAllRoles = useCallback((roles) => {
//     if (!user?.role || !Array.isArray(roles)) return false;
//     return roles.every(role => hasRole(role));
//   }, [user, hasRole]);

//   // Login function
//   const login = useCallback(async (credentials) => {
//     setLoading(true);
//     setError(null);
    
//     try {
//       const response = await apiLogin(credentials);
      
//       if (response?.user && response?.token) {
//         setUser(response.user);
//         localStorage.setItem("user", JSON.stringify(response.user));
//         localStorage.setItem("token", response.token);
        
//         // Set token expiry if provided
//         if (response.expiresIn) {
//           const expiryTime = Date.now() + response.expiresIn * 1000;
//           localStorage.setItem("token_expiry", expiryTime.toString());
//         }
        
//         return { success: true, data: response };
//       } else {
//         throw new Error("Invalid login response");
//       }
//     } catch (error) {
//       const errorMessage = error.response?.data?.message || 
//                           error.message || 
//                           "Login failed. Please check your credentials.";
//       setError(errorMessage);
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Logout function
//   const logout = useCallback(async () => {
//     setLoading(true);
    
//     try {
//       // Call logout API if token exists
//       const token = localStorage.getItem("token");
//       if (token) {
//         await apiLogout();
//       }
//     } catch (error) {
//       console.warn("Logout API call failed:", error);
//       // Continue with client-side logout even if API fails
//     } finally {
//       // Clear local storage
//       localStorage.removeItem("user");
//       localStorage.removeItem("token");
//       localStorage.removeItem("token_expiry");
//       localStorage.removeItem("rememberUsername");
      
//       // Clear state
//       setUser(null);
//       setError(null);
//       setLoading(false);
//     }
//   }, []);

//   // Refresh user data
//   const refreshUser = useCallback(async () => {
//     try {
//       const response = await apiMe();
//       if (response?.user) {
//         const updatedUser = { ...user, ...response.user };
//         setUser(updatedUser);
//         localStorage.setItem("user", JSON.stringify(updatedUser));
//         return updatedUser;
//       }
//     } catch (error) {
//       console.error("Failed to refresh user:", error);
//       // If refresh fails with 401, logout
//       if (error.response?.status === 401) {
//         logout();
//       }
//       throw error;
//     }
//   }, [user, logout]);

//   // Update user profile
//   const updateProfile = useCallback((updates) => {
//     if (!user) return;
    
//     const updatedUser = { ...user, ...updates };
//     setUser(updatedUser);
//     localStorage.setItem("user", JSON.stringify(updatedUser));
//     return updatedUser;
//   }, [user]);

//   // Check token expiry
//   const checkTokenExpiry = useCallback(() => {
//     const expiry = localStorage.getItem("token_expiry");
//     if (!expiry) return true; // No expiry set, assume valid
    
//     const expiryTime = parseInt(expiry, 10);
//     const currentTime = Date.now();
    
//     // Return true if token is still valid, false if expired
//     return currentTime < expiryTime;
//   }, []);

//   // Auto-logout on token expiry
//   useEffect(() => {
//     if (!user) return;
    
//     const checkExpiry = () => {
//       if (!checkTokenExpiry()) {
//         console.log("Token expired, logging out...");
//         logout();
//       }
//     };
    
//     // Check every minute
//     const interval = setInterval(checkExpiry, 60000);
    
//     return () => clearInterval(interval);
//   }, [user, checkTokenExpiry, logout]);

//   // Clear error after 5 seconds
//   useEffect(() => {
//     if (error) {
//       const timer = setTimeout(() => {
//         setError(null);
//       }, 5000);
      
//       return () => clearTimeout(timer);
//     }
//   }, [error]);

//   // Memoized context value
//   const contextValue = useMemo(() => ({
//     // State
//     booting,
//     user,
//     isAuthed: !!user,
//     loading,
//     error,
    
//     // User role methods
//     hasRole,
//     hasAnyRole,
//     hasAllRoles,
    
//     // Auth methods
//     login,
//     logout,
//     refreshUser,
//     updateProfile,
//     checkTokenExpiry,
    
//     // User info helpers
//     userId: user?.id,
//     userName: user?.name || user?.username,
//     userEmail: user?.email,
//     userRole: user?.role,
//     userPermissions: user?.permissions || [],
    
//     // Quick role checks
//     isAdmin: hasRole('admin'),
//     isOperator: hasRole('operator'),
//     isEmployee: hasRole('employee'),
//   }), [
//     booting,
//     user,
//     loading,
//     error,
//     hasRole,
//     hasAnyRole,
//     hasAllRoles,
//     login,
//     logout,
//     refreshUser,
//     updateProfile,
//     checkTokenExpiry,
//   ]);

//   // Show loading screen while booting
//   if (booting) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
//         <div className="text-center">
//           <div className="relative">
//             <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse"></div>
//             <div className="absolute inset-0 flex items-center justify-center">
//               <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//             </div>
//           </div>
//           <p className="text-gray-600 font-medium">Loading authentication...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <AuthContext.Provider value={contextValue}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) {
//     throw new Error("useAuth must be used within AuthProvider");
//   }
//   return ctx;
// }

// // Convenience hook for protected components
// export function useProtected(requiredRole) {
//   const auth = useAuth();
  
//   if (auth.booting) {
//     return { loading: true, hasAccess: false, auth };
//   }
  
//   if (!auth.isAuthed) {
//     return { loading: false, hasAccess: false, auth };
//   }
  
//   if (requiredRole && !auth.hasRole(requiredRole)) {
//     return { loading: false, hasAccess: false, auth };
//   }
  
//   return { loading: false, hasAccess: true, auth };
// }

// // HOC for role-based access control
// export function withRole(Component, requiredRole) {
//   return function WithRoleComponent(props) {
//     const { hasAccess, loading } = useProtected(requiredRole);
    
//     if (loading) {
//       return (
//         <div className="flex items-center justify-center p-8">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//         </div>
//       );
//     }
    
//     if (!hasAccess) {
//       return (
//         <div className="min-h-[50vh] flex items-center justify-center">
//           <div className="text-center p-8 max-w-md">
//             <div className="mx-auto w-16 h-16 flex items-center justify-center bg-red-100 rounded-full mb-4">
//               <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//               </svg>
//             </div>
//             <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
//             <p className="text-gray-600 mb-6">
//               You don't have permission to access this page.
//               {requiredRole && ` Required role: ${requiredRole}`}
//             </p>
//             <button
//               onClick={() => window.history.back()}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//             >
//               Go Back
//             </button>
//           </div>
//         </div>
//       );
//     }
    
//     return <Component {...props} />;
//   };
// }