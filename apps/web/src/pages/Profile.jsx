// src/pages/Profile.jsx
import { useAuth } from "../auth/AuthProvider";
import { AdminProfile } from "./profile/AdminProfile";
import { OperatorProfile } from "./profile/OperatorProfile";
import { EmployeeProfile } from "./profile/EmployeeProfile";

export default function Profile() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const renderProfileByRole = () => {
    const role = user?.role?.toLowerCase();
    
    switch(role) {
      case 'admin':
        return <AdminProfile />;
      case 'operator':
        return <OperatorProfile />;
      case 'employee':
        return <EmployeeProfile />;
      default:
        return <EmployeeProfile />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {renderProfileByRole()}
    </div>
  );
}