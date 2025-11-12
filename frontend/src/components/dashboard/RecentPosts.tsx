import { Plus, Download, Eye, MessageSquare, Heart, Clock } from "lucide-react";
import Image from "next/image";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { PostCardSkeleton } from "../ui/loading";

import { usePlatformStore } from "@/stores/platformStore";
import { usePlatformPosts } from "@/hooks/use-platforms";
import { Platform, Post } from "@/types";
import { formatDate, formatNumber } from "@/helpers/utils";
import { TikTokIcon } from "../Icons";

export default function RecentPosts() {
  const { setIsConnectModalOpen } = usePlatformStore();
  const { selectedPlatform } = usePlatformStore();
  const { isLoading, postsData, error } = usePlatformPosts((selectedPlatform as Platform) || "tiktok");

  if (isLoading) {
    return (
      <div className="flex-1">
        <Card className="glass-card border-white/20 px-0">
          <CardHeader className="pb-0">
            <CardTitle className="text-white text-lg">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!postsData || postsData.posts.length === 0) {
    return (
      <div className="flex-1">
        <Card className="glass-card border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-linear-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <Plus className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-white font-medium mb-2">No Posts Yet</h3>
              <p className="text-gray-400 text-sm mb-4">Connect your social accounts to start analyzing comments</p>
              <div className="space-y-2">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setIsConnectModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Connect Social Account
                </Button>
                <Button size="sm" variant="outline" className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10">
                  <Download className="w-4 h-4 mr-2" />
                  Import Post URL
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <Card className="glass-card border-white/20 px-0">
        <CardHeader className="pb-0">
          <CardTitle className="text-white text-lg">Recent Posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {postsData?.posts.map((post: Post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

const getPlatformIcon = (platform: Platform) => {
  // You can replace these with actual platform icons
  const icons = {
    TIKTOK: TikTokIcon,
    YOUTUBE: "📺",
    INSTAGRAM: "📷",
    TWITTER: "🐦",
  };
  return icons[platform] || "📱";
};

function PostItem({ post }: { post: Post }) {
  const Icon = getPlatformIcon(post.platform) as React.ElementType;

  return (
    <div key={post.id} className="group p-4 rounded-xl border cursor-pointer transition-all duration-300 border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-black/20" onClick={() => window.open(post.url, "_blank")}>
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="relative shrink-0">
          {post.thumbnailUrl ? (
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              width={64}
              height={64}
              className="w-16 h-16 rounded-lg object-cover border border-white/10"
              unoptimized={true} // For external URLs from social platforms
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-linear-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-2xl">
              <Icon />
            </div>
          )}
          {/* Platform badge overlay */}
          <div className="absolute -top-2 -left-2 px-1.5 py-0.5 text-xs font-medium">
            <Icon />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="text-white text-sm font-semibold line-clamp-2 mb-2 group-hover:text-blue-300 transition-colors">{post.title}</h4>

          {/* Description */}
          {post.description && <p className="text-gray-400 text-xs line-clamp-2 mb-3">{post.description}</p>}

          {/* Stats Row */}
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
            {post.viewCount !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{formatNumber(post.viewCount)}</span>
              </div>
            )}
            {post.likeCount !== undefined && (
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{formatNumber(post.likeCount)}</span>
              </div>
            )}
            {post.hasComments && (
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                <span>{post.commentsCount ? formatNumber(post.commentsCount) : "Comments"}</span>
              </div>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-3 text-xs hover:bg-blue-500/20 hover:text-blue-300 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            // Handle analysis action
          }}
        >
          <Eye className="w-3 h-3 mr-1.5" />
          Analyze
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-3 text-xs hover:bg-green-500/20 hover:text-green-300 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            // Handle live monitoring action
          }}
        >
          <MessageSquare className="w-3 h-3 mr-1.5" />
          Monitor
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-3 text-xs hover:bg-purple-500/20 hover:text-purple-300 transition-colors ml-auto"
          onClick={(e) => {
            e.stopPropagation();
            // Handle export action
          }}
        >
          <Download className="w-3 h-3 mr-1.5" />
          Export
        </Button>
      </div>
    </div>
  );
}
