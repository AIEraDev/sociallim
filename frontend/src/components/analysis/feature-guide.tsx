/**
 * Feature Guide Component
 *
 * Comprehensive documentation and user guide for advanced export and comparison features
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Download, BarChart3, History, Share2, ChevronRight, ChevronDown, Play, CheckCircle2, ArrowRight, Lightbulb, Target, Zap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";

interface FeatureGuideProps {
  className?: string;
}

interface GuideSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  features: {
    title: string;
    description: string;
    steps: string[];
    tips?: string[];
  }[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "export",
    title: "Advanced Export Features",
    icon: Download,
    description: "Export your analysis results in multiple formats with customizable options",
    features: [
      {
        title: "Multiple Export Formats",
        description: "Choose from PDF reports, CSV data, JSON files, or social media images",
        steps: ["Click the Export button on any analysis dashboard", "Select your preferred format from the available options", "Configure export options (include raw data, etc.)", "Preview what will be included in your export", "Click Export to download your file"],
        tips: ["PDF reports are perfect for presentations and sharing with stakeholders", "CSV format is ideal for further analysis in Excel or other tools", "JSON format is great for developers and API integrations", "Image format creates beautiful infographics for social media"],
      },
      {
        title: "Shareable Links",
        description: "Generate secure links to share your analysis results with others",
        steps: ["Open the Export modal and switch to the Share tab", "Wait for the shareable link to be generated", "Copy the link using the copy button", "Share the link with anyone who needs access", "Recipients can view results without logging in"],
        tips: ["Shared links expire after 30 days for security", "Preview cards show how your analysis will appear when shared", "Links work on all devices and platforms"],
      },
    ],
  },
  {
    id: "comparison",
    title: "Multi-Analysis Comparison",
    icon: BarChart3,
    description: "Compare multiple analyses to identify trends and patterns",
    features: [
      {
        title: "Drag & Drop Selection",
        description: "Easily select and organize analyses for comparison",
        steps: ["Navigate to the Comparison Dashboard", "Use the dropdown to select analyses to compare", "Drag and drop to reorder your selected analyses", "Remove analyses by clicking the X button", "Click 'Run Comparison' when you have 2+ analyses selected"],
        tips: ["You can compare up to 6 analyses at once", "Drag to reorder analyses for better visual comparison", "Color coding helps distinguish between different analyses"],
      },
      {
        title: "Side-by-Side Charts",
        description: "Visual comparison of sentiment breakdowns and metrics",
        steps: ["Select your analyses for comparison", "View sentiment charts side by side", "Compare engagement scores and metrics", "Identify the best performing content", "Review detailed metrics in the comparison table"],
        tips: ["Look for patterns in sentiment across different content types", "Use engagement scores to identify your most successful posts", "Pay attention to confidence scores for data reliability"],
      },
      {
        title: "AI-Powered Insights",
        description: "Get intelligent recommendations based on your comparison data",
        steps: ["Complete a comparison with multiple analyses", "Review the AI-generated insights section", "Read personalized recommendations", "Identify trends and patterns in your content", "Apply insights to improve future content"],
        tips: ["Insights are based on sentiment patterns and engagement metrics", "Recommendations help optimize your content strategy", "Look for recurring themes in successful content"],
      },
    ],
  },
  {
    id: "history",
    title: "Analysis History & Search",
    icon: History,
    description: "Comprehensive history management with advanced search and filtering",
    features: [
      {
        title: "Timeline View",
        description: "Chronological organization of your analysis history",
        steps: ["Navigate to the Analysis History page", "Switch to Timeline view using the view toggle", "Browse analyses organized by date", "Use the date groupings to find specific periods", "Click on any analysis to view details"],
        tips: ["Timeline view is perfect for tracking progress over time", "Date groupings make it easy to find analyses from specific periods", "Sticky date headers help with navigation"],
      },
      {
        title: "Advanced Search & Filtering",
        description: "Powerful search and filtering capabilities",
        steps: ["Use the search bar to find analyses by title, themes, or content", "Apply platform filters to see analyses from specific social media", "Filter by sentiment to find positive, negative, or neutral analyses", "Use date range filters to narrow down time periods", "Combine multiple filters for precise results"],
        tips: ["Search works across titles, summaries, and theme names", "Combine filters to create very specific result sets", "Clear filters to return to the full history view"],
      },
      {
        title: "Batch Operations",
        description: "Select multiple analyses for bulk actions",
        steps: ["Use checkboxes to select individual analyses", "Use 'Select All' to choose all visible analyses", "Click 'Compare' to compare selected analyses", "Access bulk actions from the toolbar", "Manage large numbers of analyses efficiently"],
        tips: ["Batch operations save time when working with many analyses", "Selection persists across different view modes", "Use filters first to narrow down before bulk selection"],
      },
    ],
  },
];

export function FeatureGuide({ className }: FeatureGuideProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["export"]));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Feature Guide</h1>
              <p className="text-muted-foreground">Learn how to use advanced export and comparison features</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              New Features
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Advanced Tools
            </Badge>
          </div>
        </div>

        {/* Quick Start */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Download className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Export Results</h4>
                  <p className="text-sm text-muted-foreground">Export analysis in PDF, CSV, JSON, or image format</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Compare Analyses</h4>
                  <p className="text-sm text-muted-foreground">Select multiple analyses to identify trends</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <History className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Browse History</h4>
                  <p className="text-sm text-muted-foreground">Search and filter your analysis history</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Sections */}
        <div className="space-y-4">
          {GUIDE_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections.has(section.id);

            return (
              <Card key={section.id}>
                <CardHeader className="cursor-pointer" onClick={() => toggleSection(section.id)}>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{section.title}</h3>
                        <p className="text-sm text-muted-foreground font-normal">{section.description}</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </CardTitle>
                </CardHeader>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                      <CardContent className="pt-0">
                        <div className="space-y-6">
                          {section.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="space-y-4">
                              <div className="flex items-start gap-3">
                                <div className="p-1 bg-primary/10 rounded-full mt-1">
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium mb-1">{feature.title}</h4>
                                  <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>

                                  {/* Steps */}
                                  <div className="space-y-2 mb-4">
                                    <h5 className="text-sm font-medium">How to use:</h5>
                                    <ol className="space-y-2">
                                      {feature.steps.map((step, stepIndex) => (
                                        <li key={stepIndex} className="flex items-start gap-2 text-sm">
                                          <span className="flex items-center justify-center w-5 h-5 bg-primary/10 text-primary rounded-full text-xs font-medium mt-0.5 shrink-0">{stepIndex + 1}</span>
                                          <span>{step}</span>
                                        </li>
                                      ))}
                                    </ol>
                                  </div>

                                  {/* Tips */}
                                  {feature.tips && feature.tips.length > 0 && (
                                    <div className="bg-muted/50 rounded-lg p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Lightbulb className="h-4 w-4 text-yellow-600" />
                                        <span className="text-sm font-medium">Pro Tips:</span>
                                      </div>
                                      <ul className="space-y-1">
                                        {feature.tips.map((tip, tipIndex) => (
                                          <li key={tipIndex} className="flex items-start gap-2 text-sm">
                                            <ArrowRight className="h-3 w-3 text-muted-foreground mt-1 shrink-0" />
                                            <span className="text-muted-foreground">{tip}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {featureIndex < section.features.length - 1 && <div className="border-t border-muted" />}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <h3 className="font-medium">Need More Help?</h3>
              <p className="text-sm text-muted-foreground">These features are designed to help you get the most out of your sentiment analysis. Experiment with different combinations to discover insights about your audience.</p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Documentation
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
