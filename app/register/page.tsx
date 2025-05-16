import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle } from "lucide-react"

import { authOptions } from "@/lib/auth"
import { RegisterForm } from "@/components/auth/register-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function RegisterPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center md:flex-row">
      {/* Left side - Form */}
      <div className="flex w-full flex-1 items-center justify-center p-6 md:w-1/2">
        <Card className="w-full max-w-md border-none shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl font-bold">Create your account</CardTitle>
            <CardDescription className="text-center">
              Sign up for Interview Copilot and get started today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />

            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Image and features */}
      <div className="hidden w-full flex-1 flex-col justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background p-10 md:flex md:w-1/2">
        <div className="relative mx-auto aspect-video w-full max-w-lg overflow-hidden rounded-xl">
          <Image
            src="/placeholder-kiizg.png"
            alt="Interview Copilot Dashboard Preview"
            width={800}
            height={600}
            className="object-cover shadow-2xl"
            priority
          />
        </div>

        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-semibold">Supercharge your interview preparation</h3>

          <div className="space-y-2">
            {[
              "Practice with AI-powered mock interviews",
              "Get personalized feedback on your responses",
              "Access a library of common interview questions",
              "Track your progress and improvement over time",
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-5 w-5 text-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <Button variant="link" className="group mt-4 flex items-center gap-1 p-0 text-primary">
            Learn more about our features
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
