import { useProtected } from "./useAuth";

/**
 * HOC for role-based access control
 */
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
