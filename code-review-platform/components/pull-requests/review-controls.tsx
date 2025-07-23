"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Assignment } from "@/types/assignment"
import type { LLM } from "@/types/llm"

interface ReviewControlsProps {
  assignments: Assignment[]
  userLLMs: LLM[]
  selectedAssignment: number | null
  selectedLLM: number | null
  selectedPRs: Set<number>
  reviewing: boolean
  syncing?: boolean
  onAssignmentChange: (id: number) => void
  onLLMChange: (id: number) => void
  onReviewSelected: () => void
  onSync?: () => void
}

export function ReviewControls({
  assignments,
  userLLMs,
  selectedAssignment,
  selectedLLM,
  selectedPRs,
  reviewing,
  syncing,
  onAssignmentChange,
  onLLMChange,
  onReviewSelected,
  onSync,
}: ReviewControlsProps) {
  const canReview = selectedAssignment && selectedLLM && selectedPRs.size > 0 && !reviewing

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="font-semibold text-lg">
          AI Review Controls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
          {/* Assignment Selection */}
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">
              Assignment
            </label>
            <Select
              value={selectedAssignment?.toString() || ""}
              onValueChange={(value) => onAssignmentChange(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assignment" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((assignment) => (
                  <SelectItem key={assignment.id} value={assignment.id.toString()}>
                    {assignment.assignment_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* LLM Selection */}
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">
              AI Model
            </label>
            <Select
              value={selectedLLM?.toString() || ""}
              onValueChange={(value) => onLLMChange(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select AI model" />
              </SelectTrigger>
              <SelectContent>
                {userLLMs.map((llm) => (
                  <SelectItem key={llm.id} value={llm.id.toString()}>
                    <span>{llm.model_name}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {llm.provider}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sync Button */}
          <div className="flex-1 flex flex-col space-y-2">
            <Button
              onClick={onSync}
              disabled={!!syncing}
              className="w-full"
              variant="outline"
            >
              {syncing ? "Syncing..." : "Sync Pull Requests"}
            </Button>
            <Button
              onClick={onReviewSelected}
              disabled={!canReview}
              className="w-full"
            >
              {reviewing ? "Reviewing..." : `Review Selected (${selectedPRs.size})`}
            </Button>
          </div>
        </div>

        {/* Status Information */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Selected: <Badge variant="secondary">{selectedPRs.size} PRs</Badge>
            </span>
            <span className="text-gray-600">
              Ready to review: <Badge variant={canReview ? "default" : "secondary"}>
                {canReview ? "Yes" : "No"}
              </Badge>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
