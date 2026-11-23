/**
 * Utility for formatting chat message timestamps, last seen statuses,
 * and conversation list timestamps reliably across all devices.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Returns formatted 12-hour time e.g. "10:35 PM" or "9:05 AM"
 * Handles Date objects, ISO strings, timestamps (numbers), or null.
 */
export function formatMessageTime(input) {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return '';

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour is 12 AM
  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Returns a clean, human-readable Last Seen status string:
 * - If online: "Online"
 * - If within 1 minute: "Last seen just now"
 * - If within 1 hour: "Last seen 12m ago"
 * - If today: "Last seen today at 10:35 PM"
 * - If yesterday: "Last seen yesterday at 4:15 PM"
 * - If older: "Last seen 21 Nov at 3:30 PM"
 * - If no time available: "Offline"
 */
export function formatLastSeen(isOnline, lastOnline, fallbackTimestamp) {
  if (isOnline) return 'Online';

  const raw = lastOnline || fallbackTimestamp;
  if (!raw) return 'Offline';

  const date = raw instanceof Date ? raw : new Date(raw);
  if (isNaN(date.getTime())) return 'Offline';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'Online'; // Clock skew compensation

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Last seen just now';
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;

  const timeStr = formatMessageTime(date);
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return `Last seen today at ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Last seen yesterday at ${timeStr}`;
  }

  const isThisYear = date.getFullYear() === now.getFullYear();
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  if (isThisYear) {
    return `Last seen ${day} ${month} at ${timeStr}`;
  }
  return `Last seen ${day} ${month} ${date.getFullYear()} at ${timeStr}`;
}

/**
 * Returns conversation list timestamp (WhatsApp style):
 * - If today: "10:35 PM"
 * - If yesterday: "Yesterday"
 * - If within 7 days: "Mon", "Tue", etc.
 * - If older: "21 Nov"
 */
export function formatConversationTime(input) {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return formatMessageTime(date);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays >= 0 && diffDays < 7) {
    return DAYS[date.getDay()];
  }

  const isThisYear = date.getFullYear() === now.getFullYear();
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  return isThisYear ? `${day} ${month}` : `${day} ${month} ${date.getFullYear()}`;
}

/**
 * Returns date divider text for grouping chat bubbles by day:
 * - "Today"
 * - "Yesterday"
 * - "21 Nov" or "21 Nov 2025"
 */
export function formatMessageDateDivider(input) {
  if (!input) return 'Today';
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return 'Today';

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return 'Today';
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  const isThisYear = date.getFullYear() === now.getFullYear();
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  return isThisYear ? `${day} ${month}` : `${day} ${month} ${date.getFullYear()}`;
}
