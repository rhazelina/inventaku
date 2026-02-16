
import { useAuth } from "../auth/useAuth";
import { Loader2 } from "lucide-react";
// We will just rename the existing files to .tsx later if possible, or assume they work as .jsx imported here.
// However, since we are "Migrating", we should ideally migrate them. 
// For now, I'll import the existing .jsx files. 
// If specific types are needed, we can add them later.

import { AdminProfile } from "./profile/AdminProfile";
import { OperatorProfile } from "./profile/OperatorProfile";
import { EmployeeProfile } from "./profile/EmployeeProfile";

export default function Profile() {
  const { user, loading } = useAuth(); // useAuth might need typing if we fully switch to TS

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
