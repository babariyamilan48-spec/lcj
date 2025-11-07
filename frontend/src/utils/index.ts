import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Calculate test progress percentage
 */
export function calculateProgress(current: number, total: number): number {
  return Math.round((current / total) * 100);
}

/**
 * Get test category color
 */
export function getTestCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    personality: 'from-blue-500 to-blue-600',
    intelligence: 'from-green-500 to-green-600',
    career: 'from-purple-500 to-purple-600',
    skills: 'from-orange-500 to-orange-600',
    interests: 'from-pink-500 to-pink-600',
    values: 'from-indigo-500 to-indigo-600',
    default: 'from-gray-500 to-gray-600',
  };
  
  return colors[category.toLowerCase()] || colors.default;
}
