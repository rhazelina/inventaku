import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function NotFound() {
  const { isAuthed } = useAuth();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-6">
        <div className="text-sm text-neutral-500">404</div>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Link-nya mungkin salah, atau halaman sudah dipindah.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/"
            className="inline-flex items-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Ke Dashboard
          </Link>

          <Link
            to={isAuthed ? "/" : "/login"}
            className="inline-flex items-center rounded-xl border px-4 py-2 text-sm hover:bg-neutral-100"
          >
            {isAuthed ? "Kembali" : "Ke Login"}
          </Link>
        </div>

        <div className="mt-6 rounded-xl border bg-neutral-50 p-3 text-xs text-neutral-600">
          Tip: cek URL di address bar, atau balik ke menu utama.
        </div>
      </div>
    </div>
  );
}
