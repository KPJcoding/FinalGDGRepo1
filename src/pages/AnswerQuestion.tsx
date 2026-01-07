import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  FileText, 
  Upload, 
  Send, 
  CheckCircle, 
  Clock, 
  Users, 
  Shield, 
  Star,
  Loader2,
  FileUp,
  X
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useState, useRef } from "react";

type SubmissionStep = "writing" | "submitted" | "reviewing" | "verified";

interface ReviewStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: "pending" | "in-progress" | "completed";
}

const reviewSteps: ReviewStep[] = [
  {
    id: "submitted",
    title: "Answer Submitted",
    description: "Your answer has been received",
    icon: FileText,
    status: "completed",
  },
  {
    id: "queue",
    title: "In Review Queue",
    description: "Waiting for peer reviewers",
    icon: Clock,
    status: "in-progress",
  },
  {
    id: "peer-review",
    title: "Peer Review",
    description: "2 reviewers checking accuracy",
    icon: Users,
    status: "pending",
  },
  {
    id: "verification",
    title: "Final Verification",
    description: "Quality check by senior contributors",
    icon: Shield,
    status: "pending",
  },
  {
    id: "merged",
    title: "Merged to Knowledge Base",
    description: "Answer approved and published",
    icon: CheckCircle,
    status: "pending",
  },
];

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "Easy":
      return "bg-sol-verified/10 text-sol-verified border-sol-verified/20";
    case "Medium":
      return "bg-sol-pending/10 text-sol-pending border-sol-pending/20";
    case "Hard":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function AnswerQuestion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const questionTitle = searchParams.get("title") || "Sample Question";
  const questionSubject = searchParams.get("subject") || "Computer Science";
  const questionDifficulty = searchParams.get("difficulty") || "Medium";
  const questionPoints = searchParams.get("points") || "25";
  
  const [currentStep, setCurrentStep] = useState<SubmissionStep>("writing");
  const [answer, setAnswer] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    
    setIsSubmitting(true);
    
    // Simulate submission delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setCurrentStep("submitted");
    
    // Simulate review progress
    await new Promise(resolve => setTimeout(resolve, 2000));
    setCurrentStep("reviewing");
  };

  if (currentStep === "writing") {
    return (
      <Layout>
        {/* Header */}
        <section className="gradient-hero text-primary-foreground py-8">
          <div className="container mx-auto px-4">
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate("/contribute")}
              className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors mb-4 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Contribute
            </motion.button>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className={`${getDifficultyColor(questionDifficulty)} border`}>
                  {questionDifficulty}
                </Badge>
                <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                  {questionSubject}
                </Badge>
                <div className="flex items-center gap-1 text-sol-cyan font-semibold text-sm">
                  <Star className="w-4 h-4" />
                  {questionPoints} pts
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {questionTitle}
              </h1>
            </motion.div>
          </div>
        </section>

        {/* Answer Form */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-6 md:p-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-sol-cyan" />
                Write Your Answer
              </h2>
              
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Provide a detailed, accurate answer to this question. Include explanations, examples, and any relevant formulas or code..."
                className="w-full h-64 p-4 bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-sol-cyan/50 focus:border-sol-cyan transition-all text-foreground placeholder:text-muted-foreground"
              />
              
              <div className="mt-4 text-sm text-muted-foreground">
                {answer.length} characters • Minimum 100 characters recommended
              </div>
            </motion.div>

            {/* File Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-6 md:p-8 mt-6"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-sol-cyan" />
                Attach Files (Optional)
              </h2>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
              />
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-sol-cyan/50 hover:bg-sol-cyan/5 transition-all cursor-pointer group"
              >
                <FileUp className="w-10 h-10 text-muted-foreground mx-auto mb-3 group-hover:text-sol-cyan transition-colors" />
                <p className="text-muted-foreground group-hover:text-foreground transition-colors">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOC, DOCX, PNG, JPG up to 10MB
                </p>
              </motion.button>

              {/* Uploaded Files List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between bg-muted rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-sol-cyan" />
                        <span className="text-sm text-foreground truncate max-w-xs">
                          {file.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-destructive/10 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex justify-end"
            >
              <Button
                variant="accent"
                size="lg"
                onClick={handleSubmit}
                disabled={answer.length < 50 || isSubmitting}
                className="gap-2 min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Answer
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </section>
      </Layout>
    );
  }

  // Submitted / Review in Progress View
  return (
    <Layout>
      <section className="py-20 bg-background min-h-[80vh]">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-12"
          >
            {currentStep === "submitted" ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-sol-verified/10 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="w-10 h-10 text-sol-verified" />
                </motion.div>
                <h1 className="text-3xl font-bold text-foreground mb-3">
                  Answer Submitted!
                </h1>
                <p className="text-lg text-muted-foreground">
                  Your contribution is being processed
                </p>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 rounded-full bg-sol-cyan/10 flex items-center justify-center mx-auto mb-6"
                >
                  <Clock className="w-10 h-10 text-sol-cyan" />
                </motion.div>
                <h1 className="text-3xl font-bold text-foreground mb-3">
                  Review in Progress
                </h1>
                <p className="text-lg text-muted-foreground">
                  Peers are verifying your answer
                </p>
              </>
            )}
          </motion.div>

          {/* Review Progress Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-6 md:p-8"
          >
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Review Progress
            </h2>
            
            <div className="space-y-1">
              {reviewSteps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = step.status === "completed";
                const isInProgress = step.status === "in-progress";
                
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <div className="flex items-start gap-4 relative">
                      {/* Connector Line */}
                      {index < reviewSteps.length - 1 && (
                        <div 
                          className={`absolute left-5 top-10 w-0.5 h-12 ${
                            isCompleted ? "bg-sol-verified" : "bg-border"
                          }`}
                        />
                      )}
                      
                      {/* Step Icon */}
                      <motion.div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCompleted 
                            ? "bg-sol-verified text-white" 
                            : isInProgress 
                              ? "bg-sol-cyan/20 text-sol-cyan" 
                              : "bg-muted text-muted-foreground"
                        }`}
                        animate={isInProgress ? { 
                          boxShadow: [
                            "0 0 0 0 hsl(var(--sol-cyan) / 0.4)",
                            "0 0 0 10px hsl(var(--sol-cyan) / 0)",
                          ]
                        } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : isInProgress ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader2 className="w-5 h-5" />
                          </motion.div>
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </motion.div>
                      
                      {/* Step Content */}
                      <div className="pb-8">
                        <h3 className={`font-semibold ${
                          isCompleted || isInProgress ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Points Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6 bg-sol-cyan/5 border border-sol-cyan/20 rounded-xl p-6 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-lg font-semibold text-sol-cyan mb-2">
              <Star className="w-5 h-5" />
              +{questionPoints} Points Pending
            </div>
            <p className="text-sm text-muted-foreground">
              Points will be awarded once your answer is verified and merged
            </p>
          </motion.div>

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-center"
          >
            <Button
              variant="outline"
              onClick={() => navigate("/contribute")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Contribute
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
