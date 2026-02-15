// src/pages/Access.jsx
import { useEffect, useState } from "react";
import { apiUsers } from "../lib/api";
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

const roles = [
  { value: "admin", label: "Admin" },
  { value: "operator", label: "Operator" },
  { value: "employee", label: "Employee" },
];

export default function Access() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [users, setUsers] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    username: "",
    role: "employee",
    password: "",
  });

  async function boot() {
    setLoading(true);
    setErr(null);
    try {
      const res = await apiUsers.list();
      setUsers(Array.isArray(res) ? res : res?.data || []);
    } catch (e) {
      setErr(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    boot();
  }, []);

  function reset() {
    setEditingId(null);
    setForm({ name: "", username: "", role: "employee", password: "" });
  }

  function startEdit(u) {
    setEditingId(u.id);
    setForm({
      name: u.name ?? "",
      username: u.username ?? "",
      role: u.role ?? "employee",
      password: "",
    });
  }

  async function onSave() {
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        name: form.name.trim(),
        username: form.username.trim(),
        role: form.role,
      };

      if (!payload.name) throw new Error("Nama wajib diisi.");
      if (!payload.username) throw new Error("Username wajib diisi.");
      if (!payload.role) throw new Error("Role wajib dipilih.");

      if (editingId) {
        if (form.password) payload.password = form.password;
        await apiUsers.update(editingId, payload);
      } else {
        if (!form.password) throw new Error("Password wajib saat buat user baru.");
        payload.password = form.password;
        await apiUsers.create(payload);
      }

      await boot();
      reset();
    } catch (e) {
      setErr(e);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    if (!confirm("Hapus user ini?")) return;
    setErr(null);
    try {
      await apiUsers.remove(id);
      await boot();
    } catch (e) {
      setErr(e);
    }
  }

  return (
    <PageShell title="Access" subtitle="Manajemen user & role (admin-only idealnya).">
      <ErrorBox error={err} />

      {loading ? (
        <LoadingLine />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 overflow-auto border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr className="text-left">
                  <th className="p-2">Nama</th>
                  <th className="p-2">Username</th>
                  <th className="p-2">Role</th>
                  <th className="p-2 w-36">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td className="p-3 text-neutral-600" colSpan={4}>
                      Belum ada user.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="p-2 font-medium">{u.name}</td>
                      <td className="p-2">{u.username ?? "-"}</td>
                      <td className="p-2">{u.role ?? "-"}</td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <SecondaryButton onClick={() => startEdit(u)}>Edit</SecondaryButton>
                          <DangerButton onClick={() => onDelete(u.id)}>Hapus</DangerButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold">
              {editingId ? `Edit User #${editingId}` : "Tambah User"}
            </div>

            <div className="grid gap-3">
              <TextInput
                label="Nama"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Deva"
              />
              <TextInput
                label="Username / Email"
                value={form.username}
                onChange={(v) => setForm((f) => ({ ...f, username: v }))}
                placeholder="deva@..."
              />
              <SelectInput
                label="Role"
                value={form.role}
                onChange={(v) => setForm((f) => ({ ...f, role: v }))}
                options={roles}
              />
              <TextInput
                label={editingId ? "Password (opsional)" : "Password"}
                type="password"
                value={form.password}
                onChange={(v) => setForm((f) => ({ ...f, password: v }))}
                placeholder="••••••••"
              />

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
