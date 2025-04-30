"use client"

import { useState } from "react"
import Image from "next/image"
import { useTemplate, type ResumeTemplate } from "@/contexts/template-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function TemplateSelector() {
  const { templates, selectedTemplate, setSelectedTemplate } = useTemplate()
  const [currentIndex, setCurrentIndex] = useState(templates.findIndex((t) => t.id === selectedTemplate.id))

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : templates.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < templates.length - 1 ? prev + 1 : 0))
  }

  const handleSelect = (template: ResumeTemplate) => {
    setSelectedTemplate(template)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Choose a Template</h2>

      <div className="relative">
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
          {templates.map((template, index) => (
            <Card
              key={template.id}
              className={cn(
                "min-w-[200px] cursor-pointer transition-all duration-200 snap-center",
                selectedTemplate.id === template.id ? "ring-2 ring-primary ring-offset-2" : "hover:border-primary/50",
              )}
              onClick={() => {
                setCurrentIndex(index)
                handleSelect(template)
              }}
            >
              <CardContent className="p-3 space-y-2">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={
                      template.thumbnail ||
                      `/placeholder.svg?height=300&width=225&query=resume+template+${template.name}`
                    }
                    alt={template.name}
                    fill
                    className="object-cover"
                  />
                  {selectedTemplate.id === template.id && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-sm">{template.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{template.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm"
          onClick={handlePrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm"
          onClick={handleNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
