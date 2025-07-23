"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw } from "lucide-react"

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

interface ResultModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedResultPR: string | null
  editableResult: ResultData | null
  isEditingResult: boolean
  savingResult: boolean
  currentPrId: string | null
  postingReview: Record<number, boolean> 
  onEditToggle: (editing: boolean) => void
  onSummaryChange: (value: string) => void
  onCommentChange: (index: number, field: string, value: string) => void
  onSaveChanges: () => void
  onPostReview: (prId: string) => void
}

export function ResultModal({
  open,
  onOpenChange,
  selectedResultPR,
  editableResult,
  isEditingResult,
  savingResult,
  currentPrId,
  postingReview,
  onEditToggle,
  onSummaryChange,
  onCommentChange,
  onSaveChanges,
  onPostReview,
}: ResultModalProps) {
  console.log("ResultModal - editableResult:", editableResult)
  console.log("ResultModal - selectedResultPR:", selectedResultPR)

  const hasValidResult =
    editableResult &&
    ((editableResult.summary && editableResult.summary.trim().length > 0) ||
      (editableResult.message && editableResult.message.trim().length > 0) ||
      (editableResult.comments && editableResult.comments.length > 0))

const prIdNum = currentPrId !== null ? Number(currentPrId) : null
const isPosting = prIdNum !== null && postingReview[prIdNum]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Result for {selectedResultPR || "Unknown PR"}</DialogTitle>
          <DialogDescription>View and edit the review result for this pull request.</DialogDescription>
        </DialogHeader>

        {hasValidResult ? (
          <div className="space-y-6 py-4">
            {/* Summary Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Summary</h3>
                {!isEditingResult && (
                  <Button variant="outline" size="sm" onClick={() => onEditToggle(true)}>
                    Edit Result
                  </Button>
                )}
              </div>

              {isEditingResult ? (
                <Textarea
                  value={editableResult?.summary || editableResult?.message || ""}
                  onChange={(e) => onSummaryChange(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="Enter summary..."
                />
              ) : (
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-sm">
                  {editableResult?.summary || editableResult?.message || "No summary available"}
                </div>
              )}
            </div>

            {/* Comments Section */}
            {editableResult?.comments && editableResult.comments.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Comments ({editableResult.comments.length})</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {editableResult.comments.map((comment: any, index: number) => (
                    <div key={index} className="border rounded-md p-4 bg-gray-50">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm font-medium text-gray-700">File Path:</span>
                            {isEditingResult ? (
                              <input
                                type="text"
                                value={comment.path || ""}
                                onChange={(e) => onCommentChange(index, "path", e.target.value)}
                                className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                                placeholder="File path..."
                              />
                            ) : (
                              <div className="mt-1 text-sm font-mono bg-white px-2 py-1 rounded border">
                                {comment.path || "No path specified"}
                              </div>
                            )}
                          </div>

                          <div>
                            <span className="text-sm font-medium text-gray-700">Line Position:</span>
                            {isEditingResult ? (
                              <input
                                type="number"
                                value={comment.position || 0}
                                onChange={(e) => onCommentChange(index, "position", e.target.value)}
                                className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                                disabled
                              />
                            ) : (
                              <div className="mt-1 text-sm bg-white px-2 py-1 rounded border">
                                Line {comment.position || "N/A"}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-sm font-medium text-gray-700">Comment:</span>
                          {isEditingResult ? (
                            <Textarea
                              value={comment.body || ""}
                              onChange={(e) => onCommentChange(index, "body", e.target.value)}
                              className="mt-1 text-sm w-full"
                              rows={3}
                              placeholder="Enter comment..."
                            />
                          ) : (
                            <div className="mt-1 text-sm p-3 bg-white rounded border whitespace-pre-wrap">
                              {comment.body || "No comment"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {isEditingResult ? (
              <DialogFooter>
                <Button variant="outline" onClick={() => onEditToggle(false)} disabled={savingResult}>
                  Cancel
                </Button>
                <Button onClick={onSaveChanges} disabled={savingResult}>
                  {savingResult ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            ) : (
              <DialogFooter>
                <Button variant="default" onClick={() => currentPrId && onPostReview(currentPrId)} disabled={isPosting}>
                  {isPosting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Posting to GitHub...
                    </>
                  ) : (
                    "Post Review to GitHub"
                  )}
                </Button>
              </DialogFooter>
            )}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="text-gray-500 space-y-2">
              <div className="text-lg">No result data available</div>
              <div className="text-sm">This pull request hasn't been reviewed yet.</div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
