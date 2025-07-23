"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth" // Add this import
import { llmService } from "@/services/llm.service"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react"

interface LLMDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function LLMDialog({ open, onOpenChange, onSuccess }: LLMDialogProps) {
  const { user } = useAuth() // Add this to get current user
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    provider: "",
    token: "",
    model_id: "",
    model_name: "",
  })
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [verifying, setVerifying] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenVerified, setTokenVerified] = useState(false)

  const resetForm = () => {
    setFormData({
      provider: "",
      token: "",
      model_id: "",
      model_name: "",
    })
    setStep(1)
    setAvailableModels([])
    setTokenVerified(false)
    setError(null)
  }

  const handleVerifyToken = async () => {
    if (!formData.provider || !formData.token) {
      setError("Please select provider and enter token")
      return
    }

    setVerifying(true)
    setError(null)

    try {
      const result = await llmService.verifyTokenAndGetModels(formData.provider, formData.token)
      
      // Check if models array is empty - indicates invalid token
      if (!result.models || result.models.length === 0) {
        setError("Invalid token - no models found for this provider")
        setTokenVerified(false)
        setAvailableModels([])
        return
      }
      
      setAvailableModels(result.models)
      setTokenVerified(true)
      setStep(2)
    } catch (error: any) {
      setError(error.response?.data?.message || "Invalid token or error occurred")
      setTokenVerified(false)
      setAvailableModels([])
    } finally {
      setVerifying(false)
    }
  }

  const handleCreateLLM = async () => {
    if (!formData.model_id || !formData.model_name) {
      setError("Please select model and enter name")
      return
    }

    // Check if user is available
    if (!user?.id) {
      setError("User not found. Please refresh and try again.")
      return
    }

    setCreating(true)
    setError(null)

    try {
      await llmService.createLLM({
        provider: formData.provider,
        model_token: formData.token,
        model_id: formData.model_id,
        model_name: formData.model_name,
        user_id: user.id, // Pass the user ID
      })
      
      onSuccess()
      handleClose()
    } catch (error: any) {
      setError(error.response?.data?.message || "Error occurred while creating model")
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add LLM Model</DialogTitle>
          <DialogDescription>
            {step === 1 ? "Select provider and verify token" : "Select model and set name"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step indicator */}
          <div className="flex items-center space-x-2 text-sm">
            <div className={`flex items-center ${step >= 1 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}>
                1
              </div>
              Verify
            </div>
            <div className="flex-1 h-px bg-gray-200"></div>
            <div className={`flex items-center ${step >= 2 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}>
                2
              </div>
              Configure
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => setFormData({ ...formData, provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="google">Google (Gemini)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>API Token</Label>
                <Input
                  type="password"
                  placeholder="Enter API token"
                  value={formData.token}
                  onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleVerifyToken} 
                  disabled={verifying || !formData.provider || !formData.token}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Token"
                  )}
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Token valid! Found {availableModels.length} models</span>
              </div>

              <div className="space-y-2">
                <Label>Select Model</Label>
                <Select
                  value={formData.model_id}
                  onValueChange={(value) => setFormData({ ...formData, model_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model ID" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((modelId) => (
                      <SelectItem key={modelId} value={modelId}>
                        {modelId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Model Name</Label>
                <Input
                  placeholder="e.g. GPT-4 Turbo for Code Review"
                  value={formData.model_name}
                  onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={handleCreateLLM}
                  disabled={creating || !formData.model_id || !formData.model_name}
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Model"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}