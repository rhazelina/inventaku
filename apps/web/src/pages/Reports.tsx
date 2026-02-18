import { Fragment, useState, useEffect, useCallback, useMemo } from "react";
import { ReportsAPI } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { Loader2, FileText, Filter, Download, Printer, AlertCircle, CheckCircle, ChevronDown, ChevronRight, Package, Users } from "lucide-react";

type LoanStatus = "PENDING" | "DITOLAK" | "DIPINJAM" | "SEBAGIAN" | "SELESAI";
type SortBy = "tanggal" | "status" | "peminjam" | "createdBy" | "itemQty" | "itemCount" | "returnedAt";
type SortDir = "asc" | "desc";

type ReportRow = {
  id: string;
  tanggal: string;
  peminjam: string;
  peminjamRole: string;
  status: LoanStatus;
  itemCount: number;
  itemQty: number;
  itemNames: string[];
  items?: Array<{ nama: string; jumlah: number; kembali: number }>;
  returnedAt?: string | null;
  createdBy: string;
  createdByRole: string;
};

type ReportPayload = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  pending: number;
  ditolak: number;
  dipinjam: number;
  sebagian: number;
  selesai: number;
  kpi?: {
    totalTransactions: number;
    totalItemLines: number;
    totalItemQty: number;
    completionRate: number;
    activeRate: number;
  };
  rows: ReportRow[];
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "Semua Status" },
  { value: "PENDING", label: "Pending" },
  { value: "DITOLAK", label: "Ditolak" },
  { value: "DIPINJAM", label: "Dipinjam" },
  { value: "SEBAGIAN", label: "Sebagian" },
  { value: "SELESAI", label: "Selesai" },
];

const ROLE_OPTIONS = [
  { value: "ALL", label: "Semua Role Pembuat" },
  { value: "admin", label: "Admin" },
  { value: "operator", label: "Operator" },
  { value: "employee", label: "Pegawai" },
];

const SORT_BY_OPTIONS: Array<{ value: SortBy; label: string }> = [
  { value: "tanggal", label: "Tanggal" },
  { value: "status", label: "Status" },
  { value: "peminjam", label: "Peminjam" },
  { value: "createdBy", label: "Dibuat Oleh" },
  { value: "itemQty", label: "Total Qty Item" },
  { value: "itemCount", label: "Jumlah Jenis Item" },
  { value: "returnedAt", label: "Tanggal Kembali" },
];

function escapeHtml(raw: string) {
  return raw
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export default function Reports() {
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    status: "ALL",
    role: "ALL",
    item: "",
  });
  const [paging, setPaging] = useState({
    page: 1,
    limit: 20,
  });
  const [sorting, setSorting] = useState<{ sortBy: SortBy; sortDir: SortDir }>({
    sortBy: "tanggal",
    sortDir: "desc",
  });
  const [reportData, setReportData] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"summary" | "detailed">("summary");

  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    setFilters((prev) => ({
      ...prev,
      from: thirtyDaysAgo.toISOString().split("T")[0] || "",
      to: today.toISOString().split("T")[0] || "",
    }));
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const generateReport = useCallback(async () => {
    if (!filters.from || !filters.to) {
      setError("Tanggal mulai dan selesai harus diisi");
      return;
    }
    if (filters.from > filters.to) {
      setError("Tanggal mulai tidak boleh lebih besar dari tanggal selesai");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res: any = await ReportsAPI.summary({
        ...filters,
        ...paging,
        ...sorting,
      });
      const payload: ReportPayload = {
        total: res?.total ?? 0,
        page: res?.page ?? 1,
        limit: res?.limit ?? paging.limit,
        totalPages: res?.totalPages ?? 1,
        pending: res?.pending ?? 0,
        ditolak: res?.ditolak ?? 0,
        dipinjam: res?.dipinjam ?? 0,
        sebagian: res?.sebagian ?? 0,
        selesai: res?.selesai ?? 0,
        kpi: res?.kpi,
        rows: Array.isArray(res?.rows) ? res.rows : [],
      };
      setReportData(payload);
      setSuccess(`Laporan berhasil: ${payload.total} transaksi, halaman ${payload.page}/${payload.totalPages}`);
      window.setTimeout(() => setSuccess(""), 2500);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Gagal generate laporan");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [filters, paging, sorting]);

  useEffect(() => {
    if (filters.from && filters.to) {
      generateReport();
    }
  }, [filters.from, filters.to, paging.page, paging.limit, sorting.sortBy, sorting.sortDir, generateReport]);

  const rows = reportData?.rows ?? [];
  const total = reportData?.total ?? 0;
  const page = reportData?.page ?? paging.page;
  const totalPages = reportData?.totalPages ?? 1;

  const statistics = useMemo(() => {
    if (!reportData) return null;
    const kpi = reportData.kpi;
    const totalItemQty = kpi?.totalItemQty ?? 0;
    const avgItemsPerTx = total > 0 ? totalItemQty / total : 0;
    return {
      pending: reportData.pending,
      ditolak: reportData.ditolak,
      dipinjam: reportData.dipinjam,
      sebagian: reportData.sebagian,
      selesai: reportData.selesai,
      totalItemQty,
      completionRate: kpi?.completionRate ?? 0,
      activeRate: kpi?.activeRate ?? 0,
      avgItemsPerTx,
    };
  }, [reportData, total]);

  const exportToCSV = () => {
    if (!rows.length || !statistics) return;
    const headers = [
      "ID",
      "Tanggal",
      "Peminjam",
      "Role Peminjam",
      "Status",
      "Jumlah Jenis Item",
      "Total Qty Item",
      "Nama Item",
      "Dibuat Oleh",
      "Role Pembuat",
      "Tanggal Kembali",
    ];
    const csvContent = [
      `Periode,${filters.from} s/d ${filters.to}`,
      `Status,${filters.status}`,
      `Role Pembuat,${filters.role}`,
      `Filter Item,${filters.item || "-"}`,
      `Total Transaksi,${total}`,
      `Total Qty Item,${statistics.totalItemQty}`,
      `Completion Rate,${statistics.completionRate.toFixed(2)}%`,
      "",
      headers.join(","),
      ...rows.map((row) =>
        [
          `"${row.id}"`,
          `"${row.tanggal}"`,
          `"${row.peminjam}"`,
          `"${row.peminjamRole}"`,
          `"${row.status}"`,
          `"${row.itemCount || 0}"`,
          `"${row.itemQty || 0}"`,
          `"${(row.itemNames || []).join(" | ")}"`,
          `"${row.createdBy}"`,
          `"${row.createdByRole}"`,
          `"${row.returnedAt || "-"}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `laporan-${filters.from}-${filters.to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    try {
      const blob = await ReportsAPI.exportPdf({ ...filters, ...sorting });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `laporan-${filters.from}-${filters.to}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || "Gagal export PDF");
    }
  };

  const getStatusBadge = (s: LoanStatus) => {
    switch (s) {
      case "PENDING":
        return <Badge variant="warning">Pending</Badge>;
      case "DITOLAK":
        return <Badge variant="destructive">Ditolak</Badge>;
      case "DIPINJAM":
        return <Badge variant="info">Dipinjam</Badge>;
      case "SEBAGIAN":
        return <Badge variant="secondary">Sebagian</Badge>;
      case "SELESAI":
        return <Badge variant="success">Selesai</Badge>;
      default:
        return <Badge variant="outline">{s}</Badge>;
    }
  };

  const changeFilter = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPaging((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan</h1>
          <p className="text-text-secondary">Filter lengkap, pagination, sorting, dan export CSV/PDF.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportToCSV} disabled={!rows.length}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
          <Button variant="secondary" onClick={exportToPDF} disabled={!rows.length}>
            <Printer className="h-4 w-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-lg bg-green-50 text-green-600 border border-green-200 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" /> Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dari</label>
              <Input type="date" value={filters.from} onChange={(e) => changeFilter("from", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sampai</label>
              <Input type="date" value={filters.to} onChange={(e) => changeFilter("to", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onChange={(e) => changeFilter("status", e.target.value)}>
                {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={filters.role} onChange={(e) => changeFilter("role", e.target.value)}>
                {ROLE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Item</label>
              <Input placeholder="mis. Laptop" value={filters.item} onChange={(e) => changeFilter("item", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sorting.sortBy} onChange={(e) => setSorting((s) => ({ ...s, sortBy: e.target.value as SortBy }))}>
                {SORT_BY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Arah</label>
              <Select value={sorting.sortDir} onChange={(e) => setSorting((s) => ({ ...s, sortDir: e.target.value as SortDir }))}>
                <option value="desc">Terbaru / Terbesar</option>
                <option value="asc">Terlama / Terkecil</option>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={generateReport} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                Buat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card><CardContent className="pt-6"><p className="text-sm text-text-secondary">Total Transaksi</p><h3 className="text-2xl font-bold">{total}</h3></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-text-secondary">Aktif</p><h3 className="text-2xl font-bold text-blue-600">{statistics.dipinjam + statistics.sebagian}</h3></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-text-secondary">Selesai</p><h3 className="text-2xl font-bold text-emerald-600">{statistics.selesai}</h3></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-text-secondary">Total Qty Item</p><h3 className="text-2xl font-bold text-amber-600">{statistics.totalItemQty}</h3></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-text-secondary">Completion Rate</p><h3 className="text-2xl font-bold text-purple-600">{statistics.completionRate.toFixed(2)}%</h3></CardContent></Card>
        </div>
      )}

      {reportData && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Detail Laporan</CardTitle>
            <div className="flex gap-2 text-sm">
              <button onClick={() => setViewMode("summary")} className={`px-3 py-1 rounded-l-md border ${viewMode === "summary" ? "bg-primary text-white border-primary" : "bg-white text-text-secondary border-border"}`}>Simplifikasi</button>
              <button onClick={() => setViewMode("detailed")} className={`px-3 py-1 rounded-r-md border-t border-b border-r ${viewMode === "detailed" ? "bg-primary text-white border-primary" : "bg-white text-text-secondary border-border"}`}>Detail</button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {viewMode === "detailed" && <TableHead className="w-10" />}
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Peminjam</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Dibuat Oleh</TableHead>
                    {viewMode === "detailed" && <TableHead>Kembali</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow><TableCell colSpan={viewMode === "detailed" ? 8 : 7} className="h-32 text-center text-text-secondary">Tidak ada data</TableCell></TableRow>
                  ) : (
                    rows.map((row) => (
                      <Fragment key={row.id}>
                        <TableRow>
                          {viewMode === "detailed" && (
                            <TableCell><button onClick={() => toggleRow(row.id)}>{expandedRows[row.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button></TableCell>
                          )}
                          <TableCell>{row.tanggal}</TableCell>
                          <TableCell><div className="font-medium">{row.peminjam}</div><div className="text-xs text-gray-500">{row.peminjamRole}</div></TableCell>
                          <TableCell>{getStatusBadge(row.status)}</TableCell>
                          <TableCell className="text-right">{row.itemQty}</TableCell>
                          <TableCell className="max-w-xs"><div className="line-clamp-1">{(row.itemNames || []).join(", ") || "-"}</div></TableCell>
                          <TableCell><div className="font-medium">{row.createdBy}</div><div className="text-xs text-gray-500">{row.createdByRole}</div></TableCell>
                          {viewMode === "detailed" && <TableCell className={row.returnedAt ? "text-green-600" : "text-gray-500"}>{row.returnedAt || "Pending"}</TableCell>}
                        </TableRow>
                        {viewMode === "detailed" && expandedRows[row.id] && (
                          <TableRow className="bg-gray-50/50">
                            <TableCell colSpan={8} className="p-4">
                              <div className="pl-8 space-y-2">
                                <div className="text-xs text-gray-500">ID: {escapeHtml(row.id)}</div>
                                <div className="space-y-1">
                                  {(row.items || []).map((item, idx) => (
                                    <div key={`${row.id}-${idx}`} className="text-sm flex items-center gap-2">
                                      <Package className="h-3 w-3 text-gray-500" />
                                      <span>{item.nama}</span>
                                      <span className="text-gray-500">qty {item.jumlah}</span>
                                      <span className="text-gray-500">kembali {item.kembali}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-t p-4">
              <div className="text-sm text-text-secondary">
                Halaman {page} / {totalPages} • Menampilkan {rows.length} data dari total {total}
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={String(paging.limit)}
                  onChange={(e) => setPaging({ page: 1, limit: Number(e.target.value) })}
                  className="w-28"
                >
                  <option value="10">10 / halaman</option>
                  <option value="20">20 / halaman</option>
                  <option value="50">50 / halaman</option>
                </Select>
                <Button variant="secondary" onClick={() => setPaging((p) => ({ ...p, page: Math.max(1, p.page - 1) }))} disabled={page <= 1}>
                  Prev
                </Button>
                <Button variant="secondary" onClick={() => setPaging((p) => ({ ...p, page: Math.min(totalPages, p.page + 1) }))} disabled={page >= totalPages}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {statistics && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Ringkasan KPI</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border p-3"><div className="text-text-secondary">Pending / Ditolak</div><div className="font-semibold">{statistics.pending} / {statistics.ditolak}</div></div>
            <div className="rounded-lg border p-3"><div className="text-text-secondary">Rata-rata Qty per Transaksi</div><div className="font-semibold">{statistics.avgItemsPerTx.toFixed(2)}</div></div>
            <div className="rounded-lg border p-3"><div className="text-text-secondary">Rasio Aktif</div><div className="font-semibold">{statistics.activeRate.toFixed(2)}%</div></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

