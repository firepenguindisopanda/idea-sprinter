import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTimeAgo, formatTimestamp } from '@/lib/time-utils';

describe('Time Utils', () => {
  // Mock a fixed "now" time for deterministic tests
  const MOCK_NOW = new Date('2024-02-04T12:00:00Z').getTime();

  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(MOCK_NOW);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTimeAgo', () => {
    describe('seconds (< 60s)', () => {
      it('should return "just now" for timestamp 0 seconds ago', () => {
        expect(getTimeAgo(MOCK_NOW)).toBe('just now');
      });

      it('should return "just now" for timestamp 1 second ago', () => {
        expect(getTimeAgo(MOCK_NOW - 1000)).toBe('just now');
      });

      it('should return "just now" for timestamp 30 seconds ago', () => {
        expect(getTimeAgo(MOCK_NOW - 30000)).toBe('just now');
      });

      it('should return "just now" for timestamp 59 seconds ago', () => {
        expect(getTimeAgo(MOCK_NOW - 59000)).toBe('just now');
      });
    });

    describe('minutes (1-59m)', () => {
      it('should return "1m ago" for timestamp exactly 1 minute ago', () => {
        expect(getTimeAgo(MOCK_NOW - 60000)).toBe('1m ago');
      });

      it('should return "1m ago" for timestamp 1.5 minutes ago', () => {
        expect(getTimeAgo(MOCK_NOW - 90000)).toBe('1m ago');
      });

      it('should return "5m ago" for timestamp 5 minutes ago', () => {
        expect(getTimeAgo(MOCK_NOW - 5 * 60000)).toBe('5m ago');
      });

      it('should return "30m ago" for timestamp 30 minutes ago', () => {
        expect(getTimeAgo(MOCK_NOW - 30 * 60000)).toBe('30m ago');
      });

      it('should return "59m ago" for timestamp 59 minutes ago', () => {
        expect(getTimeAgo(MOCK_NOW - 59 * 60000)).toBe('59m ago');
      });
    });

    describe('hours (1-23h)', () => {
      it('should return "1h ago" for timestamp exactly 1 hour ago', () => {
        expect(getTimeAgo(MOCK_NOW - 60 * 60000)).toBe('1h ago');
      });

      it('should return "1h ago" for timestamp 1.5 hours ago', () => {
        expect(getTimeAgo(MOCK_NOW - 90 * 60000)).toBe('1h ago');
      });

      it('should return "3h ago" for timestamp 3 hours ago', () => {
        expect(getTimeAgo(MOCK_NOW - 3 * 60 * 60000)).toBe('3h ago');
      });

      it('should return "12h ago" for timestamp 12 hours ago', () => {
        expect(getTimeAgo(MOCK_NOW - 12 * 60 * 60000)).toBe('12h ago');
      });

      it('should return "23h ago" for timestamp 23 hours ago', () => {
        expect(getTimeAgo(MOCK_NOW - 23 * 60 * 60000)).toBe('23h ago');
      });
    });

    describe('days (1-6d)', () => {
      it('should return "1d ago" for timestamp exactly 24 hours ago', () => {
        expect(getTimeAgo(MOCK_NOW - 24 * 60 * 60000)).toBe('1d ago');
      });

      it('should return "1d ago" for timestamp 36 hours ago', () => {
        expect(getTimeAgo(MOCK_NOW - 36 * 60 * 60000)).toBe('1d ago');
      });

      it('should return "2d ago" for timestamp 2 days ago', () => {
        expect(getTimeAgo(MOCK_NOW - 2 * 24 * 60 * 60000)).toBe('2d ago');
      });

      it('should return "5d ago" for timestamp 5 days ago', () => {
        expect(getTimeAgo(MOCK_NOW - 5 * 24 * 60 * 60000)).toBe('5d ago');
      });

      it('should return "6d ago" for timestamp 6 days ago', () => {
        expect(getTimeAgo(MOCK_NOW - 6 * 24 * 60 * 60000)).toBe('6d ago');
      });
    });

    describe('weeks+ (>= 7d)', () => {
      it('should return a date string for timestamp exactly 7 days ago', () => {
        const timestamp = MOCK_NOW - 7 * 24 * 60 * 60000;
        const result = getTimeAgo(timestamp);
        
        // Should not match the "Xd ago" pattern
        expect(result).not.toMatch(/^\d+d ago$/);
        
        // Should be a valid date string
        const expectedDate = new Date(timestamp).toLocaleDateString();
        expect(result).toBe(expectedDate);
      });

      it('should return a date string for timestamp 2 weeks ago', () => {
        const timestamp = MOCK_NOW - 14 * 24 * 60 * 60000;
        const result = getTimeAgo(timestamp);
        
        expect(result).not.toMatch(/^\d+d ago$/);
        const expectedDate = new Date(timestamp).toLocaleDateString();
        expect(result).toBe(expectedDate);
      });

      it('should return a date string for timestamp 1 month ago', () => {
        const timestamp = MOCK_NOW - 30 * 24 * 60 * 60000;
        const result = getTimeAgo(timestamp);
        
        const expectedDate = new Date(timestamp).toLocaleDateString();
        expect(result).toBe(expectedDate);
      });

      it('should return a date string for timestamp 1 year ago', () => {
        const timestamp = MOCK_NOW - 365 * 24 * 60 * 60000;
        const result = getTimeAgo(timestamp);
        
        const expectedDate = new Date(timestamp).toLocaleDateString();
        expect(result).toBe(expectedDate);
      });
    });

    describe('edge cases', () => {
      it('should handle timestamp equal to current time', () => {
        expect(getTimeAgo(MOCK_NOW)).toBe('just now');
      });

      it('should handle future timestamps (negative difference)', () => {
        // Future timestamp - this might happen due to clock skew
        // The function treats this as "just now" since seconds would be negative
        const futureTimestamp = MOCK_NOW + 60000;
        // Math.floor of negative number goes further negative
        // -60 < 60, so it returns 'just now'
        expect(getTimeAgo(futureTimestamp)).toBe('just now');
      });

      it('should handle boundary: 59 seconds vs 60 seconds', () => {
        expect(getTimeAgo(MOCK_NOW - 59000)).toBe('just now');
        expect(getTimeAgo(MOCK_NOW - 60000)).toBe('1m ago');
      });

      it('should handle boundary: 59 minutes vs 60 minutes', () => {
        expect(getTimeAgo(MOCK_NOW - 59 * 60000)).toBe('59m ago');
        expect(getTimeAgo(MOCK_NOW - 60 * 60000)).toBe('1h ago');
      });

      it('should handle boundary: 23 hours vs 24 hours', () => {
        expect(getTimeAgo(MOCK_NOW - 23 * 60 * 60000)).toBe('23h ago');
        expect(getTimeAgo(MOCK_NOW - 24 * 60 * 60000)).toBe('1d ago');
      });

      it('should handle boundary: 6 days vs 7 days', () => {
        expect(getTimeAgo(MOCK_NOW - 6 * 24 * 60 * 60000)).toBe('6d ago');
        
        const sevenDaysAgo = MOCK_NOW - 7 * 24 * 60 * 60000;
        const result = getTimeAgo(sevenDaysAgo);
        expect(result).not.toMatch(/d ago$/);
      });

      it('should handle very old timestamps', () => {
        // Unix epoch
        const veryOldTimestamp = 0;
        const result = getTimeAgo(veryOldTimestamp);
        
        // Should return a formatted date
        const expectedDate = new Date(veryOldTimestamp).toLocaleDateString();
        expect(result).toBe(expectedDate);
      });
    });
  });

  describe('formatTimestamp', () => {
    it('should return a localized string representation of the timestamp', () => {
      const timestamp = MOCK_NOW;
      const result = formatTimestamp(timestamp);
      
      // Should be a valid date/time string
      const expectedString = new Date(timestamp).toLocaleString();
      expect(result).toBe(expectedString);
    });

    it('should handle Unix epoch', () => {
      const result = formatTimestamp(0);
      const expectedString = new Date(0).toLocaleString();
      expect(result).toBe(expectedString);
    });

    it('should handle current timestamp', () => {
      const result = formatTimestamp(MOCK_NOW);
      expect(result).toContain('2024');
    });
  });
});
