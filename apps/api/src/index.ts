// apps/api/src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context, Next, HonoRequest } from "hono";

// =======================
// Types
// =======================
type Role = "admin" | "operator" | "employee";
type ItemCondition = "BAIK" | "RUSAK_RINGAN" | "RUSAK_BERAT";
type LoanStatus = "PENDING" | "DITOLAK" | "DIPINJAM" | "SEBAGIAN" | "SELESAI";

type User = {
  id: string;
  username: string;
  name: string;
  role: Role;
  password: string;
};

type Session = {
  userId: string;
  createdAt: number;
};

type Item = {
  id: string;
  nama: string;
  stok: number;
  kondisi: ItemCondition;
  kategori?: string;
  lokasi?: string;
  satuan?: string;
};

type LoanItem = {
  invId: string;
  nama: string;
  jumlah: number;
  kembali: number;
};

type Loan = {
  id: string;
  peminjamId: string;
  peminjamNama: string;
  tanggal: string;
  status: LoanStatus;
  items: LoanItem[];
  createdBy: string;
  returnedAt?: string | null;
};

type Category = {
  id: string;
  name: string;
  description?: string;
};

type Location = {
  id: string;
  name: string;
  description?: string;
};

type Unit = {
  id: string;
  name: string;
  abbreviation?: string;
  description?: string;
};

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  userName: string;
  timestamp: string;
  details?: any;
};

type NotificationType = "info" | "success" | "warning" | "error";

type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string | null;
  readAt?: string | null;
  createdAt: string;
};

type UserSettings = Record<string, any>;

// =======================
// Demo Data
// =======================
const users: User[] = [
  { id: "u1", username: "admin", name: "Admin", role: "admin", password: "admin123" },
  { id: "u2", username: "operator", name: "Operator", role: "operator", password: "operator123" },
  { id: "u3", username: "employee", name: "Employee", role: "employee", password: "employee123" },
  { id: "u4", username: "deva", name: "Deva", role: "employee", password: "deva12345" },
];

const items: Item[] = [
  { id: "i1", nama: "Laptop Lenovo", stok: 5, kondisi: "BAIK", lokasi: "Lab RPL", kategori: "Elektronik", satuan: "unit" },
  { id: "i2", nama: "Proyektor Epson", stok: 2, kondisi: "BAIK", lokasi: "Ruang Multimedia", kategori: "Elektronik", satuan: "unit" },
  { id: "i3", nama: "Kunci Inggris", stok: 10, kondisi: "BAIK", lokasi: "Gudang", kategori: "Perkakas", satuan: "pcs" },
  { id: "i4", nama: "Meja Belajar", stok: 15, kondisi: "BAIK", lokasi: "Gudang", kategori: "Furniture", satuan: "unit" },
  { id: "i5", nama: "Kursi Lipat", stok: 20, kondisi: "BAIK", lokasi: "Gudang", kategori: "Furniture", satuan: "unit" },
];

const loans: Loan[] = [];
const sessions = new Map<string, Session>();

const categories: Category[] = [
  { id: "c1", name: "Elektronik", description: "Peralatan elektronik" },
  { id: "c2", name: "Furniture", description: "Perabotan kantor" },
  { id: "c3", name: "Perkakas", description: "Alat-alat kerja" },
];

const locations: Location[] = [
  { id: "l1", name: "Lab RPL", description: "Laboratorium Rekayasa Perangkat Lunak" },
  { id: "l2", name: "Ruang Multimedia", description: "Ruang untuk presentasi" },
  { id: "l3", name: "Gudang", description: "Gudang penyimpanan barang" },
];

const units: Unit[] = [
  { id: "u1", name: "Unit", abbreviation: "unit", description: "Satuan barang per unit" },
  { id: "u2", name: "Piece", abbreviation: "pcs", description: "Satuan barang per piece" },
  { id: "u3", name: "Set", abbreviation: "set", description: "Satuan barang per set" },
  { id: "u4", name: "Liter", abbreviation: "ltr", description: "Satuan volume dalam liter" },
  { id: "u5", name: "Kilogram", abbreviation: "kg", description: "Satuan berat dalam kilogram" },
];

const auditLogs: AuditLog[] = [];
const systemSettings: UserSettings = {
  appName: "Inventaku",
  timezone: "Asia/Jakarta",
  dateFormat: "DD/MM/YYYY",
  maxLoanDays: 7,
  maxItemsPerLoan: 5,
  reminderBeforeDueDays: 1,
  reminderAfterDueDays: 1,
  autoApproveLoan: false,
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  enableLoanNotifications: true,
  enableSystemNotifications: true,
  lowStockThreshold: 10,
};

const inventorySettingsByUser = new Map<string, UserSettings>([
  [
    "u2",
    {
      lowStockThreshold: 10,
      enableAutoNotifications: true,
      damageReportNotifications: true,
      expiredItemsNotifications: true,
      inventoryCheckReminders: true,
    },
  ],
]);
const notifications: Notification[] = [
  {
    id: crypto.randomUUID(),
    userId: "u1",
    title: "Sistem Aktif",
    message: "Sistem notifikasi berhasil diaktifkan.",
    type: "info",
    actionUrl: "/notifications",
    readAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    userId: "u2",
    title: "Sistem Aktif",
    message: "Sistem notifikasi berhasil diaktifkan.",
    type: "info",
    actionUrl: "/notifications",
    readAt: null,
    createdAt: new Date().toISOString(),
  },
];

// =======================
// App + Config
// =======================
type HonoEnv = {
  Variables: {
    user: User;
  };
};

const app = new Hono<HonoEnv>();
const WEB_ORIGIN = ["http://localhost:5173", "http://localhost:5174"];
const SESSION_COOKIE = "sid";

app.use("*", cors({ origin: WEB_ORIGIN, credentials: true }));

// =======================
// Helpers
// =======================
function makeSid() { return crypto.randomUUID(); }
function getUserById(id: string) { return users.find((u) => u.id === id) ?? null; }
function sanitizeUser(u: User) { const { password, ...safe } = u; return safe; }
function getItemById(id: string) { return items.find((x) => x.id === id) ?? null; }
function isISODate(s: string) { return /^\d{4}-\d{2}-\d{2}$/.test(s); }
function todayYMD() { return new Date().toISOString().slice(0, 10); }

function logAudit(action: string, entity: string, entityId: string, user: User, details?: any) {
  const log: AuditLog = {
    id: crypto.randomUUID(),
    action,
    entity,
    entityId,
    userId: user.id,
    userName: user.name,
    timestamp: new Date().toISOString(),
    details,
  };
  auditLogs.push(log);
  return log;
}

function getSessionUser(c: Context) {
  const sid = getCookie(c, SESSION_COOKIE);
  if (!sid) return null;
  const sess = sessions.get(sid);
  if (!sess) return null;
  return getUserById(sess.userId);
}

function computeLoanStatus(loan: Loan): LoanStatus {
  if (loan.status === "PENDING" || loan.status === "DITOLAK") return loan.status;
  
  const total = loan.items.reduce((a, it) => a + it.jumlah, 0);
  const returned = loan.items.reduce((a, it) => a + it.kembali, 0);
  if (returned <= 0) return "DIPINJAM";
  if (returned >= total) return "SELESAI";
  return "SEBAGIAN";
}

type ReportQuery = {
  from?: string;
  to?: string;
  status?: string;
  role?: string;
  item?: string;
  sortBy?: string;
  sortDir?: string;
};

function mapReportRow(l: Loan) {
  const creator = getUserById(l.createdBy);
  return {
    id: l.id,
    tanggal: l.tanggal,
    peminjam: l.peminjamNama,
    peminjamRole: getUserById(l.peminjamId)?.role ?? "employee",
    status: l.status,
    itemCount: l.items.length,
    itemQty: l.items.reduce((a, b) => a + b.jumlah, 0),
    itemNames: l.items.map((it) => it.nama),
    items: l.items,
    returnedAt: l.returnedAt ?? null,
    createdBy: creator?.name || "Unknown",
    createdByRole: creator?.role || "unknown",
  };
}

function getReportRows(query: ReportQuery) {
  const from = query.from;
  const to = query.to;
  const status = query.status;
  const role = query.role;
  const item = (query.item || "").toLowerCase().trim();
  const sortBy = query.sortBy || "tanggal";
  const sortDir = query.sortDir === "asc" ? "asc" : "desc";

  let rows = loans.slice();
  if (from && isISODate(from)) rows = rows.filter((l) => l.tanggal >= from);
  if (to && isISODate(to)) rows = rows.filter((l) => l.tanggal <= to);
  if (status && status !== "ALL") rows = rows.filter((l) => l.status === status);
  if (role && role !== "ALL") {
    const roleLc = role.toLowerCase();
    rows = rows.filter((l) => getUserById(l.createdBy)?.role.toLowerCase() === roleLc);
  }
  if (item) rows = rows.filter((l) => l.items.some((it) => it.nama.toLowerCase().includes(item)));

  const mapped = rows.map(mapReportRow);
  const factor = sortDir === "asc" ? 1 : -1;
  const pick = (r: ReturnType<typeof mapReportRow>) => {
    switch (sortBy) {
      case "status":
        return r.status;
      case "peminjam":
        return r.peminjam.toLowerCase();
      case "createdBy":
        return r.createdBy.toLowerCase();
      case "itemQty":
        return r.itemQty;
      case "itemCount":
        return r.itemCount;
      case "returnedAt":
        return r.returnedAt || "";
      case "tanggal":
      default:
        return r.tanggal;
    }
  };

  mapped.sort((a, b) => {
    const va = pick(a);
    const vb = pick(b);
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * factor;
    return String(va).localeCompare(String(vb)) * factor;
  });

  return mapped;
}

function buildMinimalPdf(lines: string[]) {
  const maxLines = 55;
  const safeLines = lines.slice(0, maxLines).map((line) =>
    line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
  );
  if (lines.length > maxLines) {
    safeLines.push(`... ${lines.length - maxLines} baris lainnya tidak ditampilkan di halaman ini`);
  }

  const contentLines = [
    "BT",
    "/F1 10 Tf",
    "50 800 Td",
    "14 TL",
    ...safeLines.map((line, idx) => (idx === 0 ? `(${line}) Tj` : "T* (" + line + ") Tj")),
    "ET",
  ].join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj",
    `4 0 obj << /Length ${contentLines.length} >> stream\n${contentLines}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];

  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(body.length);
    body += obj + "\n";
  }
  const xrefOffset = body.length;
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(body);
}

function createNotification(input: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  actionUrl?: string | null;
}) {
  const notif: Notification = {
    id: crypto.randomUUID(),
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type ?? "info",
    actionUrl: input.actionUrl ?? null,
    readAt: null,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(notif);
  return notif;
}

function notifyByRoles(
  roles: Role[],
  payload: { title: string; message: string; type?: NotificationType; actionUrl?: string | null }
) {
  const roleSet = new Set(roles);
  for (const u of users) {
    if (roleSet.has(u.role)) {
      createNotification({
        userId: u.id,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        actionUrl: payload.actionUrl,
      });
    }
  }
}

function toNotificationResponse(n: Notification) {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    action_url: n.actionUrl ?? null,
    read_at: n.readAt ?? null,
    created_at: n.createdAt,
  };
}

// =======================
// Middleware
// =======================
function requireAuth() {
  return async (c: Context, next: Next) => {
    const user = getSessionUser(c);
    if (!user) return c.json({ message: "Unauthorized" }, 401);
    c.set("user", user);
    await next();
  };
}

function requireRole(roles: Role[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as User;
    if (!user) return c.json({ message: "Unauthorized" }, 401);
    if (!roles.includes(user.role)) return c.json({ message: "Forbidden" }, 403);
    await next();
  };
}

// =======================
// Validation Functions
// =======================
function validateLogin(body: any): { username?: string; password?: string } {
  const errors: any = {};
  if (!body?.username?.toString().trim()) errors.username = "Username wajib";
  if (!body?.password?.toString()) errors.password = "Password wajib";
  return errors;
}

function validateChangePassword(body: any, me: User): { oldPassword?: string; newPassword?: string } {
  const errors: any = {};
  if (!body?.oldPassword?.toString()) errors.oldPassword = "Password lama wajib";
  if (!body?.newPassword?.toString()) errors.newPassword = "Password baru wajib";
  if (body?.newPassword && body.newPassword.length < 4) errors.newPassword = "Password minimal 4 karakter";
  
  const u = users.find((x) => x.id === me.id);
  if (body?.oldPassword && u && u.password !== body.oldPassword) {
    errors.oldPassword = "Password lama salah";
  }
  if (body?.newPassword && body?.oldPassword && body.newPassword === body.oldPassword) {
    errors.newPassword = "Password baru tidak boleh sama dengan password lama";
  }
  return errors;
}

function validateUser(body: any, isUpdate = false): any {
  const errors: any = {};
  if (!isUpdate || body?.username !== undefined) {
    const username = body?.username?.toString().trim();
    if (!username) errors.username = "Username wajib";
    else if (users.some(u => u.username === username && !isUpdate)) {
      errors.username = "Username sudah dipakai";
    }
  }
  
  if (!isUpdate || body?.name !== undefined) {
    if (!body?.name?.toString().trim()) errors.name = "Nama wajib";
  }
  
  if (!isUpdate || body?.role !== undefined) {
    if (!body?.role || !["admin", "operator", "employee"].includes(body.role)) {
      errors.role = "Role tidak valid";
    }
  }
  
  if (!isUpdate && !body?.password) {
    errors.password = "Password wajib";
  }
  return errors;
}

function validateItem(body: any, isUpdate = false): any {
  const errors: any = {};
  
  if (!isUpdate || body?.nama !== undefined) {
    const nama = body?.nama?.toString().trim();
    if (!nama) errors.nama = "Nama barang wajib";
  }
  
  if (!isUpdate || body?.stok !== undefined) {
    const stok = Number(body?.stok);
    if (isNaN(stok) || stok < 0) errors.stok = "Stok harus angka ≥ 0";
  }
  
  if (!isUpdate || body?.kondisi !== undefined) {
    const kondisi = body?.kondisi;
    if (kondisi && !["BAIK", "RUSAK_RINGAN", "RUSAK_BERAT"].includes(kondisi)) {
      errors.kondisi = "Kondisi tidak valid";
    }
  }
  
  return errors;
}

function validateLoan(body: any): any {
  const errors: any = {};
  
  if (!body?.peminjamId) errors.peminjamId = "Peminjam wajib";
  else {
    const peminjam = getUserById(body.peminjamId);
    if (!peminjam || peminjam.role !== "employee") {
      errors.peminjamId = "Peminjam tidak valid";
    }
  }
  
  const tanggal = body?.tanggal?.toString();
  if (!tanggal) errors.tanggal = "Tanggal wajib";
  else if (!isISODate(tanggal)) errors.tanggal = "Format tanggal harus YYYY-MM-DD";
  
  const reqItems = body?.items;
  if (!Array.isArray(reqItems) || reqItems.length === 0) {
    errors.items = "Minimal 1 item wajib dipinjam";
  } else {
    reqItems.forEach((item: any, index: number) => {
      if (!item?.invId) errors[`items[${index}].invId`] = "ID barang wajib";
      else if (!getItemById(item.invId)) errors[`items[${index}].invId`] = "Barang tidak ditemukan";
      
      const qty = Number(item?.jumlah);
      if (isNaN(qty) || qty <= 0) errors[`items[${index}].jumlah`] = "Jumlah harus > 0";
      else if (item.invId) {
        const inv = getItemById(item.invId);
        if (inv && inv.stok < qty) errors[`items[${index}].jumlah`] = `Stok tidak cukup (tersedia: ${inv.stok})`;
      }
    });
  }
  
  return errors;
}

function validateReturn(body: any, loan: Loan): any {
  const errors: any = {};
  const retItems = body?.items;
  
  if (!Array.isArray(retItems) || retItems.length === 0) {
    errors.items = "Minimal 1 item wajib dikembalikan";
  } else {
    retItems.forEach((item: any, index: number) => {
      if (!item?.invId) errors[`items[${index}].invId`] = "ID barang wajib";
      else {
        const loanItem = loan.items.find(li => li.invId === item.invId);
        if (!loanItem) errors[`items[${index}].invId`] = "Barang tidak ada di peminjaman";
        else {
          const qty = Number(item?.jumlahKembali);
          if (isNaN(qty) || qty <= 0) errors[`items[${index}].jumlahKembali`] = "Jumlah harus > 0";
          else {
            const sisa = loanItem.jumlah - loanItem.kembali;
            if (qty > sisa) errors[`items[${index}].jumlahKembali`] = `Jumlah melebihi sisa (sisa: ${sisa})`;
          }
        }
      }
    });
  }
  
  return errors;
}

function validateCategory(body: any, isUpdate = false): any {
  const errors: any = {};
  if (!isUpdate || body?.name !== undefined) {
    if (!body?.name?.toString().trim()) errors.name = "Nama kategori wajib";
  }
  return errors;
}

function validateLocation(body: any, isUpdate = false): any {
  const errors: any = {};
  if (!isUpdate || body?.name !== undefined) {
    if (!body?.name?.toString().trim()) errors.name = "Nama lokasi wajib";
  }
  return errors;
}

function validateUnit(body: any, isUpdate = false): any {
  const errors: any = {};
  if (!isUpdate || body?.name !== undefined) {
    if (!body?.name?.toString().trim()) errors.name = "Nama satuan wajib";
  }
  return errors;
}

// =======================
// Routes: Health
// =======================
app.get("/", (c) => c.text("API OK, fine :v"));
app.get("/health", (c) => c.json({ ok: true }));

// =======================
// Routes: Auth
// =======================
app.post("/auth/login", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const errors = validateLogin(body);
  
  if (Object.keys(errors).length > 0) {
    return c.json({ message: "Validasi gagal", errors }, 400);
  }
  
  const username = body.username.toString().trim();
  const password = body.password.toString();
  
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) return c.json({ message: "username/password salah" }, 401);
  
  const sid = makeSid();
  sessions.set(sid, { userId: user.id, createdAt: Date.now() });
  
  setCookie(c, SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
    secure: false
  });
  
  return c.json({ user: sanitizeUser(user) });
});

app.get("/auth/me", (c) => {
  const user = getSessionUser(c);
  if (!user) return c.json({ user: null }, 200);
  return c.json({ user: sanitizeUser(user) });
});

app.post("/auth/change-password", requireAuth(), async (c) => {
  const me = c.get("user") as User;
  const body = await c.req.json().catch(() => ({}));
  const errors = validateChangePassword(body, me);
  
  if (Object.keys(errors).length > 0) {
    return c.json({ message: "Validasi gagal", errors }, 400);
  }
  
  const u = users.find((x) => x.id === me.id);
  if (!u) return c.json({ message: "user tidak ditemukan" }, 404);
  
  u.password = body.newPassword;
  return c.json({ ok: true });
});

app.post("/auth/logout", (c) => {
  const sid = getCookie(c, SESSION_COOKIE);
  if (sid) sessions.delete(sid);
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

// =======================
// Routes: Users
// =======================
app.get("/users", requireAuth(), requireRole(["admin"]), (c) => {
  return c.json({ data: users.map(sanitizeUser) });
});

app.post("/users", requireAuth(), requireRole(["admin"]), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const errors = validateUser(body, false);
  
  if (Object.keys(errors).length > 0) {
    return c.json({ message: "Validasi gagal", errors }, 400);
  }
  
  const newUser: User = {
    id: crypto.randomUUID(),
    username: body.username.trim(),
    name: body.name.trim(),
    role: body.role,
    password: body.password,
  };
  
  users.push(newUser);
  return c.json({ data: sanitizeUser(newUser) }, 201);
});

app.patch("/users/:id", requireAuth(), requireRole(["admin"]), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  
  const user = users.find((u) => u.id === id);
  if (!user) return c.json({ message: "user tidak ditemukan" }, 404);
  
  const errors = validateUser({ ...user, ...body }, true);
  if (Object.keys(errors).length > 0) {
    return c.json({ message: "Validasi gagal", errors }, 400);
  }
  
  if (body.username && body.username !== user.username) {
    if (users.some(u => u.username === body.username && u.id !== id)) {
      return c.json({ message: "username sudah dipakai" }, 409);
    }
    user.username = body.username.trim();
  }
  
  if (body.name) user.name = body.name.trim();
  if (body.role) user.role = body.role;
  if (body.password) user.password = body.password;
  
  return c.json({ data: sanitizeUser(user) });
});

app.delete("/users/:id", requireAuth(), requireRole(["admin"]), (c) => {
  const id = c.req.param("id");
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return c.json({ message: "user tidak ditemukan" }, 404);
  
  const me = c.get("user") as User;
  if (me.id === id) {
    return c.json({ message: "tidak bisa hapus akun sendiri" }, 400);
  }
  
  users.splice(idx, 1);
  return c.json({ ok: true });
});

// =======================
// Routes: Items
// =======================
app.get("/items", requireAuth(), (c) => {
  return c.json({ data: items });
});

app.post("/items", requireAuth(), requireRole(["admin", "operator"]), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const errors = validateItem(body, false);
  
  if (Object.keys(errors).length > 0) {
    return c.json({ message: "Validasi gagal", errors }, 400);
  }
  
  const newItem: Item = {
    id: crypto.randomUUID(),
    nama: body.nama.trim(),
    stok: Number(body.stok),
    kondisi: body.kondisi,
    kategori: body.kategori?.toString(),
    lokasi: body.lokasi?.toString(),
    satuan: body.satuan?.toString(),
  };
  
  items.push(newItem);
  return c.json({ data: newItem }, 201);
});

app.patch("/items/:id", requireAuth(), requireRole(["admin", "operator"]), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  
  const item = items.find((x) => x.id === id);
  if (!item) return c.json({ message: "barang tidak ditemukan" }, 404);
  
  const errors = validateItem(body, true);
  if (Object.keys(errors).length > 0) {
    return c.json({ message: "Validasi gagal", errors }, 400);
  }
  
  if (body.nama) item.nama = body.nama.trim();
  if (body.stok !== undefined) item.stok = Number(body.stok);
  if (body.kondisi) item.kondisi = body.kondisi;
  if (body.kategori !== undefined) item.kategori = body.kategori?.toString();
  if (body.lokasi !== undefined) item.lokasi = body.lokasi?.toString();
  if (body.satuan !== undefined) item.satuan = body.satuan?.toString();
  
  return c.json({ data: item });
});

app.delete("/items/:id", requireAuth(), requireRole(["admin", "operator"]), (c) => {
  const id = c.req.param("id");
  const idx = items.findIndex((x) => x.id === id);
  if (idx === -1) return c.json({ message: "barang tidak ditemukan" }, 404);
  
  // Check if item is in any active loan
  const activeLoan = loans.find(loan => 
    loan.status !== "SELESAI" && 
    loan.items.some(item => item.invId === id && item.jumlah > item.kembali)
  );
  
  if (activeLoan) {
    return c.json({ message: "Barang masih dalam peminjaman aktif" }, 400);
  }
  
  items.splice(idx, 1);
  return c.json({ ok: true });
});

// =======================
// Routes: Loans
// =======================
app.get("/loans", requireAuth(), (c) => {
  const me = c.get("user") as User;
  const status = c.req.query("status");
  const from = c.req.query("from");
  const to = c.req.query("to");
  const peminjamIdQ = c.req.query("peminjamId");
  
  let rows = loans.slice();
  
  if (me.role === "employee") {
    rows = rows.filter((l) => l.peminjamId === me.id);
  }
  
  if (status) rows = rows.filter((l) => l.status === status);
  if (from && isISODate(from)) rows = rows.filter((l) => l.tanggal >= from);
  if (to && isISODate(to)) rows = rows.filter((l) => l.tanggal <= to);
  if (peminjamIdQ) rows = rows.filter((l) => l.peminjamId === peminjamIdQ);
  
  return c.json({ data: rows });
});

app.post("/loans", requireAuth(), async (c) => {
  const me = c.get("user") as User;
  const body = await c.req.json().catch(() => ({}));
  
  const errors = validateLoan(body);
  if (Object.keys(errors).length > 0) {
    return c.json({ message: "Validasi gagal", errors }, 400);
  }
  
  const loanItems: LoanItem[] = [];
  for (const it of body.items) {
    const inv = getItemById(it.invId)!;
    const qty = Number(it.jumlah);
    
    // Validasi stok (tanpa pengurangan)
    // Walaupun pending, kita cek apakah stok cukup untuk saat ini
    // Tapi karena sifatnya request, mungkin kita bolehin request dulu?
    // Sesuai flow: "Terima -> Cek Stok". Jadi di sini validasi basic aja.
    // Tapi biar UX bagus, kasih tau kalo stok kurang.
    
    // NOTE: User logic wants input validation, then Insert 'Pending'.
    // Stock is NOT deducted here.
    
    loanItems.push({ 
      invId: inv.id, 
      nama: inv.nama, 
      jumlah: qty, 
      kembali: 0 
    });
  }
  
  const peminjam = getUserById(body.peminjamId)!;
  const newLoan: Loan = {
    id: crypto.randomUUID(),
    peminjamId: peminjam.id,
    peminjamNama: peminjam.name,
    tanggal: body.tanggal,
    status: "PENDING", // Start as PENDING
    items: loanItems,
    createdBy: me.id,
    returnedAt: null,
  };
  
  loans.unshift(newLoan);
  notifyByRoles(["admin", "operator"], {
    title: "Pengajuan Peminjaman Baru",
    message: `${peminjam.name} mengajukan peminjaman baru.`,
    type: "info",
    actionUrl: "/loans",
  });
  logAudit("CREATE_REQUEST", "Loan", newLoan.id, me, { peminjam: peminjam.name });
  return c.json({ data: newLoan }, 201);
});

app.post("/loans/:id/approve", requireAuth(), requireRole(["admin", "operator"]), async (c) => {
  const me = c.get("user") as User;
  const id = c.req.param("id");
  const loan = loans.find((l) => l.id === id);
  if (!loan) return c.json({ message: "Peminjaman tidak ditemukan" }, 404);
  
  if (loan.status !== "PENDING") {
    return c.json({ message: `Status peminjaman bukan PENDING (saat ini: ${loan.status})` }, 400);
  }
  
  // 1. Cek stok
  const errors: string[] = [];
  for (const item of loan.items) {
    const inv = getItemById(item.invId);
    if (!inv) {
      errors.push(`Barang ${item.nama} tidak ditemukan`);
      continue;
    }
    if (inv.stok < item.jumlah) {
      errors.push(`Stok ${item.nama} tidak cukup (tersedia: ${inv.stok}, diminta: ${item.jumlah})`);
    }
  }
  
  if (errors.length > 0) {
    return c.json({ message: "Stok tidak mencukupi", errors }, 400);
  }
  
  // 2. Kurangi stok
  for (const item of loan.items) {
    const inv = getItemById(item.invId);
    if (inv) inv.stok -= item.jumlah;
  }
  
  // 3. Update Status
  loan.status = "DIPINJAM";
  createNotification({
    userId: loan.peminjamId,
    title: "Peminjaman Disetujui",
    message: `Pengajuan peminjaman (${loan.id.slice(0, 8)}) telah disetujui.`,
    type: "success",
    actionUrl: "/loans",
  });
  
  logAudit("APPROVE", "Loan", loan.id, me);
  return c.json({ data: loan });
});

app.post("/loans/:id/reject", requireAuth(), requireRole(["admin", "operator"]), async (c) => {
  const me = c.get("user") as User;
  const id = c.req.param("id");
  const loan = loans.find((l) => l.id === id);
  if (!loan) return c.json({ message: "Peminjaman tidak ditemukan" }, 404);
  
  if (loan.status !== "PENDING") {
    return c.json({ message: `Status peminjaman bukan PENDING (saat ini: ${loan.status})` }, 400);
  }
  
  // Update status only, no stock change
  loan.status = "DITOLAK";
  createNotification({
    userId: loan.peminjamId,
    title: "Peminjaman Ditolak",
    message: `Pengajuan peminjaman (${loan.id.slice(0, 8)}) ditolak.`,
    type: "error",
    actionUrl: "/loans",
  });
  
  logAudit("REJECT", "Loan", loan.id, me);
  return c.json({ data: loan });
});

app.post("/loans/:id/return", requireAuth(), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  
  const loan = loans.find((l) => l.id === id);
  if (!loan) return c.json({ message: "peminjaman tidak ditemukan" }, 404);
  
  const errors = validateReturn(body, loan);
  if (Object.keys(errors).length > 0) {
    return c.json({ message: "Validasi gagal", errors }, 400);
  }
  
  // Process returns
  for (const ri of body.items) {
    const invId = ri.invId.toString();
    const jumlahKembali = Number(ri.jumlahKembali);
    
    const loanItem = loan.items.find((x) => x.invId === invId)!;
    loanItem.kembali += jumlahKembali;
    
    const inv = getItemById(invId);
    if (inv) inv.stok += jumlahKembali;
  }
  
  loan.status = computeLoanStatus(loan);
  if (loan.status === "SELESAI") {
    loan.returnedAt = todayYMD();
    notifyByRoles(["admin", "operator"], {
      title: "Pengembalian Selesai",
      message: `${loan.peminjamNama} telah menyelesaikan pengembalian pinjaman.`,
      type: "success",
      actionUrl: "/returns",
    });
  }
  
  return c.json({ data: loan });
});

// =======================
// Routes: Reports
// =======================
app.get("/reports/summary", requireAuth(), requireRole(["admin"]), (c) => {
  const page = Math.max(1, Number(c.req.query("page") || "1"));
  const limit = Math.max(1, Math.min(100, Number(c.req.query("limit") || "20")));
  const allRows = getReportRows({
    from: c.req.query("from"),
    to: c.req.query("to"),
    status: c.req.query("status"),
    role: c.req.query("role"),
    item: c.req.query("item"),
    sortBy: c.req.query("sortBy"),
    sortDir: c.req.query("sortDir"),
  });

  const total = allRows.length;
  const pending = allRows.filter((l) => l.status === "PENDING").length;
  const ditolak = allRows.filter((l) => l.status === "DITOLAK").length;
  const dipinjam = allRows.filter((l) => l.status === "DIPINJAM").length;
  const sebagian = allRows.filter((l) => l.status === "SEBAGIAN").length;
  const selesai = allRows.filter((l) => l.status === "SELESAI").length;
  const totalItemLines = allRows.reduce((acc, l) => acc + l.itemCount, 0);
  const totalItemQty = allRows.reduce((acc, l) => acc + l.itemQty, 0);
  const completionRate = total > 0 ? (selesai / total) * 100 : 0;
  const activeRate = total > 0 ? ((dipinjam + sebagian) / total) * 100 : 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const pagedRows = allRows.slice(start, start + limit);

  return c.json({
    total,
    page: safePage,
    limit,
    totalPages,
    pending,
    ditolak,
    dipinjam,
    sebagian,
    selesai,
    kpi: {
      totalTransactions: total,
      totalItemLines,
      totalItemQty,
      completionRate: Number(completionRate.toFixed(2)),
      activeRate: Number(activeRate.toFixed(2)),
    },
    rows: pagedRows,
  });
});

app.get("/reports/loans", requireAuth(), requireRole(["admin"]), (c) => {
  const rows = getReportRows({
    from: c.req.query("from"),
    to: c.req.query("to"),
    status: c.req.query("status"),
    role: c.req.query("role"),
    item: c.req.query("item"),
    sortBy: c.req.query("sortBy"),
    sortDir: c.req.query("sortDir"),
  });
  return c.json({
    data: rows,
  });
});

app.get("/reports/export/pdf", requireAuth(), requireRole(["admin"]), (c) => {
  const rows = getReportRows({
    from: c.req.query("from"),
    to: c.req.query("to"),
    status: c.req.query("status"),
    role: c.req.query("role"),
    item: c.req.query("item"),
    sortBy: c.req.query("sortBy"),
    sortDir: c.req.query("sortDir"),
  });
  const lines = [
    "Laporan Peminjaman Inventaku",
    `Periode: ${c.req.query("from") || "-"} s/d ${c.req.query("to") || "-"}`,
    `Status: ${c.req.query("status") || "ALL"} | Role: ${c.req.query("role") || "ALL"} | Item: ${c.req.query("item") || "-"}`,
    `Total transaksi: ${rows.length}`,
    "--------------------------------------------",
    ...rows.map(
      (r) =>
        `${r.tanggal} | ${r.peminjam} | ${r.status} | qty ${r.itemQty} | ${r.createdBy} | ${(r.itemNames || []).join(", ")}`
    ),
  ];
  const pdfBytes = buildMinimalPdf(lines);
  const filename = `laporan-${c.req.query("from") || "all"}-${c.req.query("to") || "all"}.pdf`;
  c.header("Content-Type", "application/pdf");
  c.header("Content-Disposition", `attachment; filename="${filename}"`);
  return c.body(pdfBytes);
});

// =======================
// Routes: Categories
// =======================
app.get("/categories", requireAuth(), requireRole(["admin", "operator"]), (c) => {
  return c.json({ data: categories });
});

app.post("/categories", requireAuth(), requireRole(["admin", "operator"]), async (c) => {
  const me = c.get("user") as User;
  const body = await c.req.json().catch(() => ({}));
  const errors = validateCategory(body, false);
  
  if (Object.keys(errors).length > 0) {
    return c.json({ message: "Validasi gagal", errors }, 400);
  }
  
  const newCategory: Category = {
    id: crypto.randomUUID(),
    name: body.name.trim(),
    description: body.description?.toString().trim(),
  };
  
  categories.push(newCategory);
  logAudit("CREATE", "Category", newCategory.id, me, { name: newCategory.name });
  return c.json({ data: newCategory }, 201);
});

app.patch("/categories/:id", requireAuth(), requireRole(["admin", "operator"]), async (c) => {
  const me = c.get("user") as User;
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  
  const category = categories.find((x) => x.id === id);
  if (!category) return c.json({ message: "Kategori tidak ditemukan" }, 404);
  
  const errors = validateCategory(body, true);
  if (Object.keys(errors).length > 0) {
    return c.json({ message: "Validasi gagal", errors }, 400);
  }
  
  if (body.name) category.name = body.name.trim();
  if (body.description !== undefined) category.description = body.description?.toString().trim();
  
  logAudit("UPDATE", "Category", id, me, { name: category.name });
  return c.json({ data: category });
});

app.delete("/categories/:id", requireAuth(), requireRole(["admin", "operator"]), (c) => {
  const me = c.get("user") as User;
  const id = c.req.param("id");
  const idx = categories.findIndex((x) => x.id === id);
  
  if (idx === -1) return c.json({ message: "Kategori tidak ditemukan" }, 404);
  
  categories.splice(idx, 1);
  logAudit("DELETE", "Category", id, me);
  return c.json({ ok: true });
});

// =======================
// Routes: Locations
// =======================
app.get("/locations", requireAuth(), requireRole(["admin", "operator"]), (c) => {
  return c.json({ data: locations });
});

app.post("/locations", requireAuth(), requireRole(["admin", "operator"]), async (c) => {
  const me = c.get("user") as User;
  const body = await c.req.json().catch(() => ({}));
  const errors = validateLocation(body, false);
  
  if (Object.keys(errors).length > 0) {
    return c.json({ message: "Validasi gagal", errors }, 400);
  }
  
  const newLocation: Location = {
    id: crypto.randomUUID(),
    name: body.name.trim(),
    description: body.description?.toString().trim(),
  };
  
  locations.push(newLocation);
  logAudit("CREATE", "Location", newLocation.id, me, { name: newLocation.name });
  return c.json({ data: newLocation }, 201);
});

app.patch("/locations/:id", requireAuth(), requireRole(["admin", "operator"]), async (c) => {
  const me = c.get("user") as User;
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  
  const location = locations.find((x) => x.id === id);
  if (!location) return c.json({ message: "Lokasi tidak ditemukan" }, 404);
  
  const errors = validateLocation(body, true);
  if (Object.keys(errors).length > 0) {
    return c.json({ message: "Validasi gagal", errors }, 400);
  }
  
  if (body.name) location.name = body.name.trim();
  if (body.description !== undefined) location.description = body.description?.toString().trim();
  
  logAudit("UPDATE", "Location", id, me, { name: location.name });
  return c.json({ data: location });
});

app.delete("/locations/:id", requireAuth(), requireRole(["admin", "operator"]), (c) => {
  const me = c.get("user") as User;
  const id = c.req.param("id");
  const idx = locations.findIndex((x) => x.id === id);
  
  if (idx === -1) return c.json({ message: "Lokasi tidak ditemukan" }, 404);
  
  locations.splice(idx, 1);
  logAudit("DELETE", "Location", id, me);
  return c.json({ ok: true });
});

// =======================
// Routes: Units
// =======================
app.get("/units", requireAuth(), requireRole(["admin", "operator"]), (c) => {
  return c.json({ data: units });
});

app.post("/units", requireAuth(), requireRole(["admin", "operator"]), async (c) => {
  const me = c.get("user") as User;
  const body = await c.req.json().catch(() => ({}));
  const errors = validateUnit(body, false);
  
  if (Object.keys(errors).length > 0) {
    return c.json({ message: "Validasi gagal", errors }, 400);
  }
  
  const newUnit: Unit = {
    id: crypto.randomUUID(),
    name: body.name.trim(),
    abbreviation: body.abbreviation?.toString().trim(),
    description: body.description?.toString().trim(),
  };
  
  units.push(newUnit);
  logAudit("CREATE", "Unit", newUnit.id, me, { name: newUnit.name });
  return c.json({ data: newUnit }, 201);
});

app.patch("/units/:id", requireAuth(), requireRole(["admin", "operator"]), async (c) => {
  const me = c.get("user") as User;
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  
  const unit = units.find((x) => x.id === id);
  if (!unit) return c.json({ message: "Satuan tidak ditemukan" }, 404);
  
  const errors = validateUnit(body, true);
  if (Object.keys(errors).length > 0) {
    return c.json({ message: "Validasi gagal", errors }, 400);
  }
  
  if (body.name) unit.name = body.name.trim();
  if (body.abbreviation !== undefined) unit.abbreviation = body.abbreviation?.toString().trim();
  if (body.description !== undefined) unit.description = body.description?.toString().trim();
  
  logAudit("UPDATE", "Unit", id, me, { name: unit.name });
  return c.json({ data: unit });
});

app.delete("/units/:id", requireAuth(), requireRole(["admin", "operator"]), (c) => {
  const me = c.get("user") as User;
  const id = c.req.param("id");
  const idx = units.findIndex((x) => x.id === id);
  
  if (idx === -1) return c.json({ message: "Satuan tidak ditemukan" }, 404);
  
  units.splice(idx, 1);
  logAudit("DELETE", "Unit", id, me);
  return c.json({ ok: true });
});

// =======================
// Routes: Audit Logs
// =======================
app.get("/audit-logs", requireAuth(), requireRole(["admin", "operator"]), (c) => {
  const action = c.req.query("action");
  const entity = c.req.query("entity");
  const userId = c.req.query("userId");
  
  let rows = auditLogs.slice().reverse();
  
  if (action) rows = rows.filter((l) => l.action === action);
  if (entity) rows = rows.filter((l) => l.entity === entity);
  if (userId) rows = rows.filter((l) => l.userId === userId);
  
  return c.json({ data: rows });
});

// =======================
// Routes: Settings
// =======================
app.get("/settings", requireAuth(), requireRole(["admin"]), (c) => {
  return c.json({ data: systemSettings });
});

app.post("/settings", requireAuth(), requireRole(["admin"]), async (c) => {
  const me = c.get("user") as User;
  const body = await c.req.json().catch(() => ({}));
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return c.json({ message: "Payload tidak valid" }, 400);
  }
  Object.assign(systemSettings, body);
  logAudit("UPDATE_SETTINGS", "SystemSettings", "global", me, { keys: Object.keys(body) });
  return c.json({ data: systemSettings });
});

app.get("/settings/inventory", requireAuth(), requireRole(["admin", "operator"]), (c) => {
  const me = c.get("user") as User;
  return c.json({ data: inventorySettingsByUser.get(me.id) ?? {} });
});

app.post("/settings/inventory", requireAuth(), requireRole(["admin", "operator"]), async (c) => {
  const me = c.get("user") as User;
  const body = await c.req.json().catch(() => ({}));
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return c.json({ message: "Payload tidak valid" }, 400);
  }
  const current = inventorySettingsByUser.get(me.id) ?? {};
  const updated = { ...current, ...body };
  inventorySettingsByUser.set(me.id, updated);
  logAudit("UPDATE_SETTINGS", "InventorySettings", me.id, me, { keys: Object.keys(body) });
  return c.json({ data: updated });
});

// =======================
// Routes: Notifications
// =======================
app.get("/notifications", requireAuth(), (c) => {
  const me = c.get("user") as User;
  const limit = Math.max(1, Math.min(Number(c.req.query("limit") || "50"), 100));
  const rows = notifications
    .filter((n) => n.userId === me.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit)
    .map(toNotificationResponse);
  return c.json({ data: rows });
});

app.get("/notifications/:id", requireAuth(), (c) => {
  const me = c.get("user") as User;
  const id = c.req.param("id");
  const row = notifications.find((n) => n.id === id && n.userId === me.id);
  if (!row) return c.json({ message: "Notifikasi tidak ditemukan" }, 404);
  return c.json({ data: toNotificationResponse(row) });
});

app.post("/notifications/:id/read", requireAuth(), (c) => {
  const me = c.get("user") as User;
  const id = c.req.param("id");
  const row = notifications.find((n) => n.id === id && n.userId === me.id);
  if (!row) return c.json({ message: "Notifikasi tidak ditemukan" }, 404);
  if (!row.readAt) row.readAt = new Date().toISOString();
  return c.json({ data: toNotificationResponse(row) });
});

app.post("/notifications/read-all", requireAuth(), (c) => {
  const me = c.get("user") as User;
  const now = new Date().toISOString();
  let changed = 0;
  for (const n of notifications) {
    if (n.userId === me.id && !n.readAt) {
      n.readAt = now;
      changed += 1;
    }
  }
  return c.json({ ok: true, changed });
});

app.delete("/notifications/:id", requireAuth(), (c) => {
  const me = c.get("user") as User;
  const id = c.req.param("id");
  const idx = notifications.findIndex((n) => n.id === id && n.userId === me.id);
  if (idx === -1) return c.json({ message: "Notifikasi tidak ditemukan" }, 404);
  notifications.splice(idx, 1);
  return c.json({ ok: true });
});

app.delete("/notifications", requireAuth(), (c) => {
  const me = c.get("user") as User;
  let deleted = 0;
  for (let i = notifications.length - 1; i >= 0; i--) {
    const row = notifications[i];
    if (row && row.userId === me.id) {
      notifications.splice(i, 1);
      deleted += 1;
    }
  }
  return c.json({ ok: true, deleted });
});



// =======================
// Bun entry
// =======================
export default {
  port: 3000,
  fetch: app.fetch,
};
