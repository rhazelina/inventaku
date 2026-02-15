// USERS = ADMIN 

import { useEffect, useMemo, useState } from "react";
import { apiUsersCreate, apiUsersDelete, apiUsersList, apiUsersUpdate } from "../lib/api";
import { useAuth } from "../auth/AuthProvider";

const ROLES = ["admin", "operator", "employee"];

export default function Users() {
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    id: null,
    name: "",
    username: "",
    role: "employee",
    password: "",
  });

  const isEditing = useMemo(() => Boolean(form.id), [form.id]);

  async function refresh() {
    setErr("");
    setLoading(true);
    try {
      const d = await apiUsersList();
      setRows(d.data ?? []);
    } catch (e) {
      setErr(e?.message || "Gagal load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function resetForm() {
    setForm({ id: null, name: "", username: "", role: "employee", password: "" });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    try {
      if (!form.name || !form.username || !form.role) {
        setErr("name, username, role wajib diisi");
        return;
      }

      if (!isEditing) {
        if (!form.password) {
          setErr("password wajib untuk user baru");
          return;
        }
        await apiUsersCreate({
          name: form.name,
          username: form.username,
          role: form.role,
          password: form.password,
        });
      } else {
        // password optional saat edit
        const payload = {
          name: form.name,
          username: form.username,
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        };
        await apiUsersUpdate(form.id, payload);
      }

      resetForm();
      await refresh();
    } catch (e2) {
      setErr(e2?.message || "Gagal simpan user");
    }
  }

  function onEdit(u) {
    setForm({
      id: u.id,
      name: u.name ?? "",
      username: u.username ?? "",
      role: u.role ?? "employee",
      password: "",
    });
  }

  async function onDelete(u) {
    if (!confirm(`Hapus user: ${u.username}?`)) return;
    setErr("");
    try {
      await apiUsersDelete(u.id);
      await refresh();
    } catch (e) {
      setErr(e?.message || "Gagal hapus user");
    }
  }

  // Guard UI sederhana (backend tetap yang utama)
  if (user?.role !== "admin") {
    return (
      <div className="p-6 max-w-screen-xl mx-auto">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-medium">Forbidden</div>
          <div className="mt-1 text-sm text-neutral-600">
            Halaman ini hanya untuk admin.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pengguna</h1>
          <p className="mt-1 text-sm text-neutral-600">
            CRUD akun (Admin only).
          </p>
        </div>

        <button
          onClick={refresh}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-100"
          type="button"
        >
          Refresh
        </button>
      </div>

      {err ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm">
          {err}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Form */}
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-medium">
            {isEditing ? "Edit User" : "Tambah User"}
          </div>

          <form onSubmit={onSubmit} className="mt-3 space-y-3">
            <div>
              <label className="text-sm font-medium text-neutral-700">Nama</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-200"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700">Username</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-200"
                value={form.username}
                onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700">Role</label>
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-200"
                value={form.role}
                onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700">
                Password {isEditing ? <span className="text-neutral-500">(opsional)</span> : null}
              </label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-200"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                type="password"
                placeholder={isEditing ? "isi kalau mau ganti" : "wajib untuk user baru"}
              />
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 rounded-xl bg-neutral-900 text-white py-2.5 text-sm font-medium"
                type="submit"
              >
                {isEditing ? "Update" : "Create"}
              </button>

              <button
                className="rounded-xl border px-4 py-2.5 text-sm hover:bg-neutral-100"
                type="button"
                onClick={resetForm}
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="lg:col-span-2 rounded-2xl border bg-white p-4">
          <div className="text-sm font-medium">Daftar User</div>

          <div className="mt-3 overflow-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-700">
                <tr>
                  <th className="text-left px-3 py-2">Nama</th>
                  <th className="text-left px-3 py-2">Username</th>
                  <th className="text-left px-3 py-2">Role</th>
                  <th className="text-right px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-3 py-3 text-neutral-500" colSpan={4}>
                      loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-neutral-500" colSpan={4}>
                      belum ada data
                    </td>
                  </tr>
                ) : (
                  rows.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="px-3 py-2">{u.name}</td>
                      <td className="px-3 py-2">{u.username}</td>
                      <td className="px-3 py-2">{u.role}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-lg border px-3 py-1.5 hover:bg-neutral-100"
                            type="button"
                            onClick={() => onEdit(u)}
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 hover:bg-red-100"
                            type="button"
                            onClick={() => onDelete(u)}
                            disabled={u.id === user?.id}
                            title={u.id === user?.id ? "Tidak bisa hapus akun sendiri" : "Hapus"}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-neutral-500">
            Catatan: demo password masih plaintext (nanti kita ganti hash + DB).
          </div>
        </div>
      </div>
    </div>
  );
}
