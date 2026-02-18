
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getLoans } from "@/lib/api";
import { useAuth } from "@/auth/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { FileText, History, RotateCw, ArrowRight, Loader2 } from "lucide-react";

const unwrapData = (res: any) => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && Array.isArray(res.rows)) return res.rows;
  return [];
};

const formatDateID = (iso: string) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID");
};

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setError("");
    setLoading(true);
    try {
      const lRes = await getLoans({});
      setLoans(unwrapData(lRes));
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  const activeLoans = useMemo(() => 
    loans.filter(l => l.status !== "SELESAI"), [loans]);

  const recentHistory = useMemo(() => 
    loans.slice(0, 5).map(l => ({
      id: l.id,
      date: l.tanggal || "-",
      status: l.status,
      returned: l.returnedAt ? formatDateID(l.returnedAt) : "-",
    })), [loans]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "SELESAI": return "success";
      case "SEBAGIAN": return "warning";
      case "DIPINJAM": return "default";
      default: return "secondary";
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="p-4 rounded-lg bg-red-50 text-red-600 border border-red-200">
      Error: {error}
      <Button variant="outline" size="sm" onClick={loadDashboardData} className="ml-4">Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Beranda</h1>
        <p className="text-text-secondary">
          Selamat Datang, <span className="font-semibold text-primary">{user?.name || "User"}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peminjaman Aktif</CardTitle>
            <FileText className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLoans.length}</div>
            <p className="text-xs text-text-secondary">Sedang dipinjam</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
             <History className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">{loans.length}</div>
             <p className="text-xs text-text-secondary">Semua transaksi</p>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Perlu mengembalikan item?</CardTitle>
          </CardHeader>
          <CardContent>
            <Link to="/returns">
               <Button variant="secondary" className="w-full">
                 <RotateCw className="mr-2 h-4 w-4" /> Proses Pengembalian
               </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Peminjaman Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            {activeLoans.length === 0 ? (
               <div className="text-center py-8">
                 <p className="text-text-secondary">Tidak ada peminjaman aktif</p>
                 <Link to="/loans">
                   <Button variant="link" className="mt-2 text-primary">Cari barang yang tersedia</Button>
                 </Link>
               </div>
            ) : (
               <div className="space-y-4">
                 {activeLoans.map((loan) => (
                    <div key={loan.id} className="p-4 rounded-lg border bg-card/50">
                       <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{loan.tanggal || "-"}</span>
                          <Badge variant={getStatusBadgeVariant(loan.status)}>{loan.status}</Badge>
                       </div>
                       <p className="text-sm text-text-secondary">
                          {Array.isArray(loan.items)
                            ? loan.items.map((it: any) => `${it.nama} (${it.jumlah})`).join(", ")
                            : "No items listed"}
                       </p>
                    </div>
                 ))}
               </div>
            )}
          </CardContent>
        </Card>

        <Card>
           <CardHeader>
             <CardTitle>Riwayat Terbaru</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Dikembalikan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentHistory.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell>{h.date}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(h.status)}>{h.status}</Badge>
                        </TableCell>
                        <TableCell>{h.returned}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </div>
              <div className="mt-4 flex justify-end">
                <Link to="/loans">
                   <Button variant="ghost" size="sm" className="gap-1">
                     Lihat semua <ArrowRight className="h-4 w-4" />
                   </Button>
                </Link>
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
