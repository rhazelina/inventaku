import { useState, useCallback } from "react";
import { apiSystemSettings } from "@/lib/api";
import { ProfileHeader } from "./ProfileHeader";
import { ChangePassword } from "./ChangePassword";
import { Shield, Activity, Save } from "lucide-react";

interface AdminSettings {
  enableAuditLogging: boolean;
  enableTwoFactor: boolean;
  requireStrongPasswords: boolean;
  logoutInactiveUsers: boolean;
  inactivityTimeout: number;
  allowAPIAccess: boolean;
  enableSystemMonitoring: boolean;
  [key: string]: boolean | number;
}

export function AdminProfile() {
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    enableAuditLogging: true,
    enableTwoFactor: false,
    requireStrongPasswords: true,
    logoutInactiveUsers: true,
    inactivityTimeout: 30,
    allowAPIAccess: false,
    enableSystemMonitoring: true
  });
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = useCallback(async () => {
    setSaving(true);
    try {
      await apiSystemSettings.update(adminSettings);
      alert('Pengaturan sistem berhasil disimpan!');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan pengaturan sistem');
    } finally {
      setSaving(false);
    }
  }, [adminSettings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Administrator</h1>
        <p className="text-gray-600 mt-1">
          Kelola pengaturan sistem dan keamanan aplikasi
        </p>
      </div>

      {/* Profile Header */}
      <ProfileHeader />

      {/* System Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-red-100 text-red-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pengaturan Sistem</h3>
            <p className="text-sm text-gray-600 mt-1">
              Konfigurasi keamanan dan monitoring sistem
            </p>
          </div>
        </div>

        <div className="space-y-5 max-w-2xl">
          {/* Security Settings */}
          <div className="border-b border-gray-200 pb-5">
            <h4 className="font-medium text-gray-900 mb-4">Keamanan</h4>
            <div className="space-y-3">
              {[
                { key: 'enableAuditLogging', label: 'Audit Logging', desc: 'Catat semua aktivitas pengguna' },
                { key: 'enableTwoFactor', label: 'Two-Factor Auth', desc: 'Wajibkan autentikasi dua faktor' },
                { key: 'requireStrongPasswords', label: 'Strong Passwords', desc: 'Wajibkan password yang kuat' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={adminSettings[item.key] as boolean}
                    onChange={(e) => setAdminSettings(prev => ({...prev, [item.key]: e.target.checked}))}
                    className="w-4 h-4 text-red-600 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Session Settings */}
          <div className="border-b border-gray-200 pb-5">
            <h4 className="font-medium text-gray-900 mb-4">Sesi & Timeout</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={adminSettings.logoutInactiveUsers}
                  onChange={(e) => setAdminSettings(prev => ({...prev, logoutInactiveUsers: e.target.checked}))}
                  className="w-4 h-4 text-red-600 rounded border-gray-300"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Auto Logout</div>
                  <div className="text-xs text-gray-500">Logout pengguna yang tidak aktif</div>
                </div>
              </label>

              {adminSettings.logoutInactiveUsers && (
                <div className="ml-7 mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeout Inaktivitas (menit)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="5"
                      max="120"
                      step="5"
                      value={adminSettings.inactivityTimeout}
                      onChange={(e) => setAdminSettings(prev => ({...prev, inactivityTimeout: parseInt(e.target.value)}))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-lg font-semibold text-red-600 min-w-12">{adminSettings.inactivityTimeout}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Settings */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Lanjutan</h4>
            <div className="space-y-3">
              {[
                { key: 'allowAPIAccess', label: 'API Access', desc: 'Izinkan akses API eksternal' },
                { key: 'enableSystemMonitoring', label: 'System Monitoring', desc: 'Monitor performa sistem' }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={adminSettings[item.key] as boolean}
                    onChange={(e) => setAdminSettings(prev => ({...prev, [item.key]: e.target.checked}))}
                    className="w-4 h-4 text-red-600 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan Sistem'}
        </button>
      </div>

      {/* Change Password */}
      <ChangePassword />

      {/* Admin Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-6">
          <div className="text-3xl font-bold text-red-600 mb-2">24</div>
          <div className="text-sm text-red-900">Total Pengguna</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-6">
          <div className="text-3xl font-bold text-orange-600 mb-2">156</div>
          <div className="text-sm text-orange-900">Log Aktivitas (hari ini)</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6">
          <div className="text-3xl font-bold text-green-600 mb-2">99.8%</div>
          <div className="text-sm text-green-900">Uptime Sistem</div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-red-600" />
          Quick Admin Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-left transition-colors">
            <div className="font-medium text-gray-900">Kelola Pengguna</div>
            <div className="text-xs text-gray-500 mt-1">Tambah, edit, atau hapus pengguna</div>
          </button>
          <button className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-left transition-colors">
            <div className="font-medium text-gray-900">Lihat Audit Log</div>
            <div className="text-xs text-gray-500 mt-1">Pantau aktivitas sistem</div>
          </button>
          <button className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-left transition-colors">
            <div className="font-medium text-gray-900">Backup Database</div>
            <div className="text-xs text-gray-500 mt-1">Buat backup data sistem</div>
          </button>
          <button className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-left transition-colors">
            <div className="font-medium text-gray-900">System Health</div>
            <div className="text-xs text-gray-500 mt-1">Cek kesehatan sistem</div>
          </button>
        </div>
      </div>
    </div>
  );
}
