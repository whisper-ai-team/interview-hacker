export class DeepgramTranscriber {
  private socket: WebSocket | null = null
  private stream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private audioProcessor: ScriptProcessorNode | null = null
  private apiKey: string
  private onStatusCallback: ((status: string, isError?: boolean) => void) | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout: NodeJS.Timeout | null = null
  private keepAliveInterval: NodeJS.Timeout | null = null
  private lastMessageTime = 0
  private connectionTimeout: NodeJS.Timeout | null = null
  private audioLevel = 0
  private onAudioLevelCallback: ((level: number) => void) | null = null
  private lastTranscriptTime = 0
  private transcriptBuffer = ""
  private processingInterval: NodeJS.Timeout | null = null
  private onProcessedTranscriptCallback: ((text: string) => void) | null = null
  private onContinuousTranscriptCallback: ((text: string) => void) | null = null
  private wordCountThreshold = 3 // Minimum words needed to trigger a response
  private isProcessingQueued = false
  private silenceTimeout: NodeJS.Timeout | null = null
  private lastSpeechTime = 0
  private silenceThreshold = 2000 // 2 seconds of silence to consider speech complete
  private continuousMode = true // Enable continuous mode by default

  constructor(apiKey: string) {
    this.apiKey = apiKey
    console.log("[Deepgram] Initialized with API key:", apiKey ? "API key provided" : "No API key")
  }

  setStatusCallback(callback: (status: string, isError?: boolean) => void) {
    this.onStatusCallback = callback
  }

  setAudioLevelCallback(callback: (level: number) => void) {
    this.onAudioLevelCallback = callback
  }

  setProcessedTranscriptCallback(callback: (text: string) => void) {
    this.onProcessedTranscriptCallback = callback
  }

  setContinuousTranscriptCallback(callback: (text: string) => void) {
    this.onContinuousTranscriptCallback = callback
    this.updateStatus("Continuous transcript callback set")
  }

  setWordCountThreshold(threshold: number) {
    this.wordCountThreshold = threshold
    this.updateStatus(`Word count threshold set to ${threshold}`)
  }

  setContinuousMode(enabled: boolean) {
    this.continuousMode = enabled
    this.updateStatus(`Continuous mode ${enabled ? "enabled" : "disabled"}`)
  }

  private updateStatus(message: string, isError = false) {
    console.log(`[Deepgram] ${message}`)
    if (this.onStatusCallback) {
      this.onStatusCallback(message, isError)
    }
  }

  async startWithStream(stream: MediaStream) {
    try {
      this.stream = stream
      this.updateStatus("Starting transcription with stream")

      // Check if we have audio tracks
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        this.updateStatus("No audio tracks found in the stream", true)
        throw new Error("No audio tracks found in the stream")
      }

      // Log audio track details
      audioTracks.forEach((track, i) => {
        this.updateStatus(`Audio track ${i}: ${track.label}, enabled: ${track.enabled}, muted: ${track.muted}`)
      })

      // Create audio context with specific options for better compatibility
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: "interactive",
        sampleRate: 44100, // Use a standard sample rate for better compatibility
      })
      this.updateStatus(`Audio context created with sample rate: ${this.audioContext.sampleRate}Hz`)

      // Create source from the stream
      const source = this.audioContext.createMediaStreamSource(stream)

      // Create analyzer to detect audio levels
      const analyzer = this.audioContext.createAnalyser()
      analyzer.fftSize = 256
      source.connect(analyzer)

      // Create script processor for audio data - use a smaller buffer for lower latency
      this.audioProcessor = this.audioContext.createScriptProcessor(1024, 1, 1)
      source.connect(this.audioProcessor)
      this.audioProcessor.connect(this.audioContext.destination)

      // Connect to Deepgram WebSocket
      await this.connectToDeepgram()

      // Process audio data
      this.audioProcessor.onaudioprocess = (e) => {
        // Check for audio levels
        const dataArray = new Uint8Array(analyzer.frequencyBinCount)
        analyzer.getByteFrequencyData(dataArray)

        // Calculate audio level (0-100)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        this.audioLevel = Math.min(100, Math.round((sum / dataArray.length) * 2))

        // Report audio level
        if (this.onAudioLevelCallback) {
          this.onAudioLevelCallback(this.audioLevel)
        }

        // Detect speech activity
        if (this.audioLevel > 10) {
          this.lastSpeechTime = Date.now()

          // Reset silence timeout if it exists
          if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout)
            this.silenceTimeout = null
          }
        } else if (this.transcriptBuffer && this.transcriptBuffer.trim() && !this.silenceTimeout) {
          // If we have some transcript and audio level is low, start silence timer
          this.silenceTimeout = setTimeout(() => {
            // If we have enough words and silence is detected, process the transcript
            const wordCount = this.countWords(this.transcriptBuffer)
            if (wordCount >= this.wordCountThreshold && !this.isProcessingQueued) {
              this.processTranscript()
            }
          }, this.silenceThreshold)
        }

        // Only send data if we have a connection
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0)

          // Convert float32 to int16
          const pcmData = new Int16Array(inputData.length)
          for (let i = 0; i < inputData.length; i++) {
            // Apply a slight gain to boost the audio signal
            const amplifiedSample = inputData[i] * 1.5
            // Clip to avoid distortion
            const clippedSample = Math.max(-1, Math.min(1, amplifiedSample))
            pcmData[i] = clippedSample * 0x7fff
          }

          // Send audio data to Deepgram
          this.socket.send(pcmData.buffer)
          this.lastMessageTime = Date.now()
        }
      }

      this.updateStatus("Audio processing setup complete")

      // Set up interval to check transcript periodically
      this.setupProcessingInterval()

      // Send a test transcript after 5 seconds if we haven't received any
      setTimeout(() => {
        if (Date.now() - this.lastTranscriptTime > 5000) {
          this.updateStatus("No transcripts received yet. Make sure your browser tab is producing audio.")
        }
      }, 5000)
    } catch (error) {
      this.updateStatus(
        `Error setting up audio processing: ${error instanceof Error ? error.message : String(error)}`,
        true,
      )
      throw error
    }
  }

  private setupProcessingInterval() {
    // Clear any existing interval
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
    }

    // Process transcript every 200ms for more responsiveness in continuous mode
    this.processingInterval = setInterval(() => {
      if (this.transcriptBuffer && this.transcriptBuffer.trim()) {
        try {
          // Count words in the transcript
          const wordCount = this.countWords(this.transcriptBuffer)

          // In continuous mode, send updates as they come in
          if (this.continuousMode && this.onContinuousTranscriptCallback) {
            this.onContinuousTranscriptCallback(this.transcriptBuffer)
          }

          // Check if we've reached the threshold and not already queued processing
          if (wordCount >= this.wordCountThreshold && !this.isProcessingQueued) {
            // If there's been silence for a while, process the transcript
            if (Date.now() - this.lastSpeechTime > this.silenceThreshold) {
              this.processTranscript()
            }
          }
        } catch (error) {
          this.updateStatus(
            `Error processing transcript: ${error instanceof Error ? error.message : String(error)}`,
            true,
          )
        }
      }
    }, 200) // More frequent updates for continuous mode
  }

  private processTranscript() {
    this.isProcessingQueued = true

    // Format the transcript as a question if needed
    const processedText = this.formatAsQuestion(this.transcriptBuffer)

    // Call the callback with the processed text
    if (this.onProcessedTranscriptCallback && processedText && processedText.trim()) {
      this.onProcessedTranscriptCallback(processedText)
      this.updateStatus(`Processed transcript: "${processedText}"`)
    }

    // Reset for next question
    this.transcriptBuffer = ""
    this.isProcessingQueued = false
  }

  private countWords(text: string): number {
    if (!text || typeof text !== "string") return 0
    return text.trim().split(/\s+/).length
  }

  private formatAsQuestion(text: string): string {
    // Safety check - ensure text is a string and not empty
    if (!text) {
      console.error(`[Deepgram] Invalid text for formatting: ${text}`)
      return "Could you explain more about that?" // Default fallback question
    }

    // Convert to string if it's not already
    const safeText = String(text).trim()

    if (safeText === "") {
      console.error("[Deepgram] Empty text for formatting")
      return "Could you explain more about that?" // Default fallback question
    }

    // Trim the text
    let processedText = safeText

    // Always add a question mark at the end if it doesn't have one
    if (!processedText.endsWith("?")) {
      processedText = processedText + "?"
    }

    return processedText
  }

  private async connectToDeepgram() {
    try {
      this.updateStatus("Connecting to Deepgram...")

      // Close existing connection if any
      if (this.socket) {
        this.socket.close()
        this.socket = null
      }

      // Clear any existing intervals/timeouts
      this.clearTimers()

      // Create WebSocket connection to Deepgram
      // Use the correct endpoint with parameters
      const socket = new WebSocket(
        `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=${this.audioContext?.sampleRate || 44100}`,
        ["token", this.apiKey],
      )

      // Set binary type to arraybuffer for audio data
      socket.binaryType = "arraybuffer"

      // Handle socket open
      socket.onopen = () => {
        this.updateStatus("Connected to Deepgram")
        this.isConnected = true
        this.reconnectAttempts = 0
        this.lastMessageTime = Date.now()

        // Send configuration
        const config = {
          sample_rate: this.audioContext?.sampleRate || 44100,
          encoding: "linear16",
          channels: 1,
          language: "en",
          model: "nova-2", // Use the latest model
          punctuate: true,
          interim_results: true,
          endpointing: 200,
          vad_turnoff: 500, // Voice activity detection
          alternatives: 1,
          smart_format: true,
        }

        socket.send(JSON.stringify(config))
        this.updateStatus(`Sent configuration: ${JSON.stringify(config)}`)

        // Set up keep-alive ping to prevent timeouts
        this.setupKeepAlive()

        // Set up connection monitoring
        this.monitorConnection()
      }

      // Handle messages from Deepgram
      socket.onmessage = (message) => {
        try {
          // Update last message time
          this.lastMessageTime = Date.now()

          // Try to parse as JSON
          const data = JSON.parse(message.data)

          // Check if this is a transcript
          if (data.channel && data.channel.alternatives && data.channel.alternatives.length > 0) {
            const transcript = data.channel.alternatives[0].transcript

            if (transcript) {
              // Update the transcript buffer
              this.transcriptBuffer = transcript
              this.lastTranscriptTime = Date.now()
              this.updateStatus(`Received transcript: "${transcript}"`)

              // In continuous mode, immediately send the update
              if (this.continuousMode && this.onContinuousTranscriptCallback) {
                this.onContinuousTranscriptCallback(transcript)
              }
            }
          } else if (data.type === "KeepAliveResponse") {
            this.updateStatus("Received keep-alive response")
          }
        } catch (error) {
          this.updateStatus(
            `Error parsing Deepgram message: ${error instanceof Error ? error.message : String(error)}`,
            true,
          )
        }
      }

      // Handle socket close
      socket.onclose = (event) => {
        this.isConnected = false
        this.updateStatus(`Deepgram connection closed: ${event.code} ${event.reason}`, true)

        // Clear timers
        this.clearTimers()

        // Attempt to reconnect if not intentionally closed
        if (this.stream && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          this.updateStatus(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

          // Exponential backoff for reconnection
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000)

          this.reconnectTimeout = setTimeout(() => {
            this.connectToDeepgram()
          }, delay)
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.updateStatus("Maximum reconnection attempts reached. Please try again later.", true)
        }
      }

      // Handle socket errors
      socket.onerror = (error) => {
        this.updateStatus(
          `Deepgram WebSocket error: ${error instanceof Error ? error.message : "Connection error"}`,
          true,
        )
      }

      this.socket = socket
    } catch (error) {
      this.updateStatus(`Error connecting to Deepgram: ${error instanceof Error ? error.message : String(error)}`, true)
      throw error
    }
  }

  private setupKeepAlive() {
    // Clear any existing interval
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval)
      this.keepAliveInterval = null
    }

    // Send a keep-alive ping every 15 seconds
    this.keepAliveInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        // Send a small ping message to keep the connection alive
        this.socket.send(JSON.stringify({ type: "KeepAlive", timestamp: Date.now() }))
        console.log("[Deepgram] Sent keep-alive ping")
      }
    }, 15000)
  }

  private monitorConnection() {
    // Clear any existing timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }

    // Check connection every 5 seconds
    this.connectionTimeout = setInterval(() => {
      const now = Date.now()
      // If no message received in the last 30 seconds, consider the connection dead
      if (this.lastMessageTime && now - this.lastMessageTime > 30000) {
        this.updateStatus("Connection appears to be stalled. Attempting to reconnect...", true)

        // Force close and reconnect
        if (this.socket) {
          this.socket.close()
          this.socket = null
        }

        this.connectToDeepgram()
      }
    }, 5000)
  }

  private clearTimers() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval)
      this.keepAliveInterval = null
    }

    if (this.connectionTimeout) {
      clearInterval(this.connectionTimeout)
      this.connectionTimeout = null
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }

    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout)
      this.silenceTimeout = null
    }
  }

  stop() {
    this.updateStatus("Stopping transcription")

    // Clear all timers
    this.clearTimers()

    // Close WebSocket connection
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }

    // Stop audio processing
    if (this.audioProcessor) {
      this.audioProcessor.disconnect()
      this.audioProcessor = null
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close()
      this.audioContext = null
    }

    // Stop all tracks in the stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }

    this.isConnected = false
    this.updateStatus("Transcription stopped")
  }

  isActive(): boolean {
    return this.isConnected
  }

  getAudioLevel(): number {
    return this.audioLevel
  }
}
