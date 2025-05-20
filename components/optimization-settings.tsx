"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export type OptimizationOptions = {
  detailLevel: "minimal" | "moderate" | "detailed"
  prioritySections: string[]
  preserveFormatting: boolean
  keywordDensity: "low" | "medium" | "high"
}

interface OptimizationSettingsProps {
  options: OptimizationOptions
  onChange: (options: OptimizationOptions) => void
}

// Add named export to fix deployment error
export function OptimizationSettings({ options, onChange }: OptimizationSettingsProps) {
  const handleSectionChange = (section: string) => {
    const currentSections = [...options.prioritySections]
    const index = currentSections.indexOf(section)

    if (index === -1) {
      // Add section if not already in array
      onChange({
        ...options,
        prioritySections: [...currentSections, section],
      })
    } else {
      // Remove section if already in array
      currentSections.splice(index, 1)
      onChange({
        ...options,
        prioritySections: currentSections,
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Optimization Settings</CardTitle>
        <CardDescription>Adjust settings to optimize your resume</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-medium">Detail Level</h3>
          <RadioGroup
            value={options.detailLevel}
            onValueChange={(value) =>
              onChange({ ...options, detailLevel: value as "minimal" | "moderate" | "detailed" })
            }
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="minimal" id="detail-minimal" />
              <Label htmlFor="detail-minimal">Minimal - Light adjustments to match keywords</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="moderate" id="detail-moderate" />
              <Label htmlFor="detail-moderate">Moderate - Balanced optimization (recommended)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="detailed" id="detail-detailed" />
              <Label htmlFor="detail-detailed">Detailed - Comprehensive enhancements</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium">Priority Sections</h3>
          <p className="text-sm text-muted-foreground">Select sections to prioritize during optimization</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="section-experience"
                checked={options.prioritySections.includes("experience")}
                onChange={() => handleSectionChange("experience")}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="section-experience">Experience</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="section-skills"
                checked={options.prioritySections.includes("skills")}
                onChange={() => handleSectionChange("skills")}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="section-skills">Skills</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="section-education"
                checked={options.prioritySections.includes("education")}
                onChange={() => handleSectionChange("education")}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="section-education">Education</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="section-summary"
                checked={options.prioritySections.includes("summary")}
                onChange={() => handleSectionChange("summary")}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="section-summary">Summary</Label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="preserve-formatting">Preserve Original Formatting</Label>
            <Switch
              id="preserve-formatting"
              checked={options.preserveFormatting}
              onCheckedChange={(checked) => onChange({ ...options, preserveFormatting: checked })}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Maintains original resume structure while making necessary improvements
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium">Keyword Density</h3>
          <Select
            value={options.keywordDensity}
            onValueChange={(value) => onChange({ ...options, keywordDensity: value as "low" | "medium" | "high" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select keyword density" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low - Subtle keyword integration</SelectItem>
              <SelectItem value="medium">Medium - Balanced approach (recommended)</SelectItem>
              <SelectItem value="high">High - Maximum keyword optimization</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

// Add default export as well for flexibility
export default OptimizationSettings
