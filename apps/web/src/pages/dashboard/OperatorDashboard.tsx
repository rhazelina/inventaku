
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getItems, getLoans } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Package, FileText, AlertTriangle, ArrowRight, Activity, RotateCw } from "lucide-react";
import { Loader2 } from "lucide-react";

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

export default function OperatorDashboard() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setError("");
    setLoading(true);
    try {
      const [iRes, lRes] = await Promise.all([getItems(), getLoans({})]);
      setItems(unwrapData(iRes));
      setLoans(unwrapData(lRes));
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  const todayYMD = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayLoans = useMemo(() => 
    loans.filter(l => (l.tanggal || "").slice(0, 10) === todayYMD()),
    [loans]
  );

  const lowStock = useMemo(() => 
    items.filter(it => Number(it.stok) <= 2).slice(0, 4),
    [items]
  );

  const recentLoans = useMemo(() => 
    loans.slice(0, 6).map(l => ({
      id: l.id,
      date: l.tanggal || "-",
      borrower: l.peminjamNama || l.peminjam || "-",
      status: l.status,
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
        <h1 className="text-3xl font-bold tracking-tight">Operator Dashboard</h1>
        <p className="text-text-secondary">Daily operations and inventory management.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Loans</CardTitle>
            <Activity className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayLoans.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
             <FileText className="h-4 w-4 text-text-secondary" />
          </CardHeader>
           <CardContent>
            <div className="text-2xl font-bold">{loans.filter(l => l.status !== "SELESAI").length}</div>
          </CardContent>
        </Card>
        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-status-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStock.length}</div>
          </CardContent>
        </Card>
        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Link to="/loans">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" /> New Loan
                  </Button>
                </Link>
                <Link to="/returns">
                  <Button variant="outline" className="w-full justify-start">
                    <RotateCw className="mr-2 h-4 w-4" /> Process Returns
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {lowStock.length > 0 && (
              <Card className="border-status-warning/20 bg-yellow-50/50">
                <CardHeader>
                  <CardTitle className="text-amber-800">Stock Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lowStock.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded border border-amber-100 dark:bg-transparent dark:border-amber-900/20">
                        <span className="text-sm font-medium truncate">{item.nama}</span>
                        <span className="text-sm font-bold text-status-error">Stock: {item.stok}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
         </div>

         <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                 <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Borrower</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                         {recentLoans.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center h-24 text-text-secondary">
                            No recent transactions
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentLoans.map((loan) => (
                          <TableRow key={loan.id}>
                            <TableCell>{formatDateID(loan.date)}</TableCell>
                            <TableCell>{loan.borrower}</TableCell>
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
                        View all <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                 </div>
              </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
