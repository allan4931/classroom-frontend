export type UserRole = "admin" | "teacher" | "student";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  departmentId?: number;
  department?: Department;
  createdAt?: string;
}

export interface Department {
  id: number;
  name: string;
  code?: string;
  description?: string;
}

export interface Schedule { day: string; startTime: string; endTime: string; }

export interface ClassDetails {
  id: number;
  name: string;
  description?: string;
  status: "active" | "inactive" | "archived";
  capacity: number;
  inviteCode?: string;
  bannerUrl?: string;
  bannerCldPubId?: string;
  schedules?: Schedule[];
  subjectId?: number;
  teacherId?: string;
  subject?: Subject;
  teacher?: CurrentUser;
  department?: Department;
  enrollmentCount?: number;
  createdAt?: string;
}

export interface User extends CurrentUser {
  updatedAt?: string;
  createdAt?: string;
}

export type ListResponse<T = unknown> = {
  data?: T[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
};
export type CreateResponse<T = unknown> = { data?: T };
export type GetOneResponse<T = unknown> = { data?: T };

// Cloudinary
export interface UploadWidgetValue { url: string; publicId: string; }
declare global {
  interface CloudinaryUploadWidgetResults {
    event: string;
    info: { secure_url: string; public_id: string; resource_type: string; original_filename: string };
  }
  interface CloudinaryWidget { open: () => void; }
  interface Window {
    cloudinary?: { createUploadWidget: (options: Record<string, unknown>, callback: (err: unknown, result: CloudinaryUploadWidgetResults) => void) => CloudinaryWidget };
  }
}
