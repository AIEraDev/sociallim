# EchoMind Color System Migration Guide

This guide helps you migrate existing components to use the new unified color system.

## Quick Reference

### Before → After

```tsx
// OLD: Inline gradients
className = "bg-gradient-to-r from-purple-500 to-pink-500";
// NEW: Utility class
className = "bg-gradient-primary";

// OLD: Inline text gradients
className = "bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent";
// NEW: Utility class
className = "text-gradient-primary";

// OLD: Manual glass effect
className = "bg-white/10 backdrop-blur-xl border-white/20";
// NEW: Utility class
className = "glass-card border-white/20";

// OLD: Custom button styles
className = "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600";
// NEW: Utility class
className = "btn-gradient-primary";
```

## Component Updates

### 1. Hero Sections

```tsx
// Before
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">

// After
<div className="min-h-screen bg-gradient-dark">
```

### 2. Navigation

```tsx
// Before
<nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b">

// After
<nav className="glass-card border-b border-white/10">
```

### 3. Cards

```tsx
// Before
<Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200">

// After
<Card className="glass-card border-white/20">
```

### 4. Buttons

```tsx
// Before
<Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">

// After - Option 1: Use utility class
<Button className="btn-gradient-primary">

// After - Option 2: Use component
<GradientButton variant="primary">
```

### 5. Brand Elements

```tsx
// Before
<div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
  <Brain className="w-7 h-7 text-white" />
</div>
<h1 className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
  EchoMind
</h1>

// After
<div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
  <Brain className="w-7 h-7 text-white" />
</div>
<h1 className="text-gradient-primary">EchoMind</h1>
```

## Using Theme Utilities

For more complex components, use the theme utilities:

```tsx
import { getThemedClasses, theme } from "@/lib/theme-utils";

// Hero section
<div className={getThemedClasses.hero()}>

// Navigation
<nav className={getThemedClasses.nav()}>

// Cards
<Card className={getThemedClasses.card('glass')}>

// Logo
<div className={getThemedClasses.logo('lg')}>
```

## Component-Specific Migrations

### Dashboard Cards

```tsx
// Before
<Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-700">
  <CardContent className="p-6">
    <div className="w-12 h-12 bg-linear-to-r from-purple-500 to-pink-500 rounded-lg">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-slate-900 dark:text-white">Title</h3>
    <p className="text-slate-600 dark:text-slate-400">Description</p>
  </CardContent>
</Card>

// After
<Card className="glass-card border-white/20">
  <CardContent className="p-6">
    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-white">Title</h3>
    <p className="text-gray-300">Description</p>
  </CardContent>
</Card>
```

### Feature Cards

```tsx
// Before
<Card className="glass border-border/50 hover:border-border transition-all duration-300">
  <CardContent className="p-6">
    <div className="w-12 h-12 bg-linear-to-r from-purple-500 to-pink-500 rounded-lg">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-xl font-semibold">Title</h3>
    <p className="text-muted-foreground">Description</p>
  </CardContent>
</Card>

// After
<Card className="glass-card border-white/20 hover:border-white/30 hover:-translate-y-1 transition-all duration-300">
  <CardContent className="p-6">
    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-xl font-semibold text-white">Title</h3>
    <p className="text-gray-300">Description</p>
  </CardContent>
</Card>
```

## Automated Migration Script

You can use this regex find/replace to speed up migration:

### Find/Replace Patterns

1. **Background Gradients**

   - Find: `bg-gradient-to-r from-purple-500 to-pink-500`
   - Replace: `bg-gradient-primary`

2. **Text Gradients**

   - Find: `bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent`
   - Replace: `text-gradient-primary`

3. **Glass Effects**

   - Find: `bg-white/10 backdrop-blur-xl border-white/20`
   - Replace: `glass-card border-white/20`

4. **Dark Text Colors**

   - Find: `text-slate-900 dark:text-white`
   - Replace: `text-white`

5. **Muted Text Colors**
   - Find: `text-slate-600 dark:text-slate-400`
   - Replace: `text-gray-300`

## Testing Checklist

After migration, verify:

- [ ] All gradients display consistently
- [ ] Glass effects work in both light/dark mode
- [ ] Text contrast meets accessibility standards
- [ ] Hover states work properly
- [ ] Mobile responsiveness is maintained
- [ ] No broken layouts or missing styles

## Common Issues

### Issue: Gradients not showing

**Solution**: Ensure you're using the correct class names and that globals.css is imported

### Issue: Glass effects too subtle

**Solution**: Use `glass-card` instead of `glass` for stronger effects

### Issue: Text not readable

**Solution**: Use `text-white` for primary text and `text-gray-300` for secondary text on dark backgrounds

### Issue: Buttons not styled

**Solution**: Replace `Button` with `GradientButton` or add `btn-gradient-primary` class
