
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { Eye, EyeOff, Lock, User, AlertCircle, CheckCircle, Loader2, Warehouse } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";

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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthed && user) {
      const from = (location.state as any)?.from?.pathname || "/dashboard";
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
    const errors: Record<string, string> = {};
    
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      
      setSuccessMessage("Login berhasil! Mengalihkan...");
      // Redirect handled by useEffect
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (role = "employee") => {
    const demoAccounts: Record<string, {username: string, password: string}> = {
      admin: { username: "admin", password: "admin123" },
      operator: { username: "operator", password: "operator123" },
      employee: { username: "deva", password: "deva12345" },
    };
    
    const account = demoAccounts[role];
    if (!account) return;
    
    setForm({
      username: account.username,
      password: account.password,
      rememberMe: false,
    });
    
    // Visual feedback delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Trigger submit manually since we can't easily fake the event in a way handleSubmit expects perfectly without casting
    setIsSubmitting(true);
     try {
       await login({
        username: account.username,
        password: account.password,
      });
      setSuccessMessage("Login berhasil! Mengalihkan...");
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-gray-200/80">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg text-white">
                 <Warehouse className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Selamat Datang</CardTitle>
            <p className="text-gray-500 mt-2 text-sm">
              Silakan masuk ke akun Inventaku Anda
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    className="pl-10"
                    placeholder="Masukkan username"
                    value={form.username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, username: e.target.value }))}
                    disabled={isLoading}
                    error={!!validationErrors.username}
                    autoComplete="username"
                  />
                </div>
                {validationErrors.username && (
                  <p className="text-sm text-status-error flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {validationErrors.username}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                 <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    Lupa password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    placeholder="Masukkan password"
                    value={form.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, password: e.target.value }))}
                    disabled={isLoading}
                    error={!!validationErrors.password}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-sm text-status-error flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {validationErrors.password}
                  </p>
                )}
              </div>

              {/* Remember Me & Demo */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.rememberMe}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, rememberMe: e.target.checked }))}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-600">Ingat username</span>
                </label>
              </div>

              {/* Alerts */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Login Gagal</p>
                    <p className="opacity-90">{error}</p>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-status-success flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">Login Berhasil</p>
                    <p className="opacity-90">{successMessage}</p>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sedang masuk...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
               <p className="text-xs text-center text-gray-500 mb-3">Akun Demo</p>
               <div className="grid grid-cols-3 gap-2">
                 <Button variant="secondary" size="sm" onClick={() => handleDemoLogin("admin")} disabled={isLoading} className="text-xs">
                   Admin
                 </Button>
                 <Button variant="secondary" size="sm" onClick={() => handleDemoLogin("operator")} disabled={isLoading} className="text-xs">
                   Operator
                 </Button>
                 <Button variant="secondary" size="sm" onClick={() => handleDemoLogin("employee")} disabled={isLoading} className="text-xs">
                   Karyawan
                 </Button>
               </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                Inventaku v1.0.0
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
