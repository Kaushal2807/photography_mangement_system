export type EditingWorkflowStatus = "pending" | "in_progress" | "completed";

export type EditingOverallStatus = "pending" | "ongoing" | "completed";

export interface EditingBookingSummary {
  id: string;
  bookingNumber: string;
  clientName: string;
  mobile: string;
  eventName: string;
  eventDate: string;
  photographerName: string | null;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  status: "completed" | "ongoing" | "pending";
  createdAt: string;
  updatedAt: string;
}

export interface EditingProject {
  id: string;
  bookingId: string;
  bookingNumber: string;
  clientName: string;
  mobile: string;
  eventName: string;
  eventDate: string;
  photographerName: string | null;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  bookingStatus: "completed" | "ongoing" | "pending";
  editorName: string;
  assignedDate: string;
  selectionStatus: EditingWorkflowStatus;
  albumStatus: EditingWorkflowStatus;
  videoStatus: EditingWorkflowStatus;
  coverStatus: EditingWorkflowStatus;
  pendriveStatus: EditingWorkflowStatus;
  handoverStatus: EditingWorkflowStatus;
  overallStatus: EditingOverallStatus;
  remarks: string | null;
  booking: EditingBookingSummary;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EditingProjectsResponse {
  success: boolean;
  data: EditingProject[];
  pagination: Pagination;
}

export interface SingleEditingProjectResponse {
  success: boolean;
  data: EditingProject;
}

export interface GetEditingQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CreateEditingPayload {
  bookingId: string;
  editorName: string;
  assignedDate?: string;
  selectionStatus?: EditingWorkflowStatus;
  albumStatus?: EditingWorkflowStatus;
  videoStatus?: EditingWorkflowStatus;
  coverStatus?: EditingWorkflowStatus;
  pendriveStatus?: EditingWorkflowStatus;
  handoverStatus?: EditingWorkflowStatus;
  remarks?: string;
}

export interface UpdateEditingPayload {
  editorName?: string;
  remarks?: string;
  overallStatus?: EditingOverallStatus;
}

export interface UpdateEditingProgressPayload {
  selectionStatus?: EditingWorkflowStatus;
  albumStatus?: EditingWorkflowStatus;
  videoStatus?: EditingWorkflowStatus;
  coverStatus?: EditingWorkflowStatus;
  pendriveStatus?: EditingWorkflowStatus;
  handoverStatus?: EditingWorkflowStatus;
}
