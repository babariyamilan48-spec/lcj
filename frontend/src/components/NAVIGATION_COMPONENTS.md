# Navigation Components Documentation

This document describes the navigation components added to improve user experience across the application.

## Components Overview

### 1. BackButton Component
**File:** `BackButton.tsx`

A reusable back navigation button that appears on every page for easy navigation.

#### Features:
- Uses the browser's back history
- Customizable onClick handler
- Shows Gujarati label "પાછળ" (Back)
- Can hide label if needed
- Smooth hover animations
- Accessible with proper ARIA labels

#### Usage:
```tsx
import BackButton from '@/components/BackButton';

// Basic usage
<BackButton />

// Custom onClick handler
<BackButton onClick={() => router.push('/home')} />

// Hide label (icon only)
<BackButton showLabel={false} />

// Custom styling
<BackButton className="bg-white/10 hover:bg-white/20 text-white" />
```

#### Props:
- `onClick?: () => void` - Custom click handler (defaults to browser back)
- `className?: string` - Additional CSS classes
- `showLabel?: boolean` - Show/hide text label (default: true)

---

### 2. ScrollToTop Component
**File:** `ScrollToTop.tsx`

A floating button that appears when user scrolls down the page, allowing them to quickly return to the top.

#### Features:
- Appears only after scrolling 300px down
- Smooth scroll animation to top
- Fixed position at bottom-right
- Automatically hides when near top
- Accessible with proper ARIA labels
- Gujarati tooltip "ઉપર જાઓ" (Go to Top)

#### Usage:
```tsx
import ScrollToTop from '@/components/ScrollToTop';

// Add to root layout (already done in layout.tsx)
<ScrollToTop />

// Custom appearance threshold
<ScrollToTop showAfterScroll={500} />

// Custom styling
<ScrollToTop className="bottom-12 right-12" />
```

#### Props:
- `className?: string` - Additional CSS classes
- `showAfterScroll?: number` - Pixels to scroll before showing (default: 300)

---

## Pages with Navigation Components

### Profile Page (`/profile`)
- ✅ BackButton added at top
- ✅ ScrollToTop available globally
- Location: Below navbar, above profile header

### Test Results Page (`/test-result`)
- ✅ BackButton added at top
- ✅ ScrollToTop available globally
- Location: Below navbar, above results header

### Settings Page (`/settings`)
- ✅ BackButton added at top
- ✅ ScrollToTop available globally
- Location: Below navbar, above settings content

### Dashboard Page (`/dashboard`)
- ✅ BackButton added with custom styling (white theme)
- ✅ ScrollToTop available globally
- Location: Top of dashboard content

### Home Page (`/home`)
- ✅ ScrollToTop available globally
- BackButton: Handled by internal navigation

---

## Global Integration

### Root Layout (`layout.tsx`)
The `ScrollToTop` component is added to the root layout, making it available on every page automatically.

```tsx
<Providers>
  {children}
  <ScrollToTop />
</Providers>
```

---

## Styling

### BackButton Styling
- Default: Blue background with hover effect
- Colors: Blue-600 (bg), Blue-700 (hover)
- Padding: px-4 py-2
- Border radius: lg (8px)
- Font: Medium weight

### ScrollToTop Styling
- Position: Fixed bottom-8 right-8
- Background: Blue-600 with hover to Blue-700
- Size: 24px icon
- Shadow: lg with hover enhancement
- Z-index: 40

---

## Browser Compatibility

Both components use:
- Modern CSS (Tailwind CSS)
- React hooks (useState, useEffect)
- Lucide icons
- ES6+ JavaScript

Supported browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Accessibility

### BackButton
- ARIA label: "Go back"
- Keyboard accessible (Tab + Enter)
- Semantic button element
- Clear visual feedback on hover

### ScrollToTop
- ARIA label: "Scroll to top"
- Keyboard accessible (Tab + Enter)
- Title attribute with Gujarati text
- Semantic button element
- Only visible when needed

---

## Performance Considerations

### BackButton
- Lightweight component
- No external API calls
- Uses browser's native history API
- Minimal re-renders

### ScrollToTop
- Optimized scroll listener
- Cleanup on unmount
- Smooth scroll using native browser API
- No animation libraries needed

---

## Future Enhancements

Possible improvements:
1. Add breadcrumb navigation
2. Add page transition animations
3. Add keyboard shortcuts (e.g., Alt+Left for back)
4. Add progress indicator for long pages
5. Add "scroll to section" functionality
6. Add mobile-optimized navigation drawer

---

## Troubleshooting

### BackButton not working
- Ensure component is imported correctly
- Check if onClick handler is properly defined
- Verify browser history is available

### ScrollToTop not appearing
- Check if component is in layout.tsx
- Verify scroll threshold (showAfterScroll prop)
- Check z-index conflicts with other elements
- Ensure page has enough content to scroll

### Styling issues
- Check Tailwind CSS is properly configured
- Verify custom className doesn't conflict
- Check browser DevTools for CSS specificity issues

---

## Examples

### Example 1: Profile Page with Back Button
```tsx
<div className="min-h-screen bg-gray-50">
  <ModernNavbar />
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8">
    <div className="mb-6">
      <BackButton />
    </div>
    {/* Page content */}
  </div>
</div>
```

### Example 2: Custom Styled Back Button
```tsx
<BackButton 
  onClick={() => router.push('/home')}
  className="bg-green-50 hover:bg-green-100 text-green-600"
  showLabel={true}
/>
```

### Example 3: Dashboard with Themed Back Button
```tsx
<BackButton 
  className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
/>
```

---

## Version History

- **v1.0** (Current)
  - Initial implementation
  - BackButton component
  - ScrollToTop component
  - Integration with 4 main pages
  - Gujarati language support
