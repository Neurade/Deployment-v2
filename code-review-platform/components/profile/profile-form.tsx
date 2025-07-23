"use client"

import { useState, useEffect } from "react"
import { userService } from "@/services/user.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff } from "lucide-react"
import type { User } from "@/types/user"
import { setegid } from "process"

// Helper to mask token except last 3 chars
function maskToken(token: string) {
  if (!token) return ""
  if (token.length <= 3) return token
  return "•".repeat(token.length - 3) + token.slice(-3)
}

interface ProfileFormProps {
  user: User
  onUpdate?: (updatedUser: User) => void
}

export function ProfileForm({ user, onUpdate }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [githubToken, setGithubToken] = useState<string>("")
  const [showFullToken, setShowFullToken] = useState(false)
const [initialToken, setInitialToken] = useState<string>("")

useEffect(() => {
  let ignore = false

  userService.fetchGithubToken()
    .then((token) => {
      if (!ignore) {
        const safeToken = token || ""
        setGithubToken(safeToken)
        setInitialToken(safeToken)  // lưu giá trị gốc
      }
    })
    .catch(() => {
      // error handling
    })

  return () => {
    ignore = true
  }
}, [user?.id])



    // console.log(isEditing, githubToken, user?.github_token) ;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
      // console.log("🔁 handleSubmit called")
    
    if (!user?.id) {
      setError("User ID not found")
      return
    }

    // Basic validation
    if (!githubToken.trim()) {
      setError("GitHub token cannot be empty")
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    setIsEditing(true)
    try {
      const updatedUser = await userService.updateGitHubToken(user.id, githubToken)
      setSuccessMessage("GitHub token updated successfully")
      setGithubToken(updatedUser.github_token || "")
      if (onUpdate) {
        onUpdate(updatedUser)
      }
      setIsEditing(true)
      setShowFullToken(false)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error: any) {
      // console.error("Failed to update GitHub token:", error)
      if (error?.response?.data?.message?.toLowerCase().includes("invalid")) {
        setError("Github token Invalid")
      } else {
        setError("Unable to update GitHub token due to an invalid key. Please check and try again.")
      }
      setGithubToken(initialToken || "")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset token to original user value
    setGithubToken(initialToken || "")
    setIsEditing(false)
    setError(null)
    setSuccessMessage(null)
    setShowFullToken(false)
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-600">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Read-only Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            value={user?.email || ""} 
            disabled 
            className="bg-gray-50" 
          />
          <p className="text-xs text-gray-400">Email cannot be changed</p>
        </div>

        {/* Editable GitHub Token Field */}
        <div className="space-y-2">
          <Label>GitHub Token</Label>
          <Input
            type={isEditing ? "text" : "password"}
            value={isEditing ? githubToken : maskToken(githubToken)}
            disabled={!isEditing}
            onChange={e => setGithubToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          />
          <p className="text-xs text-gray-500">
            {githubToken
              ? isEditing
                ? "Edit your GitHub token and save."
                : "Token is set."
              : "No token set."}
          </p>
        </div>

        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button 
                type="submit" 
                disabled={loading || githubToken === (user.github_token || "") || !githubToken.trim()}
              >
                {loading ? "Validating & Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => setIsEditing(true)}>
              <Settings className="h-4 w-4 mr-2" />
              {githubToken ? "Edit GitHub Token" : "Set GitHub Token"}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}