"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FileText, Upload, X, Check, AlertCircle, FileUp, Trash2, AlertTriangle } from "lucide-react"
import { saveResumeToStorage, getResumeFromStorage, clearResumeFromStorage } from "@/utils/resume-context"

export function ResumeUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [existingResume, setExistingResume] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check for existing resume on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const resume = getResumeFromStorage()
      setExistingResume(resume)
    }
  }, [])

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Reset states
    setError(null)
    setWarning(null)
    setSuccess(false)
    setFile(selectedFile)

    // Check file type and show warnings
    if (selectedFile.type === "application/pdf") {
      setWarning("PDF files may not extract properly. For best results, please use a plain text (.txt) file.")
    }
  }

  // Extract text from file
  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const text = e.target?.result as string

          // Check if this looks like binary PDF data
          if (text.startsWith("%PDF-") || text.includes("endobj") || text.includes("/Type/")) {
            // This is likely binary PDF data that can't be properly read as text
            resolve(
              "Your resume has been uploaded, but the content couldn't be fully extracted because it's a PDF file. The AI will still use your resume information, but for better results, consider uploading a plain text version.",
            )
          } else if (!text || text.trim().length === 0) {
            reject(new Error("Could not extract text from file. The file appears to be empty."))
          } else {
            resolve(text)
          }
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error("Error reading file"))
      }

      reader.readAsText(file)
    })
  }

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Extract text from file
      const text = await extractTextFromFile(file)

      // Save to session storage
      saveResumeToStorage(text, file.name)

      // Update states
      setExtractedText(text)
      setSuccess(true)
      setExistingResume({
        content: text,
        fileName: file.name,
        timestamp: new Date().toISOString(),
      })

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error uploading resume:", error)
      setError(`Upload error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsUploading(false)
      setFile(null)
    }
  }

  // Handle resume deletion
  const handleDeleteResume = () => {
    clearResumeFromStorage()
    setExistingResume(null)
    setExtractedText(null)
    setSuccess(false)
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  // Clean preview text
  const cleanPreviewText = (text: string) => {
    // If it looks like PDF binary data
    if (text.startsWith("%PDF-") || text.includes("endobj") || text.includes("/Type/")) {
      return "[PDF content - Text extraction limited. The AI will still use your resume, but for better results, consider uploading a plain text version.]"
    }
    return text
  }

  return (
    <Card className="w-full shadow-md border border-gray-100">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardTitle className="flex items-center text-indigo-700">
          <FileText className="mr-2 h-5 w-5" />
          Resume Upload
        </CardTitle>
        <CardDescription>Upload your resume to get personalized interview responses</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {existingResume ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-indigo-600 mr-2" />
                <div>
                  <p className="font-medium text-sm">{existingResume.fileName}</p>
                  <p className="text-xs text-gray-500">
                    Uploaded {new Date(existingResume.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteResume}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-lg border border-green-100 bg-green-50 p-3">
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Resume loaded successfully</p>
                  <p className="text-xs text-green-700 mt-1">
                    Your resume will be used to personalize AI responses during interview practice.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Resume Preview:</p>
              <div className="max-h-40 overflow-y-auto p-3 bg-gray-50 rounded-lg text-sm text-gray-700 font-mono">
                {cleanPreviewText(existingResume.content).substring(0, 500)}
                {existingResume.content.length > 500 && "..."}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
              <FileUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-4">Upload your resume in TXT format for best results</p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleFileChange}
                className="mb-4"
              />
              <p className="text-xs text-gray-400">Maximum file size: 5MB</p>
            </div>

            {file && (
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-indigo-600 mr-2" />
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null)
                    setWarning(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ""
                    }
                  }}
                  className="text-gray-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {warning && (
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Warning</p>
                    <p className="text-xs text-amber-700 mt-1">{warning}</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Upload failed</p>
                    <p className="text-xs text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-green-100 bg-green-50 p-3">
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Resume uploaded successfully</p>
                    <p className="text-xs text-green-700 mt-1">
                      Your resume will be used to personalize AI responses during interview practice.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {extractedText && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Extracted Text Preview:</p>
                <div className="max-h-40 overflow-y-auto p-3 bg-gray-50 rounded-lg text-sm text-gray-700 font-mono">
                  {cleanPreviewText(extractedText).substring(0, 500)}
                  {extractedText.length > 500 && "..."}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 flex justify-between">
        {!existingResume && (
          <Button onClick={handleUpload} disabled={!file || isUploading} className="bg-indigo-600 hover:bg-indigo-700">
            {isUploading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Resume
              </>
            )}
          </Button>
        )}
        <div className="text-xs text-gray-500">
          <p>For best results, use a simple text format (.txt)</p>
        </div>
      </CardFooter>
    </Card>
  )
}
