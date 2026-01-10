import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Search, BookOpen, CheckCircle, RefreshCw, ArrowRight, Sparkles, Users, Shield, Lightbulb, ChevronDown, MessageSquare, Trophy, Compass } from "lucide-react";
import { Sol1Logo } from "@/components/Sol1Logo";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const workflowSteps = [
  {
    icon: Search,
    title: "Ask",
    description: "Search or submit your academic question",
  },
  {
    icon: Sparkles,
    title: "AI Checks",
    description: "Sol-1 searches existing verified solutions",
  },
  {
    icon: BookOpen,
    title: "Contribute",
    description: "Students submit answers if none exist",
  },
  {
    icon: CheckCircle,
    title: "Review & Verify",
    description: "Peers review and verify accuracy",
  },
  {
    icon: RefreshCw,
    title: "Reuse Forever",
    description: "Quality answers persist for future batches",
  },
];

const stats = [
  { value: "2,847", label: "Verified Solutions" },
  { value: "1,234", label: "Active Contributors" },
  { value: "98.2%", label: "Accuracy Rate" },
  { value: "6", label: "Semesters Covered" },
];

const platformLinks = [
  { icon: Compass, title: "Explore your questions", desc: "Browse verified solutions", link: "/explore" },
  { icon: MessageSquare, title: "Contribute your answers", desc: "Help others by sharing knowledge", link: "/contribute" },
  { icon: Users, title: "Clubs", desc: "Connect with fellow students", link: "/clubs" },
  { icon: Trophy, title: "Leaderboard", desc: "See top contributors", link: "/leaderboard" },
];

export default function Index() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const { user } = useAuth();

  return (
    <Layout>
      {/* Hero Section - Split Layout */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="gradient-hero-enhanced text-primary-foreground py-16 lg:py-24 relative overflow-hidden"
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-sol-cyan/30 rounded-full"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
        </div>

        {/* Decorative shapes */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 right-10 w-32 h-32 border border-primary-foreground/10 rounded-full opacity-50"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-20 left-10 w-48 h-48 border border-sol-cyan/20 rotate-45 opacity-30"
        />

        <div className="container mx-auto px-4 relative z-10">
          {/* Split Layout: Text Left, Logo Right */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-left"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="inline-flex items-center gap-2 bg-primary-foreground/10 border border-primary-foreground/20 rounded-full px-4 py-2 mb-6 hover:bg-primary-foreground/15 transition-colors cursor-default"
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Exclusive to IIIT Nagpur</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance"
              >
                Your Academic Knowledge, Preserved Forever
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-xl"
              >
                Sol-1 is IIIT Nagpur's internal knowledge system. Ask questions, find verified solutions,
                and contribute answers that help every batch after you.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/explore">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="hero" size="xl" className="gap-2 group">
                      <Search className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      Explore Solutions
                    </Button>
                  </motion.div>
                </Link>
                {!user && (
                  <Link to="/get-started">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="hero-outline" size="xl" className="gap-2 group">
                        Get Started
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  </Link>
                )}
              </motion.div>
            </motion.div>

            {/* Right Side - Logo */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              className="flex justify-center lg:justify-end"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Sol1Logo size="xl" animated={true} showTagline={true} />
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.button
            onClick={() => {
              window.scrollTo({
                top: window.innerHeight * 0.85,
                behavior: 'smooth'
              });
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 cursor-pointer p-2"
            aria-label="Scroll down"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-primary-foreground/50"
            >
              <ChevronDown className="w-6 h-6" />
            </motion.div>
          </motion.button>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-12 bg-card border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <motion.div
            animate={{ x: [0, 10, 0], y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-0 left-1/4 w-16 h-16 bg-sol-cyan rotate-45"
          />
          <motion.div
            animate={{ x: [0, -10, 0], y: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute bottom-0 right-1/3 w-12 h-12 bg-primary rotate-12"
          />
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="text-center relative group cursor-default"
              >
                {index === 0 && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-4 -left-4 w-20 h-20 border-2 border-sol-cyan/20 rounded-full opacity-50"
                  />
                )}
                <motion.div
                  className="text-3xl md:text-4xl font-bold text-sol-cyan mb-1"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Links Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold text-foreground mb-4"
            >
              Navigate Sol-1
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {platformLinks.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} to={item.link}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -6, boxShadow: "0 20px 40px -20px hsl(var(--sol-cyan) / 0.3)" }}
                    className="bg-card border border-border rounded-xl p-6 h-full cursor-pointer group"
                  >
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      className="w-12 h-12 rounded-lg bg-sol-cyan/10 flex items-center justify-center mb-4 group-hover:bg-sol-cyan/20 transition-colors"
                    >
                      <Icon className="w-6 h-6 text-sol-cyan" />
                    </motion.div>
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-sol-cyan transition-colors">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 bg-muted relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent opacity-50" />
        <svg className="absolute bottom-0 left-0 right-0 opacity-5" viewBox="0 0 1440 100" preserveAspectRatio="none">
          <motion.path
            d="M0,50 C360,100 720,0 1080,50 C1260,75 1380,25 1440,50 L1440,100 L0,100 Z"
            fill="hsl(var(--sol-cyan))"
            animate={{
              d: [
                "M0,50 C360,100 720,0 1080,50 C1260,75 1380,25 1440,50 L1440,100 L0,100 Z",
                "M0,60 C360,80 720,20 1080,60 C1260,55 1380,45 1440,40 L1440,100 L0,100 Z",
                "M0,50 C360,100 720,0 1080,50 C1260,75 1380,25 1440,50 L1440,100 L0,100 Z"
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-sol-cyan/10 border border-sol-cyan/20 rounded-full px-6 py-2 mb-4 inline-block cursor-default"
              >
                <span className="text-sol-cyan font-semibold text-sm">THE KNOWLEDGE LOOP</span>
              </motion.div>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-foreground mb-4"
            >
              How Sol-1 Works
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground max-w-2xl mx-auto"
            >
              A closed knowledge loop that ensures every question asked benefits everyone who comes after.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  <motion.div
                    whileHover={{ y: -8, boxShadow: "0 20px 40px -20px hsl(var(--sol-cyan) / 0.3)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="card-hover bg-card border border-border rounded-xl p-6 text-center h-full group cursor-default"
                  >
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      className="w-12 h-12 rounded-full bg-sol-cyan/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-sol-cyan/20 transition-colors"
                    >
                      <Icon className="w-6 h-6 text-sol-cyan" />
                    </motion.div>
                    <div className="text-xs font-semibold text-sol-cyan mb-2">
                      Step {index + 1}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 group-hover:text-sol-cyan transition-colors">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </motion.div>
                  {index < workflowSteps.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2"
                    >
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-6 h-6 text-border" />
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background relative overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 right-20 w-16 h-16 border-2 border-primary/10 rotate-45 opacity-40"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute bottom-20 left-16 w-24 h-24 border border-sol-cyan/10 rounded-full opacity-30"
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-primary/10 border border-primary/20 rounded-2xl px-6 py-3 mb-4 inline-block cursor-default"
              >
                <span className="text-primary font-semibold">PLATFORM FEATURES</span>
              </motion.div>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-foreground mb-4"
            >
              Built for Academic Excellence
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Sparkles, title: "AI-Powered Search", desc: "Sol-1 intelligently matches your questions with existing verified solutions, reducing duplicate effort across batches.", color: "sol-cyan" },
              { icon: CheckCircle, title: "Peer Verification", desc: "Every answer goes through peer review. Verified solutions are marked and prioritized in search results.", color: "sol-verified" },
              { icon: Users, title: "Campus Clubs", desc: "Connect with peers, join subject-specific clubs, and build your academic reputation within IIIT Nagpur.", color: "primary" },
              { icon: Lightbulb, title: "Effective Problem Solving", desc: "Learn diverse approaches to complex problems. See how peers tackle challenges and develop stronger analytical skills.", color: "amber-500" },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <motion.div
                    whileHover={{ y: -8, boxShadow: "0 20px 40px -20px hsl(var(--foreground) / 0.1)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="card-hover bg-card border border-border rounded-xl p-8 h-full group cursor-default"
                  >
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      className={`w-12 h-12 rounded-lg bg-${feature.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`w-6 h-6 text-${feature.color}`} />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-sol-cyan transition-colors">{feature.title}</h3>
                    <p className="text-muted-foreground">
                      {feature.desc}
                    </p>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted relative overflow-hidden">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-20 -right-20 w-64 h-64 bg-sol-cyan/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary/5 rounded-full blur-2xl"
        />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <motion.div
              whileHover={{ boxShadow: "0 30px 60px -20px hsl(var(--sol-cyan) / 0.2)" }}
              className="bg-gradient-to-br from-card to-muted border border-border rounded-3xl rounded-tl-none p-10 text-center relative"
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-0 left-0 w-8 h-8 bg-sol-cyan/20 rounded-br-2xl"
              />

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl font-bold text-foreground mb-4"
              >
                Ready to Contribute?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground mb-8"
              >
                Join your batchmates in building IIIT Nagpur's permanent knowledge base.
                Your contributions help every student who comes after you.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link to="/get-started">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="accent" size="lg" className="gap-2 group">
                      Get Started with @iiitn.ac.in
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-sm text-muted-foreground mt-4"
              >
                Access restricted to IIIT Nagpur students only
              </motion.p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Resources Section with Guidelines */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">Resources</h2>
              <p className="text-muted-foreground">Everything you need to get the most out of Sol-1</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Guidelines */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sol-cyan" />
                  Guidelines
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-sol-verified mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Search First:</strong> Always search for existing solutions before asking a new question.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-sol-verified mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Be Specific:</strong> Include course name, semester, and relevant context in your questions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-sol-verified mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Quality Answers:</strong> Provide detailed, well-explained answers with examples when possible.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-sol-verified mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Respect Others:</strong> Be courteous and constructive in all interactions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-sol-verified mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Academic Integrity:</strong> Do not share exam papers or encourage plagiarism.</span>
                  </li>
                </ul>
              </motion.div>

              {/* Report Issues */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-sol-cyan" />
                  Report an Issue
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Found a bug or have a suggestion? Let us know and we'll work on it.
                </p>
                <Link to="/report-issue">
                  <Button variant="accent" className="w-full">
                    Go to Report Form
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
