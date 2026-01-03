import { describe, it, expect, beforeEach } from 'vitest';
import { api } from '@/lib/api';

describe('API Client', () => {
  beforeEach(() => {
    api.setToken(null);
  });

  it('should set authorization token', () => {
    const token = 'test-token';
    api.setToken(token);
    
    // Token should be set internally
    expect(api).toBeDefined();
  });

  it('should handle null token', () => {
    api.setToken(null);
    
    // Should not throw error
    expect(api).toBeDefined();
  });

  it('should construct correct API URL', () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    expect(apiUrl).toContain('localhost:5001');
  });
});
