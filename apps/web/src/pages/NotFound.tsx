// src/pages/NotFound.tsx
import { FC } from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

const NotFound: FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-9xl font-extrabold text-blue-600 mb-4 opacity-20">
          404
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Halaman Tidak Ditemukan</h1>
        <p className="text-gray-600 mb-8">
          Maaf, halaman yang Anda cari tidak tersedia atau mungkin telah dipindahkan.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <Home className="w-5 h-5" />
            Kembali ke Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
