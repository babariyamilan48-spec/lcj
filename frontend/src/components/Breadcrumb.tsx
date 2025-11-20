'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
}

/**
 * Breadcrumb Component
 * Displays navigation breadcrumbs based on current path
 */
export default function Breadcrumb() {
  const pathname = usePathname();

  // Map paths to breadcrumb labels
  const pathMap: Record<string, string> = {
    '/home': 'Home',
    '/profile': 'Profile',
    '/test-result': 'Test Results',
    '/comprehensive-report': 'Report',
    '/history': 'History',
    '/settings': 'Settings',
    '/admin': 'Admin',
  };

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const parts = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: '/home' }
    ];

    let currentPath = '';
    for (const part of parts) {
      currentPath += `/${part}`;
      
      // Skip auth routes and dynamic routes
      if (part.startsWith('auth') || part.startsWith('[')) {
        continue;
      }

      const label = pathMap[currentPath] || part.charAt(0).toUpperCase() + part.slice(1);
      
      // Don't add duplicate home
      if (label !== 'Home') {
        breadcrumbs.push({ label, path: currentPath });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumb on auth pages
  if (pathname.includes('/auth/')) {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 px-4 py-2">
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.path}>
          {index > 0 && <ChevronRight size={16} className="text-gray-400" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-gray-900 font-medium">{item.label}</span>
          ) : (
            <Link
              href={item.path}
              className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
