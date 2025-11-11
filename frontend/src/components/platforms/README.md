# Platform Components

This directory contains all platform connection-related components for social media integration.

## Components

### PlatformCard

- Individual platform connection card (YouTube, Instagram, Twitter, TikTok)
- Interactive connection/disconnection functionality
- Real-time status updates
- Platform-specific styling and icons
- Connection details and timestamps
- Error handling with user feedback

### PlatformDashboard

- Overview dashboard for all platform connections
- Connection status summary with progress indicators
- Real-time updates using TanStack Query
- Quick actions for connected platforms
- Refresh functionality
- Responsive grid layout

## Features

- **OAuth Integration**: Secure OAuth flows for each social media platform
- **Real-time Updates**: Live connection status updates using TanStack Query
- **Visual Feedback**: Loading states, success/error indicators, and animations
- **Platform-specific Styling**: Each platform has unique colors and branding
- **Error Handling**: Comprehensive error states with retry mechanisms
- **Responsive Design**: Adaptive layouts for all screen sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Platform Support

- **YouTube**: Video comments and engagement metrics
- **Instagram**: Post comments and story reactions
- **Twitter/X**: Tweet replies and mentions
- **TikTok**: Video comments and creator insights

## Usage

```tsx
import { PlatformCard, PlatformDashboard } from "@/components/platforms";

// Individual platform card
<PlatformCard platform={Platform.YOUTUBE} />

// Full dashboard
<PlatformDashboard />
```

## Connection Flow

1. User clicks "Connect" on a platform card
2. OAuth flow initiates with platform-specific authentication
3. User authorizes the application on the platform
4. Tokens are securely stored and encrypted
5. Connection status updates in real-time
6. User can disconnect or manage connections
