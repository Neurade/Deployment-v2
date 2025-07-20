"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import apiClient from "@/lib/axios";
import { RefreshCw, Check, Eye, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CourseService } from "@/features/courses/services/courseService";
import { LLMService } from "@/features/llm/services/llmService";

// Define LLM interface
interface LLM {
  id: number;
  user_id: number;
  model_name: string;
  model_token: string;
  status: string;
}

// Add this interface after your LLM interface
interface ResultData {
  summary?: string;
  message?: string;
  reviewURL?: string;
  status?: string;
  processed_at?: string;
  comments?: {
    path?: string;
    position?: number;
    body?: string;
  }[];
}

export default function PullRequestPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseID;
  const userId = params.userID;
  const { user } = useAuth();

  const [pullRequests, setPullRequests] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedPRs, setSelectedPRs] = useState<string[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [userLLMs, setUserLLMs] = useState<LLM[]>([]);
  const [selectedLLM, setSelectedLLM] = useState<string>("");

  // New state variables for result modal
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [selectedResultPR, setSelectedResultPR] = useState<string | null>(null);

  // New state variables for result editing
  const [editableResult, setEditableResult] = useState<ResultData | null>(null);
  const [isEditingResult, setIsEditingResult] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [currentPrId, setCurrentPrId] = useState<string | null>(null);

  // New state for posting review to GitHub
  const [postingReview, setPostingReview] = useState<Record<string, boolean>>({});

  // Add this to your state variables section
  const [courseData, setCourseData] = useState<any>(null);

  // Add this state to track if we've attempted auto-sync already
  const [hasAttemptedAutoSync, setHasAttemptedAutoSync] = useState(false);

  // Add this state for auto-grading
  const [autoGrading, setAutoGrading] = useState(false);

  // Add this state to track if PRs are already loaded
  const [prsLoaded, setPrsLoaded] = useState(false);

  // Fetch user's LLMs
  const fetchUserLLMs = async () => {
    if (!userId) return;
    
    try {
      const resData = await LLMService.getUserLLMs(Number(userId));
      setUserLLMs(resData);
      
      // If there's only one LLM, select it by default
      if (resData.length === 1) {
        setSelectedLLM(resData[0].id.toString());
      }
    } catch (error) {
      console.error("Failed to fetch user LLMs:", error);
    }
  };

  // Add this function with your other fetch functions
const fetchCourseData = async () => {
  try {
    const res = await CourseService.getCourse(Number(courseId));
    setCourseData(res);
  } catch (error) {
    console.error("Failed to fetch course data:", error);
    toast({
      title: "Error",
      description: "Failed to load course repository information",
      variant: "destructive"
    });
  }
};

  // Fetch PRs - modify to prevent duplicate fetches
  const fetchPRs = async (force = false) => {
    // Skip if already loading or if PRs are loaded and this isn't a forced refresh
    if (loading || (prsLoaded && !force)) return;
    
    setLoading(true);
    try {
      const res = await CourseService.getPullRequests(Number(courseId));
      setPullRequests(res);
      setPrsLoaded(true);
      
      // Auto-sync ONLY if no pull requests found AND we haven't tried syncing yet
      if (res.length === 0 && !hasAttemptedAutoSync && courseData?.github_url) {
        setHasAttemptedAutoSync(true); // Immediately mark that we've attempted sync
        
        // Add slight delay to avoid UI jank
        setTimeout(() => {
          toast({
            title: "No pull requests found",
            description: "Automatically syncing with GitHub repository...",
            variant: "default"
          });
          syncPRs();
        }, 500);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch assignments
  const fetchAssignments = async () => {
    try {
      const res = await CourseService.getAssignments(Number(courseId));
      setAssignments(res);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    }
  };

  // Sync PRs - modify to avoid duplicate API calls
  const syncPRs = async () => {
    if (syncing) return; // Don't allow multiple sync operations
    
    setSyncing(true);
    try {
      // Create FormData with just user_id and course_id
      const formData = new FormData();
      
      // Append only the required fields
      formData.append('user_id', userId as string);
      formData.append('course_id', courseId as string);
      
      // Send FormData to the backend
      const response = await apiClient.post("/webhooks/fetch-pull-requests", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update pullRequests state directly with the response data if available
      if (response.data && response.data.pull_requests) {
        setPullRequests(response.data.pull_requests);
        setPrsLoaded(true);
      } else {
        // Only if the response doesn't include the PRs, fetch them separately
        const res = await CourseService.getPullRequests(Number(courseId));
        setPullRequests(res);
        setPrsLoaded(true);
      }
      
      toast({
        title: "Success",
        description: "Pull requests synchronized successfully",
        variant: "default"
      });
      
      // Auto-grade if enabled for this course
      if (courseData?.auto_grade === true && !autoGrading) {
        setTimeout(() => {
          autoGradePRs();
        }, 500); // Small delay for better UX
      }
    } catch (error) {
      console.error("Failed to sync PRs:", error);
      toast({
        title: "Error",
        description: "Failed to synchronize pull requests",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  // Toggle PR selection
  const togglePRSelection = (prId: string) => {
    setSelectedPRs(prev => 
      prev.includes(prId) 
        ? prev.filter(id => id !== prId) 
        : [...prev, prId]
    );
  };

  // Review selected PRs with immediate UI update
  const reviewSelectedPRs = async () => {
    if (!selectedAssignment) {
      toast({
        title: "Error",
        description: "Please select an assignment for review",
        variant: "destructive"
      });
      return;
    }

    if (selectedPRs.length === 0) {
      toast({
        title: "Error", 
        description: "Please select at least one pull request",
        variant: "destructive"
      });
      return;
    }
    
    if (userLLMs.length > 0 && !selectedLLM) {
      toast({
        title: "Error",
        description: "Please select an LLM for code review",
        variant: "destructive"
      });
      return;
    }

    setReviewing(true);
    
    try {
      // Create FormData object
      const formData = new FormData();
      formData.append('user_id', userId as string);
      formData.append('course_id', courseId as string);
      formData.append('assignment_id', selectedAssignment);
      
      if (selectedLLM) {
        formData.append('llm_id', selectedLLM);
      }
      
      formData.append('pr_ids', selectedPRs.join(','));
      
      // Show progress toast
      toast({
        title: "Processing",
        description: "Reviewing selected pull requests...",
        variant: "default"
      });
      
      const response = await apiClient.post(`/agent/review-pr`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout for long processing
      });
      
      console.log("Review response:", response.data); // Debug log
      
      // Create updated PR array
      const updatedPullRequests = [...pullRequests];
      let updatedCount = 0;
      
      // Process the response results with correct structure
      if (response.data && response.data.results) {
        for (const result of response.data.results) {
          if (result.pr_id) {
            const prIndex = updatedPullRequests.findIndex(pr => pr.id === result.pr_id);
            
            if (prIndex !== -1) {
              // Extract data from the nested response structure
              const responseData = result.response || {};
              
              const resultData = {
                message: responseData.summary || result.message || "",
                summary: responseData.summary || result.summary || "",
                reviewURL: result.review_url || "",
                status: result.status || updatedPullRequests[prIndex].status || "",
                processed_at: new Date().toISOString(),
                comments: responseData.comments || result.comments || []
              };
              
              updatedPullRequests[prIndex] = {
                ...updatedPullRequests[prIndex],
                result: JSON.stringify(resultData),
                status_grade: "Graded" // Set to "Graded" after review
              };
              
              updatedCount++;
            }
          }
        }
      }
      
      // Update UI state AFTER processing all results
      setPullRequests(updatedPullRequests);
      
      // Update modal if open and viewing any of the updated PRs
      if (showResultModal && currentPrId) {
        const updatedPR = updatedPullRequests.find(p => p.id === currentPrId);
        
        if (updatedPR && updatedPR.result) {
          try {
            // Parse the new result data
            const newResultData = JSON.parse(updatedPR.result);
            
            // Force update both states immediately
            setSelectedResult(JSON.stringify(newResultData, null, 2));
            setEditableResult(newResultData);
            
            console.log("Modal updated with new result:", newResultData); // Debug log
          } catch (error) {
            console.error("Failed to parse updated result:", error);
          }
        }
      }
      
      toast({
        title: "Success",
        description: `Reviewed ${updatedCount} pull requests successfully`,
        variant: "default"
      });
      
      setSelectedPRs([]);
      
    } catch (error) {
      console.error("Failed to review PRs:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive"
      });
    } finally {
      setReviewing(false);
    }
  };

  // Add this function to handle viewing result details
  const viewResultDetails = (pr: any) => {
    try {
      setCurrentPrId(pr.id);
      
      // Enhanced debug logging
      console.log("Viewing result for PR:", pr.id);
      console.log("Raw result:", pr.result);
      console.log("Result type:", typeof pr.result);
      
      // Check if there's actually result data
      if (!pr.result || pr.result === 'null' || pr.result === '' || pr.result === '{}') {
        console.log("No valid result data found");
        setSelectedResult(null);
        setEditableResult(null);
        setSelectedResultPR(pr.pr_name || `PR #${pr.pr_number}`);
        setShowResultModal(true);
        setIsEditingResult(false);
        return;
      }
      
      // Parse the result data
      let resultData = pr.result;
      if (typeof resultData === 'string') {
        try {
          resultData = JSON.parse(resultData);
          console.log("Parsed result data:", resultData);
        } catch (e) {
          console.error("Failed to parse result JSON:", e);
          resultData = { 
            summary: resultData,
            message: "Raw result data",
            comments: []
          };
        }
      }
      
      // Validate that we have meaningful data
      if (!resultData || (typeof resultData === 'object' && Object.keys(resultData).length === 0)) {
        console.log("Result data is empty or invalid");
        setSelectedResult(null);
        setEditableResult(null);
      } else {
        console.log("Setting result data:", resultData);
        setSelectedResult(typeof resultData === 'object' ? 
          JSON.stringify(resultData, null, 2) : 
          String(resultData));
        
        setEditableResult(resultData);
      }
      
      setSelectedResultPR(pr.pr_name || `PR #${pr.pr_number}`);
      setShowResultModal(true);
      setIsEditingResult(false);
      
    } catch (error) {
      console.error("Failed to load result details:", error);
      toast({
        title: "Error",
        description: "Failed to load result details",
        variant: "destructive"
      });
    }
  };
  
  // Save edited result
  const saveEditedResult = async () => {
    if (!currentPrId || !editableResult) return;
    
    setSavingResult(true);
    try {
      // Update the PR with the new result
      await apiClient.patch(`/pull-requests/${currentPrId}`, {
        result: JSON.stringify({
          message: editableResult.message,
          summary: editableResult.summary,
          reviewURL: editableResult.reviewURL,
          status: editableResult.status,
          processed_at: new Date().toISOString()
        })
      });
      
      toast({
        title: "Success",
        description: "Result updated successfully",
        variant: "default"
      });
      
      // Refresh PRs to show updated result
      fetchPRs();
      
      // Close the modal
      setShowResultModal(false);
    } catch (error) {
      console.error("Failed to save edited result:", error);
      toast({
        title: "Error",
        description: "Failed to save edited result",
        variant: "destructive"
      });
    } finally {
      setSavingResult(false);
    }
  };

  // Save result changes
  const saveResultChanges = async () => {
    if (!currentPrId || !editableResult) return;
    
    setSavingResult(true);
    try {
      // Create FormData object for backend update
      const formData = new FormData();
      formData.append('pr_id', currentPrId);
      formData.append('result', JSON.stringify(editableResult));
      
      // Send FormData to the backend
      await apiClient.put(`/pull-requests/${currentPrId}/result`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update local state immediately
      setPullRequests(prev => prev.map(p => {
        if (p.id === currentPrId) {
          return {
            ...p,
            result: JSON.stringify(editableResult),
            status_grade: editableResult.status || p.status_grade
          };
        }
        return p;
      }));
      
      // Update the modal content too
      setSelectedResult(typeof editableResult === 'object' ? 
        JSON.stringify(editableResult, null, 2) : 
        editableResult);
      
      toast({
        title: "Success",
        description: "Result updated successfully",
        variant: "default"
      });
      
      setIsEditingResult(false);
      
      // Optional: Refresh PRs in background
      fetchPRs(true);
    } catch (error) {
      console.error("Failed to update result:", error);
      toast({
        title: "Error",
        description: "Failed to update result",
        variant: "destructive"
      });
    } finally {
      setSavingResult(false);
    }
  };

  // Handle summary change
  const handleSummaryChange = (value: string) => {
    setEditableResult((prev: ResultData | null) => {
      if (!prev) return { summary: value };
      return {
        ...prev,
        summary: value
      };
    });
  };

  // Handle comment change
  const handleCommentChange = (index: number, field: string, value: string) => {
    setEditableResult((prev: ResultData | null) => {
      if (!prev || !prev.comments) return prev;
      
      const newComments = [...prev.comments];
      newComments[index] = {
        ...newComments[index],
        [field]: value
      };
      
      return {
        ...prev,
        comments: newComments
      };
    });
  };
  
  // Post review to GitHub with immediate UI update
  const postReviewToGitHub = async (prId: string) => {
    // Don't allow posting if already in progress
    if (postingReview[prId]) return;
    
    // Find the PR in the list
    const pr = pullRequests.find(p => p.id === prId);
    if (!pr || !pr.result) {
      toast({
        title: "Error",
        description: "No review result found for this PR",
        variant: "destructive"
      });
      return;
    }
    
    // Update posting state
    setPostingReview(prev => ({ ...prev, [prId]: true }));
    
    try {
      // Parse the result if it's a string
      let resultData;
      if (typeof pr.result === 'string') {
        try {
          resultData = JSON.parse(pr.result);
        } catch (e) {
          // If not valid JSON, try to handle the format shown in the example
          if (pr.result.startsWith('{\'') || pr.result.startsWith('{"')) {
            // Replace single quotes with double quotes for proper JSON parsing
            const fixedJson = pr.result.replace(/'/g, '"');
            resultData = JSON.parse(fixedJson);
          } else {
            throw new Error("Invalid result format");
          }
        }
      } else {
        resultData = pr.result;
      }
      
      // Format the review request
      const reviewRequest = {
        body: resultData.summary || "Code review feedback",
        event: "COMMENT", // Use COMMENT, APPROVE, or REQUEST_CHANGES based on your needs
        comments: resultData.comments || []
      };
      
      // Create FormData
      const formData = new FormData();
      formData.append('pr_id', prId);
      formData.append('course_id', courseId as string);
      formData.append('review', JSON.stringify(reviewRequest));
      
      // Send the request
      const response = await apiClient.put(`/pull-requests/${prId}/review`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update local state to reflect that review was posted
      setPullRequests(prev => prev.map(p => {
        if (p.id === prId) {
          // Parse existing result
          let existingResult;
          try {
            existingResult = typeof p.result === 'string' ? JSON.parse(p.result) : p.result;
          } catch (e) {
            existingResult = {};
          }
          
          // Create updated result with GitHub review URL if available
          const updatedResult = {
            ...existingResult,
            reviewURL: response.data?.review_url || existingResult.reviewURL,
            posted_to_github: true,
            posted_at: new Date().toISOString()
          };
          
          return {
            ...p,
            result: JSON.stringify(updatedResult),
            status_grade: "Done" // Set to "Done" after posting to GitHub
          };
        }
        return p;
      }));
      
      // Also update the backend
      apiClient.patch(`/pull-requests/${prId}`, {
        status_grade: "Done"
      }).catch(err => console.error("Failed to update status grade in backend:", err));
      
      toast({
        title: "Success",
        description: "Review posted to GitHub successfully",
        variant: "default"
      });
    } catch (error) {
      console.error("Failed to post review to GitHub:", error);
      toast({
        title: "Error",
        description: "Failed to post review to GitHub",
        variant: "destructive"
      });
    } finally {
      setPostingReview(prev => ({ ...prev, [prId]: false }));
    }
  };

  // Add auto-grading function with immediate UI update
  const autoGradePRs = async () => {
    if (autoGrading) return;
    
    setAutoGrading(true);
    try {
      toast({
        title: "Auto-grading",
        description: "Auto-grading pull requests...",
        variant: "default"
      });
      
      // Find a suitable LLM to use
      let llmId = "";
      if (userLLMs.length > 0) {
        // Use the first available LLM or a default one if configured
        llmId = courseData?.default_llm_id || userLLMs[0].id.toString();
      }
      
      // Create FormData object
      const formData = new FormData();
      
      // Add required fields to FormData
      formData.append('user_id', userId as string);
      formData.append('course_id', courseId as string);
      
      // Add LLM ID if available
      if (llmId) {
        formData.append('llm_id', llmId);
      }
      
      // Send FormData to the backend
      const response = await apiClient.post(`/agent/review-pr-auto`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log("Auto-grade response:", response.data); // Debug log
      
      let updatedCount = 0;
      
      // Update local state if response contains results
      if (response.data && response.data.results) {
        // Use functional state update to ensure we're working with the latest state
        setPullRequests(prevPullRequests => {
          // Create a deep copy of the current PRs array
          const updatedPullRequests = prevPullRequests.map(pr => ({ ...pr }));
          
          for (const result of response.data.results) {
            if (result.pr_id) {
              const prIndex = updatedPullRequests.findIndex(pr => pr.id === result.pr_id);
              if (prIndex !== -1) {
                // Extract data from the nested response structure
                const responseData = result.response || {};
                
                const resultData = {
                  message: responseData.summary || result.message || "",
                  summary: responseData.summary || result.summary || "",
                  reviewURL: result.review_url || "",
                  status: result.status || updatedPullRequests[prIndex].status || "",
                  processed_at: new Date().toISOString(),
                  comments: responseData.comments || result.comments || []
                };
                
                // Update only the specific PR, preserving all other data
                updatedPullRequests[prIndex] = {
                  ...updatedPullRequests[prIndex], // Keep all existing properties
                  result: JSON.stringify(resultData),
                  status_grade: "Graded" // Set to "Graded" after auto-grade
                };
                
                updatedCount++;
                
                // Backend update (fire and forget)
                apiClient.patch(`/pull-requests/${result.pr_id}`, {
                  result: JSON.stringify(resultData),
                  status_grade: "Graded" // Also update in backend
                }).catch(err => console.error("Failed to update backend:", err));
              } else {
                console.warn(`PR with ID ${result.pr_id} not found in current state`);
              }
            }
          }
          
          console.log("Updated PRs count:", updatedCount);
          console.log("Total PRs in state:", updatedPullRequests.length);
          
          return updatedPullRequests;
        });
      } else {
        console.warn("No results found in auto-grade response");
      }
      
      toast({
        title: "Success",
        description: `Auto-graded ${updatedCount} pull requests successfully`,
        variant: "default"
      });
    } catch (error) {
      console.error("Failed to auto-grade PRs:", error);
      toast({
        title: "Error",
        description: "Failed to auto-grade pull requests",
        variant: "destructive"
      });
    } finally {
      setAutoGrading(false);
    }
  };

  // Separate useEffect for fetchPRs to ensure courseData is loaded first
  useEffect(() => {
    if (courseData) {
      fetchPRs();
      
      // Auto-grade on initial load if enabled and we have ungraded PRs
      if (courseData.auto_grade === true && userLLMs.length > 0) {
        // Check if we need to auto-grade (only after a delay)
        setTimeout(async () => {
          const ungradedPRs = pullRequests.filter(pr => !pr.result);
          if (ungradedPRs.length > 0) {
            autoGradePRs();
          }
        }, 1000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseData, userLLMs.length]);

  // Modified initial useEffect
  useEffect(() => {
    fetchAssignments();
    fetchUserLLMs();
    fetchCourseData();
    // fetchPRs moved to separate useEffect that depends on courseData
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, userId]);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-8">
        <div className="flex justify-between items-center mb-4">
          <Link href={`/${userId}/course/${courseId}`}>
            <Button variant="ghost">Back to Course Detail</Button>
          </Link>
          <Button onClick={syncPRs} disabled={syncing} variant="outline" className="flex items-center">
            {syncing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Pull Requests
          </Button>
        </div>
        
        {/* Assignment and LLM selection and review button */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div className="w-1/3">
            <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignment for review" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map(assignment => (
                  <SelectItem key={assignment.id} value={assignment.id.toString()}>
                    {assignment.assignment_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* LLM Selection (if available) */}
          {userLLMs.length > 0 && (
            <div className="w-1/3">
              <Select value={selectedLLM} onValueChange={setSelectedLLM}>
                <SelectTrigger>
                  <SelectValue placeholder="Select LLM for review" />
                </SelectTrigger>
                <SelectContent>
                  {userLLMs.map(llm => (
                    <SelectItem key={llm.id} value={llm.id.toString()}>
                      {llm.model_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Button 
            onClick={reviewSelectedPRs} 
            disabled={reviewing || selectedPRs.length === 0 || !selectedAssignment || (userLLMs.length > 0 && !selectedLLM)}
            className="flex items-center"
          >
            {reviewing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Review Selected PRs
          </Button>
          <div className="text-sm text-gray-500">
            {selectedPRs.length} PR{selectedPRs.length !== 1 ? 's' : ''} selected
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Pull Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>PR Name</TableHead>
                    <TableHead>PR Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>PR Number</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Status Grade</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Updated At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pullRequests.map((pr) => (
                    <TableRow key={pr.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPRs.includes(pr.id)}
                          onCheckedChange={() => togglePRSelection(pr.id)}
                        />
                      </TableCell>
                  
                      <TableCell>{pr.pr_name}</TableCell>
                      <TableCell>
                        {pr.pr_description && pr.pr_description !== '<nil>' 
                          ? pr.pr_description 
                          : '-'}
                      </TableCell>
                      <TableCell>{pr.status}</TableCell>
                      <TableCell>{pr.pr_number}</TableCell>
                      <TableCell>
                        {pr.result ? (
                          <div className="flex justify-center">
                            <button 
                              onClick={() => viewResultDetails(pr)}
                              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                              title="View review results"
                            >
                              <Eye className="h-5 w-5 text-blue-600" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400">-</div>
                        )}
                      </TableCell>
                      <TableCell>{pr.status_grade}</TableCell>
                      <TableCell>{pr.created_at ? new Date(pr.created_at).toLocaleString() : "-"}</TableCell>
                      <TableCell>{pr.updated_at ? new Date(pr.updated_at).toLocaleString() : "-"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <a
                            href={courseData?.github_url && pr.pr_number ? 
                              // Use the course's GitHub URL to build the PR URL
                              `${courseData.github_url.trim().replace(/\/$/, '')}/pull/${pr.pr_number}`
                            : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-blue-600 hover:text-blue-900 ${(!courseData?.github_url || !pr.pr_number) ? 'cursor-not-allowed opacity-50' : ''}`}
                            onClick={(e) => {
                              if (!courseData?.github_url || !pr.pr_number) {
                                e.preventDefault();
                                toast({
                                  title: "Error",
                                  description: "GitHub URL information is incomplete",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            View PR
                          </a>
                          {pr.result && (
                            <button
                              onClick={() => postReviewToGitHub(pr.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Post review comments to GitHub"
                            >
                              Post Review
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {loading && <div className="p-4 text-center">Loading...</div>}
            </div>
          </CardContent>
        </Card>
        
        {/* Result Detail Modal */}
        <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Result for {selectedResultPR}
              </DialogTitle>
              <DialogDescription>
                View and edit the review result for this pull request.
              </DialogDescription>
            </DialogHeader>
            
            {editableResult && Object.keys(editableResult).length > 0 ? (
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Summary</h3>
                    {!isEditingResult && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsEditingResult(true)}
                      >
                        Edit Result
                      </Button>
                    )}
                  </div>
                  
                  {isEditingResult ? (
                    <Textarea 
                      value={editableResult.summary || ''} 
                      onChange={(e) => handleSummaryChange(e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                    />
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                      {editableResult.summary || editableResult.message || 'No summary available'}
                    </div>
                  )}
                </div>
                
                {editableResult.comments && editableResult.comments.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Comments</h3>
                    <div className="space-y-4">
                      {editableResult.comments.map((comment: any, index: number) => (
                        <div key={index} className="border rounded-md p-4 bg-gray-50">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">File Path:</span>
                              {isEditingResult ? (
                                <input
                                  type="text"
                                  value={comment.path || ''}
                                  onChange={(e) => handleCommentChange(index, 'path', e.target.value)}
                                  className="border rounded px-2 py-1 text-sm w-full"
                                />
                              ) : (
                                <span className="text-sm">{comment.path}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Position:</span>
                              {isEditingResult ? (
                                <input
                                  type="number"
                                  value={comment.position || 0}
                                  onChange={(e) => handleCommentChange(index, 'position', e.target.value)}
                                  className="border rounded px-2 py-1 text-sm w-32"
                                  disabled // Position is not editable as per requirements
                                />
                              ) : (
                                <span className="text-sm">{comment.position}</span>
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              <span className="text-sm font-medium">Comment:</span>
                              {isEditingResult ? (
                                <Textarea
                                  value={comment.body || ''}
                                  onChange={(e) => handleCommentChange(index, 'body', e.target.value)}
                                  className="text-sm w-full"
                                />
                              ) : (
                                <div className="text-sm p-2 bg-white rounded border">
                                  {comment.body || 'No comment'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {isEditingResult ? (
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingResult(false)}
                      disabled={savingResult}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={saveResultChanges}
                      disabled={savingResult}
                    >
                      {savingResult ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </DialogFooter>
                ) : (
                  <DialogFooter>
                    <Button
                      variant="default"
                      onClick={() => currentPrId && postReviewToGitHub(currentPrId)}
                      disabled={postingReview[currentPrId || '']}
                    >
                      {postingReview[currentPrId || ''] ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Posting to GitHub...
                        </>
                      ) : (
                        <>
                          Post Review to GitHub
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="text-gray-500 mb-4">
                  {reviewing ? (
                    <>
                      <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                      Processing review...
                    </>
                  ) : (
                    "No result data available"
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

// Add this helper function at the top of your component:
const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    // Check for axios error structure
    if ('response' in error && 
        typeof (error as any).response === 'object' && 
        (error as any).response?.data?.message) {
      return (error as any).response.data.message;
    }
    
    // Check for standard Error object
    if ('message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
    }
  }
  
  return "Failed to review selected pull requests";
};