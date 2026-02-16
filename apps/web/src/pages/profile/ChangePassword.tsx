import { useState, useCallback } from "react";
import { apiChangePassword } from "../../lib/api";
import {
  KeyRound,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Lock
} from "lucide-react";

const cx = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(" ");

interface ChangePasswordProps {
  onSuccess?: () => void;
}

export function ChangePassword({ onSuccess }: ChangePasswordProps) {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      setError("Semua field harus diisi");
      return;
    }

    if (form.newPassword.length < 4) {
      setError("Password baru minimal 4 karakter");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Password baru dan konfirmasi tidak cocok");
      return;
    }

    if (form.newPassword === form.oldPassword) {
      setError("Password baru tidak boleh sama dengan password lama");
      return;
    }

    setLoading(true);

    try {
      await apiChangePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword
      });

      setSuccess("Password berhasil diubah!");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      onSuccess?.();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal mengubah password");
    } finally {
      setLoading(false);
    }
  }, [form, onSuccess]);

  const toggleVisibility = useCallback((field: keyof typeof showPassword) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Ubah Password</h3>
          <p className="text-sm text-gray-600 mt-1">
            Pastikan password baru Anda kuat dan mudah diingat
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800">Berhasil</p>
            <p className="text-sm text-emerald-700 mt-0.5">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {/* Old Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password Lama
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type={showPassword.old ? "text" : "password"}
              value={form.oldPassword}
              onChange={(e) => setForm(prev => ({ ...prev, oldPassword: e.target.value }))}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Masukkan password lama"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => toggleVisibility("old")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              tabIndex={-1}
            >
              {showPassword.old ? (
                <EyeOff className="w-5 h-5 text-gray-400" />
              ) : (
                <Eye className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password Baru
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type={showPassword.new ? "text" : "password"}
              value={form.newPassword}
              onChange={(e) => setForm(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Masukkan password baru"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => toggleVisibility("new")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              tabIndex={-1}
            >
              {showPassword.new ? (
                <EyeOff className="w-5 h-5 text-gray-400" />
              ) : (
                <Eye className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">Minimal 4 karakter</p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Konfirmasi Password Baru
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type={showPassword.confirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Konfirmasi password baru"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => toggleVisibility("confirm")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              tabIndex={-1}
            >
              {showPassword.confirm ? (
                <EyeOff className="w-5 h-5 text-gray-400" />
              ) : (
                <Eye className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !form.oldPassword || !form.newPassword || !form.confirmPassword}
          className={cx(
            "mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors",
            loading || !form.oldPassword || !form.newPassword || !form.confirmPassword
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
          )}
        >
          <KeyRound className="w-4 h-4" />
          {loading ? "Mengubah..." : "Ubah Password"}
        </button>
      </form>
    </div>
  );
}
