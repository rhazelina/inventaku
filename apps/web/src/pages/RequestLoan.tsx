import { useState, useEffect, useCallback, useMemo } from "react";
import { LoansAPI, getItems } from "@/lib/api";
import { useAuth } from "../auth/useAuth";
import {
  PlusCircle,
  ShoppingCart,
  Package,
  AlertCircle,
  CheckCircle,
  Loader2,
  Trash2,
  History
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";

interface InventoryItem {
  id: string;
  nama: string;
  stok: number;
  kondisi: string;
}

interface CartItem {
  invId: string;
  nama: string;
  stok: number;
  jumlah: number;
  kondisi: string;
}

interface MyLoanItem {
  invId: string;
  nama: string;
  jumlah: number;
}

interface MyLoan {
  id: string;
  tanggal: string;
  status: "PENDING" | "DIPINJAM" | "SEBAGIAN" | "SELESAI" | "DITOLAK";
  items: MyLoanItem[];
}

const STATUS_STYLES: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  DIPINJAM: "default",
  DITOLAK: "destructive",
  SELESAI: "outline", // 'outline' typically green or success in our badge adaptation if mapped, else secondary
  SEBAGIAN: "secondary"
};

// Start of Component
export default function RequestLoan() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [myLoans, setMyLoans] = useState<MyLoan[]>([]);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [itemId, setItemId] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (!user?.id) return;
      
      // Use Promise.all for parallel fetching
      const [itemsRes, loansRes] = await Promise.all([
        getItems(),
        LoansAPI.list({ peminjamId: user.id })
      ]);
      
      const itemsData = (itemsRes as any)?.data ?? itemsRes ?? [];
      const loansData = (loansRes as any)?.data ?? loansRes ?? [];

      setItems(itemsData);
      setMyLoans(loansData);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const availableItems = useMemo(() => {
    return items.filter(item => {
      // Show items that have stock > 0
      // We also verify against cart, but basic check first
      const inCart = cart.find(c => c.invId === item.id);
      const reserved = inCart ? inCart.jumlah : 0;
      return (Number(item.stok) - reserved) > 0;
    });
  }, [items, cart]);
  
  const selectedItem = useMemo(() => items.find(i => i.id === itemId), [items, itemId]);

  const addToCart = () => {
    if (!itemId) {
      setError("Pilih barang terlebih dahulu");
      return;
    }
    
    // Validate stock
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const inCart = cart.find(c => c.invId === itemId);
    const existingQty = inCart ? inCart.jumlah : 0;
    
    if (existingQty + jumlah > item.stok) {
        setError(`Stok tidak cukup (Sisa: ${item.stok - existingQty})`);
        return;
    }

    setCart(prev => {
      const idx = prev.findIndex(c => c.invId === itemId);
      if (idx >= 0) {
        const updated = [...prev];
        if (updated[idx]) {
          updated[idx].jumlah += jumlah;
        }
        return updated;
      }
      return [...prev, {
        invId: item.id,
        nama: item.nama,
        stok: item.stok,
        jumlah,
        kondisi: item.kondisi
      }];
    });
    
    setItemId("");
    setJumlah(1);
    setError(null);
  };

  const removeFromCart = (invId: string) => {
    setCart(prev => prev.filter(c => c.invId !== invId));
  };

  const submitRequest = async () => {
    if (cart.length === 0) {
      setError("Keranjang kosong");
      return;
    }
    if (!tanggal) {
      setError("Tanggal wajib diisi");
      return;
    }
    
    setLoading(true);
    try {
      await LoansAPI.create({
        peminjamId: user?.id,
        tanggal,
        items: cart.map(c => ({
          invId: c.invId,
          jumlah: c.jumlah
        }))
      });
      
      setSuccess("Permintaan peminjaman berhasil dikirim! Menunggu persetujuan admin.");
      setCart([]);
      await loadData();
      
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.message || "Gagal mengirim permintaan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request Peminjaman</h1>
          <p className="text-gray-600 mt-1">Ajukan peminjaman barang inventaris</p>
        </div>
        
        <div className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium">
            Login sebagai: {user?.username || user?.name || "User"}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-status-error rounded-xl flex items-center gap-3 border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 text-status-success rounded-xl flex items-center gap-3 border border-green-200">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Buat Permintaan Baru
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Pilih Barang</label>
                  <Select
                    value={itemId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setItemId(e.target.value)}
                  >
                    <option value="">-- Pilih Barang --</option>
                    {availableItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.nama} (Stok: {item.stok})
                      </option>
                    ))}
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Jumlah</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      max={selectedItem?.stok || 1}
                      value={jumlah}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJumlah(parseInt(e.target.value) || 1)}
                      className="w-24"
                    />
                    <Button 
                      onClick={addToCart}
                      className="flex-1 gap-2"
                      disabled={!itemId}
                    >
                      <PlusCircle className="w-4 h-4" />
                      Tambah
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="mb-6 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Tanggal Peminjaman</label>
                <Input
                  type="date"
                  value={tanggal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTanggal(e.target.value)}
                />
              </div>
              
              {/* Cart Preview */}
              {cart.length > 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Keranjang ({cart.length} item)
                  </h3>
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 shadow-sm">
                      <span className="font-medium text-gray-800">{item.nama} <span className="text-gray-500 text-sm">x{item.jumlah}</span></span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeFromCart(item.invId)}
                        className="text-status-error hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={submitRequest}
                    disabled={loading}
                    className="w-full mt-4"
                    size="lg"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Kirim Permintaan"}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
                  Belum ada barang dipilih
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* History Section */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600" />
                Riwayat Saya
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pt-4 p-0">
               <div className="p-6 space-y-4">
                {myLoans.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Belum ada riwayat.</p>
                ) : (
                  myLoans.map(loan => (
                    <div key={loan.id} className="border border-border rounded-lg p-4 hover:shadow-md transition bg-surface">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">{loan.tanggal}</span>
                          <h4 className="font-medium text-gray-900 text-sm">ID: #{loan.id.slice(0,6)}</h4>
                        </div>
                        <Badge variant={STATUS_STYLES[loan.status] || "default"} className="text-[10px] px-2">
                           {loan.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                        {loan.items.map(i => (
                          <div key={i.invId} className="flex justify-between py-0.5">
                            <span>{i.nama}</span>
                            <span className="font-medium">x{i.jumlah}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
