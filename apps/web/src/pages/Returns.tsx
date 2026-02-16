import { useState, useEffect, useCallback, useMemo } from "react";
import { LoansAPI } from "@/lib/api";
import { useAuth } from "../auth/useAuth";
import {
  ArrowLeftRight,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { cn } from "../lib/utils";

interface LoanItem {
  invId: string;
  nama: string;
  jumlah: number;
  kembali?: number;
}

interface Loan {
  id: string;
  peminjamNama: string;
  status: "PENDING" | "DIPINJAM" | "SEBAGIAN" | "SELESAI" | "DITOLAK";
  tanggal: string;
  items: LoanItem[];
}

interface ReturnItem extends LoanItem {
  dipinjam: number;
  sudahKembali: number;
  sisa: number;
  akanKembali: number;
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DIPINJAM: "default", // Blue-ish in default theme usually, or we can map to specific styles
  SEBAGIAN: "secondary", // Amber/Warning
  SELESAI: "outline", // Green/Success usually needs customization or just use outline
  PENDING: "secondary",
  DITOLAK: "destructive",
};

// Start of Component
export default function Returns() {
  useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState("");

  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);

  const loadActiveLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await LoansAPI.list();
      const data: Loan[] = (res as any)?.data ?? res ?? [];
      // Filter only active loans
      const activeLoans = data.filter(loan => loan.status !== "SELESAI");
      setLoans(activeLoans);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data peminjaman");
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveLoans();
  }, [loadActiveLoans]);

  const selectLoan = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) {
      setSelectedLoan(null);
      setReturnItems([]);
      return;
    }

    setSelectedLoan(loan);
    
    // Initialize return items with max returnable quantity
    const items: ReturnItem[] = (loan.items || []).map((item) => ({
      ...item,
      dipinjam: Number(item.jumlah),
      sudahKembali: Number(item.kembali || 0),
      sisa: Number(item.jumlah) - Number(item.kembali || 0),
      akanKembali: Number(item.jumlah) - Number(item.kembali || 0) // Default to return all
    }));
    
    setReturnItems(items);
  };

  const updateReturnQty = (invId: string, value: string) => {
    const item = returnItems.find(i => i.invId === invId);
    if (!item) return;

    const parsed = parseInt(value);
    const newValue = isNaN(parsed) ? 0 : Math.max(0, Math.min(item.sisa, parsed));
    
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
    } catch (err: any) {
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <Button
            variant="outline"
            onClick={loadActiveLoans}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="rounded-xl border border-status-error/20 bg-red-50 p-4 flex items-start gap-3 text-status-error">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-status-success/20 bg-green-50 p-4 flex items-start gap-3 text-status-success">
          <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Berhasil</p>
            <p className="text-sm mt-0.5">{success}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Loan Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ArrowLeftRight className="w-5 h-5 text-primary" />
                  Peminjaman Aktif
                </CardTitle>
                <Badge variant="secondary">
                  {loans.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Pilih Peminjaman
                  </label>
                  <Select
                    value={selectedLoan?.id || ""}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => selectLoan(e.target.value)}
                  >
                    <option value="">-- Pilih Peminjaman --</option>
                    {loans.map((loan) => (
                      <option key={loan.id} value={loan.id}>
                        {/* Truncate ID for display */}
                        #{loan.id.slice(0, 8)} - {loan.peminjamNama} ({loan.status})
                      </option>
                    ))}
                  </Select>
                </div>

                {loans.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Tidak ada peminjaman aktif</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {loans.map((loan) => (
                      <button
                        key={loan.id}
                        type="button"
                        onClick={() => selectLoan(loan.id)}
                        className={cn(
                          "w-full text-left p-3 border rounded-lg transition-colors",
                          selectedLoan?.id === loan.id
                            ? "border-primary/50 bg-primary/5"
                            : "border-border hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-medium text-gray-900 truncate">
                            #{loan.id.slice(0, 8)}
                          </div>
                          <Badge variant={STATUS_VARIANTS[loan.status] || "default"} className="text-[10px] px-1.5 py-0">
                            {loan.status}
                          </Badge>
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
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Return Form */}
        <div className="lg:col-span-2">
          {selectedLoan ? (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">
                      Pengembalian #{selectedLoan.id.slice(0, 8)}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
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
                        Status: <Badge variant={STATUS_VARIANTS[selectedLoan.status] || "outline"}>{selectedLoan.status}</Badge>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={allItemsReturned ? "secondary" : "default"}
                    onClick={returnAll}
                    disabled={allItemsReturned}
                    className={allItemsReturned ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    Kembalikan Semua
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Return Summary */}
                <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                      <div className="text-sm text-gray-600">Total Dipinjam</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {returnItems.reduce((sum, item) => sum + item.dipinjam, 0)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                      <div className="text-sm text-gray-600">Sudah Kembali</div>
                      <div className="text-2xl font-bold text-status-success">
                        {returnItems.reduce((sum, item) => sum + item.sudahKembali, 0)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                      <div className="text-sm text-gray-600">Akan Dikembalikan</div>
                      <div className="text-2xl font-bold text-primary">
                        {totalToReturn}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Return Items */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Detail Barang</h3>
                  
                  {returnItems.map((item) => (
                    <div key={item.invId} className="p-4 border border-border rounded-lg">
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
                            <div className="font-medium text-status-success">{item.sudahKembali}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Sisa</div>
                            <div className="font-medium text-primary">{item.sisa}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-32">
                            <label className="block text-sm text-gray-700 mb-1">
                              Jumlah Kembali
                            </label>
                            <Input
                              type="number"
                              min="0"
                              max={item.sisa}
                              value={item.akanKembali}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateReturnQty(item.invId, e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-sm pt-3 border-t border-gray-100">
                        <div className="text-gray-500">
                           {item.sisa > 0 ? `Bisa mengembalikan maksimal ${item.sisa} item` : "Semua item sudah dikembalikan"}
                        </div>
                        <div className="font-medium">
                          Akan dikembalikan: <span className="text-primary font-bold">{item.akanKembali}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit Button */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <Button
                    onClick={submitReturn}
                    disabled={submitting || totalToReturn === 0}
                    className="w-full"
                    size="lg"
                  >
                    {submitting ? "Memproses..." : `Konfirmasi Pengembalian (${totalToReturn} item)`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full min-h-[400px] flex items-center justify-center text-center p-8 border-dashed">
              <div className="max-w-md">
                <ArrowLeftRight className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Pilih Peminjaman
                </h3>
                <p className="text-gray-500">
                  Pilih salah satu peminjaman aktif dari daftar di sebelah kiri untuk memulai proses pengembalian.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
