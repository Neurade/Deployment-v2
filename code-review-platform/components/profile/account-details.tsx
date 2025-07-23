"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import type { User } from "@/types/user"

interface AccountDetailsProps {
  user: User
  onLogout: () => void
}

export function AccountDetails({ user, onLogout }: AccountDetailsProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-500">Role</p>
        <p className="font-medium capitalize">
          {user?.role === "super_admin" ? "Administrator" : "Teacher"}
        </p>
      </div>
     
      <div>
        <p className="text-sm text-gray-500">Member since</p>
        <p className="font-medium">
          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
        </p>
      </div>

      <Button variant="destructive" onClick={onLogout} className="w-full mt-4">
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  )
}