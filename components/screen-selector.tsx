"use client"

import { useState, useEffect } from "react"
import { X, Search, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ScreenInfo {
  title?: string
  url?: string
}

interface ScreenSelectorProps {
  onSelect: (stream: MediaStream, screenInfo: ScreenInfo) => void
  onClose: () => void
}

export function ScreenSelector({ onSelect, onClose }: ScreenSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [availableScreens, setAvailableScreens] = useState<MediaStream[]>([])
  const [selectedScreen, setSelectedScreen] = useState<MediaStream | null>(null)

  useEffect(() => {
    // This is a placeholder for fetching available screens.
    // In a real implementation, you would use the getDisplayMedia API
    // to get a list of available screens and tabs.
    // For this demo, we'll simulate a few screens.
    const simulatedScreens: MediaStream[] = [
      new MediaStream(), // Placeholder
    ]
    setAvailableScreens(simulatedScreens)
  }, [])

  const handleScreenSelect = async () => {
    try {
      // Request screen sharing with audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      // Get information about the shared screen/tab
      const videoTrack = stream.getVideoTracks()[0]
      const settings = videoTrack.getSettings()

      // Extract title and URL if available (may not be available in all browsers)
      const screenInfo = {
        title:
          settings.displaySurface === "browser" ? videoTrack.label.replace(" (browser tab)", "") : videoTrack.label,
        url: undefined,
      }

      onSelect(stream, screenInfo)
      onClose()
    } catch (error) {
      console.error("Error starting screen share:", error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Select Screen or Tab</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search screens..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {availableScreens.length > 0 ? (
              availableScreens.map((screen, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                  onClick={handleScreenSelect}
                >
                  <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded flex items-center justify-center w-8 h-8">
                    <Monitor className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium text-sm truncate">Screen {index + 1}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Click to share this screen</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No screens available</div>
            )}
          </div>
        </div>

        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-xs text-amber-600">
            <strong>Note:</strong> These are simulated screens for demonstration purposes.
          </div>
          <Button variant="outline" className="mr-2" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
