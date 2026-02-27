"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, Users } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">CricketAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-foreground/70 hover:text-foreground transition">
              Features
            </a>
            <a href="#about" className="text-foreground/70 hover:text-foreground transition">
              About
            </a>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              AI-Powered Team Selection & Performance Prediction
            </h1>
            <p className="text-lg text-foreground/70">
              Transforming Cricket Selection with Data-Driven Insights. Make smarter team decisions with advanced
              analytics and AI recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                Learn More
              </Button>
            </div>
          </div>
          <div className="relative h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl border border-border overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <BarChart3 className="w-24 h-24 text-primary/40 mx-auto" />
                <p className="text-foreground/50">Cricket Stadium Analytics</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-border">
        <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Users,
              title: "Smart Team Selection",
              desc: "AI-powered recommendations based on player form and opposition analysis",
            },
            {
              icon: TrendingUp,
              title: "Performance Prediction",
              desc: "Predict individual and team performance with confidence scores",
            },
            {
              icon: BarChart3,
              title: "Advanced Analytics",
              desc: "Comprehensive player statistics and head-to-head comparisons",
            },
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition">
              <feature.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-foreground/70 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-foreground/60 text-sm">
          <p>&copy; 2026 CricketAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
