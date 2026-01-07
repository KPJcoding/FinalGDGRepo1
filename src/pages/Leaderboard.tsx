import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Trophy, Medal, Star, TrendingUp, CheckCircle, GitMerge, Award } from "lucide-react";

interface Contributor {
  rank: number;
  name: string;
  batch: string;
  branch: string;
  points: number;
  tier: "Diamond" | "Platinum" | "Gold" | "Silver" | "Bronze";
  answersAccepted: number;
  accuracy: number;
  merges: number;
  change: number;
}

const leaderboardData: Contributor[] = [
  { rank: 1, name: "Arjun Mehta", batch: "2022", branch: "CSE", points: 2847, tier: "Diamond", answersAccepted: 145, accuracy: 98.2, merges: 132, change: 0 },
  { rank: 2, name: "Priya Sharma", batch: "2022", branch: "CSE", points: 2563, tier: "Diamond", answersAccepted: 128, accuracy: 97.8, merges: 119, change: 1 },
  { rank: 3, name: "Rahul Gupta", batch: "2023", branch: "ECE", points: 2234, tier: "Platinum", answersAccepted: 112, accuracy: 96.5, merges: 98, change: -1 },
  { rank: 4, name: "Sneha Reddy", batch: "2023", branch: "CSE", points: 1987, tier: "Platinum", answersAccepted: 98, accuracy: 95.4, merges: 87, change: 2 },
  { rank: 5, name: "Amit Kumar", batch: "2022", branch: "CSE", points: 1845, tier: "Gold", answersAccepted: 92, accuracy: 94.8, merges: 78, change: 0 },
  { rank: 6, name: "Neha Patel", batch: "2024", branch: "CSE", points: 1654, tier: "Gold", answersAccepted: 82, accuracy: 93.2, merges: 71, change: 3 },
  { rank: 7, name: "Vikram Singh", batch: "2023", branch: "ECE", points: 1543, tier: "Gold", answersAccepted: 76, accuracy: 92.7, merges: 65, change: -2 },
  { rank: 8, name: "Ananya Joshi", batch: "2024", branch: "CSE", points: 1432, tier: "Silver", answersAccepted: 71, accuracy: 91.5, merges: 58, change: 1 },
  { rank: 9, name: "Rohan Das", batch: "2023", branch: "CSE", points: 1298, tier: "Silver", answersAccepted: 64, accuracy: 90.8, merges: 52, change: 0 },
  { rank: 10, name: "Kavya Nair", batch: "2024", branch: "ECE", points: 1156, tier: "Silver", answersAccepted: 57, accuracy: 89.6, merges: 45, change: 4 },
];

const tierThresholds = [
  { tier: "Diamond", minPoints: 2500, color: "bg-gradient-to-r from-cyan-400 to-blue-500", textColor: "text-cyan-400" },
  { tier: "Platinum", minPoints: 2000, color: "bg-gradient-to-r from-slate-300 to-slate-400", textColor: "text-slate-300" },
  { tier: "Gold", minPoints: 1500, color: "bg-gradient-to-r from-amber-400 to-yellow-500", textColor: "text-amber-400" },
  { tier: "Silver", minPoints: 1000, color: "bg-gradient-to-r from-gray-300 to-gray-400", textColor: "text-gray-400" },
  { tier: "Bronze", minPoints: 0, color: "bg-gradient-to-r from-orange-400 to-amber-600", textColor: "text-orange-400" },
];

function getTierStyle(tier: string) {
  const tierInfo = tierThresholds.find((t) => t.tier === tier);
  return tierInfo || tierThresholds[tierThresholds.length - 1];
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="w-6 h-6 text-amber-400" />;
    case 2:
      return <Medal className="w-6 h-6 text-slate-300" />;
    case 3:
      return <Medal className="w-6 h-6 text-orange-400" />;
    default:
      return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">{rank}</span>;
  }
}

export default function Leaderboard() {
  return (
    <Layout>
      {/* Header */}
      <section className="gradient-hero text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-sol-cyan" />
            <h1 className="text-3xl font-bold">Leaderboard</h1>
          </div>
          <p className="text-primary-foreground/80">
            Top contributors from IIIT Nagpur ranked by quality contributions
          </p>
        </div>
      </section>

      <div className="bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Leaderboard */}
            <div className="lg:col-span-3">
              {/* Top 3 Podium */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {leaderboardData.slice(0, 3).map((contributor, index) => {
                  const tierStyle = getTierStyle(contributor.tier);
                  const order = index === 0 ? "order-2" : index === 1 ? "order-1" : "order-3";
                  const height = index === 0 ? "pt-0" : index === 1 ? "pt-8" : "pt-12";
                  
                  return (
                    <motion.div
                      key={contributor.rank}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`${order} ${height}`}
                    >
                      <div className="bg-card border border-border rounded-xl p-4 text-center relative overflow-hidden">
                        <div className={`absolute inset-x-0 top-0 h-1 ${tierStyle.color}`} />
                        <div className="mb-3">
                          {getRankIcon(contributor.rank)}
                        </div>
                        <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-foreground">
                          {contributor.name.charAt(0)}
                        </div>
                        <h3 className="font-semibold text-foreground">{contributor.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {contributor.branch} • Batch {contributor.batch}
                        </p>
                        <Badge className={`${tierStyle.color} text-white border-0 mb-2`}>
                          {contributor.tier}
                        </Badge>
                        <div className="text-2xl font-bold text-sol-cyan">
                          {contributor.points.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Full Leaderboard Table */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left py-4 px-4 font-semibold text-foreground">Rank</th>
                        <th className="text-left py-4 px-4 font-semibold text-foreground">Contributor</th>
                        <th className="text-left py-4 px-4 font-semibold text-foreground">Tier</th>
                        <th className="text-right py-4 px-4 font-semibold text-foreground">Points</th>
                        <th className="text-right py-4 px-4 font-semibold text-foreground">Accepted</th>
                        <th className="text-right py-4 px-4 font-semibold text-foreground">Accuracy</th>
                        <th className="text-right py-4 px-4 font-semibold text-foreground">Merges</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.map((contributor, index) => {
                        const tierStyle = getTierStyle(contributor.tier);
                        return (
                          <motion.tr
                            key={contributor.rank}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.03 }}
                            className="border-b border-border hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                {getRankIcon(contributor.rank)}
                                {contributor.change !== 0 && (
                                  <span className={`text-xs ${contributor.change > 0 ? "text-sol-verified" : "text-destructive"}`}>
                                    {contributor.change > 0 ? `↑${contributor.change}` : `↓${Math.abs(contributor.change)}`}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground">
                                  {contributor.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">{contributor.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {contributor.branch} • Batch {contributor.batch}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={`${tierStyle.color} text-white border-0`}>
                                {contributor.tier}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-right font-semibold text-foreground">
                              {contributor.points.toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-right text-muted-foreground">
                              {contributor.answersAccepted}
                            </td>
                            <td className="py-4 px-4 text-right text-muted-foreground">
                              {contributor.accuracy}%
                            </td>
                            <td className="py-4 px-4 text-right text-muted-foreground">
                              {contributor.merges}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Tier System */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-sol-cyan" />
                  Tier System
                </h3>
                <div className="space-y-3">
                  {tierThresholds.map((tier) => (
                    <div key={tier.tier} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                        <span className={`font-medium ${tier.textColor}`}>{tier.tier}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {tier.minPoints > 0 ? `${tier.minPoints}+ pts` : "Starting"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metrics Explained */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-4">Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-sol-cyan mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground text-sm">Points</div>
                      <p className="text-xs text-muted-foreground">
                        Total contribution score based on answers, reviews, and quality
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-sol-verified mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground text-sm">Accuracy</div>
                      <p className="text-xs text-muted-foreground">
                        Percentage of answers that passed peer verification
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <GitMerge className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground text-sm">Merges</div>
                      <p className="text-xs text-muted-foreground">
                        Answers merged into the permanent knowledge base
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Highlights */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-sol-cyan" />
                  This Week
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Most Active</span>
                    <span className="font-medium text-foreground">Neha Patel</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Highest Accuracy</span>
                    <span className="font-medium text-foreground">Arjun Mehta</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Top Newcomer</span>
                    <span className="font-medium text-foreground">Kavya Nair</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
