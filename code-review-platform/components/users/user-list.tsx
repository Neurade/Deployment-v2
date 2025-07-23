"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useCourses } from "@/hooks/use-courses"
import { useUsers } from "@/hooks/use-users"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Trash2, UserCheck, BookOpen } from "lucide-react"
import { CreateUserModal } from "@/components/users/create-user-modal"
import { ViewCoursesModal } from "@/components/users/view-courses-modal"
import { UserDetailsModal } from "@/components/users/user-details-modal"
import { AssignCoursesModal } from "@/components/users/assign-courses-modal"
import { courseService } from "@/services/course.service"
import type { User } from "@/types/user"

export function UserList() {
  const { isAdmin, user } = useAuth()
  const userId = user?.id ?? 0
  const { courses } = useCourses(userId, false) // Admin gets all courses they own
  const { users, loading, deleteUser, refetch } = useUsers()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCoursesModal, setShowCoursesModal] = useState(false)
  const [showAssignCoursesModal, setShowAssignCoursesModal] = useState(false)
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false)

  // Store permission-based courses for each user
  const [userCoursesMap, setUserCoursesMap] = useState<Record<number, string[]>>({})

  // Filter out super_admin users
  const teacherUsers = users.filter(user => user.role !== "super_admin")

  const getCourseNames = (courseIds: number[]) => {
    return courses.filter((course) => courseIds.includes(course.id)).map((course) => course.course_name)
  }

  const getUnassignedCourses = (user: User) => {
    return courses.filter(course => !(user.assigned_courses || []).includes(course.id))
  }

  const handleDeleteUser = async (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      await deleteUser(userId)
      refetch()
    }
  }

  const handleOpenAssignCourses = (user: User) => {
    setSelectedUser(user)
    setShowAssignCoursesModal(true)
  }

  const handleOpenUserDetails = (user: User) => {
    setSelectedUser(user)
    setShowUserDetailsModal(true)
  }

  const handleAssignCoursesComplete = () => {
    refetch()
    setShowAssignCoursesModal(false)
  }

  useEffect(() => {
    // Fetch permission-based courses for all users
    async function fetchCourses() {
      const map: Record<number, string[]> = {}
      await Promise.all(
        teacherUsers.map(async (user) => {
          try {
            const permissionCourses = await courseService.getCoursesByPermission(user.id)
            map[user.id] = permissionCourses.map((c: any) => c.course_name)
          } catch {
            map[user.id] = []
          }
        })
      )
      setUserCoursesMap(map)
    }
    if (teacherUsers.length > 0) fetchCourses()
  }, [users, courses])

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">You don't have permission to access this page.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage teacher accounts and course permissions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Account
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Courses</TableHead> {/* Added column */}
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teacherUsers.map((user: User) => {
                const assignedCourseNames = getCourseNames(user.assigned_courses || [])
                const unassignedCourses = getUnassignedCourses(user)
                const permissionCourses = userCoursesMap[user.id] || []

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="default">Teacher</Badge>
                    </TableCell>
                    <TableCell>
                      {permissionCourses.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {permissionCourses.map((name, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No courses</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString("en-US")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenUserDetails(user)}
                          title="View user details"
                        >
                          <UserCheck className="h-4 w-4 text-blue-500" />
                        </Button>
                        
                        {unassignedCourses.length > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleOpenAssignCourses(user)}
                            title="Assign courses"
                          >
                            <BookOpen className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteUser(user.id)}
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateUserModal 
        open={showCreateModal} 
        onOpenChange={open => {
          setShowCreateModal(open)
          if (!open) refetch()
        }} 
      />

      <ViewCoursesModal 
        open={showCoursesModal}
        onOpenChange={setShowCoursesModal}
        user={selectedUser}
        courses={courses}
      />

      <UserDetailsModal
        open={showUserDetailsModal}
        onOpenChange={setShowUserDetailsModal}
        user={selectedUser}
        courses={courses}
        getCourseNames={getCourseNames}
      />

      <AssignCoursesModal
        open={showAssignCoursesModal}
        onOpenChange={setShowAssignCoursesModal}
        user={selectedUser}
        courses={courses}
        getUnassignedCourses={getUnassignedCourses}
        onAssignComplete={handleAssignCoursesComplete}
      />
    </div>
  )
}