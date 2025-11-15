# EchoMind Frontend

A modern, responsive frontend application for the Comment Sentiment Analyzer built with Next.js 14, TypeScript, and cutting-edge UI technologies.

## 🚀 Tech Stack

### Core Framework

- **Next.js 14** - React framework with App Router for modern web development
- **TypeScript** - Type-safe JavaScript for better development experience
- **React 18** - Latest React with concurrent features

### State Management & Data Fetching

- **TanStack Query (React Query)** - Powerful data synchronization for React
- **Custom Hooks** - Reusable logic for authentication, platforms, and analysis

### UI & Styling

- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **shadcn/ui** - High-quality, accessible React components
- **Framer Motion** - Production-ready motion library for React
- **Lucide React** - Beautiful & consistent icon library

### Theme & Accessibility

- **next-themes** - Perfect dark mode support with system preference detection
- **CSS Custom Properties** - Dynamic theming with CSS variables
- **Responsive Design** - Mobile-first approach with Tailwind breakpoints

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── globals.css         # Global styles and CSS variables
│   │   ├── layout.tsx          # Root layout with providers
│   │   └── page.tsx            # Home page component
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── theme-provider.tsx  # Theme context provider
│   │   └── query-provider.tsx  # TanStack Query provider
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-auth.ts         # Authentication state management
│   │   └── use-platforms.ts    # Platform connections & posts
│   ├── lib/                    # Utility libraries
│   │   ├── api-client.ts       # Type-safe API client
│   │   ├── query-client.ts     # TanStack Query configuration
│   │   └── utils.ts            # Utility functions (shadcn/ui)
│   └── types/                  # TypeScript type definitions
│       └── index.ts            # Shared types matching backend
├── public/                     # Static assets
├── components.json             # shadcn/ui configuration
├── next.config.ts              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## 🎨 Design System

### Color Scheme

The application uses a sophisticated color system with CSS custom properties for seamless dark/light mode transitions:

- **Primary Colors**: Dynamic primary and accent colors
- **Semantic Colors**: Success, warning, error, and info states
- **Neutral Colors**: Comprehensive grayscale palette
- **Theme Support**: Automatic system preference detection

### Typography

- **Font Family**: Inter - Modern, readable sans-serif font
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- **Responsive Scaling**: Fluid typography that scales with screen size

### Animations

- **Framer Motion**: Smooth page transitions and micro-interactions
- **CSS Animations**: Custom keyframes for loading states and hover effects
- **Performance**: Hardware-accelerated animations with `transform` and `opacity`

## 🔧 Key Features

### Authentication System

- **JWT Token Management**: Secure token storage and automatic refresh
- **OAuth Integration**: Social media platform connections
- **Protected Routes**: Route-level authentication guards
- **User Profile**: Profile management with real-time updates

### Data Management

- **Optimistic Updates**: Immediate UI feedback with rollback on errors
- **Background Sync**: Automatic data synchronization
- **Caching Strategy**: Intelligent caching with stale-while-revalidate
- **Error Handling**: Comprehensive error boundaries and retry logic

### Real-time Features

- **Live Updates**: Real-time analysis progress tracking
- **WebSocket Support**: Ready for real-time notifications
- **Optimistic UI**: Instant feedback for user actions

### Accessibility

- **WCAG 2.1 AA**: Compliant with accessibility standards
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Focus Management**: Logical focus flow and visible focus indicators

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn package manager

### Installation

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Setup** Create a `.env.local` file:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5628/api
   ```

3. **Development Server**

   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

## 🎯 Component Architecture

### Provider Pattern

The application uses a layered provider pattern for clean separation of concerns:

```tsx
<ThemeProvider>
  {" "}
  // Theme management
  <QueryProvider>
    {" "}
    // Data fetching & caching
    <App /> // Application components
  </QueryProvider>
</ThemeProvider>
```

### Custom Hooks

Encapsulated business logic in reusable hooks:

- `useAuth()` - Authentication state and actions
- `usePlatforms()` - Platform connections management
- `usePosts()` - Posts fetching and caching
- `useAnalysis()` - Analysis operations and results

### Type Safety

Comprehensive TypeScript integration:

- **API Types**: Matching backend Prisma schema
- **Component Props**: Strict prop typing
- **Hook Returns**: Typed return values
- **Error Handling**: Typed error states

## 🔄 Data Flow

### Authentication Flow

1. User initiates login/register
2. API client handles request with error handling
3. TanStack Query manages loading states
4. Token stored securely in localStorage
5. All subsequent requests include auth header
6. Automatic token refresh before expiration

### Platform Connection Flow

1. User selects platform to connect
2. OAuth URL generated by backend
3. User redirected to platform OAuth
4. Callback handled by backend
5. Frontend updates connection status
6. Posts automatically fetched and cached

### Analysis Flow

1. User selects posts for analysis
2. Analysis job created with progress tracking
3. Real-time updates via polling/WebSocket
4. Results cached and displayed
5. Export and comparison features available

## 🎨 Styling Guidelines

### Tailwind CSS Classes

- Use semantic class names when possible
- Leverage CSS custom properties for theming
- Responsive design with mobile-first approach
- Consistent spacing using Tailwind's scale

### Component Styling

- shadcn/ui components for consistency
- Custom variants using `class-variance-authority`
- Framer Motion for animations
- CSS-in-JS for dynamic styles when needed

### Dark Mode

- Automatic system preference detection
- Manual toggle with persistence
- Smooth transitions between themes
- Consistent color contrast ratios

## 🧪 Testing Strategy

### Unit Testing

- Component testing with React Testing Library
- Hook testing with custom test utilities
- API client testing with MSW (Mock Service Worker)
- Type checking with TypeScript compiler

### Integration Testing

- End-to-end user flows
- API integration testing
- Authentication flow testing
- Platform connection testing

### Performance Testing

- Bundle size analysis
- Core Web Vitals monitoring
- Lighthouse audits
- Memory leak detection

## 📱 Responsive Design

### Breakpoints

- `sm`: 640px and up (tablets)
- `md`: 768px and up (small laptops)
- `lg`: 1024px and up (desktops)
- `xl`: 1280px and up (large screens)
- `2xl`: 1536px and up (extra large screens)

### Mobile-First Approach

- Base styles for mobile devices
- Progressive enhancement for larger screens
- Touch-friendly interface elements
- Optimized performance on mobile networks

## 🔒 Security Considerations

### Authentication Security

- JWT tokens with expiration
- Secure token storage
- CSRF protection
- XSS prevention with proper sanitization

### API Security

- Request/response validation
- Rate limiting on client side
- Error message sanitization
- Secure environment variable handling

## 🚀 Performance Optimizations

### Code Splitting

- Automatic route-based code splitting
- Dynamic imports for heavy components
- Lazy loading for non-critical features

### Caching Strategy

- TanStack Query for API response caching
- Next.js automatic static optimization
- Service worker for offline functionality
- CDN integration for static assets

### Bundle Optimization

- Tree shaking for unused code elimination
- Webpack bundle analyzer integration
- Optimized imports from libraries
- Minimal runtime overhead

## 🔮 Future Enhancements

### Planned Features

- **Real-time Notifications**: WebSocket integration for live updates
- **Advanced Visualizations**: Interactive charts with D3.js
- **Offline Support**: Service worker for offline functionality
- **PWA Features**: Install prompt and app-like experience
- **Internationalization**: Multi-language support with next-intl

### Technical Improvements

- **Micro-frontends**: Modular architecture for scalability
- **GraphQL Integration**: Type-safe API queries with generated types
- **Advanced Caching**: Redis integration for enhanced performance
- **Monitoring**: Error tracking and performance monitoring

## 📚 Documentation

### Code Documentation

- Comprehensive JSDoc comments
- Type definitions with descriptions
- Component prop documentation
- Hook usage examples

### Architecture Documentation

- System flow diagrams
- Component relationship maps
- Data flow documentation
- API integration guides

---

Built with ❤️ using modern web technologies for the best developer and user experience.
