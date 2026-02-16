
import { useAuth } from "../auth/useAuth";
import AdminDashboard from "./dashboard/AdminDashboard";
import OperatorDashboard from "./dashboard/OperatorDashboard";
import EmployeeDashboard from "./dashboard/EmployeeDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  if (role === "admin") return <AdminDashboard />;
  if (role === "operator") return <OperatorDashboard />;
  return <EmployeeDashboard />;
}
