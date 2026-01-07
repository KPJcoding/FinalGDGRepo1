import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Send, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ReportIssue() {
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  const issueTypes = [
    "Bug / Technical Issue",
    "Content Problem",
    "User Behavior Report",
    "Feature Request",
    "Other"
  ];

  return (
    <Layout>
      <section className="bg-card border-b border-border py-8">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-sol-cyan transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-8 h-8 text-sol-cyan" />
            <h1 className="text-3xl font-bold text-foreground">Report an Issue</h1>
          </div>
          <p className="text-muted-foreground">
            Help us improve Sol-1 by reporting bugs, issues, or suggestions
          </p>
        </div>
      </section>

      <div className="bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              {isSubmitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card border border-border rounded-xl p-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-20 h-20 rounded-full bg-sol-verified/20 flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle className="w-10 h-10 text-sol-verified" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Report Submitted!</h2>
                  <p className="text-muted-foreground mb-6">
                    Thank you for helping us improve Sol-1. Our team will review your report and take appropriate action.
                  </p>
                  <Link to="/">
                    <Button variant="accent">
                      Return to Home
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleSubmit}
                  className="bg-card border border-border rounded-xl p-6 space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Issue Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {issueTypes.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setIssueType(type)}
                          className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                            issueType === type
                              ? "bg-sol-cyan/10 border-sol-cyan text-sol-cyan"
                              : "border-border text-muted-foreground hover:border-sol-cyan/50"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Describe the Issue *
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please provide as much detail as possible about the issue you're experiencing..."
                      className="w-full h-40 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-sol-cyan focus:ring-1 focus:ring-sol-cyan/20 resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Your Email (optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@iiitn.ac.in"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-sol-cyan focus:ring-1 focus:ring-sol-cyan/20"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Provide your email if you'd like to receive updates about this issue.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="accent"
                    className="w-full gap-2"
                    disabled={!description.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                      />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  );
}
