
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText, 
  LogOut, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  User
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "operator", "employee"] },
  { path: "/items", label: "Daftar Barang", icon: Package, roles: ["admin", "operator", "employee"] },
  { path: "/loans", label: "Peminjaman", icon: FileText, roles: ["admin", "operator", "employee"] },
  { path: "/users", label: "Pengguna", icon: Users, roles: ["admin"] },
  { path: "/profile", label: "Profil Saya", icon: User, roles: ["admin", "operator", "employee"] },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileOpen, setMobileOpen] = useState(false);

  const filteredItems = SIDEBAR_ITEMS.filter((item) => {
    if (!item.roles) return true;
    if (!user?.role) return false;
    const userRole = user.role.toLowerCase();
    return item.roles.some(r => r.toLowerCase() === userRole);
  });

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-sidebar text-white transition-all duration-300 flex flex-col ${
          isSidebarOpen ? "w-64" : "w-20"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {isSidebarOpen ? (
            <span className="text-xl font-bold tracking-tight">Inventaku</span>
          ) : (
            <span className="text-xl font-bold mx-auto">INV</span>
          )}
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex p-1 rounded hover:bg-white/10 text-gray-300"
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
          <button 
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg transition-colors group ${
                  isActive 
                    ? "bg-primary text-white" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
                title={!isSidebarOpen ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={20} className={`flex-shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`} />
                {isSidebarOpen && (
                  <span className="ml-3 text-sm font-medium truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10">
          <div className={`flex items-center ${!isSidebarOpen && "justify-center"}`}>
            <div className={`flex items-center ${isSidebarOpen ? "flex-1 min-w-0" : ""}`}>
               <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold ring-2 ring-white/10">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
               </div>
               {isSidebarOpen && (
                 <div className="ml-3 flex-1 min-w-0">
                   <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                   <p className="text-xs text-gray-400 truncate capitalize">{user?.role}</p>
                 </div>
               )}
            </div>
            {isSidebarOpen && (
              <button 
                onClick={() => logout()}
                className="ml-2 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar (Mobile Only mostly, since sidebar covers layout) */}
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 lg:hidden">
          <button 
            onClick={() => setMobileOpen(true)}
            className="p-2 text-text-secondary hover:bg-gray-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <span className="font-semibold text-text-primary">Inventaku</span>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
           {children}
        </main>
      </div>
    </div>
  );
}
