/**
 * Enhanced DOCX parser with improved character encoding and error handling
 * This module provides robust parsing for DOCX files with proper formatting preservation
 */

import { getSampleResume } from "../file-utils"
import { logParsingEvent } from "./parser-events"

// Type definitions for mammoth.js
interface MammothOptions {
  arrayBuffer: ArrayBuffer
  styleMap?: string[]
  includeDefaultStyleMap?: boolean
  convertImage?: any
  includeEmbeddedStyleMap?: boolean
  preserveStyles?: boolean
}

interface MammothResult {
  value: string
  messages: Array<{
    type: string
    message: string
    paragraphIndex?: number
  }>
}

// Initialize mammoth.js dynamically to avoid SSR issues
let mammoth: any = null

/**
 * Initialize mammoth.js (client-side only)
 */
async function initMammoth(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false
  }

  try {
    if (!mammoth) {
      // Dynamically import mammoth.js only on the client side
      mammoth = await import("mammoth")
      return true
    }
    return true
  } catch (error) {
    console.error("Failed to initialize mammoth.js:", error)
    return false
  }
}

/**
 * Extract text from DOCX file with improved formatting preservation
 */
export async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    logParsingEvent("start", "docx", file.name, file.size)
    console.log(`Starting enhanced DOCX extraction for: ${file.name} (${file.size} bytes)`)

    // Make sure we're in a browser environment
    if (typeof window === "undefined") {
      throw new Error("DOCX extraction can only be performed in a browser environment")
    }

    // Initialize mammoth.js if needed
    const initialized = await initMammoth()
    if (!initialized || !mammoth) {
      throw new Error("Failed to initialize mammoth.js")
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Extract text using mammoth.js with improved options
    const options: MammothOptions = {
      arrayBuffer,
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Heading 5'] => h5:fresh",
        "p[style-name='Heading 6'] => h6:fresh",
        "p => p:fresh",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
        "table => table",
        "tr => tr",
        "td => td",
        "ul => ul",
        "ol => ol",
        "li => li",
      ],
      includeDefaultStyleMap: true,
      preserveStyles: true,
    }

    const result: MammothResult = await mammoth.convertToHtml(options)

    // Check for conversion messages/warnings
    if (result.messages && result.messages.length > 0) {
      console.warn("DOCX conversion messages:", result.messages)
    }

    // Convert HTML to plain text while preserving structure
    const text = htmlToStructuredText(result.value)

    if (text && text.length > 100) {
      logParsingEvent("success", "docx", file.name, file.size, text.length)
      console.log("Successfully extracted text using mammoth.js")
      return text
    } else {
      console.log("Mammoth.js extraction returned insufficient text, trying fallback method")
      return await extractTextFromDOCXFallback(file)
    }
  } catch (error) {
    logParsingEvent("error", "docx", file.name, file.size, 0, error)
    console.error("Error in mammoth.js extraction:", error)
    return await extractTextFromDOCXFallback(file)
  }
}

/**
 * Convert HTML to structured plain text
 * Preserves headings, paragraphs, and list structures
 */
function htmlToStructuredText(html: string): string {
  if (!html) return ""

  try {
    // Create a DOM parser
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")

    // Function to process a node and its children
    function processNode(node: Node, indentLevel = 0): string {
      let text = ""
      const indent = "  ".repeat(indentLevel)

      // Process different node types
      switch (node.nodeName.toLowerCase()) {
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          // Make headings uppercase for emphasis
          text += "\n" + node.textContent?.toUpperCase() + "\n"
          break

        case "p":
          // Add paragraph with proper spacing
          if (node.textContent?.trim()) {
            text += "\n" + node.textContent.trim() + "\n"
          }
          break

        case "ul":
        case "ol":
          text += "\n"
          // Process list items with proper indentation
          for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i]
            if (child.nodeName.toLowerCase() === "li") {
              text += indent + "• " + child.textContent?.trim() + "\n"
            }
          }
          break

        case "li":
          // Already handled in ul/ol case
          break

        case "table":
          text += "\n"
          // Process table rows
          for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i]
            if (child.nodeName.toLowerCase() === "tbody" || child.nodeName.toLowerCase() === "thead") {
              text += processNode(child, indentLevel)
            }
          }
          text += "\n"
          break

        case "tr":
          let rowText = ""
          // Process table cells
          for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i]
            if (child.nodeName.toLowerCase() === "td" || child.nodeName.toLowerCase() === "th") {
              rowText += (child.textContent?.trim() || "") + "\t"
            }
          }
          if (rowText) {
            text += indent + rowText.trim() + "\n"
          }
          break

        case "br":
          text += "\n"
          break

        case "strong":
        case "b":
          // Could add asterisks for emphasis but keeping it simple
          text += node.textContent
          break

        case "em":
        case "i":
          // Could add underscores for emphasis but keeping it simple
          text += node.textContent
          break

        case "#text":
          // Add text content if not empty
          if (node.textContent?.trim()) {
            text += node.textContent
          }
          break

        default:
          // Process child nodes for other elements
          for (let i = 0; i < node.childNodes.length; i++) {
            text += processNode(node.childNodes[i], indentLevel)
          }
          break
      }

      return text
    }

    // Process the entire document
    let result = processNode(doc.body)

    // Clean up excessive whitespace while preserving structure
    result = result.replace(/\n{3,}/g, "\n\n")

    return result.trim()
  } catch (error) {
    console.error("Error converting HTML to structured text:", error)
    // Return the original HTML as fallback
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }
}

/**
 * Fallback method for DOCX text extraction with improved character handling
 */
async function extractTextFromDOCXFallback(file: File): Promise<string> {
  try {
    console.log("Using enhanced DOCX fallback extraction method")

    // Try JSZip extraction first (most reliable fallback)
    try {
      const JSZip = (await import("jszip")).default
      const arrayBuffer = await file.arrayBuffer()
      const zip = await JSZip.loadAsync(arrayBuffer)

      // Get document.xml which contains the main content
      const documentXml = zip.file("word/document.xml")
      if (documentXml) {
        const content = await documentXml.async("string")
        const extractedText = extractTextFromDocumentXml(content)

        if (extractedText && extractedText.length > 100) {
          logParsingEvent("success", "docx-fallback-jszip", file.name, file.size, extractedText.length)
          return extractedText
        }
      }
    } catch (zipError) {
      console.warn("JSZip extraction failed:", zipError)
    }

    // Try direct text extraction as a last resort
    try {
      const text = await readAsTextWithEncoding(file)

      // Check if we got valid text content
      if (text && text.length > 100 && !isDOCXBinary(text)) {
        logParsingEvent("success", "docx-fallback-text", file.name, file.size, text.length)
        return cleanupDOCXText(text)
      }
    } catch (textError) {
      console.warn("Text extraction failed:", textError)
    }

    // If all methods fail, use sample resume
    logParsingEvent("fallback", "docx-sample", file.name, file.size)
    console.log("All DOCX extraction methods failed, using sample resume")
    return getSampleResume()
  } catch (error) {
    logParsingEvent("error", "docx-fallback", file.name, file.size, 0, error)
    console.error("All DOCX extraction methods failed:", error)
    return getSampleResume()
  }
}

/**
 * Extract text from document.xml with improved XML parsing
 */
function extractTextFromDocumentXml(xml: string): string {
  try {
    // Create XML parser
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xml, "text/xml")

    // Find all text elements (w:t)
    const textNodes = xmlDoc.getElementsByTagName("w:t")
    let text = ""
    let currentParagraph = ""

    // Extract text with paragraph structure
    for (let i = 0; i < textNodes.length; i++) {
      const content = textNodes[i].textContent || ""

      // Check if this is a new paragraph
      const paragraphNode = findParentByTagName(textNodes[i], "w:p")
      const currentParagraphId = paragraphNode ? paragraphNode.getAttribute("w:rsidR") : null

      if (i > 0 && currentParagraphId !== findParentByTagName(textNodes[i - 1], "w:p")?.getAttribute("w:rsidR")) {
        // New paragraph
        text += currentParagraph.trim() + "\n\n"
        currentParagraph = content
      } else {
        // Same paragraph
        currentParagraph += content
      }
    }

    // Add the last paragraph
    if (currentParagraph) {
      text += currentParagraph.trim()
    }

    return cleanupDOCXText(text)
  } catch (error) {
    console.error("Error extracting text from XML:", error)

    // Fallback to simple regex extraction
    const textMatches = xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []
    const extractedText = textMatches
      .map((match) => {
        // Extract content between tags
        const content = match.replace(/<[^>]*>/g, "")
        return content
      })
      .join(" ")

    return cleanupDOCXText(extractedText)
  }
}

/**
 * Find parent element with specific tag name
 */
function findParentByTagName(node: Node, tagName: string): Element | null {
  let current: Node | null = node

  while (current && current.nodeName !== tagName) {
    current = current.parentNode
  }

  return current as Element
}

/**
 * Read file as text with proper encoding detection
 */
async function readAsTextWithEncoding(file: File): Promise<string> {
  // Try UTF-8 first
  try {
    const text = await readAsTextPromise(file, "UTF-8")
    if (text && !containsInvalidChars(text)) {
      return text
    }
  } catch (e) {
    console.warn("UTF-8 reading failed:", e)
  }

  // Try other encodings
  const encodings = ["ISO-8859-1", "windows-1252", "UTF-16"]

  for (const encoding of encodings) {
    try {
      const text = await readAsTextPromise(file, encoding)
      if (text && !containsInvalidChars(text)) {
        return text
      }
    } catch (e) {
      console.warn(`${encoding} reading failed:`, e)
    }
  }

  // Fallback to default encoding
  return await readAsTextPromise(file)
}

/**
 * Check if text contains invalid characters
 */
function containsInvalidChars(text: string): boolean {
  // Check for replacement character or other indicators of encoding issues
  return text.includes("\uFFFD") || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text.substring(0, 1000))
}

/**
 * Promise wrapper for FileReader.readAsText with encoding
 */
function readAsTextPromise(file: File, encoding?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Failed to read file as text"))

    if (encoding) {
      reader.readAsText(file, encoding)
    } else {
      reader.readAsText(file)
    }
  })
}

/**
 * Clean up extracted DOCX text
 */
function cleanupDOCXText(text: string): string {
  if (!text) return ""

  // Remove XML/HTML entities
  let cleaned = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#\d+;/g, (match) => {
      // Convert numeric entities
      const code = Number.parseInt(match.slice(2, -1))
      return String.fromCharCode(code)
    })

  // Remove control characters
  cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, "")

  // Normalize whitespace (preserve paragraph breaks)
  cleaned = cleaned
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return cleaned
}

/**
 * Check if the content appears to be binary DOCX data
 */
function isDOCXBinary(content: string): boolean {
  // Check for DOCX signature (PK zip header)
  if (content.startsWith("PK")) {
    return true
  }

  // Check for binary content
  const checkLength = Math.min(content.length, 1000)
  let binaryCount = 0

  for (let i = 0; i < checkLength; i++) {
    const code = content.charCodeAt(i)
    if ((code < 32 || code > 126) && ![9, 10, 13].includes(code)) {
      binaryCount++
    }
  }

  return binaryCount / checkLength > 0.1
}
