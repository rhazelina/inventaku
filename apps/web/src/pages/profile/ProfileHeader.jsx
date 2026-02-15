import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { Shield, LogOut, Mail, User } from "lucide-react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export function ProfileHeader() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const initials = useMemo(() => {
    const s = (user?.name || user?.username || "U").trim();
    return s.slice(0, 2).toUpperCase();
  }, [user]);

  const roleBadgeColor = useMemo(() => {
    switch(user?.role?.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'operator': return 'bg-blue-100 text-blue-700';
      case 'employee': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Avatar */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-2xl font-bold">
            {initials}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-2 border-white"></div>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.name || "—"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  @{user?.username || "—"}
                </span>
              </div>
            </div>

            <span className={cx("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium", roleBadgeColor)}>
              <Shield className="w-4 h-4" />
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "—"}
            </span>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs text-gray-500">User ID</div>
              <div className="text-sm font-medium text-gray-900 truncate" title={user?.id}>
                {user?.id?.slice(0, 8)}...
              </div>
            </div>
            
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs text-gray-500">Username</div>
              <div className="text-sm font-medium text-gray-900">
                {user?.username || "—"}
              </div>
            </div>
            
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs text-gray-500">Role</div>
              <div className="text-sm font-medium text-gray-900">
                {user?.role || "—"}
              </div>
            </div>
            
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs text-gray-500">Status</div>
              <div className="text-sm font-medium text-emerald-600">
                Aktif
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <User className="w-4 h-4" />
          Kembali ke Dashboard
        </button>
        
        <button
          onClick={handleLogout}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          {loading ? "Keluar..." : "Keluar"}
        </button>
      </div>
    </div>
  );
}
