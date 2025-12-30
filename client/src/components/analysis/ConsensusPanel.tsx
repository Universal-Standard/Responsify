import { motion } from "framer-motion";
import { 
  Brain, 
  Smartphone, 
  BookOpen, 
  Accessibility, 
  Zap,
  Sparkles,
  Bot
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AnalysisJob, AgentEvaluation } from "@/lib/api";

interface ConsensusPanelProps {
  job: AnalysisJob;
}

function getScoreColor(score: number | undefined): string {
  if (score === undefined) return "text-muted-foreground";
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

function getScoreBgColor(score: number | undefined): string {
  if (score === undefined) return "bg-muted";
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function getScoreRingColor(score: number | undefined): string {
  if (score === undefined) return "ring-muted";
  if (score >= 80) return "ring-emerald-500/30";
  if (score >= 60) return "ring-amber-500/30";
  return "ring-red-500/30";
}

function formatScore(score: number | undefined): string {
  return score !== undefined ? Math.round(score).toString() : "--";
}

interface ScoreCardProps {
  label: string;
  score: number | undefined;
  icon: React.ReactNode;
  delay: number;
  testId: string;
}

function ScoreCard({ label, score, icon, delay, testId }: ScoreCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      data-testid={testId}
    >
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span 
              className={cn("text-2xl font-bold", getScoreColor(score))}
              data-testid={`${testId}-value`}
            >
              {formatScore(score)}
            </span>
            <span className="text-sm text-muted-foreground mb-0.5">/100</span>
          </div>
          <Progress 
            value={score ?? 0} 
            className="h-1.5"
            data-testid={`${testId}-progress`}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function getAgentIcon(agent: string): React.ReactNode {
  switch (agent.toLowerCase()) {
    case "openai":
      return <Sparkles className="w-4 h-4" />;
    case "anthropic":
      return <Brain className="w-4 h-4" />;
    case "gemini":
      return <Bot className="w-4 h-4" />;
    default:
      return <Bot className="w-4 h-4" />;
  }
}

function getAgentBadgeStyle(agent: string): string {
  switch (agent.toLowerCase()) {
    case "openai":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "anthropic":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "gemini":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

interface AgentEvaluationCardProps {
  evaluation: AgentEvaluation;
  index: number;
}

function AgentEvaluationCard({ evaluation, index }: AgentEvaluationCardProps) {
  const agentDisplayName = evaluation.agent.charAt(0).toUpperCase() + evaluation.agent.slice(1);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
      data-testid={`agent-evaluation-${evaluation.agent}`}
    >
      <Card className="bg-card/30 backdrop-blur-sm border-border/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn("gap-1.5", getAgentBadgeStyle(evaluation.agent))}
                data-testid={`agent-badge-${evaluation.agent}`}
              >
                {getAgentIcon(evaluation.agent)}
                {agentDisplayName}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <span 
                className={cn("text-lg font-bold", getScoreColor(evaluation.overallScore))}
                data-testid={`agent-score-${evaluation.agent}`}
              >
                {formatScore(evaluation.overallScore)}
              </span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
          <p 
            className="text-sm text-muted-foreground line-clamp-2"
            data-testid={`agent-feedback-${evaluation.agent}`}
          >
            {evaluation.feedback || "No feedback available"}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ConsensusPanel({ job }: ConsensusPanelProps) {
  const evaluations = (job.aiAnalysis as { evaluations?: AgentEvaluation[] })?.evaluations || [];

  return (
    <div className="space-y-6" data-testid="consensus-panel">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-display" data-testid="consensus-header">
                  AI Consensus
                </CardTitle>
              </div>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative"
              >
                <div 
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center ring-4",
                    getScoreBgColor(job.consensusScore),
                    getScoreRingColor(job.consensusScore)
                  )}
                  data-testid="consensus-score-badge"
                >
                  <div className="text-center">
                    <span 
                      className="text-2xl font-bold text-white"
                      data-testid="consensus-score-value"
                    >
                      {formatScore(job.consensusScore)}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div 
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              data-testid="score-cards-grid"
            >
              <ScoreCard
                label="Responsive"
                score={job.responsiveScore}
                icon={<Smartphone className="w-4 h-4" />}
                delay={0.1}
                testId="score-card-responsive"
              />
              <ScoreCard
                label="Readability"
                score={job.readabilityScore}
                icon={<BookOpen className="w-4 h-4" />}
                delay={0.2}
                testId="score-card-readability"
              />
              <ScoreCard
                label="Accessibility"
                score={job.accessibilityScore}
                icon={<Accessibility className="w-4 h-4" />}
                delay={0.3}
                testId="score-card-accessibility"
              />
              <ScoreCard
                label="Performance"
                score={job.performanceScore}
                icon={<Zap className="w-4 h-4" />}
                delay={0.4}
                testId="score-card-performance"
              />
            </div>

            {evaluations.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span 
                    className="text-sm font-medium text-muted-foreground px-2"
                    data-testid="agent-evaluations-header"
                  >
                    Agent Evaluations
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div 
                  className="grid gap-3 md:grid-cols-3"
                  data-testid="agent-evaluations-grid"
                >
                  {evaluations.map((evaluation, index) => (
                    <AgentEvaluationCard
                      key={evaluation.agent}
                      evaluation={evaluation}
                      index={index}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
