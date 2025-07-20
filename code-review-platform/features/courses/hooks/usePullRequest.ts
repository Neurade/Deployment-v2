"use client"

import { useState, useCallback } from "react";
import axios from "@/lib/axios";
import type { Assignment, PullRequest } from "../types";

export function usePullRequest(courseId: number) {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all pull requests for a course
  const fetchPullRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/course/${courseId}/pr`);
      setPullRequests(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch pull requests");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // Fetch all assignments for a course
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/course/${courseId}/assignment`);
      setAssignments(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // Sync pull requests from GitHub
  const syncPullRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`/webhook/fetch-pull-requests`, { course_id: courseId });
      await fetchPullRequests();
    } catch (err: any) {
      setError(err.message || "Failed to sync pull requests");
    } finally {
      setLoading(false);
    }
  }, [courseId, fetchPullRequests]);

  // Grade selected PRs for an assignment
  const gradePullRequests = useCallback(
    async (assignmentId: number, prNumbers: number[]) => {
      setLoading(true);
      setError(null);
      try {
        await axios.post(`/course/${courseId}/grade`, {
          assignment_id: assignmentId,
          pr_ids: prNumbers,
        });
      } catch (err: any) {
        setError(err.message || "Failed to grade pull requests");
      } finally {
        setLoading(false);
      }
    },
    [courseId]
  );

  // Fetch assignments and PRs initially
  const fetchAll = useCallback(async () => {
    await Promise.all([fetchAssignments(), fetchPullRequests()]);
  }, [fetchAssignments, fetchPullRequests]);

  return {
    pullRequests,
    assignments,
    loading,
    error,
    fetchPullRequests,
    fetchAssignments,
    syncPullRequests,
    gradePullRequests,
    fetchAll,
  };
} 