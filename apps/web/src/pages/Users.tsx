
import { useEffect, useState, useMemo } from "react";
import { apiUsersCreate, apiUsersDelete, apiUsersList, apiUsersUpdate } from "@/lib/api";
import { useAuth } from "../auth/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/Table";
import { Loader2, Trash2, Edit, RefreshCw, AlertCircle } from "lucide-react";
import { Badge } from "../components/ui/Badge";

const ROLES = ["admin", "operator", "employee"];

export default function Users() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    id: null as null | string | number,
    name: "",
    username: "",
    role: "employee",
    password: "",
  });

  const isEditing = useMemo(() => Boolean(form.id), [form.id]);

  async function refresh() {
    setError("");
    setLoading(true);
    try {
      const d = await apiUsersList();
      setRows(Array.isArray(d) ? d : d.data ?? []);
    } catch (e: any) {
      setError(e?.message || "Gagal load users");
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      if (!form.name || !form.username || !form.role) {
        setError("name, username, role wajib diisi");
        return;
      }

      const payload: any = {
        name: form.name,
        username: form.username,
        role: form.role,
      };

      if (!isEditing) {
        if (!form.password) {
          setError("password wajib untuk user baru");
          return;
        }
        payload.password = form.password;
        await apiUsersCreate(payload);
      } else {
        if (form.password) {
          payload.password = form.password;
        }
      if (form.id) {
        await apiUsersUpdate(form.id, payload);
      }
      }

      resetForm();
      await refresh();
    } catch (e2: any) {
      setError(e2?.message || "Gagal simpan user");
    }
  }

  function onEdit(u: any) {
    setForm({
      id: u.id,
      name: u.name ?? "",
      username: u.username ?? "",
      role: u.role ?? "employee",
      password: "",
    });
  }

  async function onDelete(u: any) {
    if (!confirm(`Hapus user: ${u.username}?`)) return;
    setError("");
    try {
      await apiUsersDelete(u.id);
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Gagal hapus user");
    }
  }

  if (user?.role !== "admin") {
    return (
      <div className="p-6">
        <Card className="border-status-error/50 bg-red-50">
          <CardContent className="pt-6 text-center text-status-error">
             Forbidden: Halaman ini hanya untuk admin.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pengguna</h1>
          <p className="text-text-secondary">Kelola pengguna dan peran sistem.</p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Perbarui
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{isEditing ? "Edit User" : "Add User"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Nama Lengkap"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                  placeholder="username"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={form.role}
                  onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Kata Sandi {isEditing && <span className="text-text-secondary font-normal">(Optional)</span>}
                </label>
                <Input
                  value={form.password}
                  onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                  type="password"
                  placeholder={isEditing ? "Biarkan kosong jika tidak ingin mengubah" : "Dibutuhkan untuk user baru"}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEditing ? "Update" : "Create")}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pengguna</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                        </TableCell>
                      </TableRow>
                    ) : rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-text-secondary">
                          Tidak ada pengguna ditemukan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell>{u.username}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === 'admin' ? 'default' : u.role === 'operator' ? 'info' : 'secondary'}>
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(u)}
                              >
                                <Edit className="h-4 w-4 text-text-secondary hover:text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(u)}
                                disabled={u.id === user?.id}
                                title={u.id === user?.id ? "Cannot delete yourself" : "Delete"}
                              >
                                <Trash2 className={`h-4 w-4 ${u.id === user?.id ? "text-gray-300" : "text-text-secondary hover:text-status-error"}`} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
               </div>
            </CardContent>
          </Card>
          <div className="mt-2 text-xs text-text-secondary px-1">
             Note: Passwords are hashed in production.
          </div>
        </div>
      </div>
    </div>
  );
}
