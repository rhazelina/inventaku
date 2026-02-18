// src/components/Navbar.tsx
import { useEffect, useRef, useState, useMemo, useCallback, type FC } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu, X, ChevronDown, ChevronUp,
  BookOpen, Home, Database, ArrowLeftRight,
  FileText, Users, Book, Package, Tag,
  MapPin, Ruler, Shield, User, Activity, LogOut,
  Bell, Settings, LucideIcon
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { useNotifications } from "../hooks/useNotifications";

const cx = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(" ");

interface NavItemProps {
  to: string;
  icon?: LucideIcon;
  label: string;
  onClick?: () => void;
  end?: boolean;
  badge?: boolean;
}

const NavItem: FC<NavItemProps> = ({ to, icon: Icon, label, onClick, end = false, badge }) => {
  return (
    <li>
      <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
          cx(
            "flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-200 group",
            "text-slate-200 hover:text-white hover:bg-white/10",
            isActive && "bg-[var(--color-primary)] text-white font-medium shadow-sm"
          )
        }
        end={end}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform" />}
        <span className="relative whitespace-nowrap text-sm font-medium leading-none">
          {label}
          {badge && <span className="ml-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-red-400 align-middle" />}
        </span>
      </NavLink>
    </li>
  );
};

interface MegaMenuItemProps {
  to: string;
  icon?: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
  badge?: string;
}

const MegaMenuItem: FC<MegaMenuItemProps> = ({ to, icon: Icon, title, description, onClick, badge }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="group block p-4 rounded-xl border border-white/10 hover:border-white/25 hover:bg-white/10 transition-all duration-300 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="p-2 rounded-lg bg-white/10 text-slate-100 transition-all duration-300">
            {Icon && <Icon className="w-5 h-5" />}
          </div>
          {badge && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#2f2f2f]"></span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-100 group-hover:text-white group-hover:translate-x-1 transition-transform">
              {title}
            </h3>
            <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-white rotate-0 group-hover:rotate-90 transition-all duration-300" />
          </div>
          <p className="mt-1 text-sm text-slate-300 line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
};

interface MobileMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
  badge?: boolean;
}

const MobileMenuButton: FC<MobileMenuButtonProps> = ({ isOpen, onClick, badge }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex items-center justify-center p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition-colors"
      aria-controls="main-menu"
      aria-expanded={isOpen}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      {badge && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
      )}
    </button>
  );
};

const NotificationBadge: FC<{ count?: number }> = ({ count }) => {
  if (!count || count === 0) return null;
  
  return (
    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full border-2 border-[var(--color-sidebar)]">
      {count > 9 ? "9+" : count}
    </span>
  );
};

interface MegaItem {
  to: string;
  icon?: LucideIcon;
  title: string;
  description: string;
  requiredRole?: string;
  badge?: string;
}

interface MegaSection {
  title: string;
  icon: LucideIcon;
  items: MegaItem[];
}

const megaMenuSections: MegaSection[] = [
  {
    title: "Data Management",
    icon: Database,
    items: [
      { 
        to: "/users", 
        icon: Users, 
        title: "Pengguna", 
        description: "Kelola akun pengguna dan peran mereka dalam sistem.",
        requiredRole: "admin",
        badge: "new"
      },
      { 
        to: "/classes", 
        icon: Book, 
        title: "Kelas", 
        description: "Master data kelas untuk sistem peminjaman.",
        requiredRole: "operator"
      },
      { 
        to: "/items", 
        icon: Package, 
        title: "Barang", 
        description: "Kelola inventaris barang dan stok.",
        requiredRole: "operator",
        badge: "updated"
      }
    ]
  },
  {
    title: "Catalog",
    icon: Tag,
    items: [
      { 
        to: "/categories", 
        icon: Tag, 
        title: "Kategori", 
        description: "Kelompokkan barang berdasarkan kategori.",
        requiredRole: "operator"
      },
      { 
        to: "/locations", 
        icon: MapPin, 
        title: "Lokasi", 
        description: "Atur penempatan barang di berbagai ruang.",
        requiredRole: "operator"
      },
      { 
        to: "/units", 
        icon: Ruler, 
        title: "Satuan", 
        description: "Unit pengukuran untuk sistem inventaris.",
        requiredRole: "operator"
      }
    ]
  },
  {
    title: "System",
    icon: Settings,
    items: [
      { 
        to: "/access", 
        icon: Shield, 
        title: "Hak Akses", 
        description: "Kelola izin dan hak akses pengguna.",
        requiredRole: "admin"
      },
      { 
        to: "/profile", 
        icon: User, 
        title: "Profil", 
        description: "Kelola informasi akun dan keamanan.",
        requiredRole: "employee"
      },
      { 
        to: "/audit", 
        icon: Activity, 
        title: "Log Aktivitas", 
        description: "Pantau aktivitas sistem dan pengguna.",
        requiredRole: "admin"
      }
    ]
  }
];

interface NavItemDef {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
  requiredRole?: string;
  badge?: boolean;
}

const navItems: NavItemDef[] = [
  { to: "/dashboard", icon: Home, label: "Dashboard", end: true, requiredRole: "employee" },
  { to: "/request-loan", icon: ArrowLeftRight, label: "Peminjaman", requiredRole: "employee" },
  { to: "/loans", icon: FileText, label: "Verifikasi", requiredRole: "operator", badge: true },
  { to: "/returns", icon: ArrowLeftRight, label: "Pengembalian", requiredRole: "operator", badge: true },
  { to: "/reports", icon: FileText, label: "Laporan", requiredRole: "admin" }
];

// Fallback role checking function (moved outside component)
const checkRole = (user: any, requiredRole: string) => {
  if (!user || !user.role) return false;
  
  const userRole = user.role.toLowerCase();
  const requiredRoleLower = requiredRole.toLowerCase();
  
  const roleHierarchy: Record<string, string[]> = {
    'admin': ['admin', 'operator', 'employee'],
    'operator': ['operator', 'employee'],
    'employee': ['employee']
  };
  
  return roleHierarchy[requiredRoleLower]?.includes(userRole) || false;
};

export default function Navbar() {
  const { user, logout, loading, hasRole: authHasRole } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const megaDesktopRef = useRef<HTMLLIElement>(null);
  const megaMobileRef = useRef<HTMLLIElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Create a safe role checking function
  const hasRole = useCallback((requiredRole: string) => {
    // First try to use the hook's hasRole function if it exists
    if (authHasRole && typeof authHasRole === 'function') {
      return authHasRole(requiredRole);
    }
    // Fallback to our own implementation
    return checkRole(user, requiredRole);
  }, [authHasRole, user]);

  // Role-based filtering
  const filteredNavItems = useMemo(() => {
    return navItems.filter((item) => 
      !item.requiredRole || hasRole(item.requiredRole)
    );
  }, [hasRole]);

  const filteredMegaSections = useMemo(() => {
    return megaMenuSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => 
          !item.requiredRole || hasRole(item.requiredRole)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [hasRole]);

  const closeAll = useCallback(() => {
    setMegaOpen(false);
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, []);

  const toggleMegaMenu = useCallback(() => {
    setMegaOpen((prev) => !prev);
    setUserMenuOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => setMobileOpen((prev) => !prev), []);
  const toggleUserMenu = useCallback(() => {
    setUserMenuOpen((prev) => !prev);
    setMegaOpen(false);
  }, []);

  const onLogout = useCallback(async () => {
    closeAll();
    await logout();
    navigate("/login", { replace: true });
  }, [logout, navigate, closeAll]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (navRef.current && !navRef.current.contains(target)) {
        closeAll();
        return;
      }

      const inDesktop = megaDesktopRef.current?.contains(target);
      const inUserMenu = userMenuRef.current?.contains(target);

      if (!inDesktop) setMegaOpen(false);
      if (!inUserMenu) setUserMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAll();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closeAll]);

  useEffect(() => {
    if (!mobileOpen) {
      setMegaOpen(false);
      setUserMenuOpen(false);
    }
  }, [mobileOpen]);

  // Early return if no user during initial loading
  if (!user && loading) {
    return (
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[var(--color-sidebar)]">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg animate-pulse"></div>
              <div className="space-y-2">
                <div className="w-24 h-4 bg-white/20 rounded animate-pulse"></div>
                <div className="w-32 h-3 bg-white/15 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-[var(--color-sidebar)]"
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo */}
          <Link
            to="/dashboard"
            onClick={closeAll}
            className="flex items-center gap-2 rounded-xl p-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Inventaku Home"
          >
            <div className="relative p-2 rounded-xl bg-[var(--color-primary)] text-white shadow-lg hover:shadow-xl transition-shadow">
              <BookOpen className="w-6 h-6" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[var(--color-sidebar)]"></div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-bold text-white">
                Inventaku
              </span>
              <span className="hidden xl:block text-xs text-slate-300 font-medium tracking-tight">
                Inventory Management System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center gap-2 min-w-0 flex-1 justify-end">
            <ul className="flex items-center gap-1 min-w-0">
              <NavItem 
                to="/dashboard" 
                icon={Home} 
                label="Dashboard" 
                onClick={closeAll} 
                end 
              />

              {filteredMegaSections.length > 0 && (
                <li ref={megaDesktopRef} className="relative">
                  <button
                    type="button"
                    onClick={toggleMegaMenu}
                    className={cx(
                      "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 transition-all duration-300 group",
                      "text-slate-200 hover:text-white hover:bg-white/10",
                      "focus:outline-none focus:ring-2 focus:ring-white/30",
                      megaOpen && "bg-[var(--color-primary)] text-white shadow-sm"
                    )}
                    aria-expanded={megaOpen}
                    aria-controls="mega-menu"
                  >
                    <Database className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    <span className="text-sm font-medium leading-none">
                      Master Data
                    </span>
                    {megaOpen ? 
                      <ChevronUp className="w-4 h-4 animate-bounce" /> : 
                      <ChevronDown className="w-4 h-4 group-hover:animate-pulse" />
                    }
                  </button>

                  {megaOpen && (
                    <div
                      id="mega-menu"
                      className="absolute left-0 lg:left-1/2 lg:transform lg:-translate-x-1/2 top-full mt-2 w-[95vw] lg:w-screen max-w-4xl animate-fadeIn"
                    >
                      <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#2f2f2f] shadow-2xl ring-1 ring-black/40 backdrop-blur-lg">
                        <div className="relative p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {filteredMegaSections.map((section, idx) => (
                              <div key={idx} className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-white/10">
                                    {section.icon && <section.icon className="w-5 h-5 text-slate-200" />}
                                  </div>
                                  <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                                    {section.title}
                                  </h3>
                                </div>
                                <div className="space-y-3">
                                  {section.items.map((item) => (
                                    <MegaMenuItem
                                      key={item.to}
                                      to={item.to}
                                      icon={item.icon}
                                      title={item.title}
                                      description={item.description}
                                      onClick={closeAll}
                                      badge={item.badge}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              )}

              {filteredNavItems
                .filter((x) => x.to !== "/dashboard")
                .map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    onClick={closeAll}
                    badge={item.badge}
                  />
                ))}
            </ul>

            <div className="relative ml-2">
              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className="p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                <NotificationBadge count={unreadCount} />
              </button>
            </div>

            <div ref={userMenuRef} className="relative ml-2">
              <button
                type="button"
                onClick={toggleUserMenu}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2 transition-all duration-300 group hover:bg-white/10 hover:border-white/30"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-semibold shadow-sm group-hover:scale-110 transition-transform">
                    {(user?.name || user?.username || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[var(--color-sidebar)]"></div>
                </div>
                <div className="hidden xl:block text-left leading-tight">
                  <div className="text-sm font-semibold text-white truncate max-w-[140px] transition-colors">
                    {user?.name || user?.username || "User"}
                  </div>
                  <div className="text-xs text-slate-300">
                    {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "-"}
                  </div>
                </div>
                <ChevronDown className={cx(
                  "w-4 h-4 text-slate-300 transition-transform duration-300",
                  userMenuOpen && "rotate-180"
                )} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/20 bg-[#2f2f2f] shadow-2xl ring-1 ring-black/40 animate-fadeIn">
                  <div className="p-4 border-b border-white/10">
                    <div className="font-medium text-white">{user?.name || user?.username}</div>
                    <div className="text-sm text-slate-300">{user?.email || user?.username}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-200 rounded-full">
                        {user?.role || "User"}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-200 rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="p-2">
                    <Link
                      to="/profile"
                      onClick={closeAll}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-200 hover:bg-white/10 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-300" />
                      <span>Profil Saya</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={closeAll}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-200 hover:bg-white/10 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-300" />
                      <span>Pengaturan</span>
                    </Link>
                    <button
                      onClick={onLogout}
                      disabled={loading}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{loading ? "Logging out..." : "Keluar"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="xl:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <NotificationBadge count={unreadCount} />
            </button>
            <MobileMenuButton 
              isOpen={mobileOpen} 
              onClick={toggleMobileMenu} 
              badge={unreadCount > 0}
            />
          </div>
        </div>

        <div
          id="main-menu"
          className={cx(
            "xl:hidden transition-all duration-300 ease-in-out overflow-hidden flex flex-col items-center",
            mobileOpen ? "max-h-[90vh] opacity-100 visible" : "max-h-0 opacity-0 invisible"
          )}
        >
          <div className="py-4 border-t border-white/10 bg-[var(--color-sidebar)] backdrop-blur-lg w-full">
            <div className="px-4 pb-4">
              <div className="rounded-xl border border-white/20 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-semibold text-lg shadow-sm">
                      {(user?.name || user?.username || "U").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[var(--color-sidebar)]"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate text-lg">
                      {user?.name || user?.username || "User"}
                    </div>
                    <div className="text-sm text-slate-300">{user?.email || user?.username}</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    to="/profile"
                    onClick={closeAll}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-slate-100 hover:bg-white/10 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Profil</span>
                  </Link>
                  <button
                    onClick={onLogout}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            </div>

            <ul className="space-y-1 px-4">
              <NavItem 
                to="/dashboard" 
                icon={Home} 
                label="Dashboard" 
                onClick={closeAll} 
                end 
              />

              {filteredMegaSections.length > 0 && (
                <li ref={megaMobileRef}>
                  <button
                    type="button"
                    onClick={toggleMegaMenu}
                    className={cx(
                      "flex items-center justify-between w-full py-3 px-4 rounded-lg transition-all duration-300",
                      "text-slate-100 hover:bg-white/10",
                      "border border-transparent hover:border-white/20",
                      megaOpen && "bg-[var(--color-primary)] border-white/30 shadow-sm"
                    )}
                    aria-expanded={megaOpen}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/10 text-slate-100">
                        <Database className="w-5 h-5" />
                      </div>
                      <span className="font-semibold">Master Data</span>
                    </div>
                    {megaOpen ? 
                      <ChevronUp className="w-5 h-5 animate-bounce" /> : 
                      <ChevronDown className="w-5 h-5 animate-pulse" />
                    }
                  </button>

                  {megaOpen && (
                    <div className="mt-2 ml-8 space-y-3">
                      {filteredMegaSections.flatMap((section) => section.items).map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={closeAll}
                          className="block p-3 rounded-xl hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-white/20"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/10 text-slate-100">
                              {item.icon && <item.icon className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-slate-100">{item.title}</div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              )}

              {filteredNavItems
                .filter((x) => x.to !== "/dashboard")
                .map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    onClick={closeAll}
                    badge={item.badge}
                  />
                ))}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
