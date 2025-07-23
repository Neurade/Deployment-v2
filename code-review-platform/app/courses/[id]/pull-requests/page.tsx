"use client"

import { usePullRequests } from "@/hooks/use-pull-requests"
import { PullRequestTable } from "@/components/pull-requests/pull-request-table"
import { ReviewControls } from "@/components/pull-requests/review-controls"
import { Sidebar } from "@/components/layout/sidebar"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { ResultModal } from "@/components/pull-requests/result-modal"

export default function PullRequestPage() {
  const {
    pullRequests,
    assignments,
    adminLLMs,
    courseData,
    selectedPRs,
    selectedAssignment,
    selectedLLM,
    reviewing,
    showResultModal,
    selectedResult,
    selectedResultPR,
    editableResult,
    isEditingResult,
    savingResult,
    currentPrId,
    postingReview,
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
    loading,
    syncing,
  } = usePullRequests()

  const selectedPRsArray = Array.from(selectedPRs)
const postingReviewRecord: Record<number, boolean> = {}
postingReview.forEach(id => { postingReviewRecord[id] = true })
console.log("PullRequestPage - postingReviewRecord:", postingReviewRecord)
console.log("editableResult in page", editableResult);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          <ReviewControls
            assignments={assignments}
            userLLMs={adminLLMs}
            selectedAssignment={selectedAssignment}
            selectedLLM={selectedLLM}
            selectedPRs={selectedPRs}
            reviewing={reviewing}
            syncing={syncing}
            onAssignmentChange={setSelectedAssignment}
            onLLMChange={setSelectedLLM}
            onReviewSelected={reviewSelectedPRs}
            onSync={syncPRs}
          />
          <PullRequestTable
            pullRequests={pullRequests}
            selectedPRs={selectedPRsArray}
            courseData={courseData}
            postingReview={postingReviewRecord}
            onToggleSelection={togglePRSelection}
            onPostReview={postReviewToGitHub}
            loading={loading}
            onRefreshPRs={syncPRs}
          />
        
        </div>
      </main>
    </div>
  )
}
