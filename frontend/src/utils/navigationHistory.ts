/**
 * Navigation History Service
 * Tracks navigation history to provide proper back navigation
 * instead of relying solely on browser history
 */

type NavigationEntry = {
  path: string;
  timestamp: number;
  title?: string;
};

class NavigationHistoryService {
  private history: NavigationEntry[] = [];
  private maxHistorySize = 50;
  private listeners: Set<(history: NavigationEntry[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Push a new navigation entry
   */
  push(path: string, title?: string): void {
    // Don't add duplicate consecutive entries
    const lastEntry = this.history[this.history.length - 1];
    if (lastEntry && lastEntry.path === path) {
      return;
    }

    this.history.push({
      path,
      timestamp: Date.now(),
      title,
    });

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Get the previous navigation entry
   */
  getPrevious(): NavigationEntry | null {
    if (this.history.length < 2) {
      return null;
    }
    return this.history[this.history.length - 2];
  }

  /**
   * Get the current navigation entry
   */
  getCurrent(): NavigationEntry | null {
    if (this.history.length === 0) {
      return null;
    }
    return this.history[this.history.length - 1];
  }

  /**
   * Pop the current entry and return the previous one
   */
  pop(): NavigationEntry | null {
    if (this.history.length > 0) {
      this.history.pop();
      this.saveToStorage();
      this.notifyListeners();
    }
    return this.getPrevious();
  }

  /**
   * Get full history
   */
  getHistory(): NavigationEntry[] {
    return [...this.history];
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Check if we can go back
   */
  canGoBack(): boolean {
    return this.history.length > 1;
  }

  /**
   * Get the path to navigate back to
   * Returns the previous path or a default fallback
   */
  getBackPath(fallback: string = '/home'): string {
    const previous = this.getPrevious();
    return previous?.path || fallback;
  }

  /**
   * Subscribe to history changes
   */
  subscribe(listener: (history: NavigationEntry[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getHistory()));
  }

  /**
   * Save history to localStorage
   */
  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lcj-nav-history', JSON.stringify(this.history));
      } catch (error) {
        console.error('Failed to save navigation history:', error);
      }
    }
  }

  /**
   * Load history from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lcj-nav-history');
        if (stored) {
          this.history = JSON.parse(stored);
        }
      } catch (error) {
        console.error('Failed to load navigation history:', error);
        this.history = [];
      }
    }
  }
}

// Singleton instance
export const navigationHistory = new NavigationHistoryService();
