import { DocxTest } from "@/components/docx-test"

export default function DocxTestPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">DOCX Parser Testing</h1>
      <p className="text-muted-foreground mb-6">
        This page allows you to test the enhanced DOCX parser against the original parser. Upload a DOCX file to see how
        both parsers handle the content.
      </p>
      <DocxTest />
    </div>
  )
}
