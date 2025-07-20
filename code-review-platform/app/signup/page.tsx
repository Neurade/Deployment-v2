"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "instructor", // Default to instructor
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { register, loading, error } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Basic validation
    const newErrors: Record<string, string> = {}
    if (!formData.email) newErrors.email = "Email is required"
    if (!formData.password) newErrors.password = "Password is required"
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters"
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        role: "instructor", // Always use instructor role
      })
      router.push("/dashboard")
    } catch (error: any) {
      setErrors({ general: error.message })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create a new instructor account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {errors.general}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="Enter your email"
                required
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Enter your password"
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="Confirm your password"
                required
              />

              {/* Role selection removed */}

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                disabled={loading}
              >
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
