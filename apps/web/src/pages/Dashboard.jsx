import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { Link } from "react-router-dom";
import { getItems, getUsers, getLoans, ReportsAPI } from "../lib/api";

// ---------- Constants & Helpers ----------
const cx = (...c) => c.filter(Boolean).join(" ");

function unwrapData(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && Array.isArray(res.rows)) return res.rows;
  return [];
}

function safeUserFromStorage() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function formatDateID(iso) {
  if (!iso) return "-";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function todayYMD() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ---------- Modern UI Components ----------
function StatCard({ title, value, hint, trend, className, icon }) {
  return (
    <div className={cx("group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {hint && <p className="text-xs text-gray-400">{hint}</p>}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs font-medium text-green-600">↑ {trend}</span>
          <span className="text-xs text-gray-500 ml-2">from last month</span>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    SELESAI: { color: "bg-green-100 text-green-800", dot: "bg-green-500" },
    SEBAGIAN: { color: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
    DIPINJAM: { color: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  };
  
  const style = config[status] || { color: "bg-gray-100 text-gray-800", dot: "bg-gray-500" };
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${style.color}`}>
      <span className={`w-2 h-2 rounded-full mr-2 ${style.dot}`}></span>
      {status || "-"}
    </span>
  );
}

function Section({ title, action, children, className }) {
  return (
    <div className={cx("bg-white rounded-xl border border-gray-100 p-5", className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {action && (
          <Link to={action.to} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
            {action.label} →
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function DataTable({ columns, data, emptyText = "No data available" }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-4 py-3 text-sm text-gray-900">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuickAction({ to, title, description, icon }) {
  return (
    <Link
      to={to}
      className="group flex flex-col p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">{title}</h3>
        <span className="text-gray-400 group-hover:text-blue-500 transition-colors">→</span>
      </div>
      <p className="text-sm text-gray-600 flex-1">{description}</p>
    </Link>
  );
}

// ---------- Dashboard Components ----------
function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loans, setLoans] = useState([]);
  const [report, setReport] = useState(null);
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
    } catch (e) {
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
      date: formatDateID(l.returnedAt || l.tanggal),
      borrower: l.peminjamNama || l.peminjam || "-",
      status: <StatusBadge status={l.status} />,
      items: Array.isArray(l.items) 
        ? `${l.items.reduce((a, b) => a + Number(b.jumlah || 0), 0)} items`
        : "-",
    })), [loans]);

  const quickActions = [
    { to: "/users", title: "Manage Users", description: "Add, edit, or remove user accounts" },
    { to: "/loans", title: "Create Loan", description: "Create new borrowing transaction" },
    { to: "/returns", title: "Process Returns", description: "Update stock and loan status" },
    { to: "/reports", title: "Generate Reports", description: "Export transaction data" },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadDashboardData} />;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">System overview and monitoring</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} hint="Active accounts" />
        <StatCard title="Total Items" value={stats.totalItems} hint="Inventory items" />
        <StatCard title="Active Loans" value={stats.activeLoans} hint="Not returned" />
        <StatCard title="Low Stock" value={stats.lowStock} hint="Items ≤ 2 in stock" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Section 
            title="Recent Activity" 
            action={{ to: "/reports", label: "View all" }}
          >
            <DataTable
              columns={["Date", "Borrower", "Status", "Items"]}
              data={recentLoans.map(l => [l.date, l.borrower, l.status, l.items])}
            />
          </Section>
        </div>

        {/* Quick Actions */}
        <div>
          <Section title="Quick Actions">
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action, idx) => (
                <QuickAction key={idx} {...action} />
              ))}
            </div>
            
            {/* Report Summary */}
            {report && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Report Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard title="Total" value={report.total ?? "-"} className="col-span-2" />
                  <StatCard title="Borrowed" value={report.dipinjam ?? "-"} />
                  <StatCard title="Partial" value={report.sebagian ?? "-"} />
                  <StatCard title="Completed" value={report.selesai ?? "-"} />
                </div>
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function OperatorDashboard() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [loans, setLoans] = useState([]);
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
    } catch (e) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

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
      date: l.tanggal || "-",
      borrower: l.peminjamNama || l.peminjam || "-",
      status: <StatusBadge status={l.status} />,
    })), [loans]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadDashboardData} />;

  return (
    <div className="space-y-8 p-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Operator Dashboard</h1>
        <p className="text-gray-600 mt-1">Daily operations overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Loans" value={todayLoans.length} />
        <StatCard title="Active Loans" value={loans.filter(l => l.status !== "SELESAI").length} />
        <StatCard title="Low Stock" value={lowStock.length} />
        <StatCard title="Total Items" value={items.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div>
          <Section title="Quick Actions">
            <div className="space-y-3">
              <QuickAction
                to="/loans"
                title="New Loan"
                description="Create new borrowing transaction"
              />
              <QuickAction
                to="/returns"
                title="Process Returns"
                description="Handle item returns and updates"
              />
            </div>

            {/* Stock Alerts */}
            {lowStock.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Stock Alerts</h3>
                <div className="space-y-2">
                  {lowStock.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900 truncate">{item.nama}</span>
                      <span className="text-sm font-bold text-red-600">Stock: {item.stok}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Section
            title="Recent Transactions"
            action={{ to: "/loans", label: "View all" }}
          >
            <DataTable
              columns={["Date", "Borrower", "Status"]}
              data={recentLoans.map(l => [l.date, l.borrower, l.status])}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState([]);
  const [error, setError] = useState("");

  const user = safeUserFromStorage();

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setError("");
    setLoading(true);
    try {
      const lRes = await getLoans({});
      setLoans(unwrapData(lRes));
    } catch (e) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  const activeLoans = useMemo(() => 
    loans.filter(l => l.status !== "SELESAI"), [loans]);

  const recentHistory = useMemo(() => 
    loans.slice(0, 5).map(l => ({
      date: l.tanggal || "-",
      status: <StatusBadge status={l.status} />,
      returned: l.returnedAt ? formatDateID(l.returnedAt) : "-",
    })), [loans]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadDashboardData} />;

  return (
    <div className="space-y-8 p-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Your Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, <span className="font-semibold text-blue-600">{user?.name || "User"}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Active Loans" value={activeLoans.length} hint="Currently borrowed" />
        <StatCard title="Total History" value={loans.length} hint="All transactions" />
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <p className="text-sm font-medium mb-2">Need to return items?</p>
          <Link
            to="/returns"
            className="inline-flex items-center px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Process Return
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Items */}
        <Section
          title="Active Borrowings"
          action={{ to: "/returns", label: "Process return" }}
        >
          {activeLoans.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No active borrowings</p>
              <Link to="/loans" className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-block">
                Browse available items →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeLoans.map((loan, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{loan.tanggal || "-"}</span>
                    <StatusBadge status={loan.status} />
                  </div>
                  <p className="text-sm text-gray-600">
                    {Array.isArray(loan.items)
                      ? loan.items.map(it => `${it.nama} (${it.jumlah})`).join(", ")
                      : "No items listed"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Recent History */}
        <Section
          title="Recent History"
          action={{ to: "/loans", label: "View all" }}
        >
          <DataTable
            columns={["Date", "Status", "Returned"]}
            data={recentHistory.map(h => [h.date, h.status, h.returned])}
          />
        </Section>
      </div>
    </div>
  );
}

// ---------- Utility Components ----------
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="p-4 bg-red-50 rounded-xl mb-4">
        <p className="text-red-600 font-medium">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// ---------- Main Export ----------
export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  if (role === "admin") return <AdminDashboard />;
  if (role === "operator") return <OperatorDashboard />;
  return <EmployeeDashboard />;
}