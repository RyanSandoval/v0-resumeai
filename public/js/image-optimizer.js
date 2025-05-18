/**
 * Image Optimizer Script
 * Automatically detects and resizes oversized images to prevent layout issues
 */
;(() => {
  // Configuration
  const MAX_WIDTH = 1200
  const MAX_HEIGHT = 800
  const QUALITY = 0.85

  // Run on DOM content loaded
  document.addEventListener("DOMContentLoaded", () => {
    // Find all images on the page
    const images = document.querySelectorAll("img:not(.ignore-optimize)")

    // Process each image
    images.forEach(processImage)

    // Also handle any images added dynamically
    observeDynamicImages()
  })

  // Process a single image
  function processImage(img) {
    // Skip small images, SVGs, and images already processed
    if (
      img.hasAttribute("data-optimized") ||
      img.src.endsWith(".svg") ||
      (img.naturalWidth <= MAX_WIDTH && img.naturalHeight <= MAX_HEIGHT)
    ) {
      return
    }

    // Mark as processed
    img.setAttribute("data-optimized", "true")

    // Wait for image to load if it hasn't already
    if (img.complete) {
      resizeImageIfNeeded(img)
    } else {
      img.addEventListener("load", function () {
        resizeImageIfNeeded(this)
      })
    }
  }

  // Resize image if it exceeds maximum dimensions
  function resizeImageIfNeeded(img) {
    // Check if resizing is needed
    if (img.naturalWidth <= MAX_WIDTH && img.naturalHeight <= MAX_HEIGHT) {
      return
    }

    console.info("Resizing large image:", img.src, `(${img.naturalWidth}x${img.naturalHeight})`)

    // Calculate new dimensions while maintaining aspect ratio
    let newWidth = img.naturalWidth
    let newHeight = img.naturalHeight

    if (newWidth > MAX_WIDTH) {
      newHeight = (MAX_WIDTH / newWidth) * newHeight
      newWidth = MAX_WIDTH
    }

    if (newHeight > MAX_HEIGHT) {
      newWidth = (MAX_HEIGHT / newHeight) * newWidth
      newHeight = MAX_HEIGHT
    }

    // Apply size constraints via CSS
    img.style.maxWidth = `${newWidth}px`
    img.style.maxHeight = `${newHeight}px`

    // Add a class for additional styling
    img.classList.add("optimized-image")

    // Add a container if needed
    if (!img.parentElement.classList.contains("image-container")) {
      const container = document.createElement("div")
      container.className = "image-container"
      img.parentNode.insertBefore(container, img)
      container.appendChild(img)
    }
  }

  // Observe DOM for dynamically added images
  function observeDynamicImages() {
    // Create a mutation observer
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Check for added nodes
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            // Check if the added node is an image
            if (node.nodeName === "IMG") {
              processImage(node)
            }
            // Check if the added node contains images
            else if (node.querySelectorAll) {
              const images = node.querySelectorAll("img")
              images.forEach(processImage)
            }
          })
        }
      })
    })

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }
})()
