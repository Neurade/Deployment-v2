"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { llmService } from "@/services/llm.service"
import { Sidebar } from "@/components/layout/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProfileForm } from "@/components/profile/profile-form"
import { AccountDetails } from "@/components/profile/account-details"
import { LLMTable } from "@/components/llm/llm-table"
import { LLMDialog } from "@/components/llm/llm-dialog"
import { User, Brain, Plus, Key } from "lucide-react"
import type { LLM } from "@/types/llm"

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [llmModels, setLlmModels] = useState<LLM[]>([])
  const [llmLoading, setLlmLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (user?.role === "super_admin") {
      fetchLLMs()
    }
  }, [user])

  const fetchLLMs = async () => {
    if (!user?.id) return
    
    try {
      setLlmLoading(true)
      const models = await llmService.getLLMs(user.id)
      setLlmModels(models)
    } catch (error) {
      console.error("Failed to fetch LLM models:", error)
    } finally {
      setLlmLoading(false)
    }
  }

  const handleDeleteLLM = async (llmId: number) => {
    if (!confirm("Are you sure you want to delete this model?")) return

    try {
      await llmService.deleteLLM(llmId)
      await fetchLLMs()
    } catch (error) {
      console.error("Failed to delete LLM:", error)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600 mt-2">Manage your account information and settings</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Information */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <User className="h-6 w-6" />
                      <CardTitle>Personal Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ProfileForm user={user!} />
                  </CardContent>
                </Card>

                {/* LLM Management - Only for super_admin */}
                {user?.role === "super_admin" && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Brain className="h-6 w-6" />
                          <CardTitle>LLM Models</CardTitle>
                        </div>
                        <Button onClick={() => setShowCreateModal(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <LLMTable
                        models={llmModels}
                        loading={llmLoading}
                        onDelete={handleDeleteLLM}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Account Details */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Key className="h-6 w-6" />
                      <CardTitle>Account Details</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <AccountDetails user={user!} onLogout={logout} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <LLMDialog
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSuccess={fetchLLMs}
        />
      </main>
    </div>
  )
}