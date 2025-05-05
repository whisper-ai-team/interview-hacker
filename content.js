// Content script that runs in the context of web pages
// This can extract information from the page and communicate with the extension

// Check if running in a browser extension context
let chromeAPI
if (typeof browser !== "undefined" && browser.runtime) {
  chromeAPI = browser // Use 'browser' API and alias it to 'chrome' for compatibility
} else if (typeof chrome === "undefined" || !chrome.runtime) {
  console.warn("Chrome runtime is not available. This script is likely running outside of a Chrome extension context.")
  chromeAPI = null // Set chrome to null to avoid errors later
} else {
  chromeAPI = chrome
}

// Listen for messages from the extension
if (chromeAPI && chromeAPI.runtime) {
  chromeAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "EXTRACT_TEXT") {
      // Extract all text from the page
      const text = document.body.innerText
      sendResponse({ text })
    }

    if (message.type === "EXTRACT_QUESTIONS") {
      // Extract potential questions from the page
      const questions = extractQuestions()
      sendResponse({ questions })
    }

    return true // Keep the message channel open for async responses
  })

  // Function to extract questions from the page
  function extractQuestions() {
    const questions = []

    // Look for question marks in headers
    const headers = document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    headers.forEach((header) => {
      if (header.textContent && header.textContent.includes("?")) {
        questions.push({
          text: header.textContent.trim(),
          element: "header",
          confidence: 0.9,
        })
      }
    })

    // Look for question marks in paragraphs
    const paragraphs = document.querySelectorAll("p")
    paragraphs.forEach((paragraph) => {
      if (paragraph.textContent && paragraph.textContent.includes("?")) {
        // Split into sentences and find those with question marks
        const sentences = paragraph.textContent.split(/[.!?]+/)
        sentences.forEach((sentence) => {
          if (sentence.includes("?")) {
            questions.push({
              text: sentence.trim() + "?",
              element: "paragraph",
              confidence: 0.7,
            })
          }
        })
      }
    })

    // Look for elements with "question" in their class or ID
    const questionElements = document.querySelectorAll('[class*="question"], [id*="question"]')
    questionElements.forEach((element) => {
      if (element.textContent) {
        questions.push({
          text: element.textContent.trim(),
          element: "question-element",
          confidence: 0.8,
        })
      }
    })

    return questions
  }

  // Observe DOM changes to detect new questions
  const observer = new MutationObserver((mutations) => {
    // Check if any mutations added new questions
    const newQuestions = extractQuestions()
    if (newQuestions.length > 0) {
      // Notify the extension about new questions
      chromeAPI.runtime.sendMessage({
        type: "NEW_QUESTIONS_DETECTED",
        questions: newQuestions,
      })
    }
  })

  // Start observing the document
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  })
}
