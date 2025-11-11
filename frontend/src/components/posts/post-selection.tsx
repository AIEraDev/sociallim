/**
 * Post Selection Interface
 * Provides sleek post listing with filtering, search, and batch operations
 */

import React, { useState, useMemo } from "react";
import { Search, Filter, Grid, List, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Post, Platform } from "@/types";
import { usePosts } from "@/hooks/use-platforms";
import { useAnalysis } from "@/hooks/use-analysis";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PostCardSkeleton } from "@/components/ui/loading";
import { PostCard } from "./post-card";
import { AnalysisProgress } from "./analysis-progress";
import { cn } from "@/lib/utils";

interface PostSelectionProps {
  selectedPlatform?: Platform;
  onPostSelect?: (post: Post) => void;
  className?: string;
}

type ViewMode = "grid" | "list";
type SortOption = "newest" | "oldest" | "title";

export function PostSelection({ selectedPlatform, onPostSelect, className }: PostSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Fetch posts with TanStack Query
  const { posts, isLoading, error, refetch } = usePosts(selectedPlatform);
  const { startAnalysis, isStarting } = useAnalysis();

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = posts.filter((post) => post.title.toLowerCase().includes(query) || post.platform.toLowerCase().includes(query));
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case "oldest":
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return sorted;
  }, [posts, searchQuery, sortBy]);

  // Handle post selection
  const handlePostToggle = (postId: string) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  };

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedPosts.size === filteredAndSortedPosts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(filteredAndSortedPosts.map((post) => post.id)));
    }
  };

  // Handle batch analysis
  const handleBatchAnalysis = () => {
    selectedPosts.forEach((postId) => {
      startAnalysis(postId);
    });
    setSelectedPosts(new Set());
  };

  // Handle single post analysis
  const handleSingleAnalysis = (post: Post) => {
    startAnalysis(post.id);
    onPostSelect?.(post);
  };

  if (error) {
    return (
      <Card className={cn("p-8 text-center", className)}>
        <CardContent>
          <p className="text-destructive mb-4">Failed to load posts: {error}</p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with search and controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search posts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center border rounded-md">
            <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="rounded-r-none">
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="rounded-l-none">
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters toggle */}
          <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="border rounded px-3 py-1 text-sm bg-background">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Title A-Z</option>
                  </select>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batch operations */}
      {selectedPosts.size > 0 && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedPosts.size} post{selectedPosts.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleBatchAnalysis} disabled={isStarting}>
              Analyze Selected
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedPosts(new Set())}>
              Clear Selection
            </Button>
          </div>
        </motion.div>
      )}

      {/* Posts grid/list */}
      {isLoading ? (
        <div className={cn("grid gap-4", viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
          {Array.from({ length: 6 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredAndSortedPosts.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent>
            <p className="text-muted-foreground">{searchQuery ? "No posts match your search." : "No posts found."}</p>
            {searchQuery && (
              <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="mt-2">
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Select all option */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredAndSortedPosts.length} post{filteredAndSortedPosts.length !== 1 ? "s" : ""}
            </p>
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              {selectedPosts.size === filteredAndSortedPosts.length ? "Select None" : "Select All"}
            </Button>
          </div>

          {/* Posts display */}
          <motion.div layout className={cn("grid gap-4", viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
            <AnimatePresence mode="popLayout">
              {filteredAndSortedPosts.map((post) => (
                <motion.div key={post.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                  <PostCard post={post} viewMode={viewMode} isSelected={selectedPosts.has(post.id)} onToggleSelect={() => handlePostToggle(post.id)} onAnalyze={() => handleSingleAnalysis(post)} isAnalyzing={isStarting} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </>
      )}

      {/* Analysis progress component */}
      <AnalysisProgress />
    </div>
  );
}
