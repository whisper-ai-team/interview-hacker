"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { getParsedResumeFromStorage, type ParsedResume } from "@/utils/resume-parser"
import { clearResumeFromStorage } from "@/utils/resume-context"
import {
  Briefcase,
  GraduationCap,
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Trash2,
  FileText,
  Code,
} from "lucide-react"

export default function ResumeDisplay() {
  const [resume, setResume] = useState<ParsedResume | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const parsedResume = getParsedResumeFromStorage()
    setResume(parsedResume)
  }, [])

  const handleDeleteResume = () => {
    clearResumeFromStorage()
    setResume(null)
  }

  if (!resume) {
    return null
  }

  return (
    <Card className="w-full shadow-md border border-indigo-100">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-indigo-700">Resume</CardTitle>
            <CardDescription>Your uploaded resume information</CardDescription>
          </div>
          <Button variant="destructive" size="sm" onClick={handleDeleteResume} className="flex items-center gap-1">
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full rounded-none border-b border-indigo-100 bg-indigo-50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white">
              <User className="h-4 w-4 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="experience" className="data-[state=active]:bg-white">
              <Briefcase className="h-4 w-4 mr-1" />
              Experience
            </TabsTrigger>
            <TabsTrigger value="education" className="data-[state=active]:bg-white">
              <GraduationCap className="h-4 w-4 mr-1" />
              Education
            </TabsTrigger>
            <TabsTrigger value="skills" className="data-[state=active]:bg-white">
              <Code className="h-4 w-4 mr-1" />
              Skills
            </TabsTrigger>
            <TabsTrigger value="raw" className="data-[state=active]:bg-white">
              <FileText className="h-4 w-4 mr-1" />
              Raw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-4">
            <div className="space-y-4">
              {/* Contact Information */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-indigo-700">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {resume.contact?.name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      <span>{resume.contact.name}</span>
                    </div>
                  )}
                  {resume.contact?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-indigo-500" />
                      <span>{resume.contact.email}</span>
                    </div>
                  )}
                  {resume.contact?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-indigo-500" />
                      <span>{resume.contact.phone}</span>
                    </div>
                  )}
                  {resume.contact?.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-indigo-500" />
                      <span>{resume.contact.location}</span>
                    </div>
                  )}
                  {resume.contact?.linkedin && (
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-indigo-500" />
                      <span>{resume.contact.linkedin}</span>
                    </div>
                  )}
                  {resume.contact?.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-indigo-500" />
                      <span>{resume.contact.website}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary of Skills */}
              {resume.skills.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-indigo-700">Key Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.slice(0, 10).map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {resume.skills.length > 10 && (
                      <Badge variant="outline" className="cursor-pointer" onClick={() => setActiveTab("skills")}>
                        +{resume.skills.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Latest Experience */}
              {resume.experience.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-indigo-700">Latest Experience</h3>
                  <div className="border rounded-md p-3 bg-indigo-50/50">
                    <div className="font-medium">{resume.experience[0].title}</div>
                    {resume.experience[0].company && (
                      <div className="text-sm text-gray-600">{resume.experience[0].company}</div>
                    )}
                    {resume.experience[0].date && (
                      <div className="text-xs text-gray-500">{resume.experience[0].date}</div>
                    )}
                    {resume.experience[0].description && (
                      <div className="mt-2 text-sm">
                        {resume.experience[0].description.length > 150
                          ? resume.experience[0].description.substring(0, 150) + "..."
                          : resume.experience[0].description}
                      </div>
                    )}
                    {resume.experience.length > 1 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto mt-1 text-indigo-600"
                        onClick={() => setActiveTab("experience")}
                      >
                        View all experience ({resume.experience.length})
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Latest Education */}
              {resume.education.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-indigo-700">Education</h3>
                  <div className="border rounded-md p-3 bg-indigo-50/50">
                    <div className="font-medium">{resume.education[0].degree}</div>
                    {resume.education[0].institution && (
                      <div className="text-sm text-gray-600">{resume.education[0].institution}</div>
                    )}
                    {resume.education[0].date && (
                      <div className="text-xs text-gray-500">{resume.education[0].date}</div>
                    )}
                    {resume.education.length > 1 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto mt-1 text-indigo-600"
                        onClick={() => setActiveTab("education")}
                      >
                        View all education ({resume.education.length})
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="experience" className="p-4">
            <h3 className="text-lg font-semibold text-indigo-700 mb-4">Work Experience</h3>
            {resume.experience.length > 0 ? (
              <div className="space-y-4">
                {resume.experience.map((exp, index) => (
                  <div key={index} className="border rounded-md p-4 bg-white">
                    <div className="font-medium text-indigo-700">{exp.title}</div>
                    {exp.company && <div className="text-sm font-medium">{exp.company}</div>}
                    {exp.date && <div className="text-xs text-gray-500 mb-2">{exp.date}</div>}
                    {exp.description && <div className="text-sm whitespace-pre-line">{exp.description}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No experience information found</div>
            )}
          </TabsContent>

          <TabsContent value="education" className="p-4">
            <h3 className="text-lg font-semibold text-indigo-700 mb-4">Education</h3>
            {resume.education.length > 0 ? (
              <div className="space-y-4">
                {resume.education.map((edu, index) => (
                  <div key={index} className="border rounded-md p-4 bg-white">
                    <div className="font-medium text-indigo-700">{edu.degree}</div>
                    {edu.institution && <div className="text-sm font-medium">{edu.institution}</div>}
                    {edu.date && <div className="text-xs text-gray-500 mb-2">{edu.date}</div>}
                    {edu.description && <div className="text-sm whitespace-pre-line">{edu.description}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No education information found</div>
            )}
          </TabsContent>

          <TabsContent value="skills" className="p-4">
            <h3 className="text-lg font-semibold text-indigo-700 mb-4">Skills</h3>
            {resume.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 py-1.5"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No skills information found</div>
            )}
          </TabsContent>

          <TabsContent value="raw" className="p-0">
            <ScrollArea className="h-[400px] w-full">
              <pre className="p-4 text-xs font-mono whitespace-pre-wrap">{resume.raw}</pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
