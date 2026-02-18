
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getUsers, getItems, getLoans, ReportsAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Users, Package, FileText, AlertTriangle, ArrowRight, TrendingUp } from "lucide-react";
import { Loader2 } from "lucide-react";

// Helpers
const unwrapData = (res: any) => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && Array.isArray(res.rows)) return res.rows;
  return [];
};

const formatDateID = (iso: string) => {
  if (!iso) return "-";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setError("");
    setLoading(true);
    try {
      const [uRes, iRes, lRes, rRes] = await Promise.all([
        getUsers(),
        getItems(),
        getLoans({}),
        ReportsAPI.summary({ from: "", to: "", status: "ALL" }).catch(() => null),
      ]);
      setUsers(unwrapData(uRes));
      setItems(unwrapData(iRes));
      setLoans(unwrapData(lRes));
      setReport(rRes);
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalItems: items.length,
    activeLoans: loans.filter(l => l.status !== "SELESAI").length,
    lowStock: items.filter(it => Number(it.stok) <= 2).length,
  }), [users, items, loans]);

  const recentLoans = useMemo(() => 
    loans.slice(0, 5).map(l => ({
      id: l.id,
      date: formatDateID(l.returnedAt || l.tanggal),
      borrower: l.peminjamNama || l.peminjam || "-",
      status: l.status,
      itemsCount: Array.isArray(l.items) 
        ? l.items.reduce((a: number, b: any) => a + Number(b.jumlah || 0), 0)
        : 0,
    })), [loans]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "SELESAI": return "success";
      case "SEBAGIAN": return "warning";
      case "DIPINJAM": return "default"; // blue
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
        <p className="text-text-secondary">Selamat datang, Admin!</p>
     {/* Fitur Jam, Beserta Tanggal Hari Ini, Bulan Ini  */}
        <div className="mt-2 text-sm text-text-secondary">
          {new Date().toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })}
        </div>

      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-text-secondary">Akun yang aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Item</CardTitle>
            <Package className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-text-secondary">Tersedia di Inventaris</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peminjaman Aktif</CardTitle>
            <FileText className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLoans}</div>
            <p className="text-xs text-text-secondary">Sedang dalam masa peminjaman</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-status-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStock}</div>
            <p className="text-xs text-text-secondary">Item atau barang yang stoknya rendah</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Aktifitas Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Peminjam</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLoans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-text-secondary">
                        No recent activity
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell>{loan.date}</TableCell>
                        <TableCell>{loan.borrower}</TableCell>
                        <TableCell>{loan.itemsCount}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(loan.status)}>
                            {loan.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-end">
               <Link to="/loans">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Lihat semua peminjaman <ArrowRight className="h-4 w-4" />
                  </Button>
               </Link>
            </div>
          </CardContent>
        </Card>
        
        <div className="col-span-3 space-y-4">
           <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat (CTA)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
               <Link to="/users">
                 <Button variant="outline" className="w-full justify-start">
                   <Users className="mr-2 h-4 w-4" /> Atur Pengguna
                 </Button>
               </Link>
               <Link to="/loans">
                 <Button variant="outline" className="w-full justify-start">
                   <FileText className="mr-2 h-4 w-4" /> Kelola Peminjaman
                 </Button>
               </Link>
               <Link to="/returns">
                 <Button variant="outline" className="w-full justify-start">
                   <TrendingUp className="mr-2 h-4 w-4" /> Proses Pengembalian
                 </Button>
               </Link>
               <Link to="/reports">
                 <Button variant="outline" className="w-full justify-start">
                   <FileText className="mr-2 h-4 w-4" /> Pembuatan Laporan
                 </Button>
               </Link>
            </CardContent>
          </Card>

          {report && (
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Laporan</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Total Transaksi</span>
                      <span className="font-medium">{report.total ?? "-"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Dipinjam</span>
                      <span className="font-medium text-blue-600">{report.dipinjam ?? "-"}</span>
                    </div>
                     <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Selesai</span>
                      <span className="font-medium text-green-600">{report.selesai ?? "-"}</span>
                    </div>
                 </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
