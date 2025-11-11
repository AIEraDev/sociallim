# Posts Components

This directory contains the modern post selection and analysis interface components for the Comment Sentiment Analyzer application.

## Components Overview

### PostSelection (`post-selection.tsx`)

The main interface component that provides:

- **Sleek post listing** with grid and list view modes
- **Advanced filtering and search** capabilities
- **Batch operations** for selecting multiple posts
- **Real-time updates** using TanStack Query
- **Responsive design** that works on all devices

**Key Features:**

- Search posts by title or platform
- Sort by newest, oldest, or title
- Toggle between grid and list view modes
- Select individual posts or batch select all
- Analyze single posts or multiple posts at once
- Real-time post data fetching with background updates

### PostCard (`post-card.tsx`)

Interactive post cards with:

- **Platform-specific styling** with unique colors and icons for each social media platform
- **Hover effects** and smooth animations using Framer Motion
- **Selection state** with visual feedback
- **Quick actions** for analysis and external links
- **Responsive layout** that adapts to grid/list view modes

**Platform Support:**

- YouTube (red theme with Play icon)
- Instagram (purple gradient theme with Image icon)
- Twitter/X (blue theme with MessageCircle icon)
- TikTok (black/white theme with Play icon)

### AnalysisProgress (`analysis-progress.tsx`)

Beautiful progress tracking with:

- **Real-time progress indicators** with animated progress bars
- **Step-by-step analysis visualization** showing current processing stage
- **Animated loading states** with platform-specific styling
- **Dismissible notifications** for completed or failed analyses
- **Multi-job tracking** for concurrent analysis operations

**Analysis Steps Visualization:**

1. Fetching comments (MessageSquare icon)
2. Analyzing sentiment (Brain icon)
3. Extracting themes (Sparkles icon)
4. Generating summary (BarChart3 icon)

## Usage

### Basic Implementation

```tsx
import { PostSelection } from "@/components/posts";

function MyPage() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  return (
    <PostSelection
      selectedPlatform={Platform.YOUTUBE} // Optional filter
      onPostSelect={setSelectedPost}
      className="my-custom-class"
    />
  );
}
```

### With Platform Filtering

```tsx
import { PostSelection } from "@/components/posts";
import { Platform } from "@/types";

function PostsPage() {
  const [platform, setPlatform] = useState<Platform | undefined>();

  return (
    <div>
      {/* Platform selector */}
      <select onChange={(e) => setPlatform(e.target.value as Platform)}>
        <option value="">All Platforms</option>
        <option value={Platform.YOUTUBE}>YouTube</option>
        <option value={Platform.INSTAGRAM}>Instagram</option>
        {/* ... */}
      </select>

      {/* Post selection interface */}
      <PostSelection selectedPlatform={platform} onPostSelect={(post) => console.log("Selected:", post)} />
    </div>
  );
}
```

## Data Flow

### TanStack Query Integration

All components use TanStack Query for:

- **Efficient data fetching** with automatic caching
- **Background updates** to keep data fresh
- **Optimistic updates** for better UX
- **Error handling** with retry logic
- **Loading states** management

### Real-time Updates

- Posts are refetched when platforms are connected/disconnected
- Analysis progress is polled every 2 seconds during processing
- Background sync keeps data current even when window is not focused

### State Management

- Local component state for UI interactions (search, filters, selections)
- TanStack Query for server state (posts, analysis jobs, results)
- Framer Motion for animation states

## Styling and Theming

### Design System

- Uses shadcn/ui components for consistent styling
- Tailwind CSS for responsive design
- CSS variables for theme support (light/dark mode)
- Framer Motion for smooth animations and transitions

### Platform-Specific Styling

Each social media platform has its own visual identity:

- **Colors**: Unique brand colors for each platform
- **Icons**: Platform-appropriate icons (Play for video platforms, etc.)
- **Hover states**: Consistent interaction patterns
- **Loading states**: Platform-themed skeleton components

### Responsive Design

- **Mobile-first** approach with progressive enhancement
- **Grid layouts** that adapt to screen size
- **Touch-friendly** interactions on mobile devices
- **Accessible** keyboard navigation and screen reader support

## Performance Optimizations

### Efficient Rendering

- **Virtual scrolling** for large post lists (future enhancement)
- **Memoized components** to prevent unnecessary re-renders
- **Optimized animations** with hardware acceleration
- **Lazy loading** for post thumbnails and media

### Data Optimization

- **Query deduplication** prevents duplicate API calls
- **Background prefetching** for likely-needed data
- **Stale-while-revalidate** strategy for better perceived performance
- **Intelligent polling** that stops when not needed

## Accessibility

### Keyboard Navigation

- Full keyboard support for all interactive elements
- Logical tab order through the interface
- Escape key to close modals and clear selections

### Screen Reader Support

- Semantic HTML structure with proper ARIA labels
- Live regions for dynamic content updates
- Descriptive text for all interactive elements

### Visual Accessibility

- High contrast colors that meet WCAG guidelines
- Focus indicators for keyboard navigation
- Reduced motion support for users with vestibular disorders

## Testing

### Component Testing

```bash
# Run component tests
npm test -- --testPathPattern=posts

# Run with coverage
npm test -- --coverage --testPathPattern=posts
```

### Integration Testing

- Tests for post selection workflows
- Analysis progress tracking scenarios
- Platform filtering and search functionality

### Accessibility Testing

- Automated a11y testing with jest-axe
- Manual keyboard navigation testing
- Screen reader compatibility verification

## Future Enhancements

### Planned Features

- **Virtual scrolling** for handling thousands of posts
- **Advanced filters** (date ranges, engagement metrics)
- **Bulk export** functionality for selected posts
- **Drag and drop** for post reordering
- **Saved searches** and filter presets

### Performance Improvements

- **Image optimization** with Next.js Image component
- **Progressive loading** for better perceived performance
- **Service worker** for offline functionality
- **WebSocket integration** for real-time updates

## Dependencies

### Core Dependencies

- `@tanstack/react-query` - Server state management
- `framer-motion` - Animations and transitions
- `lucide-react` - Icon library
- `tailwindcss` - Styling framework

### Development Dependencies

- `@testing-library/react` - Component testing
- `jest` - Test runner
- `@types/react` - TypeScript definitions

## Contributing

When adding new features to the posts components:

1. **Follow the existing patterns** for consistency
2. **Add proper TypeScript types** for all props and state
3. **Include comprehensive tests** for new functionality
4. **Update this README** with any new features or changes
5. **Ensure accessibility** compliance for all new UI elements

## API Integration

### Required Backend Endpoints

- `GET /platforms/posts` - Fetch user posts
- `POST /analysis/start` - Start comment analysis
- `GET /analysis/:id/status` - Get analysis progress
- `GET /analysis/:id/results` - Get analysis results

### Error Handling

- Network errors are handled gracefully with retry logic
- User-friendly error messages for common scenarios
- Fallback UI states for when data is unavailable
