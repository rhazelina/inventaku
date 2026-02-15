// src/pages/Items.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { apiItems, apiCategories, apiLocations, apiUnits } from "../lib/api";
import {
  PageShell,
  LoadingLine,
  ErrorBox,
  TextInput,
  SelectInput,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
} from "./_ui";

const EMPTY_FORM = {
  code: "",
  name: "",
  category_id: "",
  location_id: "",
  unit_id: "",
  stock: 0,
  description: "",
};

const normalizeData = (data) => (Array.isArray(data) ? data : data?.data || []);

const buildPayload = (form) => ({
  code: form.code?.trim() || null,
  name: form.name?.trim(),
  category_id: form.category_id ? Number(form.category_id) : null,
  location_id: form.location_id ? Number(form.location_id) : null,
  unit_id: form.unit_id ? Number(form.unit_id) : null,
  stock: Number(form.stock || 0),
  description: form.description?.trim() || null,
});

export default function Items() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [locs, setLocs] = useState([]);
  const [units, setUnits] = useState([]);

  const [q, setQ] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const loadData = useCallback(async (searchQuery = "") => {
    setLoading(true);
    setErr(null);
    try {
      const [i, c, l, u] = await Promise.all([
        apiItems.list(searchQuery ? { q: searchQuery } : {}),
        apiCategories.list(),
        apiLocations.list(),
        apiUnits.list(),
      ]);

      setItems(normalizeData(i));
      setCats(normalizeData(c));
      setLocs(normalizeData(l));
      setUnits(normalizeData(u));
    } catch (e) {
      setErr(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(q);
  }, [loadData, q]);

  // Memoized dropdown options
  const categoryOptions = useMemo(
    () => cats.map((x) => ({ value: x.id, label: x.name })),
    [cats]
  );
  const locationOptions = useMemo(
    () => locs.map((x) => ({ value: x.id, label: x.name })),
    [locs]
  );
  const unitOptions = useMemo(
    () => units.map((x) => ({ value: x.id, label: x.symbol ? `${x.name} (${x.symbol})` : x.name })),
    [units]
  );

  const startEdit = useCallback((item) => {
    setEditingId(item.id);
    setForm({
      code: item.code ?? "",
      name: item.name ?? "",
      category_id: String(item.category_id ?? item.category?.id ?? ""),
      location_id: String(item.location_id ?? item.location?.id ?? ""),
      unit_id: String(item.unit_id ?? item.unit?.id ?? ""),
      stock: Number(item.stock ?? item.qty ?? 0),
      description: item.description ?? "",
    });
  }, []);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }, []);

  const handleFormChange = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onSave = useCallback(async () => {
    setSaving(true);
    setErr(null);
    try {
      const payload = buildPayload(form);

      if (!payload.name) throw new Error("Nama barang wajib diisi.");

      if (editingId) {
        await apiItems.update(editingId, payload);
      } else {
        await apiItems.create(payload);
      }

      await loadData(q);
      resetForm();
    } catch (e) {
      setErr(e);
    } finally {
      setSaving(false);
    }
  }, [form, editingId, q, loadData, resetForm]);

  const onDelete = useCallback(async (id) => {
    if (!confirm("Hapus item ini?")) return;
    setErr(null);
    try {
      await apiItems.remove(id);
      await loadData(q);
    } catch (e) {
      setErr(e);
    }
  }, [q, loadData]);

  const onSearch = useCallback(() => {
    loadData(q);
  }, [q, loadData]);

  const onResetSearch = useCallback(() => {
    setQ("");
    loadData("");
  }, [loadData]);

  return (
    <PageShell
      title="Items"
      subtitle="CRUD barang + relasi kategori, lokasi, satuan."
      right={
        <div className="flex gap-2">
          <SecondaryButton onClick={onSearch} disabled={loading}>
            Cari
          </SecondaryButton>
          <SecondaryButton onClick={onResetSearch} disabled={loading}>
            Reset
          </SecondaryButton>
        </div>
      }
    >
      <div className="grid md:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-3">
          {/* Search Bar */}
          <input
            className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2"
            placeholder="Search nama/kode..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
            disabled={loading}
          />

          <ErrorBox error={err} />

          {/* Data Table */}
          {loading ? (
            <LoadingLine />
          ) : (
            <div className="overflow-auto border rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50">
                  <tr className="text-left">
                    <th className="p-2">Kode</th>
                    <th className="p-2">Nama</th>
                    <th className="p-2">Kategori</th>
                    <th className="p-2">Lokasi</th>
                    <th className="p-2">Satuan</th>
                    <th className="p-2">Stok</th>
                    <th className="p-2 w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td className="p-3 text-neutral-600" colSpan={7}>
                        Belum ada data.
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => (
                      <tr key={it.id} className="border-t hover:bg-neutral-50 transition">
                        <td className="p-2">{it.code || "-"}</td>
                        <td className="p-2 font-medium">{it.name}</td>
                        <td className="p-2">{it.category?.name || it.category_name || "-"}</td>
                        <td className="p-2">{it.location?.name || it.location_name || "-"}</td>
                        <td className="p-2">{it.unit?.name || it.unit_name || "-"}</td>
                        <td className="p-2">{it.stock ?? it.qty ?? 0}</td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <SecondaryButton 
                              onClick={() => startEdit(it)}
                              disabled={saving}
                            >
                              Edit
                            </SecondaryButton>
                            <DangerButton 
                              onClick={() => onDelete(it.id)}
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
          )}
        </div>

        {/* Form Panel */}
        <div className="space-y-3">
          <div className="text-sm font-semibold">
            {editingId ? `Edit Item #${editingId}` : "Tambah Item"}
          </div>

          <div className="grid gap-3">
            <TextInput
              label="Kode (opsional)"
              value={form.code}
              onChange={(v) => handleFormChange("code", v)}
              placeholder="ITM-001"
              disabled={saving}
            />
            <TextInput
              label="Nama"
              value={form.name}
              onChange={(v) => handleFormChange("name", v)}
              placeholder="Laptop Lenovo..."
              disabled={saving}
            />

            <SelectInput
              label="Kategori"
              value={form.category_id}
              onChange={(v) => handleFormChange("category_id", v)}
              options={categoryOptions}
              disabled={saving}
            />
            <SelectInput
              label="Lokasi"
              value={form.location_id}
              onChange={(v) => handleFormChange("location_id", v)}
              options={locationOptions}
              disabled={saving}
            />
            <SelectInput
              label="Satuan"
              value={form.unit_id}
              onChange={(v) => handleFormChange("unit_id", v)}
              options={unitOptions}
              disabled={saving}
            />

            <TextInput
              label="Stok"
              type="number"
              value={form.stock}
              onChange={(v) => handleFormChange("stock", v)}
              placeholder="0"
              disabled={saving}
            />

            <label className="space-y-1 block">
              <div className="text-xs text-neutral-600">Deskripsi (opsional)</div>
              <textarea
                className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 min-h-[90px] disabled:opacity-50 disabled:cursor-not-allowed"
                value={form.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                disabled={saving}
              />
            </label>

            <div className="flex gap-2">
              <PrimaryButton onClick={onSave} disabled={saving}>
                {saving ? "Menyimpan..." : editingId ? "Update" : "Simpan"}
              </PrimaryButton>
              <SecondaryButton onClick={resetForm} disabled={saving}>
                Reset
              </SecondaryButton>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
