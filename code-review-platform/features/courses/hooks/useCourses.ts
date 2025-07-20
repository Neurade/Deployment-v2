"use client"

import { useState, useEffect, useCallback } from "react"
import { CourseService } from "../services/courseService"
import type { Course, CourseCreateRequest, CourseState } from "../types"

export const useCourses = (userId: number) => {
  const [state, setState] = useState<CourseState>({
    courses: [],
    currentCourse: null,
    assignments: [],
    pullRequests: [],
    loading: false,
    error: null,
  })

  const fetchCourses = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const courses = await CourseService.getCourses(userId)
      setState(prev => ({
        ...prev,
        courses,
        loading: false,
      }))
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }))
    }
  }, [userId])

  const fetchCourse = useCallback(async (courseId: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const course = await CourseService.getCourse(courseId)
      const assignments = await CourseService.getAssignments(courseId)
      const pullRequests = await CourseService.getPullRequests(courseId)
      setState(prev => ({
        ...prev,
        currentCourse: course,
        assignments: assignments,
        pullRequests: pullRequests,
        loading: false,
      }))
      return course
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }))
      throw error
    }
  }, [])

  const createCourse = useCallback(async (courseData: CourseCreateRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const newCourse = await CourseService.createCourse(courseData)
      setState(prev => ({
        ...prev,
        courses: [...prev.courses, newCourse],
        loading: false,
      }))
      return newCourse
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }))
      throw error
    }
  }, [])

  const updateCourse = useCallback(async (courseId: number, courseData: Partial<CourseCreateRequest>) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const updatedCourse = await CourseService.updateCourse(courseId, courseData)
      setState(prev => ({
        ...prev,
        courses: prev.courses.map(course => 
          course.id === courseId ? updatedCourse : course
        ),
        currentCourse: prev.currentCourse?.id === courseId ? updatedCourse : prev.currentCourse,
        loading: false,
      }))
      return updatedCourse
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }))
      throw error
    }
  }, [])

  const deleteCourse = useCallback(async (courseId: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      await CourseService.deleteCourse(courseId)
      setState(prev => ({
        ...prev,
        courses: prev.courses.filter(course => course.id !== courseId),
        currentCourse: prev.currentCourse?.id === courseId ? null : prev.currentCourse,
        loading: false,
      }))
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }))
      throw error
    }
  }, [])

  const setCurrentCourse = useCallback((course: Course | null) => {
    setState(prev => ({
      ...prev,
      currentCourse: course
    }))
  }, [])

  const setCourses = useCallback((courses: Course[] | ((prev: Course[]) => Course[])) => {
    setState(prev => ({
      ...prev,
      courses: typeof courses === 'function' ? courses(prev.courses) : courses
    }))
  }, [])

  useEffect(() => {
    if (userId) {
      fetchCourses()
    }
  }, [userId, fetchCourses])

  return {
    courses: state.courses,
    currentCourse: state.currentCourse,
    assignments: state.assignments,
    pullRequests: state.pullRequests,
    loading: state.loading,
    error: state.error,
    fetchCourses,
    fetchCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    setCurrentCourse,
    setCourses,
  }
}