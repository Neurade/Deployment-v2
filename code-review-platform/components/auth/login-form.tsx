"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, User, Lock } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const { login } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Check for default admin credentials - redirect to admin config
      if (formData.email === "admin@gmail.com" && formData.password === "admin123") {
        toast({
          title: "Default Admin Credentials",
          description: "Redirecting to admin configuration...",
          duration: 2000, // 2 seconds for user to read
        })
        setTimeout(() => {
          router.push("/admin/config")
        }, 2000)
        setLoading(false)
        return
      }

      // For all other credentials, use normal login
      const result = await login({ email: formData.email, password: formData.password })
      
      if (result.success) {
        toast({
          title: "Login Successful",
          description: "Redirecting to dashboard...",
          duration: 2000, // 2 seconds for user to read
        })
        
          if (result.user && result.user.role === "super_admin") {
            router.push("/users")
          } else {
            router.push("/courses")
          }
      
        
      } else {
        // Error messages stay longer for user to read
        toast({
          title: "Login Failed",
          description: result.message || "Please check your credentials and try again.",
          duration: 4000, // 4 seconds for error messages
        })
      }
    } catch (error: any) {
      // Connection errors stay longer for user to read
      toast({
        title: "Connection Error",
        description: error?.message || "Please check your internet connection and try again.",
        duration: 4000, // 4 seconds for error messages
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Login</CardTitle>
        <p className="text-sm text-gray-600 text-center">Enter your login credentials</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="email"
                type="email"
                placeholder="admin@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                className="pl-10 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}