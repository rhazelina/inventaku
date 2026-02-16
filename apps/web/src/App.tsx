// src/App.tsx

import { Suspense, lazy, ReactNode } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth";
import Loader from "./components/Loader";
import ErrorBoundary from "./components/ErrorBoundary";
import { useAuth } from "./auth/useAuth";
import { MainLayout } from "./components/layout/MainLayout";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Users = lazy(() => import("./pages/Users"));
const Classes = lazy(() => import("./pages/Classes"));
const Items = lazy(() => import("./pages/Items"));
const Categories = lazy(() => import("./pages/Categories"));
const Locations = lazy(() => import("./pages/Locations"));
const Units = lazy(() => import("./pages/Units"));
const Access = lazy(() => import("./pages/Access"));
const Profile = lazy(() => import("./pages/Profile"));
const Audit = lazy(() => import("./pages/Audit"));
const Loans = lazy(() => import("./pages/Loans"));
const RequestLoan = lazy(() => import("./pages/RequestLoan"));
const Returns = lazy(() => import("./pages/Returns"));
const Reports = lazy(() => import("./pages/Reports"));
const Notifications = lazy(() => import("./pages/Notifications"));

const Unauthorized = lazy(() => import("./pages/Unauthorized"));

const publicRoutes = [
  { path: "/login", element: <Login /> }
];

interface RouteConfig {
  path: string;
  element: ReactNode;
  name: string;
  role?: string;
}

const protectedRoutes: RouteConfig[] = [
  { path: "/dashboard", element: <Dashboard />, name: "Dashboard" },
  { path: "/users", element: <Users />, name: "Users", role: "admin" },
  { path: "/classes", element: <Classes />, name: "Classes" },
  { path: "/items", element: <Items />, name: "Items" },
  { path: "/categories", element: <Categories />, name: "Categories" },
  { path: "/locations", element: <Locations />, name: "Locations" },
  { path: "/units", element: <Units />, name: "Units" },
  { path: "/access", element: <Access />, name: "Access", role: "admin" },
  { path: "/profile", element: <Profile />, name: "Profile" },
  { path: "/audit", element: <Audit />, name: "Audit", role: "admin" },
  { path: "/loans", element: <Loans />, name: "Loans" },
  { path: "/request-loan", element: <RequestLoan />, name: "Request Peminjaman" },
  { path: "/returns", element: <Returns />, name: "Returns" },
  { path: "/reports", element: <Reports />, name: "Reports", role: "admin" },
  { path: "/notifications", element: <Notifications />, name: "Notifications" }
];

// Layout Components
function PublicLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Outlet />
    </div>
  );
}

function AuthedLayout() {
  return (
    <MainLayout>
      <Suspense fallback={<div className="h-16 bg-white border-b" />}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </Suspense>
    </MainLayout>
  );
}

interface RoleProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

function RoleProtectedRoute({ children, requiredRole }: RoleProtectedRouteProps) {
  const auth = useAuth();

  if (auth.booting) return null; // Or a loader
  if (!requiredRole) return children;

  if (!auth.hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader size="lg" />
        </div>
      }
    >
      <Routes>
        <Route element={<PublicLayout />}>
          {publicRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Route>

        {/* Protected Routes */}
        <Route element={<RequireAuth />}>
          <Route element={<AuthedLayout />}>
            {protectedRoutes.map(({ path, element, role }) => (
              <Route
                key={path}
                path={path}
                element={
                  <RoleProtectedRoute requiredRole={role}>
                    {element}
                  </RoleProtectedRoute>
                }
              />
            ))}

            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* ✅ root saat sudah login: redirect ke dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}
