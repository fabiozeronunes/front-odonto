export type Role = "ADMIN" | "USER";
export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type Difficulty = "BASICO" | "INTERMEDIARIO" | "AVANCADO";
export type VideoType = "EMBED" | "EXTERNAL" | "UPLOAD";
export type VideoSource = "FRONTODONTUS" | "STUDENT";
export type PlanStatus = "ACTIVE" | "INACTIVE";
export type BillingPeriod = "MONTHLY" | "YEARLY";
export type AccessLevelType = "PUBLIC" | "MEMBER" | "PREMIUM";

export type StudyResourceType =
  | "QUIZ"
  | "FLASHCARDS"
  | "QUESTIONARIO"
  | "MIND_MAP"
  | "INFOGRAPHIC"
  | "RESUMO"
  | "AUDIO_RESUMO"
  | "TRANSCRICAO";

export type StudyResourceStatus = "RASCUNHO" | "EM_REVISAO" | "PUBLICADO" | "REJEITADO";

export interface StudyResource {
  id: string;
  type: StudyResourceType;
  status: StudyResourceStatus;
  title: string;
  content: unknown;
  audioUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  video?: { id: string; title: string; slug: string; thumbnailUrl?: string | null } | null;
  caseStudy?: { id: string; title: string; slug: string } | null;
  author?: { id: string; name: string | null; email?: string } | null;
  mine?: boolean;
  votes?: number;
  rejectedReason?: string | null;
}

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
  createdById?: string | null;
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
  source: VideoSource;
  author?: string | null;
  institution?: string | null;
  observations?: string | null;
  audioUrl?: string | null;
  audioTitle?: string | null;
  audioTags?: VideoTag[];
  audios?: { id: string; url: string; title?: string | null; createdAt?: string }[];
  status: ContentStatus;
  publishedAt?: string | null;
  viewCount: number;
  specialty?: Specialty | null;
  tags: VideoTag[];
  images?: Media[];
  createdById?: string | null;
  createdBy?: { id: string; name: string; email: string; role?: string } | null;
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
  audioUrl?: string | null;
  audioTitle?: string | null;
  audioTags?: { tag: Tag }[];
  publishedAt?: string | null;
  specialty?: Specialty | null;
  tags: { tag: Tag }[];
  images?: Media[];
  videoIds?: string[];
  videoCases?: {
    video: {
      id: string;
      title: string;
      slug: string;
      thumbnailUrl?: string | null;
      durationSeconds?: number | null;
      isFree: boolean;
    };
  }[];
  tagIds?: string[];
  createdById?: string | null;
  createdBy?: { id: string; name: string; email: string; role?: string } | null;
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

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: string | number;
  promoPrice?: string | number | null;
  saleStartsAt?: string | null;
  saleEndsAt?: string | null;
  sku?: string | null;
  stock: number;
  status: ContentStatus;
  isFeatured: boolean;
  brand?: string | null;
  accessLevel: AccessLevelType;
  category?: ProductCategory | null;
  tags: { tag: Tag }[];
  images?: Media[];
  createdAt?: string;
}

export interface ShopOrderItem {
  id: string;
  quantity: number;
  unitPrice: string | number;
  product: { id: string; name: string; slug: string; images?: Media[] };
}

export interface ShopOrder {
  id: string;
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELED";
  subtotal: string | number;
  discount: string | number;
  total: string | number;
  createdAt: string;
  items: ShopOrderItem[];
  user?: { id: string; name: string; email: string; registrationNumber?: string | null };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  registrationNumber?: string | null;
  role: Role;
  isActive?: boolean;
  plan?: { id: string; name: string; slug: string; price: string | number; billing: BillingPeriod };
  paymentStatus?: "PAGO" | "EM_ATRASO" | "AGUARDANDO_PAGAMENTO" | "GRATUITO" | null;
  lastPaymentAt?: string | null;
  expiresAt?: string | null;
  subscriptionStatus?: string | null;
  isAffiliate?: boolean;
  affiliateCode?: string | null;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  tokens: { accessToken: string; refreshToken: string };
}

export interface VideoDetail {
  video: Video & { caseStudies?: { caseStudy: CaseStudy }[] };
  related: Video[];
  relatedImages?: {
    id: string;
    url: string;
    alt?: string | null;
    tags: { tag: Tag }[];
    video?: { id: string; title: string; slug: string } | null;
    caseStudy?: { id: string; title: string; slug: string } | null;
  }[];
  relatedCaseStudies?: {
    id: string;
    title: string;
    slug: string;
    difficulty: Difficulty;
    isFree: boolean;
    videoCases?: {
      video: {
        id: string;
        title: string;
        slug: string;
        thumbnailUrl?: string | null;
        isFree: boolean;
      };
    }[];
  }[];
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
