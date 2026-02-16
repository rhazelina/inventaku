// lib/api.ts

const API_BASE = "http://localhost:3000";

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  ignore401?: boolean;
  ignoreStatuses?: number[];
  redirectOn401?: boolean;
}

async function request(path: string, opts: RequestOptions = {}) {
  const {
    ignore401 = false,
    ignoreStatuses = [],
    redirectOn401 = true,
    ...rest
  } = opts;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(rest.headers as any || {}),
  };

  // Auto stringify kalau body object (biar gak lupa JSON.stringify)
  let body = rest.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    body,
    headers,
    credentials: "include",
  } as RequestInit);

  // coba parse json, kalau gagal ambil text
  let data: any = null;
  const ct = res.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) data = await res.json();
    else data = await res.text();
  } catch {
    data = null;
  }

  if (!res.ok) {
    // ignore rules
    if (res.status === 401 && ignore401) return null;
    if (ignoreStatuses.includes(res.status)) return null;

    // optional global redirect
    if (res.status === 401 && redirectOn401) {
      window.location.assign("/login");
      return null;
    }

    const msg =
      (data && typeof data === "object" && typeof data.message === "string"
        ? data.message
        : null) || `Request failed (${res.status})`;

    const err = new Error(msg) as any;
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/* =========================
   AUTH
========================= */
export function apiLogin({ username, password }: any) {
  return request("/auth/login", {
    method: "POST",
    body: { username, password },
  });
}

export function apiMe() {
  return request("/auth/me", {
    method: "GET",
    ignore401: true,
  });
}

export function apiChangePassword({ oldPassword, newPassword }: any) {
  return request("/auth/change-password", {
    method: "POST",
    body: { oldPassword, newPassword },
  });
}

export function apiLogout() {
  return request("/auth/logout", { method: "POST" });
}

export function getHealth() {
  return request("/health", { method: "GET" });
}

/* =========================
   MASTER DATA
========================= */
export function getItems() {
  return request("/items", { method: "GET" });
}

export function getUsers() {
  return request("/users", { method: "GET" });
}

/* =========================
   USERS CRUD (ADMIN)
========================= */
export function apiUsersList() {
  return request("/users", { method: "GET" });
}

export function apiUsersCreate(payload: any) {
  return request("/users", { method: "POST", body: payload });
}

export function apiUsersUpdate(id: string | number, payload: any) {
  return request(`/users/${id}`, { method: "PATCH", body: payload });
}

export function apiUsersDelete(id: string | number) {
  return request(`/users/${id}`, { method: "DELETE" });
}

/* =========================
   LOANS (Peminjaman)
========================= */
export function getLoans(filter: any = {}) {
  const params = new URLSearchParams(filter).toString();
  return request(params ? `/loans?${params}` : "/loans", { method: "GET" });
}

export const LoansAPI = {
  inventory: () => request("/loans/inventory", { method: "GET" }),

  list: (filter: any = {}) => {
    const params = new URLSearchParams(filter).toString();
    return request(params ? `/loans?${params}` : "/loans", { method: "GET" });
  },

  create: (payload: any) => request("/loans", { method: "POST", body: payload }),

  approve: (id: string | number) => request(`/loans/${id}/approve`, { method: "POST" }),
  
  reject: (id: string | number) => request(`/loans/${id}/reject`, { method: "POST" }),

  ret: (id: string | number, payload: any) =>
    request(`/loans/${id}/return`, { method: "POST", body: payload }),
};

/* =========================
   REPORTS (Laporan)
========================= */
export const ReportsAPI = {
  summary: (q: any = {}) => {
    const params = new URLSearchParams({
      from: q.from || "",
      to: q.to || "",
      status: q.status || "ALL",
    }).toString();

    return request(`/reports/summary?${params}`, { method: "GET" });
  },

  loans: (q: any = {}) => {
    const params = new URLSearchParams({
      from: q.from || "",
      to: q.to || "",
      status: q.status || "ALL",
    }).toString();

    return request(`/reports/loans?${params}`, { method: "GET" });
  },
};

/* =========================
   INVENTORY
========================= */
export function getInventory() {
  return request("/inventory", { method: "GET" });
}

export function updateInventoryItem(invId: string | number, payload: any) {
  return request(`/inventory/${invId}`, { method: "PATCH", body: payload });
}

export function createInventoryItem(payload: any) {
  return request("/inventory", { method: "POST", body: payload });
}

export function deleteInventoryItem(invId: string | number) {
  return request(`/inventory/${invId}`, { method: "DELETE" });
}

/* =========================
   CATEGORIES
========================= */
export function getCategories() {
  return request("/categories", { method: "GET" });
}

export function createCategory(payload: any) {
  return request("/categories", { method: "POST", body: payload });
}

export function updateCategory(catId: string | number, payload: any) {
  return request(`/categories/${catId}`, { method: "PATCH", body: payload });
}

export function deleteCategory(catId: string | number) {
  return request(`/categories/${catId}`, { method: "DELETE" });
}

/* =========================
   SETTINGS
========================= */
export function getSettings() {
  return request("/settings", { method: "GET" });
}

export function updateSettings(payload: any) {
  return request("/settings", { method: "POST", body: payload });
}

export const apiSystemSettings = {
  get: getSettings,
  update: updateSettings
};

export const apiInventorySettings = {
  get: getSettings, // Assuming same endpoint for now or adjust if specialized
  update: updateSettings
};


// =========================
// ITEMS (match hono: /items)
// =========================
export const apiItems = {
  list: (params: any = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/items${qs ? `?${qs}` : ""}`, { method: "GET" });
  },
  get: (id: string | number) => request(`/items/${id}`, { method: "GET" }),
  create: (payload: any) => request(`/items`, { method: "POST", body: payload }),
  update: (id: string | number, payload: any) => request(`/items/${id}`, { method: "PATCH", body: payload }),
  remove: (id: string | number) => request(`/items/${id}`, { method: "DELETE" }),
};

// =========================
// CATEGORIES
// =========================
export const apiCategories = {
  list: () => request(`/categories`, { method: "GET" }),
  create: (payload: any) => request(`/categories`, { method: "POST", body: payload }),
  update: (id: string | number, payload: any) => request(`/categories/${id}`, { method: "PATCH", body: payload }),
  remove: (id: string | number) => request(`/categories/${id}`, { method: "DELETE" }),
};

// =========================
// LOCATIONS
// =========================
export const apiLocations = {
  list: () => request(`/locations`, { method: "GET" }),
  create: (payload: any) => request(`/locations`, { method: "POST", body: payload }),
  update: (id: string | number, payload: any) => request(`/locations/${id}`, { method: "PATCH", body: payload }),
  remove: (id: string | number) => request(`/locations/${id}`, { method: "DELETE" }),
};

// =========================
// UNITS
// =========================
export const apiUnits = {
  list: () => request(`/units`, { method: "GET" }),
  create: (payload: any) => request(`/units`, { method: "POST", body: payload }),
  update: (id: string | number, payload: any) => request(`/units/${id}`, { method: "PATCH", body: payload }),
  remove: (id: string | number) => request(`/units/${id}`, { method: "DELETE" }),
};

// =========================
// CLASSES (optional module)
// =========================
export const apiClasses = {
  list: () => request(`/api/classes`),
  create: (payload: any) =>
    request(`/api/classes`, { method: "POST", body: payload }),
  update: (id: string | number, payload: any) =>
    request(`/api/classes/${id}`, { method: "PUT", body: payload }),
  remove: (id: string | number) => request(`/api/classes/${id}`, { method: "DELETE" }),
};

// =========================
// ACCESS (users + roles)
// =========================
export const apiUsers = {
  list: () => request(`/users`, { method: "GET" }),
  create: (payload: any) => request(`/users`, { method: "POST", body: payload }),
  update: (id: string | number, payload: any) => request(`/users/${id}`, { method: "PATCH", body: payload }),
  remove: (id: string | number) => request(`/users/${id}`, { method: "DELETE" }),
};

// =========================
// AUDIT
// =========================
export const apiAudit = {
  list: (params: any = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/audit-logs${qs ? `?${qs}` : ""}`, { method: "GET" });
  },
};

// =========================
// NOTIFICATIONS
// =========================
export const apiNotifications = {
  list: (params: any = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/notifications${qs ? `?${qs}` : ""}`, { method: "GET" });
  },
  get: (id: string | number) => request(`/notifications/${id}`, { method: "GET" }),
  markAsRead: (id: string | number) => request(`/notifications/${id}/read`, { method: "POST" }),
  markAllAsRead: () => request(`/notifications/read-all`, { method: "POST" }),
  delete: (id: string | number) => request(`/notifications/${id}`, { method: "DELETE" }),
  deleteAll: () => request(`/notifications`, { method: "DELETE" }),
};
