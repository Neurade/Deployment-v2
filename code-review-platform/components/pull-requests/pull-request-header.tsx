"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface PullRequestHeaderProps {
  syncing: boolean
  onSync: () => void
}

export function PullRequestHeader({ syncing, onSync }: PullRequestHeaderProps) {
  const params = useParams()
  const userId = params.userID
  const courseId = params.courseID

  return (
    <div className="flex justify-between items-center mb-4">
      <Link href={`/${userId}/course/${courseId}`}>
        <Button variant="ghost">Back to Course Detail</Button>
      </Link>
      <Button onClick={onSync} disabled={syncing} variant="outline" className="flex items-center bg-transparent">
        {syncing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
        Sync Pull Requests
      </Button>
    </div>
  )
}
