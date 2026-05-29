import { getAvatarUrl, bustAvatarCache } from '../lib/avatarCache';

describe('avatarCache', () => {
  describe('getAvatarUrl', () => {
    it('should return empty string for null/undefined/empty input', () => {
      expect(getAvatarUrl(null)).toBe('');
      expect(getAvatarUrl(undefined)).toBe('');
      expect(getAvatarUrl('')).toBe('');
    });

    it('should return data URLs unchanged', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
      expect(getAvatarUrl(dataUrl)).toBe(dataUrl);
    });

    it('should add cache buster to simple URL without query params', () => {
      const url = 'https://example.com/avatar.jpg';
      const result = getAvatarUrl(url);
      expect(result).toContain('?_t=');
      expect(result).toContain(url);
    });

    it('should add cache buster to URL with existing query params using &', () => {
      const url = 'https://example.com/avatar.jpg?size=100';
      const result = getAvatarUrl(url);
      expect(result).toContain('&_t=');
      expect(result).toContain('size=100');
    });

    it('should generate timestamp-based cache buster', () => {
      const url = 'https://example.com/test.png';
      const beforeTime = Date.now();
      const result = getAvatarUrl(url);
      const afterTime = Date.now();

      const timestampMatch = result.match(/_t=(\d+)/);
      expect(timestampMatch).not.toBeNull();

      const timestamp = parseInt(timestampMatch![1]);
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should handle malformed URL gracefully', () => {
      const result = getAvatarUrl('not-a-valid-url');
      expect(typeof result).toBe('string');
    });
  });

  describe('bustAvatarCache', () => {
    it('should return empty string for null/undefined/empty input', () => {
      expect(bustAvatarCache(null)).toBe('');
      expect(bustAvatarCache(undefined)).toBe('');
      expect(bustAvatarCache('')).toBe('');
    });

    it('should add cache buster parameter to URL without query params', () => {
      const url = 'https://example.com/photo.jpg';
      const result = bustAvatarCache(url);
      expect(result).toContain('?_t=');
    });

    it('should append cache buster with & when URL has query params', () => {
      const url = 'https://example.com/photo.jpg?v=1';
      const result = bustAvatarCache(url);
      expect(result).toContain('&_t=');
      expect(result).toContain('v=1');
    });

    it('should generate unique timestamps on multiple calls', () => {
      const url = 'https://example.com/image.png';
      const result1 = bustAvatarCache(url);
      
      jest.useFakeTimers();
      jest.advanceTimersByTime(100);
      const result2 = bustAvatarCache(url);
      jest.useRealTimers();

      expect(result1).not.toBe(result2);
    });

    it('should preserve original URL structure', () => {
      const url = 'https://cdn.example.com/users/123/avatar.png?w=200&h=200';
      const result = bustAvatarCache(url);

      expect(result).toContain('https://cdn.example.com/users/123/avatar.png');
      expect(result).toContain('w=200');
      expect(result).toContain('h=200');
    });
  });
});
