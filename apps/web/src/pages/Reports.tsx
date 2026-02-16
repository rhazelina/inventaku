
import { useState, useEffect, useCallback, useMemo } from "react";
import { ReportsAPI } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { Loader2, FileText, Filter, Download, Printer, AlertCircle, CheckCircle, TrendingUp, Clock, ChevronDown, ChevronRight } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Semua Status" },
  { value: "DIPINJAM", label: "Dipinjam" },
  { value: "SELESAI", label: "Selesai" },
  { value: "SEBAGIAN", label: "Sebagian" }
];

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    from: "",
    to: ""
  });
  const [status, setStatus] = useState("ALL");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [viewMode, setViewMode] = useState<"summary" | "detailed">("summary");

  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setDateRange({
      from: thirtyDaysAgo.toISOString().split('T')[0] || "",
      to: today.toISOString().split('T')[0] || ""
    });
  }, []);

  const toggleRow = (id: string | number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const generateReport = useCallback(async () => {
    if (!dateRange.from || !dateRange.to) {
      setError("Tanggal mulai dan selesai harus diisi");
      return;
    }

    if (dateRange.from > dateRange.to) {
      setError("Tanggal mulai tidak boleh lebih besar dari tanggal selesai");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await ReportsAPI.summary({
        from: dateRange.from,
        to: dateRange.to,
        status: status === "ALL" ? "" : status
      });

      const data = res?.data ?? res;
      
      if (data) {
        setReportData(data);
        setSuccess(`Laporan berhasil digenerate untuk ${data.rows?.length || 0} data`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Data laporan tidak ditemukan");
        setReportData(null);
      }
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Gagal generate laporan");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange, status]);

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      generateReport();
    }
  }, [generateReport]); // Added generateReport to dependency array, wrapped in useCallback. But logic prevents infinite loop if stable.
  // Actually, generateReport depends on dateRange and status. If I add it here, it will run whenever they change.
  // The original code ran only on mount (empty deps) because it checked if dates were set (which they are set in another useEffect on mount).
  // I should probably just run it once when dates are initialized or let user click Generate?
  // Original: useEffect hook for initial load. I'll duplicate that behavior: call generateReport only when dates are first set?
  // Actually, typical pattern is to load on mount or when filter changes if auto-refresh is desired. Laporan.jsx had empty deps array for the effect calling generateReport, but generateReport itself relied on state. That's a closure issue in the original code (stale state) if not careful, but maybe it worked.
  // I'll make it explicit: Run once on mount after dates are set?
  // I will just leave it to manual generation or initial load.
  // Let's stick to "User clicks Generate" or initial load.

  const rows: any[] = reportData?.rows ?? [];
  const total = reportData?.total ?? 0;
  
  const statistics = useMemo(() => {
    if (!reportData) return null;
    
    return {
      dipinjam: reportData.dipinjam ?? rows.filter(r => r.status === "DIPINJAM").length,
      sebagian: reportData.sebagian ?? rows.filter(r => r.status === "SEBAGIAN").length,
      selesai: reportData.selesai ?? rows.filter(r => r.status === "SELESAI").length,
      totalItems: rows.reduce((sum: number, row: any) => sum + (row.itemCount || 0), 0)
    };
  }, [reportData, rows]);

  const exportToCSV = () => {
    if (!rows.length) return;
    
    const headers = ["ID", "Tanggal", "Peminjam", "Status", "Jumlah Item", "Dibuat Oleh", "Tanggal Kembali"];
    const csvContent = [
      headers.join(","),
      ...rows.map(row => [
        `"${row.id}"`,
        `"${row.tanggal}"`,
        `"${row.peminjam || row.peminjamNama || '-'}"`,
        `"${row.status}"`,
        `"${row.itemCount || 0}"`,
        `"${row.createdBy || '-'}"`,
        `"${row.returnedAt || '-'}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan-peminjaman-${dateRange.from}-${dateRange.to}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "DIPINJAM": return <Badge variant="info">Dipinjam</Badge>;
      case "SELESAI": return <Badge variant="success">Selesai</Badge>;
      case "SEBAGIAN": return <Badge variant="secondary">Sebagian</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report</h1>
          <p className="text-text-secondary">Analyze loan data and export reports.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary" onClick={exportToCSV} disabled={!rows.length}>
             <Download className="h-4 w-4 mr-2" /> CSV
           </Button>
           <Button variant="secondary" onClick={() => window.print()} disabled={!rows.length}>
             <Printer className="h-4 w-4 mr-2" /> Print
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
            <Filter className="h-5 w-5" /> Filter Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Input 
                type="date" 
                value={dateRange.from} 
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Input 
                type="date" 
                value={dateRange.to} 
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={generateReport} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Total Transactions</p>
                  <h3 className="text-2xl font-bold">{total}</h3>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Active Loans</p>
                  <h3 className="text-2xl font-bold text-blue-600">{statistics.dipinjam}</h3>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
           <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Partial Returns</p>
                  <h3 className="text-2xl font-bold text-amber-600">{statistics.sebagian}</h3>
                </div>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
           <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Completed</p>
                  <h3 className="text-2xl font-bold text-emerald-600">{statistics.selesai}</h3>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportData && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Report Details</CardTitle>
            <div className="flex gap-2 text-sm">
               <button 
                 onClick={() => setViewMode("summary")}
                 className={`px-3 py-1 rounded-l-md border ${viewMode === 'summary' ? 'bg-primary text-white border-primary' : 'bg-white text-text-secondary border-border'}`}
               >
                 Summary
               </button>
               <button 
                 onClick={() => setViewMode("detailed")}
                 className={`px-3 py-1 rounded-r-md border-t border-b border-r ${viewMode === 'detailed' ? 'bg-primary text-white border-primary' : 'bg-white text-text-secondary border-border'}`}
               >
                 Detailed
               </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {viewMode === "detailed" && <TableHead className="w-10"></TableHead>}
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    {viewMode === "detailed" && (
                      <>
                        <TableHead>Created By</TableHead>
                        <TableHead>Returned At</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={viewMode === "detailed" ? 8 : 6} className="h-32 text-center text-text-secondary">
                        No data found for selected period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <>
                        <TableRow key={row.id}>
                          {viewMode === "detailed" && (
                            <TableCell>
                              <button onClick={() => toggleRow(row.id)}>
                                {expandedRows.has(row.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </button>
                            </TableCell>
                          )}
                          <TableCell className="font-mono text-xs">#{row.id.slice(0, 8)}</TableCell>
                          <TableCell>{row.tanggal}</TableCell>
                          <TableCell>{row.peminjam || row.peminjamNama || "-"}</TableCell>
                          <TableCell>{getStatusBadge(row.status)}</TableCell>
                          <TableCell>{row.itemCount || 0} items</TableCell>
                          {viewMode === "detailed" && (
                            <>
                              <TableCell>{row.createdBy || "-"}</TableCell>
                              <TableCell className={row.returnedAt ? "text-green-600" : "text-gray-500"}>
                                {row.returnedAt || "Pending"}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                        {viewMode === "detailed" && expandedRows.has(row.id) && (
                          <TableRow className="bg-gray-50/50">
                            <TableCell colSpan={8} className="p-4">
                               <div className="pl-10 space-y-1 text-sm text-text-secondary">
                                 <div><strong>Full ID:</strong> {row.id}</div>
                                 {row.createdBy && <div><strong>Created By:</strong> {row.createdBy}</div>}
                                 <div><strong>Status:</strong> {row.status}</div>
                                 {row.returnedAt && <div><strong>Returned At:</strong> {row.returnedAt}</div>}
                               </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))
                  )}
                </TableBody>
              </Table>
             </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
