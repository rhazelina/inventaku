// src/pages/Peminjaman.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { LoansAPI, getUsers, getItems } from "../lib/api";
import { useAuth } from "../auth/AuthProvider";
import { useNotifications } from "../hooks/useNotifications";
import { 
  PlusCircle, 
  Trash2, 
  ShoppingCart, 
  History,
  Calendar,
  UserCheck,
  Package,
  CheckCircle,
  AlertCircle,
  RotateCw,
  Filter,
  Download,
  Printer,
  ChevronDown,
  X
} from "lucide-react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function Peminjaman() {
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loans, setLoans] = useState([]);

  const [peminjamId, setPeminjamId] = useState("");
  const [itemId, setItemId] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [cart, setCart] = useState([]);
  
  // Return items state
  const [returnLoanId, setReturnLoanId] = useState("");
  const [returnItems, setReturnItems] = useState([]);
  const [showReturnModal, setShowReturnModal] = useState(false);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsRes, usersRes, loansRes] = await Promise.all([
        getItems(),
        getUsers(),
        LoansAPI.list(),
      ]);

      setItems(itemsRes?.data ?? itemsRes ?? []);
      setUsers(usersRes?.data ?? usersRes ?? []);
      setLoans(loansRes?.data ?? loansRes ?? []);
    } catch (err) {
      setError(err.message || "Gagal memuat data");
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const availableItems = useMemo(() => {
    return items.filter(item => {
      const inCart = cart.find(c => c.invId === item.id);
      const reserved = inCart ? inCart.jumlah : 0;
      return item.stok - reserved > 0;
    });
  }, [items, cart]);

  const selectedItem = useMemo(() => {
    return items.find(i => i.id === itemId);
  }, [items, itemId]);

  const selectedUser = useMemo(() => {
    return users.find(u => u.id === peminjamId);
  }, [users, peminjamId]);

  const addToCart = useCallback(() => {
    if (!itemId) {
      setError("Pilih barang terlebih dahulu");
      return;
    }

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const qty = Number(jumlah) || 1;
    const maxQty = item.stok;
    
    if (qty > maxQty) {
      setError(`Stok tidak cukup. Tersedia: ${maxQty}`);
      return;
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(c => c.invId === itemId);
      
      if (existingIndex >= 0) {
        const newTotal = prev[existingIndex].jumlah + qty;
        if (newTotal > maxQty) {
          setError(`Total ${item.nama} melebihi stok (${maxQty})`);
          return prev;
        }
        
        const updated = [...prev];
        updated[existingIndex].jumlah = newTotal;
        return updated;
      }
      
      return [...prev, {
        invId: item.id,
        nama: item.nama,
        stok: item.stok,
        jumlah: qty,
        kondisi: item.kondisi
      }];
    });

    setError(null);
    setJumlah(1);
    setItemId("");
  }, [itemId, jumlah, items]);

  const removeFromCart = useCallback((invId) => {
    setCart(prev => prev.filter(item => item.invId !== invId));
  }, []);

  const updateCartQty = useCallback((invId, newQty) => {
    const cartItem = cart.find(c => c.invId === invId);
    if (!cartItem) return;

    const item = items.find(i => i.id === invId);
    if (!item) return;

    if (newQty > item.stok) {
      setError(`Stok tidak cukup. Maksimal: ${item.stok}`);
      return;
    }

    if (newQty < 1) {
      removeFromCart(invId);
      return;
    }

    setCart(prev => 
      prev.map(c => 
        c.invId === invId 
          ? { ...c, jumlah: newQty }
          : c
      )
    );
    setError(null);
  }, [cart, items, removeFromCart]);

  const calculateTotalItems = useCallback(() => {
    return cart.reduce((total, item) => total + item.jumlah, 0);
  }, [cart]);

  const submitLoan = useCallback(async () => {
    if (!peminjamId) {
      setError("Pilih peminjam terlebih dahulu");
      return;
    }

    if (cart.length === 0) {
      setError("Tambahkan barang ke keranjang terlebih dahulu");
      return;
    }

    if (!tanggal) {
      setError("Tanggal peminjaman harus diisi");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await LoansAPI.create({
        peminjamId,
        tanggal,
        items: cart.map(item => ({
          invId: item.invId,
          jumlah: item.jumlah
        }))
      });

      setSuccess("Peminjaman berhasil disimpan!");
      setCart([]);
      setPeminjamId("");
      setTanggal(new Date().toISOString().split('T')[0]);
      await loadData();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Gagal menyimpan peminjaman");
    } finally {
      setLoading(false);
    }
  }, [peminjamId, cart, tanggal, loadData]);

  const returnLoan = useCallback(async () => {
    if (!returnLoanId || returnItems.length === 0) {
      setError("Pilih peminjaman dan barang yang dikembalikan");
      return;
    }

    setLoading(true);
    try {
      await LoansAPI.ret(returnLoanId, {
        items: returnItems.map(item => ({
          invId: item.invId,
          jumlahDikembalikan: item.jumlahDikembalikan,
          kondisi: item.kondisi || "baik"
        }))
      });

      setSuccess("Pengembalian barang berhasil dicatat!");
      setShowReturnModal(false);
      setReturnItems([]);
      setReturnLoanId("");
      await loadData();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Gagal memproses pengembalian");
    } finally {
      setLoading(false);
    }
  }, [returnLoanId, returnItems, loadData]);

  const openReturnModal = useCallback((loanId) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    setReturnLoanId(loanId);
    setReturnItems(
      loan.items?.map(item => ({
        invId: item.invId,
        nama: item.nama,
        jumlah: item.jumlah,
        jumlahDikembalikan: 0,
        kondisi: "baik"
      })) || []
    );
    setShowReturnModal(true);
  }, [loans]);

  const closeReturnModal = useCallback(() => {
    setShowReturnModal(false);
    setReturnLoanId("");
    setReturnItems([]);
  }, []);

  const filteredLoans = useMemo(() => {
    let filtered = loans;

    if (statusFilter !== "ALL") {
      filtered = filtered.filter(l => l.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.peminjamNama?.toLowerCase().includes(query) ||
        l.id?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [loans, statusFilter, searchQuery]);

  const exportToCSV = useCallback(() => {
    if (filteredLoans.length === 0) {
      setError("Tidak ada data untuk diexport");
      return;
    }

    const headers = ["ID", "Peminjam", "Tanggal", "Status", "Jumlah Barang"];
    const rows = filteredLoans.map(loan => [
      loan.id,
      loan.peminjamNama,
      loan.tanggal,
      loan.status,
      loan.items?.length || 0
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `peminjaman-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [filteredLoans]);

  const printLoans = useCallback(() => {
    if (filteredLoans.length === 0) {
      setError("Tidak ada data untuk dicetak");
      return;
    }

    const printContent = `
      <html>
        <head>
          <title>Laporan Peminjaman Barang</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Laporan Peminjaman Barang</h1>
          <p>Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Peminjam</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th>Jumlah Barang</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLoans.map(loan => `
                <tr>
                  <td>${loan.id}</td>
                  <td>${loan.peminjamNama}</td>
                  <td>${loan.tanggal}</td>
                  <td>${loan.status}</td>
                  <td>${loan.items?.length || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=400,width=800');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  }, [filteredLoans]);

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
          <h1 className="text-2xl font-bold text-gray-900">Peminjaman Barang</h1>
          <p className="text-gray-600 mt-1">
            Kelola peminjaman barang inventaris
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={printLoans}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cx(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              showFilters
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="DIPINJAM">Dipinjam</option>
                <option value="SELESAI">Selesai</option>
                <option value="SEBAGIAN">Sebagian</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cari (Peminjam / ID)
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari peminjam atau ID peminjaman..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setSearchQuery("");
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Reset Filter
            </button>
            <div className="ml-auto text-sm text-gray-600">
              Menampilkan {filteredLoans.length} dari {loans.length} peminjaman
            </div>
          </div>
        </div>
      )}

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
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Peminjam Selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Data Peminjam</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Peminjam
                </label>
                <select
                  value={peminjamId}
                  onChange={(e) => setPeminjamId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                >
                  <option value="">-- Pilih Peminjam --</option>
                  {users
                    .filter(u => u.role === 'employee')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.username})
                      </option>
                    ))
                  }
                </select>
                {selectedUser && (
                  <div className="mt-2 text-sm text-gray-600">
                    Dipilih: <span className="font-medium">{selectedUser.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Peminjaman
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Item Selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Tambah Barang</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Barang
                </label>
                <select
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                >
                  <option value="">-- Pilih Barang --</option>
                  {availableItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nama} (Stok: {i.stok})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={selectedItem?.stok || 1}
                    value={jumlah}
                    onChange={(e) => setJumlah(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                  <button
                    onClick={addToCart}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Tambah
                  </button>
                </div>
              </div>
            </div>

            {selectedItem && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">{selectedItem.nama}</span> • 
                  Stok: {selectedItem.stok} • 
                  Kondisi: {selectedItem.kondisi} • 
                  Lokasi: {selectedItem.lokasi || '-'}
                </p>
              </div>
            )}
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Keranjang Peminjaman</h2>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  {calculateTotalItems()} barang
                </span>
              </div>

              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.invId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.nama}</div>
                      <div className="text-sm text-gray-600">
                        Stok tersedia: {item.stok} • Kondisi: {item.kondisi}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQty(item.invId, item.jumlah - 1)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">{item.jumlah}</span>
                        <button
                          onClick={() => updateCartQty(item.invId, item.jumlah + 1)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(item.invId)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={submitLoan}
                  disabled={loading || !peminjamId || cart.length === 0}
                  className={cx(
                    "w-full py-3 px-4 rounded-lg font-semibold transition-colors",
                    loading || !peminjamId || cart.length === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
                  )}
                >
                  {loading ? "Menyimpan..." : "Simpan Peminjaman"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Riwayat Peminjaman</h2>
            </div>

            <div className="space-y-3">
              {filteredLoans.slice(0, 10).map((loan) => (
                <div key={loan.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      #{loan.id.slice(0, 8)}
                    </div>
                    <span className={cx(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      loan.status === "SELESAI" && "bg-emerald-100 text-emerald-700",
                      loan.status === "DIPINJAM" && "bg-blue-100 text-blue-700",
                      loan.status === "SEBAGIAN" && "bg-amber-100 text-amber-700"
                    )}>
                      {loan.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {loan.peminjamNama}
                  </div>
                  <div className="text-xs text-gray-500">
                    {loan.tanggal} • {loan.items?.length || 0} item
                  </div>
                  
                  {loan.status === "DIPINJAM" && (
                    <button
                      onClick={() => openReturnModal(loan.id)}
                      className="w-full mt-2 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                    >
                      Kembalikan Barang
                    </button>
                  )}
                </div>
              ))}

              {filteredLoans.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Belum ada riwayat peminjaman
                </div>
              )}

              {loans.length > 10 && (
                <button
                  onClick={() => {/* Navigate to full history */}}
                  className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Lihat Semua ({loans.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Kembalikan Barang Peminjaman</h2>
              <button
                onClick={closeReturnModal}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {returnItems.map((item, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.nama}</p>
                    <p className="text-xs text-gray-500">Dipinjam: {item.jumlah} barang</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Jumlah Dikembalikan
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={item.jumlah}
                      value={item.jumlahDikembalikan}
                      onChange={(e) => {
                        const updated = [...returnItems];
                        updated[idx].jumlahDikembalikan = Math.min(
                          item.jumlah,
                          Math.max(0, parseInt(e.target.value) || 0)
                        );
                        setReturnItems(updated);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Kondisi Barang
                    </label>
                    <select
                      value={item.kondisi}
                      onChange={(e) => {
                        const updated = [...returnItems];
                        updated[idx].kondisi = e.target.value;
                        setReturnItems(updated);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="baik">Baik</option>
                      <option value="rusak-ringan">Rusak Ringan</option>
                      <option value="rusak-berat">Rusak Berat</option>
                      <option value="hilang">Hilang</option>
                    </select>
                  </div>
                </div>
              ))}

              <div className="border-t border-gray-200 pt-4 flex gap-3">
                <button
                  onClick={closeReturnModal}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={returnLoan}
                  disabled={loading}
                  className={cx(
                    "flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors text-white",
                    loading
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  )}
                >
                  {loading ? "Menyimpan..." : "Simpan Pengembalian"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}