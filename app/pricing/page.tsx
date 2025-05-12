import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"

export default async function PricingPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="py-20 bg-gradient-to-b from-violet-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Start with 100 free credits when you sign up. Purchase more credits as you need them.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-2">Small</h3>
              <div className="text-gray-500 mb-6">For occasional interview practice</div>
              <div className="mb-6">
                <span className="text-5xl font-bold">$9.99</span>
              </div>
              <p className="text-gray-600 mb-8">100 credits for interview practice sessions</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Real-time transcription</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>AI-powered responses</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Export transcripts</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Email support</span>
                </li>
              </ul>
              <Button asChild className="w-full" variant="outline">
                <Link href={session ? "/dashboard" : "/register"}>Get Started</Link>
              </Button>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-xl shadow-2xl transform scale-105 z-10">
            <div className="p-8">
              <div className="bg-white/20 text-white text-xs font-bold uppercase rounded-full px-3 py-1 inline-block mb-4">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Medium</h3>
              <div className="text-indigo-200 mb-6">For regular interview preparation</div>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">$39.99</span>
              </div>
              <p className="text-indigo-100 mb-8">500 credits for interview practice sessions</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-white">
                  <Check className="h-5 w-5 text-indigo-200 mr-3 flex-shrink-0" />
                  <span>Real-time transcription</span>
                </li>
                <li className="flex items-center text-white">
                  <Check className="h-5 w-5 text-indigo-200 mr-3 flex-shrink-0" />
                  <span>AI-powered responses</span>
                </li>
                <li className="flex items-center text-white">
                  <Check className="h-5 w-5 text-indigo-200 mr-3 flex-shrink-0" />
                  <span>Export transcripts</span>
                </li>
                <li className="flex items-center text-white">
                  <Check className="h-5 w-5 text-indigo-200 mr-3 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center text-white">
                  <Check className="h-5 w-5 text-indigo-200 mr-3 flex-shrink-0" />
                  <span>Advanced analytics</span>
                </li>
              </ul>
              <Button asChild className="w-full bg-white text-indigo-600 hover:bg-indigo-50">
                <Link href={session ? "/dashboard" : "/register"}>Get Started</Link>
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-2">Large</h3>
              <div className="text-gray-500 mb-6">For intensive job search</div>
              <div className="mb-6">
                <span className="text-5xl font-bold">$69.99</span>
              </div>
              <p className="text-gray-600 mb-8">1000 credits for interview practice sessions</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Real-time transcription</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>AI-powered responses</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Export transcripts</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Dedicated account manager</span>
                </li>
              </ul>
              <Button asChild className="w-full" variant="outline">
                <Link href={session ? "/dashboard" : "/register"}>Get Started</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-20 max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">What are credits?</h3>
              <p className="text-gray-600">
                Credits are used to power your interview practice sessions. Each AI-generated response costs 1 credit.
                Starting a new interview session costs 10 credits.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Do credits expire?</h3>
              <p className="text-gray-600">
                No, your credits never expire. Use them at your own pace whenever you need to practice for interviews.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Can I get a refund?</h3>
              <p className="text-gray-600">
                We offer a 7-day money-back guarantee if you're not satisfied with our service. Contact our support team
                for assistance.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">How do I get more credits?</h3>
              <p className="text-gray-600">
                You can purchase additional credits at any time from your dashboard. Choose from our Small, Medium, or
                Large packages based on your needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
