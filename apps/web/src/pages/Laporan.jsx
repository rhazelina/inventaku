// src/pages/Laporan.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { ReportsAPI } from "../lib/api";
import { 
  FileText, 
  Calendar, 
  Filter, 
  Download, 
  Printer, 
  RefreshCw, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Users,
  Package,
  Clock,
  Eye
} from "lucide-react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

const STATUS_OPTIONS = [
  { value: "ALL", label: "Semua Status", color: "gray" },
  { value: "DIPINJAM", label: "Dipinjam", color: "blue" },
  { value: "SELESAI", label: "Selesai", color: "green" },
  { value: "SEBAGIAN", label: "Sebagian", color: "amber" }
];

const STATUS_COLORS = {
  DIPINJAM: "bg-blue-100 text-blue-700 border-blue-200",
  SELESAI: "bg-emerald-100 text-emerald-700 border-emerald-200",
  SEBAGIAN: "bg-amber-100 text-amber-700 border-amber-200",
  ALL: "bg-gray-100 text-gray-700 border-gray-200"
};

export default function Laporan() {
  const [dateRange, setDateRange] = useState({
    from: "",
    to: ""
  });
  const [status, setStatus] = useState("ALL");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [viewMode, setViewMode] = useState("summary"); // 'summary' or 'detailed'

  // Set default date range to last 30 days
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setDateRange({
      from: thirtyDaysAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    });
  }, []);

  const toggleRow = (id) => {
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

      // Normalize response
      const data = res?.data ?? res;
      
      if (data) {
        setReportData(data);
        setSuccess(`Laporan berhasil digenerate untuk ${data.rows?.length || 0} data`);
        
        // Auto-clear success message
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Data laporan tidak ditemukan");
      }
    } catch (err) {
      setError(err?.data?.message || err?.message || "Gagal generate laporan");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange, status]);

  // Auto-generate report on initial load
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      generateReport();
    }
  }, []); // Empty dependency array for initial load only

  const total = reportData?.total ?? 0;
  const rows = reportData?.rows ?? [];
  
  const statistics = useMemo(() => {
    if (!reportData) return null;
    
    return {
      dipinjam: reportData.dipinjam ?? rows.filter(r => r.status === "DIPINJAM").length,
      sebagian: reportData.sebagian ?? rows.filter(r => r.status === "SEBAGIAN").length,
      selesai: reportData.selesai ?? rows.filter(r => r.status === "SELESAI").length,
      totalItems: rows.reduce((sum, row) => sum + (row.itemCount || 0), 0)
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

  const printReport = () => {
    window.print();
  };

  const resetFilters = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setDateRange({
      from: thirtyDaysAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    });
    setStatus("ALL");
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Peminjaman</h1>
          </div>
          <p className="text-gray-600">
            Analisis dan monitoring data peminjaman inventaris
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            disabled={!rows.length}
            className={cx(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
              !rows.length
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            )}
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={printReport}
            disabled={!rows.length}
            className={cx(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
              !rows.length
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            )}
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800">Berhasil</p>
            <p className="text-sm text-emerald-700 mt-0.5">{success}</p>
          </div>
        </div>
      )}

      {/* Filter Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filter Laporan</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Periode
            </label>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Dari Tanggal</div>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Sampai Tanggal</div>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Status Peminjaman
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={cx(
                    "px-3 py-2 text-sm rounded-lg border transition-colors",
                    status === option.value
                      ? STATUS_COLORS[option.value]
                      : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col justify-end space-y-3">
            <button
              onClick={generateReport}
              disabled={loading || !dateRange.from || !dateRange.to}
              className={cx(
                "w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2",
                loading || !dateRange.from || !dateRange.to
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
              )}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  Generate Laporan
                </>
              )}
            </button>
            
            <button
              onClick={resetFilters}
              className="w-full py-2 px-4 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Total Transaksi</div>
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-xs text-gray-500 mt-1">Dalam periode terpilih</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Masih Dipinjam</div>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700">{statistics.dipinjam}</div>
            <div className="text-xs text-gray-500 mt-1">Belum dikembalikan</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Dikembalikan Sebagian</div>
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-700">{statistics.sebagian}</div>
            <div className="text-xs text-gray-500 mt-1">Sedang dalam proses</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Selesai</div>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700">{statistics.selesai}</div>
            <div className="text-xs text-gray-500 mt-1">Sudah dikembalikan</div>
          </div>
        </div>
      )}

      {/* Report Table */}
      {reportData && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Detail Laporan</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {rows.length} data ditemukan • {statistics?.totalItems || 0} total barang dipinjam
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">Tampilan:</div>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("summary")}
                    className={cx(
                      "px-3 py-1.5 text-sm font-medium transition-colors",
                      viewMode === "summary"
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    Ringkasan
                  </button>
                  <button
                    onClick={() => setViewMode("detailed")}
                    className={cx(
                      "px-3 py-1.5 text-sm font-medium transition-colors",
                      viewMode === "detailed"
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    Detail
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {viewMode === "detailed" && <th className="w-12 p-4"></th>}
                  <th className="text-left p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    ID Transaksi
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Tanggal
                    </div>
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Peminjam
                    </div>
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      Jumlah
                    </div>
                  </th>
                  {viewMode === "detailed" && (
                    <>
                      <th className="text-left p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Dibuat Oleh
                      </th>
                      <th className="text-left p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Tgl. Kembali
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={viewMode === "detailed" ? 8 : 6} 
                      className="p-12 text-center text-gray-500"
                    >
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">Tidak ada data ditemukan</p>
                      <p className="text-sm mt-1">Coba ubah filter atau periode tanggal</p>
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <>
                      <tr 
                        key={row.id} 
                        className={cx(
                          "hover:bg-gray-50 transition-colors",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        )}
                      >
                        {viewMode === "detailed" && (
                          <td className="p-4">
                            <button
                              onClick={() => toggleRow(row.id)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <Eye className={cx(
                                "w-4 h-4 transition-transform",
                                expandedRows.has(row.id) ? "text-blue-600" : "text-gray-400"
                              )} />
                            </button>
                          </td>
                        )}
                        
                        <td className="p-4">
                          <div className="font-mono text-sm font-medium text-gray-900">
                            #{row.id.slice(0, 8)}
                          </div>
                        </td>
                        
                        <td className="p-4">
                          <div className="text-sm text-gray-900">{row.tanggal}</div>
                        </td>
                        
                        <td className="p-4">
                          <div className="font-medium text-gray-900">
                            {row.peminjam || row.peminjamNama || "-"}
                          </div>
                        </td>
                        
                        <td className="p-4">
                          <span className={cx(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                            STATUS_COLORS[row.status] || STATUS_COLORS.ALL
                          )}>
                            {row.status}
                          </span>
                        </td>
                        
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">
                              {row.itemCount || 0}
                            </div>
                            <div className="text-xs text-gray-500">
                              item
                            </div>
                          </div>
                        </td>
                        
                        {viewMode === "detailed" && (
                          <>
                            <td className="p-4">
                              <div className="text-sm text-gray-600">
                                {row.createdBy || "-"}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className={cx(
                                "text-sm",
                                row.returnedAt ? "text-emerald-600" : "text-gray-500"
                              )}>
                                {row.returnedAt || "Belum"}
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                      
                      {/* Expanded Row for Detailed View */}
                      {viewMode === "detailed" && expandedRows.has(row.id) && (
                        <tr className="bg-blue-50/30">
                          <td colSpan={8} className="p-4">
                            <div className="pl-12">
                              <div className="text-sm font-medium text-gray-900 mb-2">
                                Detail Transaksi
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div>ID Lengkap: {row.id}</div>
                                {row.createdBy && <div>Dibuat oleh: {row.createdBy}</div>}
                                <div>Status: {row.status}</div>
                                {row.returnedAt && (
                                  <div className="text-emerald-600">
                                    Dikembalikan pada: {row.returnedAt}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-600">
              <div>
                Menampilkan <span className="font-medium">{rows.length}</span> dari{" "}
                <span className="font-medium">{total}</span> data
              </div>
              <div className="mt-2 md:mt-0">
                Periode: {dateRange.from} hingga {dateRange.to}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!reportData && !loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
            <FileText className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Belum Ada Laporan
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Klik tombol "Generate Laporan" untuk memulai analisis data peminjaman
          </p>
        </div>
      )}
    </div>
  );
}