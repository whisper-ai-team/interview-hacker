"use client"

import { useState } from "react"
import { Chrome, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Tab {
  id: string
  title: string
  url: string
  favicon: string
}

interface TabSelectorProps {
  tabs: Tab[]
  onSelect: (tabId: string) => void
  onClose: () => void
}

export function TabSelector({ tabs, onSelect, onClose }: TabSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTabs = tabs.filter(
    (tab) =>
      tab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tab.url.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Select Browser Tab</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tabs..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {filteredTabs.length > 0 ? (
              filteredTabs.map((tab) => (
                <div
                  key={tab.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                  onClick={() => onSelect(tab.id)}
                >
                  <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded flex items-center justify-center w-8 h-8">
                    {tab.favicon === "🌐" ? (
                      <Chrome className="h-5 w-5 text-blue-500" />
                    ) : (
                      <span className="text-lg">{tab.favicon}</span>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium text-sm truncate">{tab.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tab.url}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No tabs match your search</div>
            )}
          </div>
        </div>

        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-xs text-amber-600">
            <strong>Note:</strong> These are simulated tabs for demonstration purposes.
          </div>
          <Button variant="outline" className="mr-2" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
