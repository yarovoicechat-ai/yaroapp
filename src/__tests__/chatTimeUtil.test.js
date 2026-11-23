import {
  formatMessageTime,
  formatLastSeen,
  formatConversationTime,
  formatMessageDateDivider,
} from '../utils/chatTimeUtil';

describe('Chat Time Utility Tests', () => {
  describe('formatMessageTime', () => {
    it('returns empty string for null or invalid dates', () => {
      expect(formatMessageTime(null)).toBe('');
      expect(formatMessageTime(undefined)).toBe('');
      expect(formatMessageTime('invalid-date-string')).toBe('');
    });

    it('formats morning times as AM correctly', () => {
      const d = new Date(2026, 10, 23, 9, 5, 0); // 9:05 AM
      expect(formatMessageTime(d)).toBe('9:05 AM');
    });

    it('formats midnight as 12:xx AM', () => {
      const d = new Date(2026, 10, 23, 0, 15, 0); // 12:15 AM
      expect(formatMessageTime(d)).toBe('12:15 AM');
    });

    it('formats noon as 12:xx PM', () => {
      const d = new Date(2026, 10, 23, 12, 0, 0); // 12:00 PM
      expect(formatMessageTime(d)).toBe('12:00 PM');
    });

    it('formats evening times as PM correctly', () => {
      const d = new Date(2026, 10, 23, 22, 35, 0); // 10:35 PM
      expect(formatMessageTime(d)).toBe('10:35 PM');
    });
  });

  describe('formatLastSeen', () => {
    it('returns "Online" when isOnline is true', () => {
      expect(formatLastSeen(true, new Date().toISOString())).toBe('Online');
      expect(formatLastSeen(true, null)).toBe('Online');
    });

    it('returns "Offline" when no timestamp is provided', () => {
      expect(formatLastSeen(false, null, null)).toBe('Offline');
      expect(formatLastSeen(false, undefined, undefined)).toBe('Offline');
      expect(formatLastSeen(false, '', '')).toBe('Offline');
    });

    it('returns "Last seen just now" when lastOnline is within 1 minute', () => {
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      expect(formatLastSeen(false, thirtySecondsAgo)).toBe('Last seen just now');
    });

    it('returns minutes ago when within 1 hour', () => {
      const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);
      expect(formatLastSeen(false, twentyMinsAgo)).toBe('Last seen 20m ago');
    });

    it('returns "Last seen today at ..." when earlier today', () => {
      const now = new Date();
      // Set to 3 hours ago today
      const earlierToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 30, 0);
      if (now.getHours() >= 7) {
        expect(formatLastSeen(false, earlierToday)).toContain('Last seen today at 6:30 AM');
      }
    });

    it('returns "Last seen yesterday at ..." when yesterday', () => {
      const now = new Date();
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 16, 45, 0);
      expect(formatLastSeen(false, yesterday)).toContain('Last seen yesterday at 4:45 PM');
    });

    it('returns "Last seen DD MMM at ..." when multiple days ago', () => {
      const pastDate = new Date(2026, 4, 15, 14, 20, 0); // 15 May 2026 2:20 PM
      const formatted = formatLastSeen(false, pastDate);
      expect(formatted).toContain('Last seen 15 May');
      expect(formatted).toContain('2:20 PM');
    });
  });

  describe('formatConversationTime', () => {
    it('formats today message as time (e.g. 10:35 PM)', () => {
      const now = new Date();
      const todayMsg = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 35, 0);
      expect(formatConversationTime(todayMsg)).toBe('10:35 PM');
    });

    it('formats yesterday message as "Yesterday"', () => {
      const now = new Date();
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 0, 0);
      expect(formatConversationTime(yesterday)).toBe('Yesterday');
    });

    it('returns empty for invalid/null input', () => {
      expect(formatConversationTime(null)).toBe('');
      expect(formatConversationTime('')).toBe('');
    });
  });

  describe('formatMessageDateDivider', () => {
    it('returns "Today" for today date', () => {
      expect(formatMessageDateDivider(new Date())).toBe('Today');
    });

    it('returns "Yesterday" for yesterday date', () => {
      const now = new Date();
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      expect(formatMessageDateDivider(yesterday)).toBe('Yesterday');
    });

    it('returns day and month for older dates', () => {
      const past = new Date(2026, 4, 10);
      expect(formatMessageDateDivider(past)).toBe('10 May');
    });
  });
});
