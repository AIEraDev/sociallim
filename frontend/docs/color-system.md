# EchoMind Color System

This document outlines the unified color system for EchoMind, inspired by the beautiful auth page design and extended across the entire application.

## Design Philosophy

The color system is built around:

- **Dark gradient backgrounds** for immersive experiences
- **Purple-to-pink-to-cyan gradients** for brand consistency
- **Glass morphism effects** for modern, elegant UI
- **High contrast** for accessibility
- **Consistent theming** across light and dark modes

## Color Palette

### Primary Gradients

- **Purple**: `oklch(0.6 0.2 264)` (light) / `oklch(0.7 0.18 264)` (dark)
- **Pink**: `oklch(0.65 0.18 320)` (light) / `oklch(0.75 0.16 320)` (dark)
- **Cyan**: `oklch(0.7 0.15 200)` (light) / `oklch(0.8 0.13 200)` (dark)

### Background Gradients

- **Dark Hero**: `bg-gradient-dark` - Main dark gradient for hero sections
- **Light Surface**: `bg-gradient-surface` - Light gradient for content areas

## CSS Classes

### Background Gradients

```css
.bg-gradient-primary     /* Purple to pink */
/* Purple to pink */
.bg-gradient-secondary   /* Pink to cyan */
.bg-gradient-accent      /* Cyan to purple */
.bg-gradient-dark        /* Dark hero background */
.bg-gradient-surface; /* Light surface background */
```

### Text Gradients

```css
.text-gradient-primary   /* Purple to pink text */
/* Purple to pink text */
.text-gradient-secondary /* Pink to cyan text */
.text-gradient-accent; /* Cyan to purple text */
```

### Glass Morphism

```css
.glass                   /* Basic glass effect */
/* Basic glass effect */
.glass-card; /* Enhanced glass card */
```

### Button Styles

```css
.btn-gradient-primary/* Primary gradient button */;
```

## Components

### GradientButton

```tsx
import { GradientButton } from "@/components/ui/gradient-button";

<GradientButton variant="primary">Primary Action</GradientButton>
<GradientButton variant="secondary">Secondary Action</GradientButton>
<GradientButton variant="outline">Outline Button</GradientButton>
```

### GlassCard

```tsx
import { GlassCard } from "@/components/ui/glass-card";

<GlassCard variant="default" hover="lift">
  Content here
</GlassCard>

<GlassCard variant="card" hover="glow">
  Enhanced card content
</GlassCard>
```

## Usage Examples

### Hero Section

```tsx
<div className="min-h-screen bg-gradient-dark">
  <h1 className="text-white">
    Welcome to <span className="text-gradient-primary">EchoMind</span>
  </h1>
  <GradientButton variant="primary" size="lg">
    Get Started
  </GradientButton>
</div>
```

### Card Layout

```tsx
<GlassCard variant="card" hover="lift" className="p-6">
  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
    <Icon className="w-6 h-6 text-white" />
  </div>
  <h3 className="text-white font-semibold mb-2">Card Title</h3>
  <p className="text-gray-300">Card description</p>
</GlassCard>
```

### Navigation

```tsx
<nav className="glass-card border-white/10">
  <div className="flex items-center space-x-2">
    <div className="w-8 h-8 bg-gradient-primary rounded-lg">
      <Brain className="w-5 h-5 text-white" />
    </div>
    <span className="text-gradient-primary font-bold">EchoMind</span>
  </div>
</nav>
```

## Color Utility Functions

```tsx
import { getGradientClass, getTextGradientClass, getGlassClass } from "@/lib/colors";

// Get gradient background class
const bgClass = getGradientClass("primary"); // 'bg-gradient-primary'

// Get text gradient class
const textClass = getTextGradientClass("secondary"); // 'text-gradient-secondary'

// Get glass effect class
const glassClass = getGlassClass("card"); // 'glass-card'
```

## Accessibility

- All color combinations meet WCAG AA contrast requirements
- Glass effects maintain readability with sufficient backdrop blur
- Focus states use high-contrast ring colors
- Color is never the only way to convey information

## Dark/Light Mode

The system automatically adapts between light and dark modes:

- **Light mode**: Subtle gradients with high contrast text
- **Dark mode**: Rich, immersive gradients matching the auth page aesthetic

## Migration Guide

To update existing components:

1. Replace `bg-purple-500` with `bg-gradient-primary`
2. Replace `text-purple-600` with `text-gradient-primary`
3. Replace `bg-white/80` cards with `glass-card`
4. Use `GradientButton` instead of regular `Button` for primary actions
5. Wrap sections in `bg-gradient-dark` for hero areas

## Best Practices

1. **Consistency**: Use the predefined gradient classes instead of custom colors
2. **Hierarchy**: Primary gradients for main actions, secondary for supporting elements
3. **Glass Effects**: Use sparingly for key UI elements to maintain focus
4. **Contrast**: Always ensure sufficient contrast between text and backgrounds
5. **Performance**: Gradients and glass effects are optimized but use judiciously on mobile
