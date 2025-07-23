"use client"

import { AdminConfigForm } from "@/components/admin/admin-config-form"

export default function AdminConfigPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="w-full max-w-md">
        <AdminConfigForm />
      </div>
    </div>
  )
}