// auth/RequireAuth.tsx
import { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function RequireAuth() {
  const { booting, isAuthed } = useAuth();
  const loc = useLocation();

  if (booting) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-neutral-600">
        Memuat sesi, mohon bersabar ...
      </div>
    );
  }

  if (!isAuthed) {
    const from = loc.pathname + loc.search;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <Outlet />;
}
