/**
 * Utility functions for time formatting
 */

/**
 * Format a timestamp into a human-readable "time ago" string
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Human-readable time string (e.g., "just now", "5m ago", "2h ago", "3d ago", or a date string)
 */
export function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) {
    return 'just now';
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  
  // For older items, show the date
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Format a date for display with full timestamp
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}
