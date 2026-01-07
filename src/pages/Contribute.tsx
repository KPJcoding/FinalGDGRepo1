import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { BookOpen, GitMerge, CheckCircle, Star, ArrowRight, Clock, FileText, Trophy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const contributionSteps = [
  {
    icon: FileText,
    title: "Submit Answer",
    description: "Find an open question and write a detailed, accurate solution",
  },
  {
    icon: Clock,
    title: "Peer Review",
    description: "Your answer enters the review queue for verification by peers",
  },
  {
    icon: GitMerge,
    title: "Merge",
    description: "Once approved, your answer becomes part of the knowledge base",
  },
  {
    icon: Star,
    title: "Earn Points",
    description: "Gain contribution points and climb the leaderboard",
  },
];

interface OpenQuestion {
  id: string;
  title: string;
  subject: string;
  semester: string;
  difficulty: "Easy" | "Medium" | "Hard";
  points: number;
  attempts: number;
  timeAgo: string;
}

const openQuestions: OpenQuestion[] = [
  {
    id: "1",
    title: "TCP congestion control mechanisms - slow start vs AIMD",
    subject: "Computer Networks",
    semester: "Sem 5",
    difficulty: "Medium",
    points: 25,
    attempts: 0,
    timeAgo: "1 hour ago",
  },
  {
    id: "2",
    title: "Implement a priority queue using a min-heap in Python",
    subject: "Data Structures",
    semester: "Sem 3",
    difficulty: "Easy",
    points: 15,
    attempts: 2,
    timeAgo: "3 hours ago",
  },
  {
    id: "3",
    title: "Explain ACID properties with real-world transaction examples",
    subject: "Database Systems",
    semester: "Sem 5",
    difficulty: "Medium",
    points: 20,
    attempts: 1,
    timeAgo: "5 hours ago",
  },
  {
    id: "4",
    title: "Prove that P ⊆ NP using Turing machine definitions",
    subject: "Algorithms",
    semester: "Sem 4",
    difficulty: "Hard",
    points: 40,
    attempts: 0,
    timeAgo: "1 day ago",
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

export default function Contribute() {
  const navigate = useNavigate();

  const handleAnswerQuestion = (question: OpenQuestion) => {
    const params = new URLSearchParams({
      title: question.title,
      subject: question.subject,
      difficulty: question.difficulty,
      points: question.points.toString(),
    });
    navigate(`/answer?${params.toString()}`);
  };

  return (
    <Layout>
      {/* Header */}
      <section className="gradient-hero text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 border border-primary-foreground/20 rounded-full px-4 py-2 mb-4">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">Open Source Style</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Contribute to Sol-1
            </h1>
            <p className="text-primary-foreground/80 text-lg">
              Help build IIIT Nagpur's permanent knowledge base. Submit answers, 
              get them reviewed, and earn recognition for quality contributions.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Contribution Workflow
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {contributionSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="bg-card border border-border rounded-xl p-6 text-center h-full">
                    <div className="w-12 h-12 rounded-full bg-sol-cyan/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-sol-cyan" />
                    </div>
                    <div className="text-xs font-semibold text-sol-cyan mb-2">
                      Step {index + 1}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  {index < contributionSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <ArrowRight className="w-6 h-6 text-border" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Points Info */}
      <section className="py-12 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-sol-verified/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-sol-verified" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Answer Accepted</div>
                  <div className="text-sm text-muted-foreground">+10-40 points</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Points based on question difficulty
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-sol-cyan/10 flex items-center justify-center">
                  <GitMerge className="w-5 h-5 text-sol-cyan" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Peer Review</div>
                  <div className="text-sm text-muted-foreground">+5 points each</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Review others' answers for accuracy
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Quality Bonus</div>
                  <div className="text-sm text-muted-foreground">+15 points</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Highly upvoted verified answers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Questions */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Open Questions
              </h2>
              <p className="text-muted-foreground">
                These questions need answers. Pick one and contribute!
              </p>
            </div>
            <Link to="/explore">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          <div className="space-y-4">
            {openQuestions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                      <Badge variant="secondary">{question.semester}</Badge>
                      <Badge variant="secondary">{question.subject}</Badge>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {question.title}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Asked {question.timeAgo}</span>
                      <span>•</span>
                      <span>{question.attempts} attempts</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1 text-sol-cyan font-semibold">
                      <Star className="w-4 h-4" />
                      {question.points} pts
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="accent" 
                        size="sm"
                        onClick={() => handleAnswerQuestion(question)}
                      >
                        Answer
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
