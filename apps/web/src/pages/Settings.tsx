// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { apiSystemSettings } from "../lib/api";
import { PageShell, ErrorBox, LoadingLine } from "./_ui";

type SettingsState = {
  appName: string;
  timezone: string;
  dateFormat: string;
  maxLoanDays: number;
  maxItemsPerLoan: number;
  reminderBeforeDueDays: number;
  reminderAfterDueDays: number;
  autoApproveLoan: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  enableLoanNotifications: boolean;
  enableSystemNotifications: boolean;
  lowStockThreshold: number;
};

const DEFAULT_SETTINGS: SettingsState = {
  appName: "Inventaku",
  timezone: "Asia/Jakarta",
  dateFormat: "DD/MM/YYYY",
  maxLoanDays: 7,
  maxItemsPerLoan: 5,
  reminderBeforeDueDays: 1,
  reminderAfterDueDays: 1,
  autoApproveLoan: false,
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  enableLoanNotifications: true,
  enableSystemNotifications: true,
  lowStockThreshold: 10,
};

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
}) {
  return (
    <label className="space-y-1 block">
      <div className="text-xs text-neutral-600">{label}</div>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2"
      />
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 block">
      <div className="text-xs text-neutral-600">{label}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2"
      />
    </label>
  );
}

function ToggleInput({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1"
      />
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
    </label>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await apiSystemSettings.get();
      const payload = (res?.data ?? {}) as Partial<SettingsState>;
      setSettings({ ...DEFAULT_SETTINGS, ...payload });
    } catch (err: any) {
      setError(err?.message || "Gagal memuat pengaturan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res: any = await apiSystemSettings.update(settings);
      const payload = (res?.data ?? {}) as Partial<SettingsState>;
      setSettings({ ...DEFAULT_SETTINGS, ...payload });
      setSuccess("Pengaturan berhasil disimpan");
      window.setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  }, [settings]);

  return (
    <PageShell
      title="Pengaturan Sistem"
      subtitle="Konfigurasi kebijakan peminjaman, notifikasi, dan keamanan sistem."
      right={
        <button
          onClick={saveSettings}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-50"
          type="button"
        >
          <Save className="w-4 h-4" />
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      }
    >
      <ErrorBox error={error} />
      {success ? (
        <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {loading ? (
        <LoadingLine text="Memuat pengaturan..." />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-gray-900">
            <SettingsIcon className="w-5 h-5" />
            <h3 className="font-semibold">General</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <TextInput label="Nama Aplikasi" value={settings.appName} onChange={(v) => setSettings((s) => ({ ...s, appName: v }))} />
            <TextInput label="Timezone" value={settings.timezone} onChange={(v) => setSettings((s) => ({ ...s, timezone: v }))} />
            <TextInput label="Format Tanggal" value={settings.dateFormat} onChange={(v) => setSettings((s) => ({ ...s, dateFormat: v }))} />
          </div>

          <h3 className="font-semibold text-gray-900">Loan Policy</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <NumberInput label="Maks Hari Pinjam" value={settings.maxLoanDays} min={1} onChange={(v) => setSettings((s) => ({ ...s, maxLoanDays: v }))} />
            <NumberInput label="Maks Item/Pinjam" value={settings.maxItemsPerLoan} min={1} onChange={(v) => setSettings((s) => ({ ...s, maxItemsPerLoan: v }))} />
            <NumberInput label="Reminder Sebelum Jatuh Tempo (hari)" value={settings.reminderBeforeDueDays} onChange={(v) => setSettings((s) => ({ ...s, reminderBeforeDueDays: v }))} />
            <NumberInput label="Reminder Setelah Jatuh Tempo (hari)" value={settings.reminderAfterDueDays} onChange={(v) => setSettings((s) => ({ ...s, reminderAfterDueDays: v }))} />
          </div>

          <h3 className="font-semibold text-gray-900">Security & Notification</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <NumberInput label="Timeout Sesi (menit)" value={settings.sessionTimeoutMinutes} min={5} onChange={(v) => setSettings((s) => ({ ...s, sessionTimeoutMinutes: v }))} />
            <NumberInput label="Maks Percobaan Login" value={settings.maxLoginAttempts} min={1} onChange={(v) => setSettings((s) => ({ ...s, maxLoginAttempts: v }))} />
            <NumberInput label="Batas Stok Rendah Default" value={settings.lowStockThreshold} min={1} onChange={(v) => setSettings((s) => ({ ...s, lowStockThreshold: v }))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ToggleInput
              label="Auto Approve Peminjaman"
              desc="Jika aktif, pengajuan akan langsung diproses tanpa approval manual."
              value={settings.autoApproveLoan}
              onChange={(v) => setSettings((s) => ({ ...s, autoApproveLoan: v }))}
            />
            <ToggleInput
              label="Notifikasi Peminjaman"
              desc="Aktifkan notifikasi event peminjaman."
              value={settings.enableLoanNotifications}
              onChange={(v) => setSettings((s) => ({ ...s, enableLoanNotifications: v }))}
            />
            <ToggleInput
              label="Notifikasi Sistem"
              desc="Aktifkan notifikasi sistem umum."
              value={settings.enableSystemNotifications}
              onChange={(v) => setSettings((s) => ({ ...s, enableSystemNotifications: v }))}
            />
          </div>
        </div>
      )}
    </PageShell>
  );
}
