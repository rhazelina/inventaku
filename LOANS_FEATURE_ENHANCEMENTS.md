# Loans/Peminjaman Feature Enhancements

## Overview
Enhanced the Loans (Peminjaman) feature with comprehensive functionality for managing inventory loans, returns, and reporting. This feature is primarily designed for Operators to manage daily loan and return operations.

## New Features Implemented

### 1. **Return Loan Management** ✅
**Purpose**: Track when borrowed items are returned and record their condition

**Features**:
- Modal interface for processing item returns
- Per-item quantity tracking (can return partial quantities)
- Condition status recording (Baik/Good, Rusak Ringan/Minor Damage, Rusak Berat/Major Damage, Hilang/Missing)
- Validates return quantities against borrowed amounts
- Integration with `LoansAPI.ret()` endpoint

**Code Components**:
- `returnItems` state: Array of items with return data
- `returnLoanId` state: Track which loan is being returned
- `openReturnModal()`: Display return form for a specific loan
- `closeReturnModal()`: Clean up modal state
- `returnLoan()`: Submit return data to API

**UI Elements**:
- "Kembalikan Barang" button on loans with DIPINJAM status
- Full-screen modal with item-by-item form
- Quantity input with max validation
- Condition dropdown with 4 states

---

### 2. **Advanced Filtering System** ✅
**Purpose**: Easily find and organize loans by status and borrower

**Features**:
- **Status Filter**: ALL, DIPINJAM (Active), SELESAI (Complete), SEBAGIAN (Partial)
- **Search**: Find loans by peminjam (borrower) name or loan ID
- **Toggle Panel**: Hide/show filters to save screen space
- **Reset Option**: Clear all filters with one click
- **Result Counter**: Shows "Menampilkan X dari Y peminjaman"

**Code Components**:
- `statusFilter` state: Track selected status
- `searchQuery` state: Track search input
- `showFilters` state: Toggle filter panel visibility
- `filteredLoans` memo: Efficiently computed filtered results

---

### 3. **Export to CSV** ✅
**Purpose**: Generate reportable data for external analysis

**Features**:
- Exports filtered loan data (not all data)
- Columns: ID, Peminjam, Tanggal, Status, Jumlah Barang
- Filename: `peminjaman-YYYY-MM-DD.csv`
- Works in all modern browsers

**Code**:
```javascript
exportToCSV() {
  // Creates CSV with headers
  // Maps filtered loans to rows
  // Downloads as blob
}
```

---

### 4. **Print Functionality** ✅
**Purpose**: Generate hard-copy reports with professional formatting

**Features**:
- Prints filtered loan data
- Formatted HTML table with styling
- Shows current date on report
- Uses browser's native print dialog
- Can save as PDF via print menu

**Code**:
```javascript
printLoans() {
  // Generates HTML table
  // Opens print dialog
  // User can save as PDF or print to paper
}
```

---

### 5. **Performance Optimization** ✅
**Purpose**: Ensure smooth UI even with large datasets

**Techniques Applied**:
- **useCallback**: All event handlers memoized to prevent unnecessary re-renders
  - `addToCart()` - Only recalculates when itemId/jumlah/items change
  - `removeFromCart()` - Pure function, no dependencies
  - `updateCartQty()` - Only recalculates when cart/items change
  - `submitLoan()` - Only recreates when peminjamId/cart/tanggal change
  - `returnLoan()` - Only recreates when return data changes
  - `exportToCSV()` - Only recreates when filteredLoans change
  - `printLoans()` - Only recreates when filteredLoans change

- **useMemo**: Expensive computations cached
  - `availableItems` - Filters items with stock > 0
  - `selectedItem` - Finds current item selection
  - `selectedUser` - Finds current borrower selection
  - `filteredLoans` - Applies all filters in one pass

---

## Component Architecture

### Main Component: `Peminjaman.jsx`

#### State Management (11 states)
```javascript
// Core data
const [items, setItems] = useState([])
const [users, setUsers] = useState([])
const [loans, setLoans] = useState([])

// Loan creation
const [peminjamId, setPeminjamId] = useState("")
const [itemId, setItemId] = useState("")
const [jumlah, setJumlah] = useState(1)
const [tanggal, setTanggal] = useState(today)
const [cart, setCart] = useState([])

// Return processing
const [returnLoanId, setReturnLoanId] = useState("")
const [returnItems, setReturnItems] = useState([])
const [showReturnModal, setShowReturnModal] = useState(false)

// Filtering
const [statusFilter, setStatusFilter] = useState("ALL")
const [searchQuery, setSearchQuery] = useState("")
const [showFilters, setShowFilters] = useState(false)

// UI state
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
const [success, setSuccess] = useState("")
```

#### Key Functions
1. **loadData()** - Parallel fetch of items, users, and loans
2. **addToCart()** - Validate and add item to loan cart
3. **removeFromCart()** - Remove item from cart
4. **updateCartQty()** - Adjust item quantity in cart
5. **calculateTotalItems()** - Sum all cart quantities
6. **submitLoan()** - POST loan to API
7. **returnLoan()** - POST return to API with conditions
8. **openReturnModal()** - Show return form for loan
9. **closeReturnModal()** - Hide return form
10. **exportToCSV()** - Generate CSV file
11. **printLoans()** - Generate printable HTML

---

## API Integration

### LoansAPI Endpoints Used
```javascript
LoansAPI.list() // GET /loans - Fetch all loans
LoansAPI.create(payload) // POST /loans - Create new loan
LoansAPI.ret(id, payload) // POST /loans/:id/return - Process return
```

### Required API Payload Formats

**Create Loan**:
```javascript
{
  peminjamId: "uuid",
  tanggal: "YYYY-MM-DD",
  items: [
    { invId: "uuid", jumlah: 2 },
    { invId: "uuid", jumlah: 1 }
  ]
}
```

**Return Loan**:
```javascript
{
  items: [
    { invId: "uuid", jumlahDikembalikan: 2, kondisi: "baik" },
    { invId: "uuid", jumlahDikembalikan: 1, kondisi: "rusak-ringan" }
  ]
}
```

---

## UI/UX Features

### Layout
- **Left Column (2/3 width)**: Form for creating loans
- **Right Column (1/3 width)**: Recent loan history with return actions

### Forms
1. **Peminjam Selection** - Dropdown filtered to employees only
2. **Item Addition** - Select item and quantity with add button
3. **Cart Display** - Shows added items with qty +/- buttons
4. **Submit Button** - Disabled until valid loan data exists

### History Section
- Shows up to 10 most recent loans
- Status badges: DIPINJAM (blue), SELESAI (green), SEBAGIAN (yellow)
- "Kembalikan Barang" button for active loans
- "Lihat Semua" link if > 10 loans exist

### Return Modal
- Per-item form with:
  - Current quantity borrowed display
  - Number input for return quantity
  - Condition dropdown with 4 options
  - Cancel/Submit buttons

### Filter Panel
- Collapsible filter section
- Status dropdown (4 options)
- Search text input
- Reset button
- Result counter

### Export/Print Buttons
- Download icon + "Export" button → CSV file
- Printer icon + "Print" button → HTML print dialog

---

## Operator Workflow

### Create Loan
1. Select borrower (employee) from dropdown
2. Confirm loan date (defaults to today)
3. Select item from dropdown
4. Enter quantity needed
5. Click "Tambah" to add to cart
6. Repeat steps 3-5 for multiple items
7. Click "Simpan Peminjaman" to submit
8. Success message shows confirmation

### Return Items
1. Find loan in "Riwayat Peminjaman" with DIPINJAM status
2. Click "Kembalikan Barang" button
3. Modal opens showing borrowed items
4. For each item:
   - Enter quantity being returned (≤ borrowed amount)
   - Select condition (Baik/Rusak Ringan/Rusak Berat/Hilang)
5. Click "Simpan Pengembalian"
6. Loan status updates (SELESAI if all returned, SEBAGIAN if partial)

### View & Filter Loans
1. Click "Filter" button to show filter panel
2. Select status: ALL, DIPINJAM, SELESAI, or SEBAGIAN
3. Type in search box to find by peminjam name or loan ID
4. Results update in real-time
5. Click "Reset Filter" to clear selections

### Export Data
1. Apply filters as needed
2. Click "Export" button
3. CSV file downloads with current date
4. Open in Excel/Sheets for analysis

### Print Report
1. Apply filters as needed
2. Click "Print" button
3. Print preview opens
4. Select printer or save as PDF
5. Print/save the report

---

## Technical Improvements Over Previous Version

| Aspect | Before | After |
|--------|--------|-------|
| **Return Handling** | None | Full return workflow with condition tracking |
| **Filtering** | None | Status + search with real-time updates |
| **Export** | None | CSV export of filtered data |
| **Reporting** | None | Print-friendly HTML reports |
| **Performance** | No memoization | useCallback on 10 functions, useMemo on 5 computed values |
| **Code Quality** | Mixed patterns | Consistent useCallback/useMemo usage |
| **User Feedback** | Basic alerts | Success/error messages with auto-dismiss |

---

## Error Handling

All async operations include try-catch with:
- User-friendly error messages
- Loading state management
- Auto-dismiss success messages (3 seconds)
- Error details logged to console

---

## Browser Compatibility

- **CSV Export**: Works in all modern browsers (IE11+)
- **Print Functionality**: Native browser print dialog
- **Modals**: No external libraries, pure CSS/React

---

## Future Enhancements

Possible additions for future versions:
1. Bulk return processing (multiple loans at once)
2. Loan history/audit trail
3. Item condition history tracking
4. Damage report attachment
5. SMS/Email notifications for due dates
6. Loan approval workflow
7. Item-specific damage reports
8. Inventory impact calculations

---

## File Locations

- **Main Component**: [/src/pages/Peminjaman.jsx](src/pages/Peminjaman.jsx)
- **API Layer**: [/src/lib/api.js](src/lib/api.js) - `LoansAPI` object
- **Auth Integration**: [/src/auth/AuthProvider.jsx](src/auth/AuthProvider.jsx) - `useAuth` hook
- **Notifications**: [/src/hooks/useNotifications.js](src/hooks/useNotifications.js) - `useNotifications` hook

---

## Testing Checklist

- [ ] Create loan with single item
- [ ] Create loan with multiple items
- [ ] Verify stock availability check
- [ ] Add duplicate item to cart (should increase qty)
- [ ] Remove item from cart
- [ ] Adjust cart quantities up/down
- [ ] Submit loan successfully
- [ ] Return full quantity (SELESAI status)
- [ ] Return partial quantity (SEBAGIAN status)
- [ ] Filter by status
- [ ] Search by peminjam name
- [ ] Search by loan ID
- [ ] Export CSV file
- [ ] Print report
- [ ] Verify error handling for invalid inputs
- [ ] Check responsive design on mobile
- [ ] Verify loading states during API calls

---

## Dependencies

- **React**: 18+
- **Lucide Icons**: For UI icons (RotateCw, Download, Printer, Filter, etc.)
- **API Backend**: Requires `/loans`, `/loans/:id/return`, `/items`, `/users` endpoints
- **Auth Context**: Requires `useAuth()` hook from AuthProvider

---

Generated: 2024
Enhanced Loans Feature for Operator Workflow
