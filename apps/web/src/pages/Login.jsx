// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Eye, EyeOff, Lock, User, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, isAuthed, user } = useAuth();

  const [form, setForm] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingState, setLoadingState] = useState(loading);
 
  // Sync loading state from auth
  useEffect(() => {
    setLoadingState(loading);
  }, [loading]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthed && user) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthed, user, navigate, location]);

  // Load remembered username
  useEffect(() => {
    const rememberedUsername = localStorage.getItem("rememberUsername");
    if (rememberedUsername) {
      setForm(prev => ({
        ...prev,
        username: rememberedUsername,
        rememberMe: true,
      }));
    }
  }, []);

  const validateForm = () => {
    const errors = {};
    
    if (!form.username.trim()) {
      errors.username = "Username diperlukan";
    } else if (form.username.length < 3) {
      errors.username = "Username minimal 3 karakter";
    }
    
    if (!form.password) {
      errors.password = "Password diperlukan";
    } else if (form.password.length < 6) {
      errors.password = "Password minimal 6 karakter";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setValidationErrors({});
    setSuccessMessage("");
    
    try {
      if (form.rememberMe) {
        localStorage.setItem("rememberUsername", form.username);
      } else {
        localStorage.removeItem("rememberUsername");
      }
      
      await login({
        username: form.username.trim(),
        password: form.password,
      });
      
      // Show success message briefly before redirect
      setSuccessMessage("Login berhasil! Mengalihkan...");
      
      // Redirect will happen automatically via the useEffect
    } catch (err) {
      // Error is already handled by the auth provider
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (role = "employee") => {
    const demoAccounts = {
      admin: { username: "admin", password: "admin123" },
      operator: { username: "operator", password: "operator123" },
      employee: { username: "deva", password: "deva12345" },
      // employee: { username: "arie", password: "1234569" },
    };
    
    const account = demoAccounts[role];
    if (!account) return;
    
    setForm({
      username: account.username,
      password: account.password,
      rememberMe: false,
    });
    
    // Wait a bit for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Submit using the form data
    const fakeEvent = { preventDefault: () => {} };
    handleSubmit(fakeEvent);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-400 rounded-full border-4 border-white"></div>
              </div>
            </div>
            
            <div className="text-center mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Selamat Datang
              </h1>
              <p className="text-gray-600 mt-2">
                Silakan masuk ke akun Inventaku Anda
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                    className={cx(
                      "block w-full pl-10 pr-3 py-3 border rounded-xl",
                      "focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none",
                      "transition-colors duration-200",
                      validationErrors.username ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="Masukkan username"
                    disabled={loading || isSubmitting}
                    autoComplete="username"
                  />
                </div>
                {validationErrors.username && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.username}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Lupa password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                    className={cx(
                      "block w-full pl-10 pr-10 py-3 border rounded-xl",
                      "focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none",
                      "transition-colors duration-200",
                      validationErrors.password ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="Masukkan password"
                    disabled={loading || isSubmitting}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.password}
                  </p>
                )}
              </div>

              {/* Remember Me & Demo Accounts */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.rememberMe}
                    onChange={(e) => setForm(prev => ({ ...prev, rememberMe: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={loading || isSubmitting}
                  />
                  <span className="text-sm text-gray-700">Ingat username</span>
                </label>

                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin("employee")}
                    disabled={loading || isSubmitting}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Coba demo
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">Login Gagal</p>
                      <p className="text-sm text-red-700 mt-0.5">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-emerald-800">Login Berhasil</p>
                      <p className="text-sm text-emerald-700 mt-0.5">{successMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || isSubmitting}
                className={cx(
                  "w-full py-3 px-4 rounded-xl font-semibold",
                  "transition-all duration-300",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                  (loading || isSubmitting)
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg active:scale-[0.99]"
                )}
              >
                {loading || isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sedang masuk...
                  </span>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>

            {/* Demo Accounts Section */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Akun Demo (klik untuk login cepat)
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("admin")}
                  disabled={loading || isSubmitting}
                  className="px-4 py-2.5 text-sm rounded-lg border border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center"
                >
                  <span className="font-medium text-gray-900">Admin</span>
                  <span className="text-xs text-gray-600 mt-0.5">Full Access</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleDemoLogin("operator")}
                  disabled={loading || isSubmitting}
                  className="px-4 py-2.5 text-sm rounded-lg border border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center"
                >
                  <span className="font-medium text-gray-900">Operator</span>
                  <span className="text-xs text-gray-600 mt-0.5">Inventory Manager</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleDemoLogin("employee")}
                  disabled={loading || isSubmitting}
                  className="px-4 py-2.5 text-sm rounded-lg border border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center"
                >
                  <span className="font-medium text-gray-900">Karyawan</span>
                  <span className="text-xs text-gray-600 mt-0.5">Basic Access</span>
                </button>
              </div>
            </div>

            {/* Footer Links */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Belum punya akun?{" "}
                <Link
                  to="/register"
                  className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Daftar sekarang
                </Link>
              </p>
              
              <div className="mt-4 flex justify-center gap-4">
                <Link
                  to="/privacy"
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Privasi
                </Link>
                <Link
                  to="/terms"
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Syarat
                </Link>
                <Link
                  to="/help"
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Bantuan
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Inventaku
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Inventory Management System v1.0.0
          </p>
          <p className="text-xs text-gray-500 mt-2">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}