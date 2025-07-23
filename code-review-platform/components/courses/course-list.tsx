"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useCourses } from "@/hooks/use-courses"
import { useAuth } from "@/hooks/use-auth"
import { CreateCourseModal } from "@/components/courses/create-course-modal"
import { EditCourseModal } from "@/components/courses/edit-course-modal"
import { Plus, Search, MoreVertical, Eye, Edit, Trash2, Users, FileText, Download, ExternalLink } from "lucide-react"
import Link from "next/link"
import type { Course } from "@/types/course"

export function CourseList() {
  const { courses, loading, deleteCourse } = useCourses()
  const { isAdmin } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const filteredCourses = courses.filter((course) =>
    course.course_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEdit = (course: Course) => {
    setSelectedCourse(course)
    setEditModalOpen(true)
  }

  const handleDelete = async (courseId: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa khóa học này?")) {
      await deleteCourse(courseId)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý khóa học</h1>
          <p className="text-gray-600 mt-1">Quản lý và theo dõi các khóa học của bạn</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo khóa học
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Tìm kiếm khóa học..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có khóa học nào</h3>
            <p className="text-gray-600 text-center mb-4">
              {isAdmin
                ? "Bắt đầu bằng cách tạo khóa học đầu tiên của bạn"
                : "Bạn chưa được cấp quyền truy cập khóa học nào"}
            </p>
            {isAdmin && (
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo khóa học
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{course.course_name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={course.auto_grade ? "default" : "secondary"}>
                        {course.auto_grade ? "Tự động chấm" : "Chấm thủ công"}
                      </Badge>
                      {course.github_url && (
                        <a
                          href={course.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/courses/${course.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => handleEdit(course)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(course.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Repository:</span>
                      <span className="font-mono text-xs">
                        {course.owner}/{course.repo_name}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Tạo lúc:</span>
                      <span>{new Date(course.created_at).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Link href={`/courses/${course.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        <Eye className="h-3 w-3 mr-1" />
                        Chi tiết
                      </Button>
                    </Link>
                    {isAdmin && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(course)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(course.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Contextual Actions */}
                  <div className="flex space-x-2 pt-2 border-t">
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Users className="h-3 w-3 mr-1" />
                      Phân quyền
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1">
                      <FileText className="h-3 w-3 mr-1" />
                      Bài tập
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Download className="h-3 w-3 mr-1" />
                      Xuất dữ liệu
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateCourseModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={async () => {}}
      />
      {selectedCourse && (
        <EditCourseModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          course={selectedCourse}
          onSuccess={() => setEditModalOpen(false)}
        />
      )}
    </div>
  )
}
