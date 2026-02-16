
import { useEffect, useState, useMemo, useCallback } from "react";
import { apiItems, apiCategories, apiLocations, apiUnits } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/Table";
import { Loader2, Search, Trash2, Edit, X, RefreshCw } from "lucide-react";
import { AlertCircle } from "lucide-react";

interface ItemForm {
  code: string;
  name: string;
  category_id: string;
  location_id: string;
  unit_id: string;
  stock: number;
  description: string;
}

const EMPTY_FORM: ItemForm = {
  code: "",
  name: "",
  category_id: "",
  location_id: "",
  unit_id: "",
  stock: 0,
  description: "",
};

const normalizeData = (data: any) => (Array.isArray(data) ? data : data?.data || []);

export default function Items() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [locs, setLocs] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  const loadData = useCallback(async (q = "") => {
    setLoading(true);
    setError(null);
    try {
      const [i, c, l, u] = await Promise.all([
        apiItems.list(q ? { q } : {}),
        apiCategories.list(),
        apiLocations.list(),
        apiUnits.list(),
      ]);

      setItems(normalizeData(i));
      setCats(normalizeData(c));
      setLocs(normalizeData(l));
      setUnits(normalizeData(u));
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(searchQuery);
  }, [loadData]); // Debounce could be added here if needed, but for now manual search or enter is fine? Original logic had useEffect on q.

  const categoryOptions = useMemo(() => cats.map((x) => ({ value: x.id, label: x.name })), [cats]);
  const locationOptions = useMemo(() => locs.map((x) => ({ value: x.id, label: x.name })), [locs]);
  const unitOptions = useMemo(() => units.map((x) => ({ value: x.id, label: x.symbol ? `${x.name} (${x.symbol})` : x.name })), [units]);

  const handleEdit = (item: any) => {
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
  };

  const handleReset = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Hapus item ini?")) return;
    setError(null);
    try {
      await apiItems.remove(id);
      await loadData(searchQuery);
    } catch (e: any) {
      setError(e.message || "Failed to delete item");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        code: form.code?.trim() || null,
        name: form.name?.trim(),
        category_id: form.category_id ? Number(form.category_id) : null,
        location_id: form.location_id ? Number(form.location_id) : null,
        unit_id: form.unit_id ? Number(form.unit_id) : null,
        stock: Number(form.stock || 0),
        description: form.description?.trim() || null,
      };

      if (!payload.name) throw new Error("Nama barang wajib diisi.");

      if (editingId) {
        await apiItems.update(editingId, payload);
      } else {
        await apiItems.create(payload);
      }

      await loadData(searchQuery);
      handleReset();
    } catch (e: any) {
      setError(e.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const onSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
       loadData(searchQuery);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Items</h1>
        <p className="text-text-secondary">Manage inventory items, stock, and details.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content (Table) */}
        <div className="md:col-span-2 space-y-4">
           {/* Search & Toolbar */}
           <div className="flex gap-2">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
               <Input 
                 placeholder="Search by name or code..." 
                 className="pl-9"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 onKeyDown={onSearchKeyDown}
               />
             </div>
             <Button variant="secondary" onClick={() => loadData(searchQuery)} disabled={loading}>
               <Search className="h-4 w-4 mr-2" /> Cari
             </Button>
             <Button variant="outline" onClick={() => { setSearchQuery(""); loadData(""); }} disabled={loading}>
               <RefreshCw className="h-4 w-4" />
             </Button>
           </div>
           
           {error && (
             <div className="p-4 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center gap-2">
               <AlertCircle className="h-5 w-5" />
               {error}
             </div>
           )}

           <Card>
             <CardContent className="p-0">
               <div className="overflow-x-auto">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Kode</TableHead>
                       <TableHead>Nama</TableHead>
                       <TableHead>Kategori</TableHead>
                       <TableHead>Lokasi</TableHead>
                       <TableHead>Satuan</TableHead>
                       <TableHead>Stok</TableHead>
                       <TableHead className="text-right">Aksi</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {loading ? (
                       <TableRow>
                         <TableCell colSpan={7} className="h-24 text-center">
                           <div className="flex justify-center items-center">
                             <Loader2 className="h-6 w-6 animate-spin text-primary" />
                           </div>
                         </TableCell>
                       </TableRow>
                     ) : items.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={7} className="h-24 text-center text-text-secondary">
                           No items found.
                         </TableCell>
                       </TableRow>
                     ) : (
                       items.map((item) => (
                         <TableRow key={item.id}>
                           <TableCell className="font-mono text-xs">{item.code || "-"}</TableCell>
                           <TableCell className="font-medium">{item.name}</TableCell>
                           <TableCell>{item.category?.name || item.category_name || "-"}</TableCell>
                           <TableCell>{item.location?.name || item.location_name || "-"}</TableCell>
                           <TableCell>{item.unit?.name || item.unit_name || "-"}</TableCell>
                           <TableCell>{item.stock ?? item.qty ?? 0}</TableCell>
                           <TableCell className="text-right">
                             <div className="flex justify-end gap-2">
                               <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                 <Edit className="h-4 w-4 text-text-secondary hover:text-primary" />
                               </Button>
                               <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                 <Trash2 className="h-4 w-4 text-text-secondary hover:text-status-error" />
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
        </div>

        {/* Form Panel */}
        <div className="space-y-6">
           <Card className="sticky top-6">
             <CardHeader>
               <CardTitle>{editingId ? "Edit Item" : "New Item"}</CardTitle>
             </CardHeader>
             <CardContent>
               <form onSubmit={handleSave} className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-sm font-medium">Kode (Opsional)</label>
                   <Input 
                     value={form.code} 
                     onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))}
                     placeholder="ITM-001"
                     disabled={saving}
                   />
                 </div>
                 
                 <div className="space-y-2">
                   <label className="text-sm font-medium">Nama <span className="text-red-500">*</span></label>
                   <Input 
                     value={form.name} 
                     onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                     placeholder="Laptop..."
                     disabled={saving}
                     required
                   />
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-medium">Kategori</label>
                   <Select 
                     value={form.category_id} 
                     onChange={(e) => setForm(prev => ({ ...prev, category_id: e.target.value }))}
                     disabled={saving}
                   >
                     <option value="">- Pilih Kategori -</option>
                     {categoryOptions.map(opt => (
                       <option key={opt.value} value={opt.value}>{opt.label}</option>
                     ))}
                   </Select>
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-medium">Lokasi</label>
                   <Select 
                     value={form.location_id} 
                     onChange={(e) => setForm(prev => ({ ...prev, location_id: e.target.value }))}
                     disabled={saving}
                   >
                     <option value="">- Pilih Lokasi -</option>
                     {locationOptions.map(opt => (
                       <option key={opt.value} value={opt.value}>{opt.label}</option>
                     ))}
                   </Select>
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-medium">Satuan</label>
                   <Select 
                     value={form.unit_id} 
                     onChange={(e) => setForm(prev => ({ ...prev, unit_id: e.target.value }))}
                     disabled={saving}
                   >
                     <option value="">- Pilih Satuan -</option>
                     {unitOptions.map(opt => (
                       <option key={opt.value} value={opt.value}>{opt.label}</option>
                     ))}
                   </Select>
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-medium">Stok Awal</label>
                   <Input 
                     type="number"
                     value={form.stock} 
                     onChange={(e) => setForm(prev => ({ ...prev, stock: Number(e.target.value) }))}
                     placeholder="0"
                     disabled={saving}
                     min={0}
                   />
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-medium">Deskripsi</label>
                   <Textarea 
                     value={form.description} 
                     onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                     placeholder="Optional description..."
                     disabled={saving}
                   />
                 </div>

                 <div className="flex gap-2 pt-2">
                   <Button type="submit" disabled={saving} className="flex-1">
                     {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     {editingId ? "Update Item" : "Save Item"}
                   </Button>
                   {(editingId || form.name) && (
                     <Button type="button" variant="outline" onClick={handleReset} disabled={saving} size="icon">
                       <X className="h-4 w-4" />
                     </Button>
                   )}
                 </div>
               </form>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
