/**
 * Enhanced Export Modal Component
 *
 * Elegant modal for exporting analysis results with format selection,
 * preview options, download progress tracking, and shareable links
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, Table, CheckCircle2, AlertCircle, Loader2, Share2, Copy, Eye, Image, BarChart3 } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { AnalysisResult } from "@/types";
import { useExport, useShareableLink } from "@/hooks/use-export";
import { cn } from "@/lib/utils";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: AnalysisResult;
}

type ExportFormat = "pdf" | "csv" | "json" | "image";
// type ExportStatus = "idle" | "loading" | "success" | "error";

const EXPORT_FORMATS = [
  {
    id: "pdf" as ExportFormat,
    name: "PDF Report",
    description: "Complete analysis report with charts and summaries",
    icon: FileText,
    features: ["Executive summary", "Sentiment breakdown charts", "Theme and keyword analysis", "Visual emotion indicators", "Professional formatting"],
    preview: "A comprehensive 5-10 page report with visual charts, detailed analysis, and actionable insights.",
    size: "~2-5 MB",
  },
  {
    id: "csv" as ExportFormat,
    name: "CSV Data",
    description: "Raw data for further analysis and processing",
    icon: Table,
    features: ["Comment-level sentiment scores", "Theme classifications", "Keyword frequencies", "Emotion percentages", "Spreadsheet compatible"],
    preview: "Structured data file with all analysis results in tabular format for Excel or data analysis tools.",
    size: "~100-500 KB",
  },
  {
    id: "json" as ExportFormat,
    name: "JSON Data",
    description: "Machine-readable format for developers and APIs",
    icon: BarChart3,
    features: ["Complete analysis object", "Nested data structures", "API-compatible format", "Developer-friendly", "Programmatic access"],
    preview: "Full analysis data in JSON format, perfect for integration with other tools and applications.",
    size: "~50-200 KB",
  },
  {
    id: "image" as ExportFormat,
    name: "Summary Image",
    description: "Visual summary perfect for social media sharing",
    icon: Image,
    features: ["Key metrics visualization", "Branded design", "Social media optimized", "High resolution", "Instant sharing"],
    preview: "A beautiful infographic summarizing your analysis results, ready to share on social platforms.",
    size: "~500 KB - 1 MB",
  },
];

export function ExportModal({ isOpen, onClose, analysisResult }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");
  const [includeRawData, setIncludeRawData] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<"export" | "share">("export");

  const { exportAnalysis, isExporting, exportError, exportSuccess } = useExport();
  const { shareData, isLoading: isLoadingShare, copyToClipboard } = useShareableLink(analysisResult.id);

  const handleExport = () => {
    exportAnalysis({
      analysisId: analysisResult.id,
      format: selectedFormat,
      includeRawData,
    });
  };

  const handleClose = () => {
    setShowPreview(false);
    setActiveTab("export");
    onClose();
  };

  const selectedFormatConfig = EXPORT_FORMATS.find((f) => f.id === selectedFormat);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {activeTab === "export" ? <Download className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            {activeTab === "export" ? "Export Analysis Results" : "Share Analysis"}
          </DialogTitle>
          <DialogDescription>{activeTab === "export" ? "Choose your preferred format and options for exporting the analysis data." : "Generate shareable links and preview cards for your analysis results."}</DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <button onClick={() => setActiveTab("export")} className={cn("flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all", activeTab === "export" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <Download className="h-4 w-4 mr-2 inline" />
            Export
          </button>
          <button onClick={() => setActiveTab("share")} className={cn("flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all", activeTab === "share" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <Share2 className="h-4 w-4 mr-2 inline" />
            Share
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "export" ? (
            <motion.div key="export" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              {/* Format Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Export Format</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
                    <Eye className="h-4 w-4 mr-2" />
                    {showPreview ? "Hide" : "Show"} Preview
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {EXPORT_FORMATS.map((format) => {
                    const Icon = format.icon;
                    const isSelected = selectedFormat === format.id;

                    return (
                      <motion.div key={format.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Card className={cn("cursor-pointer transition-all duration-200", isSelected ? "ring-2 ring-primary border-primary" : "hover:border-muted-foreground/50")} onClick={() => setSelectedFormat(format.id)}>
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <div className={cn("p-2 rounded-lg", isSelected ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-medium">{format.name}</h4>
                                  <span className="text-xs text-muted-foreground">{format.size}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{format.description}</p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  {format.features.slice(0, 3).map((feature, index) => (
                                    <li key={index} className="flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Options */}
              {(selectedFormat === "csv" || selectedFormat === "json") && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Export Options</h3>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="includeRawData" checked={includeRawData} onChange={(e) => setIncludeRawData(e.target.checked)} className="rounded border-gray-300" />
                    <label htmlFor="includeRawData" className="text-sm">
                      Include raw comment data
                    </label>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Includes original comment text and metadata</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}

              {/* Preview */}
              <AnimatePresence>
                {showPreview && selectedFormatConfig && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
                    <h3 className="text-sm font-medium">Preview & Details</h3>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                      <p className="text-sm text-muted-foreground">{selectedFormatConfig.preview}</p>
                      <div>
                        <h4 className="text-sm font-medium mb-2">What&apos;s Included:</h4>
                        <ul className="text-sm space-y-2">
                          {selectedFormatConfig.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status Messages */}
              <AnimatePresence>
                {exportSuccess && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-800 dark:text-green-200">Export completed successfully! Download should start automatically.</p>
                  </motion.div>
                )}

                {exportError && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-800 dark:text-red-200">{exportError}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div key="share" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              {/* Shareable Link */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Shareable Link</h3>
                <Card>
                  <CardContent className="pt-4">
                    {isLoadingShare ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Generating link...</span>
                      </div>
                    ) : shareData ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input type="text" value={shareData.url} readOnly className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted" />
                          <Button size="sm" onClick={copyToClipboard}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Anyone with this link can view your analysis results</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Failed to generate shareable link</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Preview Card */}
              {shareData && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Preview Card</h3>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="border rounded-lg p-4 bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <BarChart3 className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{shareData.previewCard.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{shareData.previewCard.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{analysisResult.totalComments} comments analyzed</span>
                              <span>{new Date(analysisResult.analyzedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">This is how your analysis will appear when shared on social media</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {activeTab === "export" ? (
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {selectedFormatConfig?.name}
                </>
              )}
            </Button>
          ) : (
            <Button onClick={copyToClipboard} disabled={!shareData}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
