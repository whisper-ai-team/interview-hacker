import OpenAI from "openai"

// Simple mock transcriber for when OpenAI Whisper is unavailable
class MockTranscriber {
  private callback: ((text: string, isFinal: boolean) => void) | null = null
  private interval: NodeJS.Timeout | null = null
  private mockPhrases = [
    "Tell me about your experience with distributed systems.",
    "How would you design a scalable web application?",
    "What's your approach to debugging complex issues?",
    "Explain the difference between processes and threads.",
    "How do you handle technical disagreements in a team?",
  ]

  start(onTranscript: (text: string, isFinal: boolean) => void) {
    this.callback = onTranscript
    console.log("[MockTranscriber] Mock transcriber started")

    // Simulate receiving transcripts
    let phraseIndex = 0
    this.interval = setInterval(() => {
      if (this.callback) {
        // First send as interim
        this.callback(this.mockPhrases[phraseIndex], false)
        console.log("[MockTranscriber] Mock sent interim:", this.mockPhrases[phraseIndex])

        // Then after a delay, send as final
        setTimeout(() => {
          if (this.callback) {
            this.callback(this.mockPhrases[phraseIndex], true)
            console.log("[MockTranscriber] Mock sent final:", this.mockPhrases[phraseIndex])
            phraseIndex = (phraseIndex + 1) % this.mockPhrases.length
          }
        }, 2000)
      }
    }, 5000) // New phrase every 5 seconds (reduced from 10)

    return Promise.resolve()
  }

  startWithStream(stream: MediaStream, onTranscript: (text: string, isFinal: boolean) => void) {
    console.log("[MockTranscriber] Mock transcriber started with stream")
    // Log audio tracks in the stream
    const audioTracks = stream.getAudioTracks()
    console.log(`[MockTranscriber] Stream has ${audioTracks.length} audio tracks`)
    audioTracks.forEach((track, i) => {
      console.log(`[MockTranscriber] Track ${i}: ${track.label}, enabled: ${track.enabled}, muted: ${track.muted}`)
    })

    return this.start(onTranscript)
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    this.callback = null
    console.log("[MockTranscriber] Mock transcriber stopped")
  }
}

export class AudioTranscriber {
  private openai: OpenAI | null = null
  private stream: MediaStream | null = null
  private mediaRecorder: MediaRecorder | null = null
  private isRecording = false
  private audioChunks: Blob[] = []
  private mockTranscriber: MockTranscriber | null = null
  private useMockMode = false
  private apiKey: string
  private onConnectionStatus: ((status: string, isError?: boolean) => void) | null = null
  private debugMode = true // Enable debug mode by default

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.mockTranscriber = new MockTranscriber()

    // Log constructor initialization
    console.log("[AudioTranscriber] Initialized with API key:", apiKey ? "API key provided" : "No API key")
  }

  setConnectionStatusCallback(callback: (status: string, isError?: boolean) => void) {
    this.onConnectionStatus = callback
  }

  private updateStatus(message: string, isError = false) {
    console.log(`[AudioTranscriber] ${message}`)
    if (this.onConnectionStatus) {
      this.onConnectionStatus(message, isError)
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      // Simple validation check - API keys should be 40 characters
      if (!this.apiKey || this.apiKey.length < 30) {
        this.updateStatus("API key appears invalid (too short)", true)
        return false
      }

      // Try to create a client as a validation step
      this.openai = new OpenAI({ apiKey: this.apiKey, dangerouslyAllowBrowser: true })
      this.updateStatus("API key validation successful")
      return true
    } catch (error) {
      this.updateStatus(`API key validation failed: ${error instanceof Error ? error.message : String(error)}`, true)
      return false
    }
  }

  async start(onTranscript: (text: string, isFinal: boolean) => void) {
    try {
      this.updateStatus("Starting transcription...")

      // Force mock mode for testing if needed
      if (this.useMockMode) {
        this.updateStatus("Using mock transcriber (forced)")
        return this.mockTranscriber?.start(onTranscript)
      }

      // Validate API key first
      const isValid = await this.validateApiKey()
      if (!isValid) {
        this.updateStatus("Falling back to mock transcriber due to invalid API key", true)
        this.useMockMode = true
        return this.mockTranscriber?.start(onTranscript)
      }

      this.updateStatus("Requesting microphone access...")
      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      this.updateStatus("Microphone access granted")

      await this.setupTranscription(this.stream, onTranscript)
    } catch (error) {
      this.updateStatus(`Error starting transcription: ${error instanceof Error ? error.message : String(error)}`, true)
      throw error
    }
  }

  async startWithStream(stream: MediaStream, onTranscript: (text: string, isFinal: boolean) => void) {
    try {
      this.updateStatus("Starting transcription with stream...")

      // Force mock mode for testing if needed
      if (this.useMockMode) {
        this.updateStatus("Using mock transcriber with stream (forced)")
        return this.mockTranscriber?.startWithStream(stream, onTranscript)
      }

      // Validate API key first
      const isValid = await this.validateApiKey()
      if (!isValid) {
        this.updateStatus("Falling back to mock transcriber due to invalid API key", true)
        this.useMockMode = true
        return this.mockTranscriber?.startWithStream(stream, onTranscript)
      }

      // Use the provided stream
      this.stream = stream

      await this.setupTranscription(this.stream, onTranscript)
    } catch (error) {
      this.updateStatus(`Error starting transcription: ${error instanceof Error ? error.message : String(error)}`, true)
      throw error
    }
  }

  private async setupTranscription(stream: MediaStream, onTranscript: (text: string, isFinal: boolean) => void) {
    if (!this.openai) {
      throw new Error("OpenAI client is not initialized. Please validate the API key.")
    }

    this.mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
    this.mediaRecorder.addEventListener("dataavailable", (event) => {
      this.audioChunks.push(event.data)
    })

    this.mediaRecorder.addEventListener("stop", async () => {
      const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" })
      this.audioChunks = []

      try {
        this.updateStatus("Sending audio to OpenAI Whisper...")
        const formData = new FormData()
        formData.append("file", audioBlob, "recording.webm")
        formData.append("model", "whisper-1")

        const resp = await this.openai?.audio.transcriptions.create({
          file: audioBlob,
          model: "whisper-1",
          response_format: "verbose_json",
        })

        if (resp) {
          this.updateStatus(`Received transcript from OpenAI Whisper: ${resp.text}`)
          onTranscript(resp.text, true) // Mark as final transcript
        } else {
          this.updateStatus("Received empty transcript from OpenAI Whisper", true)
          onTranscript("", true) // Send empty transcript
        }
      } catch (error) {
        this.updateStatus(`Error transcribing audio: ${error instanceof Error ? error.message : String(error)}`, true)
        onTranscript(
          "Sorry, I encountered an error while transcribing audio. Please check your OpenAI API key and network connection.",
          true,
        )
      } finally {
        this.isRecording = false
      }
    })

    this.mediaRecorder.start()
    this.isRecording = true
    this.updateStatus("Transcription started")
  }

  stop() {
    this.isRecording = false

    // Stop mock transcriber if active
    if (this.useMockMode && this.mockTranscriber) {
      this.mockTranscriber.stop()
    }

    // Stop recording
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop()
    }

    // Stop all audio tracks
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
  }

  // Method to force mock mode for testing
  enableMockMode() {
    this.useMockMode = true
    if (!this.mockTranscriber) {
      this.mockTranscriber = new MockTranscriber()
    }
    this.updateStatus("Mock mode enabled")
  }

  // Method to disable mock mode and force OpenAI Whisper
  disableMockMode() {
    this.useMockMode = false
    this.updateStatus("Mock mode disabled, will use OpenAI Whisper")
  }
}
