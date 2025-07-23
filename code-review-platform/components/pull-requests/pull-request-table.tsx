"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { PullRequest } from "@/types/pull-request"
import type { Course } from "@/types/course"
import { useState } from "react"
import { pullRequestService } from "@/services/pull-request.service"
import { ResultModal } from "@/components/pull-requests/result-modal"

interface PullRequestTableProps {
  pullRequests: PullRequest[]
  selectedPRs: number[]
  courseData: Course | null
  postingReview: Record<number, boolean>
  onToggleSelection: (prId: number) => void
  onPostReview: (prId: number) => void
  loading: boolean
  onRefreshPRs?: () => Promise<void> // <-- Add this optional prop
}

export function PullRequestTable(props: PullRequestTableProps) {
  const {
    pullRequests,
    selectedPRs,
    courseData,
    postingReview,
    onToggleSelection,
    onPostReview,
    loading,
  } = props

  const [showResultModal, setShowResultModal] = useState(false)
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null)
  const [isEditingResult, setIsEditingResult] = useState(false)
  const [savingResult, setSavingResult] = useState(false)
  const [editableResult, setEditableResult] = useState<any>(null)

  const handleViewResult = (pr: PullRequest) => {
    let resultObj = pr.result;
    if (typeof resultObj === "string") {
      try { resultObj = JSON.parse(resultObj) } catch { resultObj = null }
    }
    setSelectedPR(pr)
    setEditableResult(resultObj)
    setShowResultModal(true)
    setIsEditingResult(false)
  }

  const handleEditToggle = (editing: boolean) => setIsEditingResult(editing)

  const handleSummaryChange = (value: string) => {
    setEditableResult((prev: any) => ({ ...prev, summary: value }))
  }

  const handleCommentChange = (index: number, field: string, value: string) => {
    setEditableResult((prev: any) => {
      const comments = [...(prev.comments || [])]
      comments[index] = { ...comments[index], [field]: value }
      return { ...prev, comments }
    })
  }

  const handleSaveChanges = async () => {
    if (!selectedPR) return
    setSavingResult(true)
    try {
      await pullRequestService.updateResult(selectedPR.id, editableResult)
      setIsEditingResult(false)
      // Optionally refresh PR list here
    } catch (e) {
      // handle error
    }
    setSavingResult(false)
  }

  const handleViewPR = (pr: PullRequest) => {
    if (!courseData?.github_url || !pr.pr_number) {
      toast({
        title: "Error",
        description: "GitHub URL information is incomplete",
        variant: "destructive",
      })
      return
    }

    const url = `${courseData.github_url.trim().replace(/\/$/, "")}/pull/${pr.pr_number}`
    window.open(url, "_blank", "noopener,noreferrer")
  }
  
  const handlePostReview = async (prId: number) => {
    await props.onPostReview(prId)
    setShowResultModal(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pull Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="w-12">Select</TableCell>
                <TableCell>PR Name</TableCell>
                <TableCell>PR Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>PR Number</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>Status Grade</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Updated At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pullRequests.map((pr) => (
                <TableRow key={pr.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedPRs.includes(pr.id)}
                      onCheckedChange={() => onToggleSelection(pr.id)}
                    />
                  </TableCell>

                  <TableCell>{pr.pr_name}</TableCell>
                  <TableCell>{pr.pr_description && pr.pr_description !== "<nil>" ? pr.pr_description : "-"}</TableCell>
                  <TableCell>{pr.status}</TableCell>
                  <TableCell>{pr.pr_number}</TableCell>
                  <TableCell>
                    {pr.result ? (
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleViewResult(pr)}
                          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                          title="View review results"
                        >
                          <Eye className="h-5 w-5 text-blue-600" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400">-</div>
                    )}
                  </TableCell>
                  <TableCell>{pr.status_grade}</TableCell>
                  <TableCell>{pr.created_at ? new Date(pr.created_at).toLocaleString() : "-"}</TableCell>
                  <TableCell>{pr.updated_at ? new Date(pr.updated_at).toLocaleString() : "-"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewPR(pr)}
                        className={`text-blue-600 hover:text-blue-900 ${!courseData?.github_url || !pr.pr_number ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        View PR
                      </button>
                      {(pr as any).result && (
                        <button
                          onClick={() => handlePostReview(pr.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Post review comments to GitHub"
                          disabled={
                            postingReview[pr.id] ||
                            !(
                              (typeof pr.result === "string" && (JSON.parse(pr.result).summary || JSON.parse(pr.result).message)) ||
                              (typeof pr.result === "object" && (pr.result.summary || pr.result.message))
                            )
                          }
                        >
                          {postingReview[pr.id] ? "Posting..." : "Post Review"}
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {loading && <div className="p-4 text-center">Loading...</div>}

          {/* Result Modal */}
          <ResultModal
            open={showResultModal}
            onOpenChange={setShowResultModal}
            selectedResultPR={selectedPR?.pr_name?.toString() || ""}
            editableResult={editableResult}
            isEditingResult={isEditingResult}
            savingResult={savingResult}
            currentPrId={selectedPR ? selectedPR.id.toString() : null}
            postingReview={postingReview}
            onEditToggle={handleEditToggle}
            onSummaryChange={handleSummaryChange}
            onCommentChange={handleCommentChange}
            onSaveChanges={handleSaveChanges}
            onPostReview={(prId: string) => handlePostReview(Number(prId))}
          />
        </div>
      </CardContent>
    </Card>
  )
}
