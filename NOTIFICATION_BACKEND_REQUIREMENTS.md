// NOTIFICATION SYSTEM BACKEND REQUIREMENTS
// ==========================================
// This document outlines what needs to be implemented in your backend API

/**
 * NOTIFICATIONS ENDPOINTS
 * 
 * All endpoints should support these operations:
 */

// GET /notifications
// Description: List all notifications for the current user
// Query Parameters:
//   - limit: number (default: 50) - max notifications to return
//   - sort: string (default: "-created_at") - sort field, prefix with - for descending
//   - status: string (optional) - filter by "read" or "unread"
// Response:
// {
//   "data": [
//     {
//       "id": 1,
//       "title": "string",
//       "message": "string",
//       "type": "info|warning|success|error",
//       "created_at": "2024-01-26T10:30:00Z",
//       "read_at": null or "2024-01-26T10:35:00Z",
//       "action_url": "/items/123" (optional)
//     }
//   ]
// }

// GET /notifications/:id
// Description: Get a single notification
// Response: Same notification object

// POST /notifications/:id/read
// Description: Mark a notification as read
// Request: {} (empty body)
// Response: Updated notification object

// POST /notifications/read-all
// Description: Mark all notifications as read for current user
// Request: {} (empty body)
// Response: { "message": "All notifications marked as read" }

// DELETE /notifications/:id
// Description: Delete a specific notification
// Response: { "message": "Notification deleted" }

// DELETE /notifications
// Description: Delete all notifications for current user
// Response: { "message": "All notifications deleted" }

/**
 * NOTIFICATION OBJECT SCHEMA
 */
interface Notification {
  id: number | string;
  title: string;              // e.g., "Item Returned"
  message: string;            // e.g., "Item ABC-001 has been returned successfully"
  type: "info" | "warning" | "success" | "error";
  created_at: string;         // ISO 8601 datetime
  read_at: string | null;     // ISO 8601 datetime or null if unread
  action_url?: string;        // Optional: URL to navigate when clicked
  user_id?: number;           // Current user's ID
  data?: object;              // Optional: Additional metadata
}

/**
 * FALLBACK/MOCK DATA
 * 
 * While your backend is being developed, the system will use:
 * 1. Mock notifications (for first-time users)
 * 2. localStorage (to persist user state locally)
 * 3. Console warnings instead of errors for 404s
 * 
 * This allows development to continue without blocking API availability.
 */

/**
 * SUGGESTED IMPLEMENTATION TRIGGERS
 * 
 * You might want to send notifications when:
 * - Item is borrowed/returned
 * - Loan is about to expire
 * - System maintenance scheduled
 * - User permissions changed
 * - Audit log events
 * - Report generation completed
 * - Inventory alerts (low stock, damaged items)
 */

/**
 * INTEGRATION NOTES
 * 
 * - Notifications are automatically polled every 30 seconds
 * - All operations are optimistic (UI updates before API response)
 * - Failed API calls fall back to localStorage silently
 * - useNotifications() hook returns unreadCount for navbar badge
 * - NotificationBadge component shows "9+" for counts > 9
 */
