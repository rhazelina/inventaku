// src/components/Navbar.jsx
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu, X, ChevronDown, ChevronUp,
  BookOpen, Home, Database, ArrowLeftRight,
  FileText, Users, Book, Package, Tag,
  MapPin, Ruler, Shield, User, Activity, LogOut,
  Bell, Settings
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { useNotifications } from "../hooks/useNotifications";

const cx = (...classes) => classes.filter(Boolean).join(" ");

const NavItem = ({ to, icon: Icon, label, onClick, end = false, badge }) => {
  return (
    <li>
      <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
          cx(
            "flex items-center gap-2 py-2 px-4 rounded-lg transition-all duration-200 group",
            "text-gray-700 hover:text-blue-600 hover:bg-blue-50",
            isActive && "text-blue-600 bg-blue-50 font-medium shadow-sm"
          )
        }
        end={end}
      >
        {Icon && <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />}
        <span className="relative">
          {label}
          {badge && (
            <span className="absolute -top-2 -right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </span>
      </NavLink>
    </li>
  );
};

const MegaMenuItem = ({ to, icon: Icon, title, description, onClick, badge }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="group block p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-white transition-all duration-300 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 group-hover:from-blue-200 group-hover:to-blue-100 transition-all duration-300">
            {Icon && <Icon className="w-5 h-5" />}
          </div>
          {badge && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 group-hover:translate-x-1 transition-transform">
              {title}
            </h3>
            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-400 rotate-0 group-hover:rotate-90 transition-all duration-300" />
          </div>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
};

const MobileMenuButton = ({ isOpen, onClick, badge }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
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

const NotificationBadge = ({ count }) => {
  if (!count || count === 0) return null;
  
  return (
    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full border-2 border-white">
      {count > 9 ? "9+" : count}
    </span>
  );
};

const megaMenuSections = [
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

const navItems = [
  { to: "/dashboard", icon: Home, label: "Dashboard", end: true, requiredRole: "employee" },
  { to: "/loans", icon: ArrowLeftRight, label: "Peminjaman", requiredRole: "employee", badge: true },
  { to: "/returns", icon: ArrowLeftRight, label: "Pengembalian", requiredRole: "employee", badge: true },
  { to: "/reports", icon: FileText, label: "Laporan", requiredRole: "operator" }
];

// Fallback role checking function (moved outside component)
const checkRole = (user, requiredRole) => {
  if (!user || !user.role) return false;
  
  const userRole = user.role.toLowerCase();
  const requiredRoleLower = requiredRole.toLowerCase();
  
  const roleHierarchy = {
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

  const navRef = useRef(null);
  const megaDesktopRef = useRef(null);
  const megaMobileRef = useRef(null);
  const userMenuRef = useRef(null);

  // Create a safe role checking function
  const hasRole = useCallback((requiredRole) => {
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
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        closeAll();
        return;
      }

      const inDesktop = megaDesktopRef.current?.contains(event.target);
      const inMobile = megaMobileRef.current?.contains(event.target);
      const inUserMenu = userMenuRef.current?.contains(event.target);

      if (!inDesktop) setMegaOpen(false);
      if (!inUserMenu) setUserMenuOpen(false);
    };

    const handleEscape = (event) => {
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

  // Animation for badge (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      // Notifications are automatically refreshed by the useNotifications hook
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Early return if no user during initial loading
  if (!user && loading) {
    return (
      <nav className="sticky top-0 z-50 w-full bg-white/95 border-b border-gray-200/60 backdrop-blur-lg">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Loading skeleton */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="space-y-2">
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
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
      className="sticky top-0 z-50 w-full bg-white/95 border-b border-gray-200/60 backdrop-blur-lg supports-[backdrop-filter]:bg-white/80"
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/dashboard"
            onClick={closeAll}
            className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl p-1 transition-all hover:scale-105 duration-300"
            aria-label="Inventaku Home"
          >
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl transition-shadow">
              <BookOpen className="w-6 h-6" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Inventaku
              </span>
              <span className="text-xs text-gray-500 font-medium tracking-tight">
                Inventory Management System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <ul className="flex items-center space-x-1">
              {/* Home */}
              <NavItem 
                to="/dashboard" 
                icon={Home} 
                label="Dashboard" 
                onClick={closeAll} 
                end 
              />

              {/* Mega Menu Desktop */}
              {filteredMegaSections.length > 0 && (
                <li ref={megaDesktopRef} className="relative">
                  <button
                    type="button"
                    onClick={toggleMegaMenu}
                    className={cx(
                      "flex items-center gap-2 py-2 px-4 rounded-lg transition-all duration-300 group",
                      "text-gray-700 hover:text-blue-600 hover:bg-blue-50",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                      megaOpen && "text-blue-600 bg-blue-50 shadow-sm"
                    )}
                    aria-expanded={megaOpen}
                    aria-controls="mega-menu"
                  >
                    <Database className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    <span>Master Data</span>
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
                      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-2xl ring-1 ring-black/5 backdrop-blur-lg">
                        <div className="relative p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {filteredMegaSections.map((section, idx) => (
                              <div key={idx} className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50">
                                    {section.icon && <section.icon className="w-5 h-5 text-gray-600" />}
                                  </div>
                                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
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
                          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {filteredMegaSections.flatMap(s => s.items).length} menu tersedia
                            </span>
                            <Link 
                              to="/all-modules" 
                              onClick={closeAll}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                            >
                              Lihat semua
                              <ChevronDown className="w-4 h-4 rotate-270" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              )}

              {/* Other Navigation Items */}
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

            {/* Notifications */}
            <div className="relative ml-2">
              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                <NotificationBadge count={unreadCount} />
              </button>
            </div>

            {/* User Profile Menu */}
            <div ref={userMenuRef} className="relative ml-2">
              <button
                type="button"
                onClick={toggleUserMenu}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 group"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 flex items-center justify-center font-semibold shadow-sm group-hover:scale-110 transition-transform">
                    {(user?.name || user?.username || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="hidden lg:block text-left leading-tight">
                  <div className="text-sm font-semibold text-gray-900 truncate max-w-[140px] group-hover:text-blue-600 transition-colors">
                    {user?.name || user?.username || "User"}
                  </div>
                  <div className="text-xs text-gray-500 group-hover:text-gray-700">
                    {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "-"}
                  </div>
                </div>
                <ChevronDown className={cx(
                  "w-4 h-4 text-gray-400 transition-transform duration-300",
                  userMenuOpen && "rotate-180"
                )} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5 animate-fadeIn">
                  <div className="p-4 border-b border-gray-100">
                    <div className="font-medium text-gray-900">{user?.name || user?.username}</div>
                    <div className="text-sm text-gray-500">{user?.email || user?.username}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        {user?.role || "User"}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="p-2">
                    <Link
                      to="/profile"
                      onClick={closeAll}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      <span>Profil Saya</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={closeAll}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
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

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors relative"
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

        {/* Mobile Navigation Menu */}
        <div
          id="main-menu"
          className={cx(
            "md:hidden transition-all duration-300 ease-in-out overflow-hidden",
            mobileOpen ? "max-h-[90vh] opacity-100 visible" : "max-h-0 opacity-0 invisible"
          )}
        >
          <div className="py-4 border-t border-gray-200/60 bg-white/95 backdrop-blur-lg">
            {/* User info (mobile) */}
            <div className="px-4 pb-4">
              <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-white to-blue-50/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 flex items-center justify-center font-semibold text-lg shadow-sm">
                      {(user?.name || user?.username || "U").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate text-lg">
                      {user?.name || user?.username || "User"}
                    </div>
                    <div className="text-sm text-gray-600">{user?.email || user?.username}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                        Online
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    to="/profile"
                    onClick={closeAll}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
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
                    <span>{loading ? "..." : "Keluar"}</span>
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

              {/* Mega Menu Mobile */}
              {filteredMegaSections.length > 0 && (
                <li ref={megaMobileRef}>
                  <button
                    type="button"
                    onClick={toggleMegaMenu}
                    className={cx(
                      "flex items-center justify-between w-full py-3 px-4 rounded-lg transition-all duration-300",
                      "text-gray-700 hover:text-blue-600 hover:bg-blue-50",
                      "border border-transparent hover:border-blue-200",
                      megaOpen && "text-blue-600 bg-blue-50 border-blue-200 shadow-sm"
                    )}
                    aria-expanded={megaOpen}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600">
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
                    <div className="mt-2 ml-8 space-y-3 animate-slideDown">
                      {filteredMegaSections.flatMap((section) => section.items).map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={closeAll}
                          className="block p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-white transition-all duration-300 border border-transparent hover:border-blue-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                {item.icon && <item.icon className="w-4 h-4" />}
                              </div>
                              {item.badge && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 flex items-center gap-2">
                                {item.title}
                                {item.badge && (
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              )}

              {/* Other Mobile Navigation Items */}
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

              {/* Additional Mobile Menu Items */}
              <NavItem to="/notifications" icon={Bell} label="Notifikasi" onClick={closeAll} badge={unreadCount > 0} />
              <NavItem to="/settings" icon={Settings} label="Pengaturan" onClick={closeAll} />
            </ul>

            {/* Mobile Footer */}
            <div className="mt-8 px-4 pt-4 border-t border-gray-200/60">
              <div className="text-xs text-gray-500 text-center">
                <p>Inventaku v1.0.0 • {new Date().getFullYear()}</p>
                <div className="flex justify-center gap-3 mt-2">
                  <Link to="/help" onClick={closeAll} className="hover:text-blue-600">Bantuan</Link>
                  <Link to="/privacy" onClick={closeAll} className="hover:text-blue-600">Privasi</Link>
                  <Link to="/terms" onClick={closeAll} className="hover:text-blue-600">Syarat</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}