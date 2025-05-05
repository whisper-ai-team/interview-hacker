// This is a simplified version of what would be a React application
// In a real implementation, you would use React, Next.js, or another framework

document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app")

  // Initialize the UI
  initializeUI()

  // Request all tabs from the background script
  chrome.runtime.sendMessage({ type: "GET_ALL_TABS" }, (response) => {
    if (response && response.tabs) {
      updateTabList(response.tabs)
    }
  })

  // Listen for tab updates from the background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "TAB_UPDATED" && message.tabs) {
      updateTabList(message.tabs)
    }

    if (message.type === "AUDIO_CAPTURE_STARTED") {
      updateStatus(`Listening to tab ${message.tabId}`)
    }

    if (message.type === "AUDIO_CAPTURE_FAILED") {
      updateStatus(`Failed to capture audio: ${message.error}`)
    }
  })

  function initializeUI() {
    // Create the basic UI structure
    app.innerHTML = `
      <div class="flex flex-col h-full">
        <header class="bg-gray-800 text-white p-4 flex items-center justify-between">
          <h1 class="text-xl font-bold">Interview Copilot</h1>
          <div class="flex items-center space-x-2">
            <button id="settingsBtn" class="p-2 rounded hover:bg-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </header>
        
        <div class="flex flex-1 overflow-hidden">
          <!-- Tab List -->
          <div class="w-1/3 border-r border-gray-200 flex flex-col">
            <div class="p-4 border-b border-gray-200">
              <input id="searchTabs" type="text" placeholder="Search tabs..." class="w-full p-2 border border-gray-300 rounded">
            </div>
            <div id="tabList" class="flex-1 overflow-y-auto p-2">
              <!-- Tabs will be inserted here -->
            </div>
          </div>
          
          <!-- Main Content -->
          <div class="flex-1 flex flex-col">
            <div id="selectedTab" class="p-4 border-b border-gray-200 bg-gray-50">
              <!-- Selected tab info will be shown here -->
              <p class="text-gray-500">Select a tab to start listening</p>
            </div>
            
            <div id="transcriptContainer" class="flex-1 p-4 overflow-y-auto">
              <div id="transcript" class="text-gray-700">
                <!-- Transcript will appear here -->
              </div>
            </div>
            
            <div id="responseContainer" class="flex-1 p-4 overflow-y-auto bg-gray-50">
              <h3 class="font-medium mb-2">AI Response:</h3>
              <div id="aiResponse" class="text-gray-700">
                <!-- AI response will appear here -->
              </div>
            </div>
            
            <div class="p-4 border-t border-gray-200 flex justify-between items-center">
              <div id="status" class="text-sm text-gray-500">Ready</div>
              <button id="listenBtn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Start Listening
              </button>
            </div>
          </div>
        </div>
      </div>
    `

    // Add event listeners
    document.getElementById("searchTabs").addEventListener("input", filterTabs)
    document.getElementById("listenBtn").addEventListener("click", toggleListening)
  }

  function updateTabList(tabs) {
    const tabList = document.getElementById("tabList")
    const searchInput = document.getElementById("searchTabs")
    const searchTerm = searchInput.value.toLowerCase()

    // Filter tabs if search term exists
    const filteredTabs = searchTerm
      ? tabs.filter((tab) => tab.title.toLowerCase().includes(searchTerm) || tab.url.toLowerCase().includes(searchTerm))
      : tabs

    // Clear existing tabs
    tabList.innerHTML = ""

    // Add tabs to the list
    filteredTabs.forEach((tab) => {
      const tabElement = document.createElement("div")
      tabElement.className = "flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
      tabElement.dataset.tabId = tab.id

      const favicon = tab.favIconUrl || "icons/default-favicon.png"

      tabElement.innerHTML = `
        <img src="${favicon}" class="w-4 h-4 mr-2" onerror="this.src='icons/default-favicon.png'">
        <div class="overflow-hidden">
          <div class="font-medium text-sm truncate">${tab.title}</div>
          <div class="text-xs text-gray-500 truncate">${tab.url}</div>
        </div>
      `

      tabElement.addEventListener("click", () => selectTab(tab))

      tabList.appendChild(tabElement)
    })
  }

  function filterTabs(event) {
    const searchTerm = event.target.value.toLowerCase()

    // Request all tabs again and filter them
    chrome.runtime.sendMessage({ type: "GET_ALL_TABS" }, (response) => {
      if (response && response.tabs) {
        updateTabList(response.tabs)
      }
    })
  }

  let selectedTabId = null
  let isListening = false

  function selectTab(tab) {
    selectedTabId = tab.id

    const selectedTabElement = document.getElementById("selectedTab")
    selectedTabElement.innerHTML = `
      <div class="flex items-center">
        <img src="${tab.favIconUrl || "icons/default-favicon.png"}" class="w-5 h-5 mr-2" onerror="this.src='icons/default-favicon.png'">
        <div>
          <div class="font-medium">${tab.title}</div>
          <div class="text-xs text-gray-500">${tab.url}</div>
        </div>
      </div>
    `

    // Enable the listen button
    const listenBtn = document.getElementById("listenBtn")
    listenBtn.disabled = false

    // Extract question from the selected tab
    chrome.runtime.sendMessage({ type: "EXTRACT_QUESTION", tabId: tab.id }, (response) => {
      if (response && response.question) {
        const transcriptElement = document.getElementById("transcript")
        transcriptElement.innerHTML = `
            <div class="bg-blue-50 p-3 rounded-md mb-4">
              <p class="text-xs font-medium mb-1 text-blue-600">Detected Question:</p>
              <p>${response.question}</p>
            </div>
          `
      }
    })
  }

  function toggleListening() {
    if (!selectedTabId) return

    const listenBtn = document.getElementById("listenBtn")

    if (isListening) {
      // Stop listening
      isListening = false
      listenBtn.textContent = "Start Listening"
      listenBtn.classList.remove("bg-red-600", "hover:bg-red-700")
      listenBtn.classList.add("bg-blue-600", "hover:bg-blue-700")

      updateStatus("Stopped listening")

      // In a real implementation, you would stop the audio capture here
    } else {
      // Start listening
      isListening = true
      listenBtn.textContent = "Stop Listening"
      listenBtn.classList.remove("bg-blue-600", "hover:bg-blue-700")
      listenBtn.classList.add("bg-red-600", "hover:bg-red-700")

      updateStatus("Starting to listen...")

      // Request audio capture from the background script
      chrome.runtime.sendMessage({
        type: "START_TAB_CAPTURE",
        tabId: selectedTabId,
      })

      // Simulate receiving a transcript after a delay
      setTimeout(() => {
        const transcriptElement = document.getElementById("transcript")
        const currentContent = transcriptElement.innerHTML

        transcriptElement.innerHTML =
          currentContent +
          `
          <div class="mt-4">
            <p class="text-xs font-medium mb-1 text-gray-500">Transcribed:</p>
            <p>"Can you explain how you would implement a distributed caching system?"</p>
          </div>
        `

        // Simulate AI response
        simulateAIResponse()
      }, 3000)
    }
  }

  function updateStatus(message) {
    const statusElement = document.getElementById("status")
    statusElement.textContent = message
  }

  function simulateAIResponse() {
    const responseElement = document.getElementById("aiResponse")
    responseElement.innerHTML = '<div class="animate-pulse">Thinking...</div>'

    // Simulate streaming response
    const response = `To implement a distributed caching system, I would follow these key steps:

1. **Choose a Caching Strategy**: First, decide between write-through, write-behind, or write-around caching based on your application's read/write patterns.

2. **Select a Distribution Model**: Options include:
   - Sharding (partitioning data across nodes)
   - Replication (copying data to multiple nodes)
   - A hybrid approach

3. **Implement Consistency Protocols**: Use techniques like:
   - Optimistic concurrency control
   - Two-phase commit
   - Eventual consistency with conflict resolution

4. **Handle Node Failures**: Implement:
   - Health monitoring
   - Automatic failover
   - Data recovery mechanisms

5. **Optimize Performance**:
   - Use intelligent eviction policies (LRU, LFU)
   - Implement data compression
   - Consider in-memory storage with disk persistence

6. **Scale Horizontally**: Design the system to add/remove nodes without downtime.

Popular technologies I might leverage include Redis Cluster, Memcached with consistent hashing, or Apache Ignite depending on specific requirements.`

    // Display the response word by word to simulate streaming
    const words = response.split(" ")
    let currentText = ""
    let wordIndex = 0

    const interval = setInterval(() => {
      if (wordIndex < words.length) {
        currentText += words[wordIndex] + " "
        responseElement.innerHTML = currentText
        wordIndex++
      } else {
        clearInterval(interval)
      }
    }, 100)
  }
})
