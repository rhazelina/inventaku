import { useState, useCallback } from "react";
import { apiInventorySettings } from "@/lib/api";
import { ProfileHeader } from "./ProfileHeader";
import { ChangePassword } from "./ChangePassword";
import { Package, Save } from "lucide-react";

interface OperatorSettings {
  lowStockThreshold: number;
  enableAutoNotifications: boolean;
  damageReportNotifications: boolean;
  expiredItemsNotifications: boolean;
  inventoryCheckReminders: boolean;
  [key: string]: boolean | number;
}

export function OperatorProfile() {
  const [settings, setSettings] = useState<OperatorSettings>({
    lowStockThreshold: 10,
    enableAutoNotifications: true,
    damageReportNotifications: true,
    expiredItemsNotifications: true,
    inventoryCheckReminders: true
  });
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = useCallback(async () => {
    setSaving(true);
    try {
      await apiInventorySettings.update(settings);
      alert('Pengaturan berhasil disimpan!');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  }, [settings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Operator</h1>
        <p className="text-gray-600 mt-1">
          Kelola informasi akun dan pengaturan inventaris Anda
        </p>
      </div>

      {/* Profile Header */}
      <ProfileHeader />

      {/* Inventory Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pengaturan Inventaris</h3>
            <p className="text-sm text-gray-600 mt-1">
              Konfigurasi preferensi dan threshold inventaris Anda
            </p>
          </div>
        </div>

        <div className="space-y-5 max-w-2xl">
          {/* Low Stock Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Threshold Stok Rendah
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="100"
                value={settings.lowStockThreshold}
                onChange={(e) => setSettings(prev => ({...prev, lowStockThreshold: parseInt(e.target.value)}))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-2xl font-bold text-purple-600 min-w-12 text-right">
                {settings.lowStockThreshold}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Dapatkan notifikasi ketika stok barang di bawah {settings.lowStockThreshold} unit
            </p>
          </div>

          {/* Toggle Settings */}
          <div className="border-t border-gray-200 pt-5 space-y-4">
            {[
              { key: 'enableAutoNotifications', label: 'Auto Notifikasi', desc: 'Terima notifikasi otomatis untuk perubahan inventaris' },
              { key: 'damageReportNotifications', label: 'Laporan Kerusakan', desc: 'Notifikasi untuk barang yang dilaporkan rusak' },
              { key: 'expiredItemsNotifications', label: 'Barang Kadaluarsa', desc: 'Pengingat untuk barang yang masa berlakunya habis' },
              { key: 'inventoryCheckReminders', label: 'Pengingat Stock Opname', desc: 'Reminder untuk melakukan stock opname berkala' }
            ].map(item => (
              <label key={item.key} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings[item.key] as boolean}
                  onChange={(e) => setSettings(prev => ({...prev, [item.key]: e.target.checked}))}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>

      {/* Change Password */}
      <ChangePassword />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
          <div className="text-3xl font-bold text-blue-600 mb-2">156</div>
          <div className="text-sm text-blue-900">Total Barang Dikelola</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-6">
          <div className="text-3xl font-bold text-orange-600 mb-2">12</div>
          <div className="text-sm text-orange-900">Barang Stok Rendah</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6">
          <div className="text-3xl font-bold text-green-600 mb-2">3</div>
          <div className="text-sm text-green-900">Lokasi Aktif</div>
        </div>
      </div>
    </div>
  );
}
