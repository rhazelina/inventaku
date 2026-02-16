// src/pages/Unauthorized.tsx
import { FC } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Home } from "lucide-react";

const Unauthorized: FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Akses Ditolak</h1>
        <p className="text-gray-600 mb-8">
          Anda tidak memiliki izin yang cukup untuk mengakses halaman ini. Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
        >
          <Home className="w-5 h-5" />
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
