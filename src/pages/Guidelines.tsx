import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, Users, Shield, AlertTriangle, MessageSquare, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const guidelines = [
  {
    icon: BookOpen,
    title: "How Sol-1 Works",
    items: [
      "Sol-1 is IIIT Nagpur's internal knowledge platform where students ask questions and share verified solutions.",
      "All content is created, reviewed, and verified by fellow students.",
      "Solutions persist forever, helping every future batch.",
      "The platform uses AI to match your questions with existing verified solutions."
    ]
  },
  {
    icon: CheckCircle,
    title: "How to Ask Questions",
    items: [
      "Always search for existing solutions before asking a new question.",
      "Be specific - include course name, semester, and professor if relevant.",
      "Provide enough context for others to understand your problem.",
      "Use clear, descriptive titles that summarize your question.",
      "Tag your question with the appropriate subject/category."
    ]
  },
  {
    icon: Users,
    title: "How to Contribute",
    items: [
      "Provide detailed, well-explained answers with examples when possible.",
      "Include step-by-step solutions for complex problems.",
      "Cite sources or reference materials when applicable.",
      "Upload relevant files, diagrams, or code snippets to support your answer.",
      "Review and verify other students' answers to help maintain quality."
    ]
  },
  {
    icon: MessageSquare,
    title: "Community Behavior Expectations",
    items: [
      "Be respectful and courteous in all interactions.",
      "Provide constructive feedback when reviewing answers.",
      "Acknowledge and credit others' contributions.",
      "Help newcomers navigate the platform.",
      "Report inappropriate content or behavior."
    ]
  },
  {
    icon: Shield,
    title: "Academic Integrity",
    items: [
      "Do not share current exam papers or answers.",
      "Do not encourage plagiarism or academic dishonesty.",
      "Use Sol-1 as a learning resource, not for cheating.",
      "Focus on understanding concepts, not just copying solutions.",
      "Report any violations of academic integrity."
    ]
  },
  {
    icon: AlertTriangle,
    title: "Content Guidelines",
    items: [
      "Keep all content relevant to academics and student life at IIIT Nagpur.",
      "Do not post offensive, discriminatory, or harmful content.",
      "Respect intellectual property rights.",
      "Do not spam or post promotional content.",
      "Ensure uploaded files are safe and virus-free."
    ]
  }
];

export default function Guidelines() {
  return (
    <Layout>
      <section className="bg-card border-b border-border py-8">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-sol-cyan transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-sol-cyan" />
            <h1 className="text-3xl font-bold text-foreground">Platform Guidelines</h1>
          </div>
          <p className="text-muted-foreground">
            Everything you need to know about using Sol-1 effectively
          </p>
        </div>
      </section>

      <div className="bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {guidelines.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-sol-cyan/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-sol-cyan" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
                  </div>
                  <ul className="space-y-3">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-sol-verified mt-1 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-sol-cyan/10 border border-sol-cyan/30 rounded-xl p-6 text-center"
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">Questions?</h3>
              <p className="text-muted-foreground mb-4">
                If you have any questions about these guidelines or need help, reach out to the community.
              </p>
              <Link to="/community">
                <Button variant="accent">
                  Join the Community
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
