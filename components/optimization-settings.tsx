"use client"

import { Sliders } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import type { OptimizationOptions } from "@/components/resume-optimizer"

interface OptimizationSettingsProps {
  options: OptimizationOptions
  onChange: (options: OptimizationOptions) => void
}

export function OptimizationSettings({ options, onChange }: OptimizationSettingsProps) {
  const updateOptions = (key: keyof OptimizationOptions, value: any) => {
    onChange({
      ...options,
      [key]: value,
    })
  }

  const toggleSection = (section: string) => {
    const currentSections = options.prioritySections
    if (currentSections.includes(section)) {
      updateOptions(
        "prioritySections",
        currentSections.filter((s) => s !== section),
      )
    } else {
      updateOptions("prioritySections", [...currentSections, section])
    }
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="settings">
        <AccordionTrigger className="flex items-center gap-2">
          <Sliders className="h-4 w-4" />
          <span>Optimization Settings</span>
        </AccordionTrigger>
        <AccordionContent className="space-y-6 pt-4">
          <div className="space-y-3">
            <h3 className="font-medium">Detail Level</h3>
            <RadioGroup value={options.detailLevel} onValueChange={(value) => updateOptions("detailLevel", value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="minimal" id="detail-minimal" />
                <Label htmlFor="detail-minimal">Minimal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="moderate" id="detail-moderate" />
                <Label htmlFor="detail-moderate">Moderate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="detail-detailed" />
                <Label htmlFor="detail-detailed">Detailed</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-medium">Priority Sections</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="section-experience"
                  checked={options.prioritySections.includes("experience")}
                  onCheckedChange={() => toggleSection("experience")}
                />
                <Label htmlFor="section-experience">Experience</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="section-skills"
                  checked={options.prioritySections.includes("skills")}
                  onCheckedChange={() => toggleSection("skills")}
                />
                <Label htmlFor="section-skills">Skills</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="section-education"
                  checked={options.prioritySections.includes("education")}
                  onCheckedChange={() => toggleSection("education")}
                />
                <Label htmlFor="section-education">Education</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="section-summary"
                  checked={options.prioritySections.includes("summary")}
                  onCheckedChange={() => toggleSection("summary")}
                />
                <Label htmlFor="section-summary">Summary</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="section-projects"
                  checked={options.prioritySections.includes("projects")}
                  onCheckedChange={() => toggleSection("projects")}
                />
                <Label htmlFor="section-projects">Projects</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="section-certifications"
                  checked={options.prioritySections.includes("certifications")}
                  onCheckedChange={() => toggleSection("certifications")}
                />
                <Label htmlFor="section-certifications">Certifications</Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-medium">Keyword Density</h3>
            <RadioGroup
              value={options.keywordDensity}
              onValueChange={(value) => updateOptions("keywordDensity", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="density-low" />
                <Label htmlFor="density-low">Low (subtle integration)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="density-medium" />
                <Label htmlFor="density-medium">Medium (balanced approach)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="density-high" />
                <Label htmlFor="density-high">High (maximize keyword matches)</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="preserve-formatting"
              checked={options.preserveFormatting}
              onCheckedChange={(checked) => updateOptions("preserveFormatting", checked)}
            />
            <Label htmlFor="preserve-formatting">Preserve original formatting when possible</Label>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
