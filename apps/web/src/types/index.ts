export type Role = "ADMIN" | "USER";
export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type Difficulty = "BASICO" | "INTERMEDIARIO" | "AVANCADO";
export type VideoType = "EMBED" | "EXTERNAL" | "UPLOAD";
export type PlanStatus = "ACTIVE" | "INACTIVE";
export type BillingPeriod = "MONTHLY" | "YEARLY";

export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

export interface Specialty {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { videos: number };
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  _count?: { videos: number; caseStudies: number };
}

export interface VideoTag {
  tag: Tag;
}

export interface Media {
  id: string;
  url: string;
  alt?: string | null;
  tags?: { tag: Tag }[];
}

export interface Video {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  videoType: VideoType;
  videoUrl: string;
  durationSeconds?: number | null;
  difficulty: Difficulty;
  isFree: boolean;
  author?: string | null;
  institution?: string | null;
  observations?: string | null;
  status: ContentStatus;
  publishedAt?: string | null;
  viewCount: number;
  specialty?: Specialty | null;
  tags: VideoTag[];
  images?: Media[];
  createdById?: string | null;
  createdBy?: { id: string; name: string; email: string } | null;
}

export interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  diagnosis?: string | null;
  difficulty: Difficulty;
  isFree: boolean;
  status: ContentStatus;
  author?: string | null;
  institution?: string | null;
  observations?: string | null;
  publishedAt?: string | null;
  specialty?: Specialty | null;
  tags: Tag[];
  images?: Media[];
  videoIds?: string[];
  videoCases?: { video: { id: string; title: string; slug: string; isFree: boolean } }[];
  tagIds?: string[];
  createdById?: string | null;
  createdBy?: { id: string; name: string; email: string } | null;
}

export interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: string | number;
  billing: BillingPeriod;
  benefits: unknown;
  status: PlanStatus;
  sortOrder: number;
  _count?: { users: number };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  plan?: { id: string; name: string; slug: string; price: string | number; billing: BillingPeriod };
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  tokens: { accessToken: string; refreshToken: string };
}

export interface VideoDetail {
  video: Video & { caseStudies?: { caseStudy: CaseStudy }[] };
  related: Video[];
}

export interface DashboardMetrics {
  users: { total: number; free: number; premium: number };
  subscriptions: { active: number };
  content: {
    videos: number;
    publishedVideos: number;
    specialties: number;
    caseStudies: number;
    tags: number;
  };
  shopping: { products: number; orders: number };
  topVideos: { id: string; title: string; slug: string; viewCount: number; isFree: boolean }[];
  recentUsers: User[];
}
