"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { pullRequestService } from "@/services/pull-request.service"
import { assignmentService } from "@/services/assignment.service"
import { llmService } from "@/services/llm.service"
import { courseService } from "@/services/course.service"
import type { PullRequest, PullRequestResult, UpdateResultRequest } from "@/types/pull-request"
import type { Assignment } from "@/types/assignment"
import type { LLM } from "@/types/llm"
import type { Course } from "@/types/course"
import { useToast } from "@/hooks/use-toast"

export function usePullRequests() {
  const { user } = useAuth()
  const params = useParams()
  const courseId = parseInt(params.id as string)
  const { toast } = useToast()

  // Data state
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [adminLLMs, setAdminLLMs] = useState<LLM[]>([])
  const [courseData, setCourseData] = useState<Course | null>(null)

  // Selection state
  const [selectedPRs, setSelectedPRs] = useState<Set<number>>(new Set())
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null)
  const [selectedLLM, setSelectedLLM] = useState<number | null>(null)

  // Loading states
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [autoGrading, setAutoGrading] = useState(false)

  // Modal state
  const [showResultModal, setShowResultModal] = useState(false)
  const [selectedResult, setSelectedResult] = useState<PullRequestResult | null>(null)
  const [selectedResultPR, setSelectedResultPR] = useState<PullRequest | null>(null)
  const [editableResult, setEditableResult] = useState<UpdateResultRequest | null>(null)
  const [isEditingResult, setIsEditingResult] = useState(false)
  const [savingResult, setSavingResult] = useState(false)
  const [currentPrId, setCurrentPrId] = useState<number | null>(null)
  const [postingReview, setPostingReview] = useState<Set<number>>(new Set())

  // Load initial data
useEffect(() => {
  console.log("params.id =", params.id)
  console.log("parsed courseId =", courseId)
  console.log("user =", user)

  if (!params.id) return
  if (isNaN(courseId)) return

  if (courseId && user) {
    loadInitialData()
  }
}, [params.id, user])


  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [prs, courseInfo] = await Promise.all([
        pullRequestService.getPullRequestsByCourse(courseId),
        courseService.getCourse(courseId)
      ])
      setPullRequests(prs)
      setCourseData(courseInfo)

      // Load assignments for the course
      if (courseInfo) {
        const courseAssignments = await assignmentService.getAssignments(courseId)
        setAssignments(courseAssignments)
      }

      // Load only admin LLMs
      const llms: LLM[] = await llmService.getAdminLLMs()
      // Deduplicate by id (if needed)
      const llmMap = new Map<number, LLM>()
      llms.forEach((llm: LLM) => llmMap.set(llm.id, llm))
      setAdminLLMs(Array.from(llmMap.values()))
    } catch (error) {
      console.error("Failed to load initial data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Sync pull requests from GitHub
  const syncPRs = async () => {
    try {
      setSyncing(true)
      await pullRequestService.fetchPullRequests(courseId)
      const updatedPRs = await pullRequestService.getPullRequestsByCourse(courseId)
      setPullRequests(updatedPRs)
    } catch (error) {
      console.error("Failed to sync pull requests:", error)
    } finally {
      setSyncing(false)
    }
  }

  // Toggle PR selection
  const togglePRSelection = (prId: number) => {
    const newSelected = new Set(selectedPRs)
    if (newSelected.has(prId)) {
      newSelected.delete(prId)
    } else {
      newSelected.add(prId)
    }
    setSelectedPRs(newSelected)
  }

  // Review selected PRs
  const reviewSelectedPRs = async () => {
    if (!selectedAssignment || !selectedLLM || selectedPRs.size === 0 || !user?.id || !courseId) {
      return
    }
    try {
      setReviewing(true)
      // Always send all selected PR ids as comma-separated string in pr_ids
      const prIdsStr = Array.from(selectedPRs).join(",")
      await pullRequestService.reviewPR({
        user_id: user.id,
        course_id: courseId,
        assignment_id: selectedAssignment,
        llm_id: selectedLLM,
        pr_ids: prIdsStr
      })
      const updatedPRs = await pullRequestService.getPullRequestsByCourse(courseId)
      setPullRequests(updatedPRs)
      setSelectedPRs(new Set())
    } catch (error) {
      console.error("Failed to review pull requests:", error)
    } finally {
      setReviewing(false)
    }
  }

  // View result details
  const viewResultDetails = (pr: PullRequest) => {
    console.log("PR result:", pr.result)
  if (pr.result) {
    setSelectedResult(pr.result)
    setSelectedResultPR(pr)
    setEditableResult({
      summary: pr.result.summary,
      comments: Array.isArray(pr.result.comments)
        ? pr.result.comments.map(
            (comment: any) => ({
              path: comment.path,
              position: comment.position,
              body: comment.body,
              })
          )
        : [] // fallback to empty array if comments is undefined or not an array
    })
    setCurrentPrId(pr.id)
    setShowResultModal(true)
  }
}

  // Handle result changes
  const handleSummaryChange = (summary: string) => {
    if (editableResult) {
      setEditableResult({ ...editableResult, summary })
    }
  }

  const handleCommentChange = (index: number, field: string, value: string | number) => {
    if (editableResult) {
      const updatedComments = [...editableResult.comments]
      updatedComments[index] = { ...updatedComments[index], [field]: value }
      setEditableResult({ ...editableResult, comments: updatedComments })
    }
  }

  // Save result changes
  const saveResultChanges = async () => {
    if (!currentPrId || !editableResult) return
    try {
      setSavingResult(true)
      const updatedPR = await pullRequestService.updateResult(currentPrId, editableResult)
      setPullRequests(prev => prev.map(pr => pr.id === currentPrId ? updatedPR : pr))
      if (updatedPR.result) {
        setSelectedResult(updatedPR.result)
        setSelectedResultPR(updatedPR)
      }
      setIsEditingResult(false)
    } catch (error) {
      console.error("Failed to save result changes:", error)
    } finally {
      setSavingResult(false)
    }
  }

  // Post review to GitHub
  const postReviewToGitHub = async (prId: number) => {
    console.log("Posting review to GitHub for PR ID:", prId);
    console.log("Current course ID:", courseId);
    
   
    try {
      setPostingReview(prev => new Set(prev).add(prId))
      await pullRequestService.postReviewToGitHub(prId, courseId)
      toast({ title: "Review posted to GitHub", variant: "default" })
      // Refresh PR list to update status after posting
      const updatedPRs = await pullRequestService.getPullRequestsByCourse(courseId)
      setPullRequests(updatedPRs)
    } catch (error) {
      toast({ title: "Failed to post review", description: "The review has already been posted or the student did not follow the required file format.", variant: "destructive" })
    } finally {
      setPostingReview(prev => {
        const next = new Set(prev)
        next.delete(prId)
        return next
      })  
    }
  }

  // Auto grade PRs (placeholder)
  const autoGradePRs = async () => {
    console.log("Auto grading not implemented yet")
  }

  return {
    // Data
    pullRequests,
    assignments,
    adminLLMs,
    courseData,

    // Selection state
    selectedPRs,
    selectedAssignment,
    selectedLLM,

    // Loading states
    loading,
    syncing,
    reviewing,
    autoGrading,

    // Modal state
    showResultModal,
    selectedResult,
    selectedResultPR,
    editableResult,
    isEditingResult,
    savingResult,
    currentPrId,
    postingReview,

    // Actions
    syncPRs,
    togglePRSelection,
    setSelectedAssignment,
    setSelectedLLM,
    reviewSelectedPRs,
    viewResultDetails,
    setShowResultModal,
    setIsEditingResult,
    handleSummaryChange,
    handleCommentChange,
    saveResultChanges,
    postReviewToGitHub,
    autoGradePRs,
  }
}