"use client"

import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Trash2, Loader2 } from "lucide-react"
import type { LLM } from "@/types/llm"

interface LLMTableProps {
  models: LLM[]
  loading: boolean
  onDelete: (id: number) => void
}

export function LLMTable({ models, loading, onDelete }: LLMTableProps) {
  if (loading) {
    return (
      <div className="text-center py-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="text-center py-8">
        <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No models configured</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell>Model Name</TableCell>
          <TableCell>Model ID</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Created</TableCell>
          <TableCell>Action</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {models.map((model) => (
          <TableRow key={model.id}>
            <TableCell className="font-medium">{model.model_name}</TableCell>
            <TableCell className="font-mono text-sm">{model.model_id}</TableCell>
            <TableCell>
              <Badge variant={model.status === "active" ? "default" : "secondary"}>
                {model.status === "active" ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell>{new Date(model.created_at).toLocaleDateString()}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => onDelete(model.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}