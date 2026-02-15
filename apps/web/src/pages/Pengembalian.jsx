// src/pages/Pengembalian.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { LoansAPI } from "../lib/api";
import { useAuth } from "../auth/AuthProvider";
import {
  ArrowLeftRight,
  Package,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Clock,
  ChevronDown
} from "lucide-react";

const cx = (...classes) => classes.filter(Boolean).join(" ");
const STATUS_COLORS = {
  DIPINJAM: "bg-blue-100 text-blue-700",
  SEBAGIAN: "bg-amber-100 text-amber-700",
  SELESAI: "bg-emerald-100 text-emerald-700"
};

export default function Pengembalian() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [returnItems, setReturnItems] = useState([]);

  const loadActiveLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await LoansAPI.list();
      const data = res?.data ?? res ?? [];
      // Filter only active loans
      const activeLoans = data.filter(loan => loan.status !== "SELESAI");
      setLoans(activeLoans);
    } catch (err) {
      setError(err.message || "Gagal memuat data peminjaman");
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveLoans();
  }, [loadActiveLoans]);

  const selectLoan = (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) {
      setSelectedLoan(null);
      setReturnItems([]);
      return;
    }

    setSelectedLoan(loan);
    
    // Initialize return items with max returnable quantity
    const items = (loan.items || []).map(item => ({
      ...item,
      invId: item.invId,
      nama: item.nama,
      dipinjam: Number(item.jumlah),
      sudahKembali: Number(item.kembali || 0),
      sisa: Number(item.jumlah) - Number(item.kembali || 0),
      akanKembali: Number(item.jumlah) - Number(item.kembali || 0) // Default to return all
    }));
    
    setReturnItems(items);
  };

  const updateReturnQty = (invId, value) => {
    const item = returnItems.find(i => i.invId === invId);
    if (!item) return;

    const newValue = Math.max(0, Math.min(item.sisa, parseInt(value) || 0));
    
    setReturnItems(prev =>
      prev.map(i =>
        i.invId === invId
          ? { ...i, akanKembali: newValue }
          : i
      )
    );
  };

  const totalToReturn = useMemo(() => {
    return returnItems.reduce((sum, item) => sum + item.akanKembali, 0);
  }, [returnItems]);

  const allItemsReturned = useMemo(() => {
    return returnItems.every(item => item.akanKembali === item.sisa);
  }, [returnItems]);

  const submitReturn = async () => {
    if (!selectedLoan) {
      setError("Pilih peminjaman terlebih dahulu");
      return;
    }

    if (totalToReturn === 0) {
      setError("Pilih jumlah barang yang akan dikembalikan");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const itemsToReturn = returnItems
        .filter(item => item.akanKembali > 0)
        .map(item => ({
          invId: item.invId,
          jumlahKembali: item.akanKembali
        }));

      await LoansAPI.ret(selectedLoan.id, { items: itemsToReturn });

      setSuccess("Pengembalian berhasil disimpan!");
      
      // Reset form
      setSelectedLoan(null);
      setReturnItems([]);
      
      // Reload data
      await loadActiveLoans();

      // Clear success message
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Gagal menyimpan pengembalian");
    } finally {
      setSubmitting(false);
    }
  };

  const returnAll = () => {
    setReturnItems(prev =>
      prev.map(item => ({
        ...item,
        akanKembali: item.sisa
      }))
    );
  };

  if (loading && loans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengembalian Barang</h1>
          <p className="text-gray-600 mt-1">
            Proses pengembalian barang yang dipinjam
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadActiveLoans}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Loan Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowLeftRight className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Peminjaman Aktif</h2>
              <span className="ml-auto px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                {loans.length}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Pilih Peminjaman
              </label>
              <select
                value={selectedLoan?.id || ""}
                onChange={(e) => selectLoan(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              >
                <option value="">-- Pilih Peminjaman --</option>
                {loans.map((loan) => (
                  <option key={loan.id} value={loan.id}>
                    #{loan.id.slice(0, 8)} - {loan.peminjamNama} ({loan.status})
                  </option>
                ))}
              </select>
            </div>

            {loans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Tidak ada peminjaman aktif</p>
              </div>
            ) : (
              <div className="space-y-3">
                {loans.map((loan) => (
                  <button
                    key={loan.id}
                    onClick={() => selectLoan(loan.id)}
                    className={cx(
                      "w-full text-left p-3 border rounded-lg transition-colors",
                      selectedLoan?.id === loan.id
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium text-gray-900 truncate">
                        #{loan.id.slice(0, 8)}
                      </div>
                      <span className={cx(
                        "px-2 py-1 text-xs font-medium rounded-full flex-shrink-0",
                        STATUS_COLORS[loan.status]
                      )}>
                        {loan.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-3 h-3" />
                      {loan.peminjamNama}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      {loan.tanggal}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {loan.items?.length || 0} item • 
                      Total: {loan.items?.reduce((sum, item) => sum + item.jumlah, 0) || 0}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Return Form */}
        <div className="lg:col-span-2">
          {selectedLoan ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Pengembalian #{selectedLoan.id.slice(0, 8)}
                  </h2>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {selectedLoan.peminjamNama}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {selectedLoan.tanggal}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Status: <span className={cx("font-medium", STATUS_COLORS[selectedLoan.status])}>
                        {selectedLoan.status}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={returnAll}
                  disabled={allItemsReturned}
                  className={cx(
                    "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                    allItemsReturned
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  )}
                >
                  Kembalikan Semua
                </button>
              </div>

              {/* Return Summary */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-sm text-gray-600">Total Dipinjam</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {returnItems.reduce((sum, item) => sum + item.dipinjam, 0)}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-sm text-gray-600">Sudah Kembali</div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {returnItems.reduce((sum, item) => sum + item.sudahKembali, 0)}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-sm text-gray-600">Akan Dikembalikan</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {totalToReturn}
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Items */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Detail Barang</h3>
                
                {returnItems.map((item) => (
                  <div key={item.invId} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.nama}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          ID: {item.invId.slice(0, 8)}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-sm text-gray-600">Dipinjam</div>
                          <div className="font-medium">{item.dipinjam}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Sudah Kembali</div>
                          <div className="font-medium text-emerald-600">{item.sudahKembali}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Sisa</div>
                          <div className="font-medium text-blue-600">{item.sisa}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-32">
                          <label className="block text-sm text-gray-700 mb-1">
                            Jumlah Kembali
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={item.sisa}
                            value={item.akanKembali}
                            onChange={(e) => updateReturnQty(item.invId, e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <div className="text-gray-500">
                        Tekan "Kembalikan Semua" untuk mengembalikan {item.sisa} item
                      </div>
                      <div className="font-medium">
                        Akan dikembalikan: <span className="text-blue-600">{item.akanKembali}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={submitReturn}
                  disabled={submitting || totalToReturn === 0}
                  className={cx(
                    "w-full py-3 px-4 rounded-lg font-semibold transition-colors",
                    submitting || totalToReturn === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                  )}
                >
                  {submitting ? "Memproses..." : `Konfirmasi Pengembalian (${totalToReturn} item)`}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <ArrowLeftRight className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Pilih Peminjaman
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Pilih salah satu peminjaman aktif dari daftar di sebelah kiri untuk memulai proses pengembalian.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}