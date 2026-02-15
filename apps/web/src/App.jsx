// src/App.jsx

import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth";
import Loader from "./components/Loader";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./auth/AuthProvider";
// import { useAuth } from "./auth/useAuth"; //

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
const Loans = lazy(() => import("./pages/Peminjaman"));
const Returns = lazy(() => import("./pages/Pengembalian"));
const Reports = lazy(() => import("./pages/Laporan"));
const Notifications = lazy(() => import("./pages/Notifications"));

const Unauthorized = lazy(() => import("./pages/Unauthorized"));

const publicRoutes = [
  { path: "/login", element: <Login /> }
];

const protectedRoutes = [
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

const Navbar = lazy(() => import("./components/Navbar")); 

function AuthedLayout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Suspense fallback={<div className="h-16 bg-white border-b" />}>
        <Navbar />
      </Suspense>
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}


function RoleProtectedRoute({ children, requiredRole }) {
  // const auth = useAuth();

  if (!requiredRole) return children;

  // if (!auth.hasRole(requiredRole)) {
  //   return <Navigate to="/unauthorized" replace />;
  // }

  // sementara contoh minimal: ambil dari localStorage
  const userRole = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null")?.role;
    } catch {
      return null;
    }
  })();
  
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}

// Route protection based on roles
// function RoleProtectedRoute({ children, requiredRole }) {
//   // const { user } = useAuth();
//   // const userRole = user?.role;

//   // sementara contoh minimal: ambil dari localStorage
//   const userRole = (() => {
//     try {
//       return JSON.parse(localStorage.getItem("user") || "null")?.role;
//     } catch {
//       return null;
//     }
//   })();

//   if (requiredRole && userRole !== requiredRole) {
//     return <Navigate to="/unauthorized" replace />;
//   }

//   return children;
// }

function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          {/* <LoadingSpinner size="lg" /> */}
          <Loader size="lg" />
        </div>
      }
    >
      <Routes>
        <Route element={<PublicLayout />}>
          {publicRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}

          {/*  Public fallback untuk routes yang nggak ada (belum login) */}
          {/* kalau kamu mau semua yang random route dilempar login */}
          {/* <Route path="*" element={<Navigate to="/login" replace />} /> */}
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

            {/* <Route path="/users/:id" element={<Users />} />
            <Route path="/items/:id" element={<Items />} /> */}

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
    <AuthProvider>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </AuthProvider>
  );
}
