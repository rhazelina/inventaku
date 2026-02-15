import { useAuth } from "../../auth/AuthProvider";
import { ProfileHeader } from "./ProfileHeader";
import { ChangePassword } from "./ChangePassword";
import { Bell, FileText } from "lucide-react";

export function EmployeeProfile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-600 mt-1">
          Kelola informasi akun dan preferensi Anda
        </p>
      </div>

      {/* Profile Header */}
      <ProfileHeader />

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Preferensi Notifikasi</h3>
            <p className="text-sm text-gray-600 mt-1">
              Atur kapan Anda ingin menerima notifikasi
            </p>
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          {[
            { id: 'email_notifications', label: 'Email Notifications', desc: 'Terima notifikasi melalui email' },
            { id: 'loan_reminders', label: 'Loan Reminders', desc: 'Pengingat peminjaman yang akan jatuh tempo' },
            { id: 'system_updates', label: 'System Updates', desc: 'Notifikasi update sistem' }
          ].map(pref => (
            <label key={pref.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{pref.label}</div>
                <div className="text-xs text-gray-500">{pref.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <button className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-colors">
          Simpan Preferensi
        </button>
      </div>

      {/* Change Password */}
      <ChangePassword />

      {/* Tips & Help */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Butuh Bantuan?</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Pelajari cara meminjam barang dengan benar</li>
              <li>• Ketahui tenggat waktu pengembalian barang</li>
              <li>• Hubungi operator jika ada pertanyaan</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
