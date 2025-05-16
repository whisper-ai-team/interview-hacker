"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  Sparkles,
  Shield,
  Mic,
  Clock,
  CheckCircle,
  ChevronRight,
  MessageSquare,
  BarChart3,
  Zap,
} from "lucide-react"
import { useInView } from "react-intersection-observer"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Replace the existing Home component with this enhanced version that includes more animations
export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [session, setSession] = useState(null)
  const [isScrolled, setIsScrolled] = useState(false)

  // Add these refs for scroll animations
  const { ref: featuresRef, inView: featuresInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const { ref: pricingRef, inView: pricingInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const { ref: faqRef, inView: faqInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const { ref: ctaRef, inView: ctaInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // Simulate session check on client side
  useEffect(() => {
    setMounted(true)
    // In a real app, you'd use a hook like useSession() from next-auth
    // This is just for demo purposes
    const checkSession = async () => {
      try {
        // Mock session check
        const hasSession = localStorage.getItem("mockSession") === "true"
        setSession(hasSession ? {} : null)
      } catch (e) {
        setSession(null)
      }
    }

    checkSession()

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!mounted) {
    return null // Prevent hydration errors
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar - Add animation to the navbar */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-500 ${isScrolled ? "bg-background/80 backdrop-blur-md border-b shadow-subtle animate-fade-in" : "bg-transparent"}`}
      >
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center animate-pulse">
              <MessageSquare className="size-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl">InterviewHackr</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium hover:text-primary transition-colors hover:scale-105 transition-transform"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium hover:text-primary transition-colors hover:scale-105 transition-transform"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium hover:text-primary transition-colors hover:scale-105 transition-transform"
            >
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {session ? (
              <Button asChild size="sm" className="animate-fade-in hover:scale-105 transition-transform">
                <Link href="/dashboard">
                  Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex hover:scale-105 transition-transform"
                >
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm" className="hover:scale-105 transition-transform">
                  <Link href="/register">
                    Sign up free <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section - Enhanced with more animations */}
      <section className="relative overflow-hidden pt-24 pb-32">
        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>

        {/* Animated particles */}
        <div className="absolute inset-0 -z-5 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary/10"
              style={{
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${Math.random() * 10 + 10}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: Math.random() * 0.5 + 0.2,
              }}
            />
          ))}
        </div>

        <div className="container relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
              <div className="space-y-4">
                <Badge
                  variant="outline"
                  className="px-3 py-1 border-primary/30 bg-primary/10 text-primary animate-bounce-subtle"
                >
                  <Sparkles className="mr-1 h-3 w-3 animate-pulse" /> AI-Powered Interview Preparation
                </Badge>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight gradient-heading animate-slide-up">
                  Ace Your Next Interview with AI Assistance
                </h1>

                <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 animate-slide-up [animation-delay:150ms]">
                  Get real-time AI-powered responses to help you navigate tough interview questions with confidence.
                  Perfect your answers and land your dream job.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up [animation-delay:300ms]">
                {session ? (
                  <Button asChild size="lg" className="h-12 px-8 hover:scale-105 transition-transform shadow-glow">
                    <Link href="/dashboard">
                      Go to Dashboard{" "}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      asChild
                      size="lg"
                      className="h-12 px-8 hover:scale-105 transition-transform shadow-glow group"
                    >
                      <Link href="/register">
                        Start for free{" "}
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="hover:scale-105 transition-transform">
                      <Link href="/login">Log In</Link>
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 animate-slide-up [animation-delay:450ms]">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="size-8 rounded-full border-2 border-background bg-muted overflow-hidden hover:scale-110 hover:z-10 transition-all duration-300"
                      style={{ transitionDelay: `${i * 50}ms` }}
                    >
                      <Image
                        src={`/diverse-group.png?height=32&width=32&query=person ${i}`}
                        alt={`User ${i}`}
                        width={32}
                        height={32}
                      />
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground animate-pulse">4,000+</span> professionals using
                  Interview Copilot
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 animate-fade-in [animation-delay:300ms]">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-400/30 rounded-2xl blur-md opacity-70 animate-pulse"></div>
                <Card className="glass-card overflow-hidden border-none hover:shadow-xl transition-all duration-500">
                  <div className="bg-gradient-to-r from-primary to-purple-400 text-primary-foreground p-4 rounded-t-xl">
                    <div className="flex items-center">
                      <div className="flex space-x-2">
                        <div className="size-3 rounded-full bg-red-500"></div>
                        <div className="size-3 rounded-full bg-yellow-500"></div>
                        <div className="size-3 rounded-full bg-green-500"></div>
                      </div>
                      <h3 className="font-medium ml-4">Interview Simulation</h3>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-6 bg-card/80 backdrop-blur-sm">
                    <div className="bg-muted/50 rounded-lg p-4 max-w-[80%] animate-slide-in-left hover:bg-muted/70 transition-colors duration-300">
                      <p className="text-sm text-muted-foreground mb-1">Interviewer:</p>
                      <p>Tell me about a challenging project you worked on and how you overcame obstacles.</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-400/20 rounded-lg blur-sm animate-pulse"></div>
                      <div className="bg-primary/10 rounded-lg p-4 max-w-[90%] ml-auto relative animate-slide-in-right hover:bg-primary/20 transition-colors duration-300">
                        <div className="absolute top-2 right-2">
                          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                        </div>
                        <p className="text-sm text-primary mb-1 font-medium">AI Response:</p>
                        <p className="animate-typing overflow-hidden whitespace-nowrap">
                          In my previous role at XYZ Corp, I led a complex migration project with a tight deadline. The
                          main challenge was coordinating across three different teams while maintaining system uptime.
                        </p>
                        <p className="mt-2 animate-typing [animation-delay:2s] overflow-hidden whitespace-nowrap">
                          I implemented a phased approach with clear milestones, daily stand-ups, and a shared dashboard
                          for real-time progress tracking. When we encountered an unexpected data consistency issue, I
                          quickly assembled a task force to develop a validation script that identified and resolved the
                          discrepancies.
                        </p>
                        <p className="mt-2 animate-typing [animation-delay:4s] overflow-hidden whitespace-nowrap">
                          The project was delivered on time with 99.9% uptime maintained throughout the migration, and
                          it resulted in a 40% improvement in system performance.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                      <Button variant="ghost" size="sm" className="h-8 gap-1 hover:scale-105 transition-transform">
                        <Zap className="h-3.5 w-3.5" />
                        Regenerate
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 gap-1 hover:scale-105 transition-transform">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="absolute -bottom-6 -right-6 bg-primary/20 backdrop-blur-md rounded-full p-4 shadow-lg border border-primary/30 animate-float">
                  <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Add scroll animations */}
      <section id="features" className="py-24 bg-muted/30" ref={featuresRef}>
        <div className="container">
          <div
            className={`text-center mb-16 max-w-3xl mx-auto transition-all duration-700 ${featuresInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <Badge variant="outline" className="mb-4 px-3 py-1 border-primary/30 bg-primary/10 text-primary">
              Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold gradient-heading mb-4">How Interview Copilot Works</h2>
            <p className="text-lg text-muted-foreground">
              Our AI-powered platform helps you prepare for interviews by providing real-time assistance during practice
              sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Mic className="h-5 w-5" />,
                title: "Real-time Transcription",
                description:
                  "Our platform transcribes your interview practice sessions in real-time, capturing every question and response.",
              },
              {
                icon: <Sparkles className="h-5 w-5" />,
                title: "AI-Powered Responses",
                description:
                  "Get professional, tailored responses to interview questions based on your experience and the job requirements.",
              },
              {
                icon: <Clock className="h-5 w-5" />,
                title: "30-Second Window",
                description:
                  "Our system maintains a 30-second rolling transcript window, ensuring context-aware responses to your interview questions.",
              },
              {
                icon: <MessageSquare className="h-5 w-5" />,
                title: "Personalized Feedback",
                description:
                  "Receive detailed feedback on your responses with suggestions for improvement and alternative approaches.",
              },
              {
                icon: <BarChart3 className="h-5 w-5" />,
                title: "Performance Analytics",
                description:
                  "Track your progress over time with detailed analytics on your response quality and improvement areas.",
              },
              {
                icon: <Shield className="h-5 w-5" />,
                title: "Secure & Private",
                description:
                  "Your practice sessions are encrypted and never shared. We prioritize your privacy and data security.",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className={`group border-border/40 bg-background hover:shadow-md transition-all duration-500 hover:border-primary/50 hover:-translate-y-1 ${featuresInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 group-hover:scale-110 transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Add scroll animations */}
      <section id="pricing" className="py-24" ref={pricingRef}>
        <div className="container">
          <div
            className={`text-center mb-16 max-w-3xl mx-auto transition-all duration-700 ${pricingInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <Badge variant="outline" className="mb-4 px-3 py-1 border-primary/30 bg-primary/10 text-primary">
              Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold gradient-heading mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground">
              Start with 100 free credits when you sign up. Purchase more credits as you need them.
            </p>
          </div>

          <Tabs
            defaultValue="monthly"
            className={`w-full max-w-3xl mx-auto mb-8 transition-all duration-700 ${pricingInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            style={{ transitionDelay: "100ms" }}
          >
            <TabsList className="grid w-full max-w-xs mx-auto grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly (Save 20%)</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {[
                  {
                    name: "Small",
                    price: "$9.99",
                    credits: "100",
                    popular: true,
                    features: ["Real-time transcription", "AI-powered responses", "Export transcripts"],
                  },
                  {
                    name: "Medium",
                    price: "$39.99",
                    credits: "500",
                    bestValue: true,
                    features: [
                      "Real-time transcription",
                      "AI-powered responses",
                      "Export transcripts",
                      "Priority support",
                    ],
                  },
                  {
                    name: "Large",
                    price: "$69.99",
                    credits: "1000",
                    features: [
                      "Real-time transcription",
                      "AI-powered responses",
                      "Export transcripts",
                      "Priority support",
                    ],
                  },
                ].map((plan, index) => (
                  <Card
                    key={index}
                    className={`overflow-hidden transition-all duration-500 hover:shadow-lg hover:-translate-y-2 ${plan.bestValue ? "relative border-primary shadow-lg" : "border-border/50"} ${pricingInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                    style={{ transitionDelay: `${(index + 1) * 200}ms` }}
                  >
                    {plan.bestValue && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg animate-pulse">
                        Best Value
                      </div>
                    )}
                    {plan.popular && !plan.bestValue && (
                      <div className="absolute top-0 right-0 bg-muted text-xs font-medium px-3 py-1 rounded-bl-lg">
                        Popular
                      </div>
                    )}
                    <CardContent
                      className={`p-6 ${plan.bestValue ? "bg-gradient-to-b from-primary/5 to-background" : ""}`}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">{plan.name}</h3>
                      </div>
                      <div className="mb-4">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <p className="text-muted-foreground mb-6">
                        {plan.credits} credits for interview practice sessions
                      </p>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-primary mr-2" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        asChild
                        className={`w-full hover:scale-105 transition-transform ${plan.bestValue ? "shadow-glow" : "bg-muted hover:bg-muted/80 text-foreground"}`}
                        variant={plan.bestValue ? "default" : "outline"}
                      >
                        <Link href={session ? "/dashboard" : "/register"}>Get Started</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="yearly" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {[
                  {
                    name: "Small",
                    price: "$95.90",
                    originalPrice: "$119.88",
                    credits: "100",
                    popular: true,
                    features: ["Real-time transcription", "AI-powered responses", "Export transcripts"],
                  },
                  {
                    name: "Medium",
                    price: "$383.90",
                    originalPrice: "$479.88",
                    credits: "500",
                    bestValue: true,
                    features: [
                      "Real-time transcription",
                      "AI-powered responses",
                      "Export transcripts",
                      "Priority support",
                    ],
                  },
                  {
                    name: "Large",
                    price: "$671.90",
                    originalPrice: "$839.88",
                    credits: "1000",
                    features: [
                      "Real-time transcription",
                      "AI-powered responses",
                      "Export transcripts",
                      "Priority support",
                    ],
                  },
                ].map((plan, index) => (
                  <Card
                    key={index}
                    className={`overflow-hidden transition-all duration-500 hover:shadow-lg hover:-translate-y-2 ${plan.bestValue ? "relative border-primary shadow-lg" : "border-border/50"}`}
                  >
                    {plan.bestValue && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg animate-pulse">
                        Best Value
                      </div>
                    )}
                    {plan.popular && !plan.bestValue && (
                      <div className="absolute top-0 right-0 bg-muted text-xs font-medium px-3 py-1 rounded-bl-lg">
                        Popular
                      </div>
                    )}
                    <CardContent
                      className={`p-6 ${plan.bestValue ? "bg-gradient-to-b from-primary/5 to-background" : ""}`}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">{plan.name}</h3>
                      </div>
                      <div className="mb-1">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground">/year</span>
                      </div>
                      <div className="mb-4">
                        <span className="text-sm text-muted-foreground line-through">{plan.originalPrice}</span>
                        <span className="ml-2 text-sm text-green-500 font-medium animate-pulse">Save 20%</span>
                      </div>
                      <p className="text-muted-foreground mb-6">{plan.credits} credits/month for interview practice</p>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-primary mr-2" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        asChild
                        className={`w-full hover:scale-105 transition-transform ${plan.bestValue ? "shadow-glow" : "bg-muted hover:bg-muted/80 text-foreground"}`}
                        variant={plan.bestValue ? "default" : "outline"}
                      >
                        <Link href={session ? "/dashboard" : "/register"}>Get Started</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div
            className={`text-center text-sm text-muted-foreground mt-8 transition-all duration-700 ${pricingInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            style={{ transitionDelay: "800ms" }}
          >
            All plans include a 14-day money-back guarantee. No questions asked.
          </div>
        </div>
      </section>

      {/* FAQ Section - Add scroll animations */}
      <section id="faq" className="py-24 bg-muted/30" ref={faqRef}>
        <div className="container">
          <div
            className={`text-center mb-16 max-w-3xl mx-auto transition-all duration-700 ${faqInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <Badge variant="outline" className="mb-4 px-3 py-1 border-primary/30 bg-primary/10 text-primary">
              FAQ
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold gradient-heading mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">Everything you need to know about Interview Copilot</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                q: "How does Interview Copilot work?",
                a: "Interview Copilot uses advanced AI to transcribe your practice interview questions and generate professional responses in real-time. It maintains context through a 30-second rolling window and provides tailored answers based on your experience and the job requirements.",
              },
              {
                q: "What happens when I run out of credits?",
                a: "When your credits are depleted, you can purchase more through your dashboard. We offer flexible packages to suit your needs, and unused credits roll over month to month.",
              },
              {
                q: "Is my interview data secure?",
                a: "Yes, we take security seriously. All your practice sessions are encrypted and stored securely. We never share your data with third parties, and you can delete your data at any time.",
              },
              {
                q: "Can I use Interview Copilot on my phone?",
                a: "Yes, Interview Copilot is fully responsive and works on desktop, tablet, and mobile devices. Practice your interview skills anywhere, anytime.",
              },
              {
                q: "Do you offer refunds?",
                a: "Yes, we offer a 14-day money-back guarantee on all plans. If you're not satisfied with our service, contact our support team for a full refund.",
              },
            ].map((item, index) => (
              <Card
                key={index}
                className={`border-border/40 hover:border-primary/30 hover:shadow-md transition-all duration-500 ${faqInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="font-medium text-lg mb-2">{item.q}</div>
                  <div className="text-muted-foreground">{item.a}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Add scroll animations */}
      <section className="py-24 relative overflow-hidden" ref={ctaRef}>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>

        {/* Animated particles */}
        <div className="absolute inset-0 -z-5 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary/20"
              style={{
                width: `${Math.random() * 15 + 5}px`,
                height: `${Math.random() * 15 + 5}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${Math.random() * 10 + 15}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: Math.random() * 0.7 + 0.3,
              }}
            />
          ))}
        </div>

        <div className="container relative z-10 text-center">
          <div
            className={`max-w-3xl mx-auto transition-all duration-700 ${ctaInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <Badge
              variant="outline"
              className="mb-4 px-3 py-1 border-primary/30 bg-primary/10 text-primary animate-bounce-subtle"
            >
              Get Started Today
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold gradient-heading mb-6">Ready to Ace Your Next Interview?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Sign up today and get 100 free credits to start practicing with our AI-powered interview assistant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="h-12 px-8 hover:scale-105 transition-transform shadow-glow group">
                <Link href={session ? "/dashboard" : "/register"}>
                  {session ? "Go to Dashboard" : "Start for Free"}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="hover:scale-105 transition-transform group">
                <Link href="#features">
                  Learn More
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-8 rounded-lg bg-primary flex items-center justify-center animate-pulse">
                  <MessageSquare className="size-5 text-primary-foreground" />
                </div>
                <span className="font-heading font-bold text-xl">InterviewHackr</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                AI-powered interview preparation to help you land your dream job.
              </p>
              <div className="flex gap-4">
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors hover:scale-110 transform"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors hover:scale-110 transform"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors hover:scale-110 transform"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="#features"
                    className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block transform"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block transform"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block transform"
                  >
                    Testimonials
                  </Link>
                </li>
                <li>
                  <Link
                    href="#faq"
                    className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block transform"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block transform"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block transform"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block transform"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block transform"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block transform"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block transform"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block transform"
                  >
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Interview Copilot. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground mt-4 md:mt-0">Made with ❤️ for job seekers everywhere</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
