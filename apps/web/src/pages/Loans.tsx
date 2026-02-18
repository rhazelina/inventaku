
import { useState, useEffect, useCallback, useMemo } from "react";
import { LoansAPI } from "@/lib/api";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/Table";
import { Loader2, Search, Check, X, RefreshCw, Calendar, Package, User } from "lucide-react";
import { AlertCircle, CheckCircle } from "lucide-react";

// Since we don't have a Tabs component in ui/ yet, I'll build a simple one or use buttons like Peminjaman.jsx
// Actually, I'll stick to the button group pattern for now to avoid adding more deps/complex components if not requested.
// Or I can just make a simple segmented control.

interface LoanItem {
  nama: string;
  jumlah: number;
}

interface Loan {
  id: string;
  peminjamNama: string;
  tanggal: string;
  status: "PENDING" | "DIPINJAM" | "DITOLAK" | "SELESAI" | "SEBAGIAN";
  items: LoanItem[];
}

export default function Loans() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [loans, setLoans] = useState<Loan[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "history">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await LoansAPI.list();
      // Handle potential data structure differences
      const data = Array.isArray(res) ? res : res?.data || [];
      setLoans(data);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id: string) => {
    if (!confirm("Terima permintaan peminjaman ini? Stok akan berkurang.")) return;
    
    setLoading(true);
    try {
      await LoansAPI.approve(id);
      setSuccess("Permintaan disetujui");
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal menyetujui permintaan");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Tolak permintaan peminjaman ini?")) return;

    setLoading(true);
    try {
      await LoansAPI.reject(id);
      setSuccess("Permintaan ditolak");
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal menolak permintaan");
    } finally {
      setLoading(false);
    }
  };

  const filteredLoans = useMemo(() => {
    let filtered = loans;

    if (activeTab === "pending") {
      filtered = filtered.filter(l => l.status === "PENDING");
    } else if (activeTab === "active") {
      filtered = filtered.filter(l => ["DIPINJAM", "SEBAGIAN"].includes(l.status));
    }
    // history shows all

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.peminjamNama?.toLowerCase().includes(query) ||
        l.id?.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [loans, activeTab, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="warning">PENDING</Badge>;
      case "DIPINJAM": return <Badge variant="info">DIPINJAM</Badge>;
      case "DITOLAK": return <Badge variant="destructive">DITOLAK</Badge>;
      case "SELESAI": return <Badge variant="success">SELESAI</Badge>;
      case "SEBAGIAN": return <Badge variant="secondary">SEBAGIAN</Badge>; // Orange mapped to secondary or create custom? Secondary is grey/purple usually. Info is blue. Warning is yellow.
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Info Peminjaman</h1>
          <p className="text-text-secondary">Kelola permintaan peminjaman dan peminjaman aktif.</p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
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

      {success && (
        <div className="p-4 rounded-lg bg-green-50 text-green-600 border border-green-200 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {success}
        </div>
      )}

      <div className="space-y-4">
        {/* Tabs/Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex p-1 bg-surface border border-border rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "pending" ? "bg-background shadow-sm text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Pending ({loans.filter(l => l.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "active" ? "bg-background shadow-sm text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Sedang Aktif ({loans.filter(l => ["DIPINJAM", "SEBAGIAN"].includes(l.status)).length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "history" ? "bg-background shadow-sm text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Riwayat
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
            <Input
              placeholder="Cari peminjam atau ID peminjaman..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Peminjam</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && loans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex justify-center flex-col items-center text-text-secondary">
                          <Loader2 className="h-6 w-6 animate-spin mb-2" />
                          <span>Loading data...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredLoans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-text-secondary">
                        Tidak ada data peminjaman
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-mono text-xs text-text-secondary">
                          #{loan.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-gray-100 rounded-full">
                              <User className="h-3 w-3 text-gray-600" />
                            </div>
                            <span className="font-medium">{loan.peminjamNama}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-text-secondary text-sm">
                            <Calendar className="h-3 w-3" />
                            {loan.tanggal}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {loan.items.map((item, i) => (
                              <div key={i} className="text-sm flex items-center gap-2">
                                <Package className="h-3 w-3 text-text-secondary" />
                                <span>{item.nama}</span>
                                <span className="text-xs font-semibold bg-gray-100 px-1.5 rounded">x{item.jumlah}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {loan.status === "PENDING" && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                                  onClick={() => handleApprove(loan.id)}
                                  disabled={loading}
                                >
                                  <Check className="h-3 w-3 mr-1" /> Setujui
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  className="h-8"
                                  onClick={() => handleReject(loan.id)}
                                  disabled={loading}
                                >
                                  <X className="h-3 w-3 mr-1" /> Tolak
                                </Button>
                              </>
                            )}
                            {loan.status === "DIPINJAM" && (
                                <span className="text-xs text-text-secondary italic">Active</span>
                            )}
                             {loan.status === "DITOLAK" && (
                                <span className="text-xs text-text-secondary italic">Rejected</span>
                            )}
                             {loan.status === "SELESAI" && (
                                <span className="text-xs text-text-secondary italic">Completed</span>
                            )}
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
    </div>
  );
}