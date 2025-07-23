"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { RefreshCw, Eye, ExternalLink, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { courseService } from "@/services/course.service"
import type { PullRequest } from "@/types/pull-request"
import type { Assignment } from "@/types/assignment"

interface PullRequestSectionProps {
  courseId: number
  courseGithubUrl?: string
}

interface ResultData {
  summary?: string
  message?: string
  reviewURL?: string
  status?: string
  processed_at?: string
  comments?: {
    path?: string
    position?: number
    body?: string
  }[]
}

export function PullRequestSection({ courseId, courseGithubUrl }: PullRequestSectionProps) {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedPRs, setSelectedPRs] = useState<string[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [selectedResult, setSelectedResult] = useState<ResultData | null>(null)
  const [selectedResultPR, setSelectedResultPR] = useState<string | null>(null)
  const [currentPrId, setCurrentPrId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [courseId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [prsData, assignmentsData] = await Promise.all([
        courseService.getCoursePullRequests(courseId),
        courseService.getCourseAssignments(courseId),
      ])
      setPullRequests(prsData)
      setAssignments(assignmentsData)
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast({
        title: "Error",
        description: "Failed to load pull requests and assignments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const syncPRs = async () => {
    setSyncing(true)
    try {
      // Simulate sync operation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Add a new mock PR to simulate sync
      const newPR: PullRequest = {
        id: Date.now(),
        course_id: courseId,
        pr_number: Math.floor(Math.random() * 1000) + 100,
        pr_name: "New Assignment Submission",
        pr_description: "Recently synced pull request from GitHub",
        status: "open",
        status_grade: "Not Graded",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setPullRequests((prev) => [newPR, ...prev])

      toast({
        title: "Success",
        description: "Pull requests synchronized successfully",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to synchronize pull requests",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const togglePRSelection = (prId: string) => {
    setSelectedPRs((prev) => (prev.includes(prId) ? prev.filter((id) => id !== prId) : [...prev, prId]))
  }

  const reviewSelectedPRs = async () => {
    if (!selectedAssignment) {
      toast({
        title: "Error",
        description: "Please select an assignment for review",
        variant: "destructive",
      })
      return
    }

    if (selectedPRs.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one pull request",
        variant: "destructive",
      })
      return
    }

    setReviewing(true)

    try {
      // Simulate review process
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Mock review results
      const mockResults = selectedPRs.map((prId) => ({
        pr_id: prId,
        summary: "Code review completed. Good implementation with minor suggestions for improvement.",
        comments: [
          {
            path: "index.html",
            position: 10,
            body: "Consider using semantic HTML elements for better accessibility.",
          },
          {
            path: "style.css",
            position: 25,
            body: "Good use of flexbox! Consider adding media queries for better mobile responsiveness.",
          },
        ],
        status: "reviewed",
        processed_at: new Date().toISOString(),
      }))

      // Update PRs with results
      setPullRequests((prev) =>
        prev.map((pr) => {
          const result = mockResults.find((r) => r.pr_id === pr.id.toString())
          if (result) {
            return {
              ...pr,
              status_grade: "Graded",
              result: JSON.stringify(result),
            }
          }
          return pr
        }),
      )

      toast({
        title: "Success",
        description: `Reviewed ${selectedPRs.length} pull request${selectedPRs.length !== 1 ? "s" : ""} successfully`,
        variant: "default",
      })

      setSelectedPRs([])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to review pull requests",
        variant: "destructive",
      })
    } finally {
      setReviewing(false)
    }
  }

  const viewResultDetails = (pr: PullRequest) => {
    try {
      setCurrentPrId(pr.id.toString())

      if (!pr.result) {
        setSelectedResult(null)
        setSelectedResultPR(pr.pr_name || `PR #${pr.pr_number}`)
        setShowResultModal(true)
        return
      }

      let resultData = pr.result
      if (typeof resultData === "string") {
        try {
          resultData = JSON.parse(resultData)
        } catch (e) {
          resultData = {
            summary: resultData,
            message: "Raw result data",
            comments: [],
          }
        }
      }

      setSelectedResult(resultData)
      setSelectedResultPR(pr.pr_name || `PR #${pr.pr_number}`)
      setShowResultModal(true)
    } catch (error) {
      console.error("Failed to load result details:", error)
      toast({
        title: "Error",
        description: "Failed to load result details",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      open: "default",
      merged: "secondary",
      closed: "outline",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "outline"}>{status}</Badge>
  }

  const getGradeBadge = (grade: string) => {
    const variants = {
      Graded: "default",
      "In Progress": "secondary",
      "Not Graded": "outline",
    } as const

    return <Badge variant={variants[grade as keyof typeof variants] || "outline"}>{grade}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select assignment for review" />
            </SelectTrigger>
            <SelectContent>
              {assignments.map((assignment) => (
                <SelectItem key={assignment.id} value={assignment.id.toString()}>
                  {assignment.assignment_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={reviewSelectedPRs}
            disabled={reviewing || selectedPRs.length === 0 || !selectedAssignment}
            className="flex items-center gap-2"
          >
            {reviewing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Review Selected ({selectedPRs.length})
          </Button>
        </div>

        <Button
          onClick={syncPRs}
          disabled={syncing}
          variant="outline"
          className="flex items-center gap-2 bg-transparent"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          Sync PRs
        </Button>
      </div>

      {/* Pull Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pull Requests ({pullRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedPRs.length === pullRequests.length && pullRequests.length > 0}
                        onCheckedChange={(checked) => {
                          setSelectedPRs(checked ? pullRequests.map((pr) => pr.id.toString()) : [])
                        }}
                      />
                    </TableHead>
                    <TableHead>PR #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Grade Status</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pullRequests.map((pr) => (
                    <TableRow key={pr.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPRs.includes(pr.id.toString())}
                          onCheckedChange={() => togglePRSelection(pr.id.toString())}
                        />
                      </TableCell>
                      <TableCell className="font-medium">#{pr.pr_number}</TableCell>
                      <TableCell>{pr.pr_name}</TableCell>
                      <TableCell className="max-w-xs truncate">{pr.pr_description || "-"}</TableCell>
                      <TableCell>{getStatusBadge(pr.status)}</TableCell>
                      <TableCell>{getGradeBadge(pr.status_grade)}</TableCell>
                      <TableCell>
                        {pr.result ? (
                          <Button variant="ghost" size="sm" onClick={() => viewResultDetails(pr)} className="p-1">
                            <Eye className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(pr.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-800">
                          <a
                            href={courseGithubUrl ? `${courseGithubUrl}/pull/${pr.pr_number}` : "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Detail Modal */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Result for {selectedResultPR}</DialogTitle>
            <DialogDescription>Detailed review results and feedback for this pull request.</DialogDescription>
          </DialogHeader>

          {selectedResult ? (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Summary</h3>
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                  {selectedResult.summary || selectedResult.message || "No summary available"}
                </div>
              </div>

              {selectedResult.comments && selectedResult.comments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Comments</h3>
                  <div className="space-y-4">
                    {selectedResult.comments.map((comment: any, index: number) => (
                      <div key={index} className="border rounded-md p-4 bg-gray-50">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">File:</span>
                            <span className="text-sm font-mono">{comment.path}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Line:</span>
                            <span className="text-sm">{comment.position}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm font-medium">Comment:</span>
                            <div className="text-sm p-2 bg-white rounded border">{comment.body || "No comment"}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="text-gray-500">No result data available</div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowResultModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
