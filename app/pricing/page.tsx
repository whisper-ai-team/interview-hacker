"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Check, X, Zap, Shield, Clock, ArrowRight, CheckCircle, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
}

const checkmarkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      delay: 0.2,
    },
  },
}

export default function PricingPage() {
  const { data: session, status } = useSession()
  const [billingPeriod, setBillingPeriod] = useState("monthly")

  // Intersection observer hooks for scroll animations
  const { ref: pricingRef, inView: pricingInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const { ref: faqRef, inView: faqInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // Calculate yearly prices (20% discount)
  const getYearlyPrice = (monthlyPrice) => {
    const yearlyPrice = monthlyPrice * 12 * 0.8
    return yearlyPrice.toFixed(2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Header with subtle animation */}
      <motion.div className="container pt-20 pb-12 text-center" initial="hidden" animate="visible" variants={fadeIn}>
        <Badge variant="outline" className="mb-4 px-3 py-1 border-primary/30 bg-primary/10 text-primary">
          Pricing
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold gradient-heading mb-4">Simple, Transparent Pricing</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Start with 100 free credits when you sign up. Purchase more credits as you need them.
        </p>
      </motion.div>

      {/* Pricing toggle */}
      <div className="container mb-12">
        <Tabs defaultValue="monthly" className="w-full max-w-xs mx-auto" onValueChange={setBillingPeriod}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">
              Yearly
              <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-green-200 text-xs">
                Save 20%
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pricing cards with staggered animation */}
      <motion.div
        className="container pb-20"
        ref={pricingRef}
        initial="hidden"
        animate={pricingInView ? "visible" : "hidden"}
        variants={staggerContainer}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Small Plan */}
          <motion.div variants={cardVariants}>
            <Card className="h-full overflow-hidden border-border/50 hover:border-primary/20 transition-colors duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Small</CardTitle>
                <CardDescription>For occasional interview practice</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="mb-4 space-y-1">
                  <div className="text-4xl font-bold">
                    ${billingPeriod === "monthly" ? "9.99" : getYearlyPrice(9.99)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {billingPeriod === "monthly" ? "per month" : "per year"}
                  </p>
                </div>

                <div className="border-t border-border/50 pt-4 mb-6">
                  <p className="text-sm">100 credits for interview practice sessions</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {["Real-time transcription", "AI-powered responses", "Export transcripts", "Email support"].map(
                    (feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <Check className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ),
                  )}
                  {["Priority support", "Advanced analytics", "Dedicated account manager"].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground">
                      <div className="rounded-full bg-muted p-1 mt-0.5">
                        <X className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href={status === "authenticated" ? "/dashboard" : "/register"}>Get Started</Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Medium Plan (Featured) */}
          <motion.div variants={cardVariants} className="md:-mt-4 md:-mb-4">
            <Card className="h-full border-primary relative shadow-lg overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1 bg-primary"></div>
              <div className="absolute -top-px right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
                Most Popular
              </div>

              <CardHeader className="pb-4 pt-8">
                <CardTitle className="text-2xl">Medium</CardTitle>
                <CardDescription>For regular interview preparation</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="mb-4 space-y-1">
                  <div className="text-4xl font-bold">
                    ${billingPeriod === "monthly" ? "39.99" : getYearlyPrice(39.99)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {billingPeriod === "monthly" ? "per month" : "per year"}
                  </p>
                </div>

                <div className="border-t border-border/50 pt-4 mb-6">
                  <p className="text-sm">500 credits for interview practice sessions</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    "Real-time transcription",
                    "AI-powered responses",
                    "Export transcripts",
                    "Priority support",
                    "Advanced analytics",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {["Dedicated account manager"].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground">
                      <div className="rounded-full bg-muted p-1 mt-0.5">
                        <X className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pb-8">
                <Button asChild className="w-full shadow-glow">
                  <Link href={status === "authenticated" ? "/dashboard" : "/register"}>Get Started</Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Large Plan */}
          <motion.div variants={cardVariants}>
            <Card className="h-full overflow-hidden border-border/50 hover:border-primary/20 transition-colors duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Large</CardTitle>
                <CardDescription>For intensive job search</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="mb-4 space-y-1">
                  <div className="text-4xl font-bold">
                    ${billingPeriod === "monthly" ? "69.99" : getYearlyPrice(69.99)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {billingPeriod === "monthly" ? "per month" : "per year"}
                  </p>
                </div>

                <div className="border-t border-border/50 pt-4 mb-6">
                  <p className="text-sm">1000 credits for interview practice sessions</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    "Real-time transcription",
                    "AI-powered responses",
                    "Export transcripts",
                    "Priority support",
                    "Advanced analytics",
                    "Dedicated account manager",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href={status === "authenticated" ? "/dashboard" : "/register"}>Get Started</Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Feature comparison */}
      <div className="container pb-20">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-center">Compare All Features</CardTitle>
            <CardDescription className="text-center">
              See which plan is right for your interview preparation needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4 font-medium">Feature</th>
                    <th className="text-center py-4 px-4 font-medium">Small</th>
                    <th className="text-center py-4 px-4 font-medium">Medium</th>
                    <th className="text-center py-4 px-4 font-medium">Large</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Credits", small: "100", medium: "500", large: "1000" },
                    { name: "Real-time transcription", small: true, medium: true, large: true },
                    { name: "AI-powered responses", small: true, medium: true, large: true },
                    { name: "Export transcripts", small: true, medium: true, large: true },
                    { name: "Email support", small: true, medium: true, large: true },
                    { name: "Priority support", small: false, medium: true, large: true },
                    { name: "Advanced analytics", small: false, medium: true, large: true },
                    { name: "Dedicated account manager", small: false, medium: false, large: true },
                    { name: "Custom interview templates", small: false, medium: false, large: true },
                    { name: "Team collaboration", small: false, medium: false, large: true },
                  ].map((feature, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-4 px-4">{feature.name}</td>
                      <td className="text-center py-4 px-4">
                        {typeof feature.small === "boolean" ? (
                          feature.small ? (
                            <CheckCircle className="h-5 w-5 text-primary mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          feature.small
                        )}
                      </td>
                      <td className="text-center py-4 px-4">
                        {typeof feature.medium === "boolean" ? (
                          feature.medium ? (
                            <CheckCircle className="h-5 w-5 text-primary mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          feature.medium
                        )}
                      </td>
                      <td className="text-center py-4 px-4">
                        {typeof feature.large === "boolean" ? (
                          feature.large ? (
                            <CheckCircle className="h-5 w-5 text-primary mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          feature.large
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benefits section */}
      <div className="container pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Interview Copilot?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our platform is designed to help you ace your interviews with AI-powered assistance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              icon: <Zap className="h-6 w-6 text-primary" />,
              title: "Instant Feedback",
              description: "Get real-time feedback on your interview responses to improve your performance",
            },
            {
              icon: <Shield className="h-6 w-6 text-primary" />,
              title: "Secure & Private",
              description: "Your data is encrypted and never shared with third parties",
            },
            {
              icon: <Clock className="h-6 w-6 text-primary" />,
              title: "Practice Anytime",
              description: "Access the platform 24/7 to practice for interviews on your schedule",
            },
          ].map((benefit, i) => (
            <Card
              key={i}
              className="border-border/50 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 p-3 w-fit mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-medium mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ section with animation */}
      <motion.div
        className="container pb-20"
        ref={faqRef}
        initial="hidden"
        animate={faqInView ? "visible" : "hidden"}
        variants={fadeIn}
      >
        <Card className="border-border/50 max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Frequently Asked Questions</CardTitle>
            <CardDescription className="text-center">
              Everything you need to know about our pricing and credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  question: "What are credits?",
                  answer:
                    "Credits are used to power your interview practice sessions. Each AI-generated response costs 1 credit. Starting a new interview session costs 10 credits.",
                },
                {
                  question: "Do credits expire?",
                  answer:
                    "No, your credits never expire. Use them at your own pace whenever you need to practice for interviews.",
                },
                {
                  question: "Can I get a refund?",
                  answer:
                    "We offer a 7-day money-back guarantee if you're not satisfied with our service. Contact our support team for assistance.",
                },
                {
                  question: "How do I get more credits?",
                  answer:
                    "You can purchase additional credits at any time from your dashboard. Choose from our Small, Medium, or Large packages based on your needs.",
                },
                {
                  question: "Can I upgrade my plan?",
                  answer:
                    "Yes, you can upgrade your plan at any time. When you upgrade, you'll immediately receive the additional credits and benefits of your new plan.",
                },
                {
                  question: "Is there a free trial?",
                  answer:
                    "Yes! When you sign up, you automatically receive 100 free credits to try out the platform before making a purchase.",
                },
              ].map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA section */}
      <div className="container pb-20">
        <Card className="border-primary/20 bg-primary/5 max-w-4xl mx-auto overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-70"></div>
          <CardContent className="p-8 md:p-12 relative">
            <div className="text-center max-w-2xl mx-auto">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Ready to Ace Your Next Interview?</h2>
              <p className="text-muted-foreground mb-8">
                Sign up today and get 100 free credits to start practicing with our AI-powered interview assistant.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="shadow-glow">
                  <Link href={status === "authenticated" ? "/dashboard" : "/register"}>
                    Get Started for Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
