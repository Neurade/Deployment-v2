"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Key, Github, Edit } from "lucide-react"
import { TokenModal } from "./token-modal"

export function ProfileContent() {
  const [isModelTokenModalOpen, setIsModelTokenModalOpen] = useState(false)
  const [isGithubTokenModalOpen, setIsGithubTokenModalOpen] = useState(false)

  // Mock user data
  const user = {
    email: "john.doe@example.com",
    role: "Instructor",
    modelToken: "abc****xyz",
    githubToken: "ghp****123",
  }

  const maskToken = (token: string) => {
    if (token.length <= 6) return token
    return token.slice(0, 3) + "****" + token.slice(-3)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and tokens</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <div className="mt-1">
                  <Badge variant="secondary">{user.role}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Token Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Model Token Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                AI Model Token
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Current Token</p>
                  <p className="text-sm text-gray-600 font-mono">
                    {user.modelToken ? maskToken(user.modelToken) : "No token configured"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModelTokenModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  {user.modelToken ? "Edit Token" : "Add Token"}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This token is used to authenticate with the AI model for code evaluation.
              </p>
            </CardContent>
          </Card>

          {/* GitHub Token Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                GitHub Token
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Current Token</p>
                  <p className="text-sm text-gray-600 font-mono">
                    {user.githubToken ? maskToken(user.githubToken) : "No token configured"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsGithubTokenModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  {user.githubToken ? "Edit Token" : "Add Token"}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This token is used to access GitHub repositories and pull requests.
              </p>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-amber-800">Security Notice</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Tokens are partially masked for security. They can be edited but never fully displayed. Store your
                    tokens securely and never share them with others.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TokenModal
        open={isModelTokenModalOpen}
        onOpenChange={setIsModelTokenModalOpen}
        title="AI Model Token"
        description="Enter your AI model API token for code evaluation"
        tokenType="model"
      />

      <TokenModal
        open={isGithubTokenModalOpen}
        onOpenChange={setIsGithubTokenModalOpen}
        title="GitHub Token"
        description="Enter your GitHub personal access token"
        tokenType="github"
      />
    </div>
  )
}
