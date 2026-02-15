import { useEffect, useState, useCallback, useMemo } from "react";
import {
  PageShell,
  LoadingLine,
  ErrorBox,
  TextInput,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
} from "./_ui";

export default function SimpleCrud({
  title,
  subtitle,
  api, // { list, create, update, remove }
  fields, // [{key,label,placeholder,type?}]
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [rows, setRows] = useState([]);

  // Memoize empty form object to avoid recreating on each render
  const emptyForm = useMemo(
    () => fields.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {}),
    [fields]
  );

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  // Load data from API
  const loadData = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.list();
      setRows(Array.isArray(res) ? res : res?.data || []);
    } catch (e) {
      setErr(e);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startEdit = useCallback((row) => {
    setEditingId(row.id);
    const formData = fields.reduce((acc, f) => ({ ...acc, [f.key]: row[f.key] ?? "" }), {});
    setForm(formData);
  }, [fields]);

  const reset = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm);
  }, [emptyForm]);

  const handleFormChange = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onSave = useCallback(async () => {
    setSaving(true);
    setErr(null);
    try {
      // Validate first field is required
      const firstKey = fields[0]?.key;
      if (firstKey && !String(form[firstKey] ?? "").trim()) {
        throw new Error(`${fields[0].label} wajib diisi.`);
      }

      // Build payload with only form fields
      const payload = fields.reduce((acc, f) => ({ ...acc, [f.key]: form[f.key] }), {});

      if (editingId) {
        await api.update(editingId, payload);
      } else {
        await api.create(payload);
      }

      await loadData();
      reset();
    } catch (e) {
      setErr(e);
    } finally {
      setSaving(false);
    }
  }, [fields, form, editingId, api, loadData, reset]);

  const onDelete = useCallback(async (id) => {
    if (!confirm("Hapus data ini?")) return;
    setErr(null);
    try {
      await api.remove(id);
      await loadData();
    } catch (e) {
      setErr(e);
    }
  }, [api, loadData]);

  return (
    <PageShell title={title} subtitle={subtitle}>
      <ErrorBox error={err} />

      {loading ? (
        <LoadingLine />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Data Table */}
          <div className="md:col-span-2 overflow-auto border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr className="text-left">
                  {fields.map((f) => (
                    <th key={f.key} className="p-2">
                      {f.label}
                    </th>
                  ))}
                  <th className="p-2 w-36">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="p-3 text-neutral-600" colSpan={fields.length + 1}>
                      Belum ada data.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-neutral-50 transition">
                      {fields.map((f) => (
                        <td key={f.key} className="p-2">
                          {String(r[f.key] ?? "-")}
                        </td>
                      ))}
                      <td className="p-2">
                        <div className="flex gap-2">
                          <SecondaryButton 
                            onClick={() => startEdit(r)}
                            disabled={saving}
                          >
                            Edit
                          </SecondaryButton>
                          <DangerButton 
                            onClick={() => onDelete(r.id)}
                            disabled={saving}
                          >
                            Hapus
                          </DangerButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Form Panel */}
          <div className="space-y-3">
            <div className="text-sm font-semibold">
              {editingId ? `Edit #${editingId}` : "Tambah Data"}
            </div>

            <div className="grid gap-3">
              {fields.map((f) => (
                <TextInput
                  key={f.key}
                  label={f.label}
                  placeholder={f.placeholder}
                  type={f.type || "text"}
                  value={form[f.key]}
                  onChange={(v) => handleFormChange(f.key, v)}
                  disabled={saving}
                />
              ))}

              <div className="flex gap-2">
                <PrimaryButton onClick={onSave} disabled={saving}>
                  {saving ? "Menyimpan..." : editingId ? "Update" : "Simpan"}
                </PrimaryButton>
                <SecondaryButton onClick={reset} disabled={saving}>
                  Reset
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
