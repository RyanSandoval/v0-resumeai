/**
 * PDF.js worker setup
 * This file initializes the PDF.js worker
 */

import * as pdfjs from "pdfjs-dist"

// Initialize PDF.js worker
// In a production environment, we would set this to a CDN URL or local path
const pdfjsWorker = require("pdfjs-dist/build/pdf.worker.entry")
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default pdfjs
