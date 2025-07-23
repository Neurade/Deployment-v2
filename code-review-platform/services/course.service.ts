import apiClient from "@/lib/axios"
import type { Course, CreateCourseRequest, UpdateCourseRequest } from "@/types/course"
import type { Assignment } from "@/types/assignment"
import type { PullRequest } from "@/types/pullrequest"

export const courseService = {
  async getCourses(userId: number): Promise<Course[]> {
    const response = await apiClient.get<Course[]>(`/courses/owner/${userId}`);
    return response.data;
  },

  async getCourse(courseId: number): Promise<Course> {
    const response = await apiClient.get<Course>(`/courses/${courseId}`);
    return response.data;
  },

  async createCourse(courseData: CreateCourseRequest & { generalAnswerFile?: File }): Promise<Course> {
    const formData = new FormData();
    formData.append("course_name", courseData.course_name);
    formData.append("github_url", courseData.github_url);
    formData.append("auto_grade", String(courseData.auto_grade));
    if (courseData.generalAnswerFile) {
      formData.append("file", courseData.generalAnswerFile);
      const response = await apiClient.post<Course>("/courses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } else {
      const response = await apiClient.post<Course>("/courses", courseData);
      return response.data;
    }
  },

  async updateCourse(courseId: number, courseData: UpdateCourseRequest | FormData): Promise<Course> {
    if (courseData instanceof FormData) {
      const response = await apiClient.put<Course>(`/courses/${courseId}`, courseData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } else {
      const response = await apiClient.put<Course>(`/courses/${courseId}`, courseData);
      return response.data;
    }
  },

  async deleteCourse(courseId: number): Promise<void> {
    await apiClient.delete(`/courses/${courseId}`);
  },

  async getCourseAssignments(courseId: number): Promise<Assignment[]> {
    const response = await apiClient.get<Assignment[]>(`/assignments/course/${courseId}`);
    return response.data;
  },

  async getCoursePullRequests(courseId: number): Promise<PullRequest[]> {
    const response = await apiClient.get<PullRequest[]>(`/pull-requests/course/${courseId}`);
    return response.data;
  },

  async uploadGeneralAnswer(courseId: number, file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);
    await apiClient.post(`/courses/${courseId}/general-answer`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  async getCourseUsers(courseId: number): Promise<any[]> {
    const response = await apiClient.get(`/courses/${courseId}/users`)
    return response.data
  },

  async assignUserToCourse(courseId: number, userId: number): Promise<void> {
    await apiClient.post(`/courses/${courseId}/assign-user/${userId}`)
  },

  async updateUserCoursePermissions(userId: number, courseIds: number[]): Promise<void> {
    const formData = new FormData()
    
    // Add user_id as form field
    formData.append('user_id', userId.toString())
    
    // Add course_ids as array (course_ids[]=1&course_ids[]=2)
    courseIds.forEach(courseId => {
      formData.append('course_ids', courseId.toString())
    })
    
    await apiClient.post(`/users/${userId}/courses-permission`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  async getCoursesByPermission(userId: number): Promise<Course[]> {
    const response = await apiClient.get<Course[]>(`/courses/permission/${userId}`)
    return response.data
  },

  async getCoursesByOwner(userId: number): Promise<Course[]> {
    const response = await apiClient.get<Course[]>(`/courses/owner/${userId}`)
    return response.data
  },
}