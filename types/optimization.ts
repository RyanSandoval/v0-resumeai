export interface OptimizationSettings {
  detailLevel: "concise" | "balanced" | "comprehensive"
  prioritySections: string[]
  keywordDensity: "low" | "medium" | "high"
  preserveFormatting?: boolean
}
