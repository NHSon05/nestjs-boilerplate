import {
  Gender,
  GuideVerificationStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  gender?: Gender;
  dateOfBirth?: Date | string | null;
  avatarUrl?: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerificationAt?: Date | string | null;
  lastLoginAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TouristProfile {
  userId: string;
  preferredLanguage?: string | null;
  nationality?: string | null;
  interests?: string[];
  travelPreferences?: Record<string, any> | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface GuideProfile {
  userId?: string;
  bio?: string | null;
  yearsExperience?: number;
  hourlyRate?: number | string | null;
  city?: string | null;
  country?: string | null;
  currency?: string;
  isAvailable?: boolean;
  verificationStatus?: GuideVerificationStatus;
  averageRating?: number | string;
  reviewCount?: number;
  languages?: any[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface UserWithProfiles extends User {
  touristProfile?: TouristProfile | null;
  guideProfile?: GuideProfile | null;
}
