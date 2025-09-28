"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Search, PenTool, Megaphone, CheckCircle, ArrowRight, RotateCcw } from "lucide-react"
import { useApp } from "@/providers"

interface WorkflowPanelProps {
  className?: string
}

export function WorkflowPanel({ className }: WorkflowPanelProps) {
  const { currentPhase, completedPhases, setCurrentPhase, completePhase, resetWorkflow } = useApp()

  const phases = [
    {
      id: "research",
      title: "Research Phase",
      description: "Deep-dive research to gather data and outrank competitors",
      icon: Search,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      tasks: [
        "Analyze search results and AI overviews",
        "Study competitor content strategies",
        "Identify keyword opportunities",
        "Understand user intent and questions",
      ],
    },
    {
      id: "creation",
      title: "Creation Phase",
      description: "Collaborative content creation with structured guidance",
      icon: PenTool,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      tasks: [
        "Create compelling titles",
        "Write engaging introductions",
        "Structure comprehensive content",
        "Add expert insights and E-E-A-T signals",
      ],
    },
    {
      id: "amplification",
      title: "Amplification Phase",
      description: "Maximize reach and build topical authority",
      icon: Megaphone,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      tasks: [
        "Plan supporting content cluster",
        "Create internal linking strategy",
        "Repurpose for multiple platforms",
        "Track performance and optimize",
      ],
    },
  ]

  const startPhase = (phaseId: string) => {
    setCurrentPhase(phaseId as any)
  }

  const handleCompletePhase = (phaseId: string) => {
    completePhase(phaseId)
  }

  return (
    <div className={cn("flex h-full flex-col bg-background", className)}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-6 bg-card">
        <div>
          <h1 className="text-xl font-serif font-bold text-foreground">Keyo Content Workflow</h1>
          <p className="text-sm text-muted-foreground">Follow the 3-phase process to create winning content</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs">
            {completedPhases.length}/3 Phases Complete
          </Badge>
          <Progress value={(completedPhases.length / 3) * 100} className="w-20" />
          {completedPhases.length > 0 && (
            <Button onClick={resetWorkflow} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {!currentPhase ? (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            {phases.map((phase, index) => {
              const Icon = phase.icon
              const isCompleted = completedPhases.includes(phase.id)
              const isNext = index === completedPhases.length && !isCompleted

              return (
                <Card
                  key={phase.id}
                  className={cn(
                    "relative transition-all duration-200 hover:shadow-md",
                    isCompleted && "border-green-200 bg-green-50/50",
                    isNext && "border-accent shadow-sm",
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={cn("p-2 rounded-lg", phase.bgColor)}>
                        <Icon className={cn("h-5 w-5", phase.color)} />
                      </div>
                      {isCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
                    </div>
                    <CardTitle className="text-lg font-serif">{phase.title}</CardTitle>
                    <CardDescription>{phase.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                      {phase.tasks.map((task, taskIndex) => (
                        <li key={taskIndex} className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                          {task}
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => startPhase(phase.id)}
                      disabled={isCompleted || (!isNext && completedPhases.length > 0)}
                      className="w-full"
                      variant={isNext ? "default" : isCompleted ? "secondary" : "outline"}
                    >
                      {isCompleted ? (
                        "Completed"
                      ) : isNext ? (
                        <>
                          Start Phase
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        "Locked"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const phase = phases.find((p) => p.id === currentPhase)
                      const Icon = phase?.icon || Search
                      return (
                        <>
                          <div className={cn("p-2 rounded-lg", phase?.bgColor)}>
                            <Icon className={cn("h-5 w-5", phase?.color)} />
                          </div>
                          <div>
                            <CardTitle className="font-serif">{phase?.title}</CardTitle>
                            <CardDescription>{phase?.description}</CardDescription>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  <Button onClick={() => handleCompletePhase(currentPhase)} variant="default">
                    Complete Phase
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    This phase is now active. Start chatting with Keyo to begin the {currentPhase} process.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Keyo will guide you through each step and help you create winning content.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
