"use client"
import { Button } from "@/components/ui/button"
import { Mic, Clock } from "lucide-react"

// Add import for the CSS at the top
import "@/app/conversation.css"

import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { ArrowRight, Sparkles, Shield } from "lucide-react"

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-violet-50 to-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-6">
                Ace Your Next Interview with AI Assistance
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Interview Copilot provides real-time AI-powered responses to help you navigate tough interview questions
                with confidence. Get instant, professional answers tailored to your experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {session ? (
                  <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                    <Link href="/dashboard">
                      Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                      <Link href="/register">
                        Get Started <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                      <Link href="/login">Log In</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-t-xl">
                    <h3 className="font-semibold">Interview Simulation</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="bg-gray-100 rounded-lg p-4 max-w-[80%]">
                      <p className="text-sm text-gray-500 mb-1">Interviewer:</p>
                      <p>Tell me about a challenging project you worked on and how you overcame obstacles.</p>
                    </div>
                    <div className="bg-indigo-100 rounded-lg p-4 max-w-[80%] ml-auto">
                      <p className="text-sm text-indigo-500 mb-1">AI Response:</p>
                      <p>
                        In my previous role at XYZ Corp, I led a complex migration project with a tight deadline. The
                        main challenge was coordinating across three different teams while maintaining system uptime.
                      </p>
                      <p className="mt-2">
                        I implemented a phased approach with clear milestones, daily stand-ups, and a shared dashboard
                        for real-time progress tracking. When we encountered an unexpected data consistency issue, I
                        quickly assembled a task force to develop a validation script that identified and resolved the
                        discrepancies.
                      </p>
                      <p className="mt-2">
                        The project was delivered on time with 99.9% uptime maintained throughout the migration, and it
                        resulted in a 40% improvement in system performance.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 bg-indigo-100 rounded-full p-4 shadow-lg border border-indigo-200">
                  <Sparkles className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-4">
              How Interview Copilot Works
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform helps you prepare for interviews by providing real-time assistance during practice
              sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Mic className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Transcription</h3>
              <p className="text-gray-600">
                Our platform transcribes your interview practice sessions in real-time, capturing every question and
                response.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Responses</h3>
              <p className="text-gray-600">
                Get professional, tailored responses to interview questions based on your experience and the job
                requirements.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">30-Second Window</h3>
              <p className="text-gray-600">
                Our system maintains a 30-second rolling transcript window, ensuring context-aware responses to your
                interview questions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Start with 100 free credits when you sign up. Purchase more credits as you need them.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Small</h3>
                  <div className="bg-indigo-100 rounded-full px-3 py-1 text-xs font-medium text-indigo-600">
                    Popular
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$9.99</span>
                </div>
                <p className="text-gray-600 mb-6">100 credits for interview practice sessions</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <Shield className="h-5 w-5 text-green-500 mr-2" />
                    <span>Real-time transcription</span>
                  </li>
                  <li className="flex items-center">
                    <Shield className="h-5 w-5 text-green-500 mr-2" />
                    <span>AI-powered responses</span>
                  </li>
                  <li className="flex items-center">
                    <Shield className="h-5 w-5 text-green-500 mr-2" />
                    <span>Export transcripts</span>
                  </li>
                </ul>
                <Button asChild className="w-full" variant="outline">
                  <Link href={session ? "/dashboard" : "/register"}>Get Started</Link>
                </Button>
              </div>
            </div>

            <div className="bg-indigo-600 rounded-xl shadow-lg transform scale-105">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-white">Medium</h3>
                  <div className="bg-white rounded-full px-3 py-1 text-xs font-medium text-indigo-600">Best Value</div>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">$39.99</span>
                </div>
                <p className="text-indigo-100 mb-6">500 credits for interview practice sessions</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center text-white">
                    <Shield className="h-5 w-5 text-indigo-200 mr-2" />
                    <span>Real-time transcription</span>
                  </li>
                  <li className="flex items-center text-white">
                    <Shield className="h-5 w-5 text-indigo-200 mr-2" />
                    <span>AI-powered responses</span>
                  </li>
                  <li className="flex items-center text-white">
                    <Shield className="h-5 w-5 text-indigo-200 mr-2" />
                    <span>Export transcripts</span>
                  </li>
                  <li className="flex items-center text-white">
                    <Shield className="h-5 w-5 text-indigo-200 mr-2" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button asChild className="w-full bg-white text-indigo-600 hover:bg-indigo-50">
                  <Link href={session ? "/dashboard" : "/register"}>Get Started</Link>
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Large</h3>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$69.99</span>
                </div>
                <p className="text-gray-600 mb-6">1000 credits for interview practice sessions</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <Shield className="h-5 w-5 text-green-500 mr-2" />
                    <span>Real-time transcription</span>
                  </li>
                  <li className="flex items-center">
                    <Shield className="h-5 w-5 text-green-500 mr-2" />
                    <span>AI-powered responses</span>
                  </li>
                  <li className="flex items-center">
                    <Shield className="h-5 w-5 text-green-500 mr-2" />
                    <span>Export transcripts</span>
                  </li>
                  <li className="flex items-center">
                    <Shield className="h-5 w-5 text-green-500 mr-2" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button asChild className="w-full" variant="outline">
                  <Link href={session ? "/dashboard" : "/register"}>Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Ace Your Next Interview?</h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
            Sign up today and get 100 free credits to start practicing with our AI-powered interview assistant.
          </p>
          <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50">
            <Link href={session ? "/dashboard" : "/register"}>
              {session ? "Go to Dashboard" : "Get Started for Free"}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
