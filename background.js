// Background script for the extension
// This runs in the background and manages tab information and question extraction

// Store information about all tabs
const allTabs = {}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    // Store tab information
    allTabs[tabId] = {
      id: tabId,
      title: tab.title,
      url: tab.url,
      favIconUrl: tab.favIconUrl || "",
    }

    // Notify popup if it's open
    chrome.runtime.sendMessage({
      type: "TAB_UPDATED",
      tabs: Object.values(allTabs),
    })
  }
})

// Listen for tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  if (allTabs[tabId]) {
    delete allTabs[tabId]

    // Notify popup if it's open
    chrome.runtime.sendMessage({
      type: "TAB_UPDATED",
      tabs: Object.values(allTabs),
    })
  }
})

// Initialize tabs when extension is loaded
chrome.tabs.query({}, (tabs) => {
  tabs.forEach((tab) => {
    if (tab.id && tab.url) {
      allTabs[tab.id] = {
        id: tab.id,
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl || "",
      }
    }
  })
})

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_ALL_TABS") {
    sendResponse({ tabs: Object.values(allTabs) })
  }

  if (message.type === "EXTRACT_QUESTION" && message.tabId) {
    // Execute a content script to extract questions from the page
    chrome.scripting.executeScript(
      {
        target: { tabId: message.tabId },
        function: extractQuestionFromPage,
      },
      (results) => {
        if (results && results[0]) {
          sendResponse({ question: results[0].result })
        } else {
          sendResponse({ question: null, error: "Could not extract question" })
        }
      },
    )
    return true // Keep the message channel open for the async response
  }
})

// Function to extract questions from a page
// This will be injected into the tab
function extractQuestionFromPage() {
  // Look for common question patterns in the page
  // This is a simplified example - you would need more sophisticated logic
  // based on the sites you're targeting

  // Try to find question marks in headers or paragraphs
  const headers = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
  const paragraphs = Array.from(document.querySelectorAll("p"))

  // Check headers first
  for (const header of headers) {
    if (header.textContent && header.textContent.includes("?")) {
      return header.textContent.trim()
    }
  }

  // Then check paragraphs
  for (const paragraph of paragraphs) {
    if (paragraph.textContent && paragraph.textContent.includes("?")) {
      // Extract the sentence with the question mark
      const sentences = paragraph.textContent.split(/[.!?]+/)
      for (const sentence of sentences) {
        if (sentence.includes("?")) {
          return sentence.trim() + "?"
        }
      }
      return paragraph.textContent.trim()
    }
  }

  // If no question found, return the page title as fallback
  return document.title
}
