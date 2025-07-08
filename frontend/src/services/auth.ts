import { apiService } from './api';
import { User } from '@/store/slices/authSlice';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  location?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

class AuthService {
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/login', credentials);
  }

  // Register user
  async register(userData: RegisterData): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/register', userData);
  }

  // Logout user
  async logout(): Promise<void> {
    return apiService.post<void>('/auth/logout');
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    return apiService.get<User>('/auth/me');
  }

  // Update user profile
  async updateProfile(profileData: ProfileUpdateData): Promise<User> {
    return apiService.patch<User>('/auth/profile', profileData);
  }

  // Upload avatar
  async uploadAvatar(file: File): Promise<{ avatar: string }> {
    return apiService.upload<{ avatar: string }>('/auth/avatar', file);
  }

  // Connect wallet
  async connectWallet(walletAddress: string, signature: string): Promise<User> {
    return apiService.post<User>('/auth/wallet/connect', {
      walletAddress,
      signature,
    });
  }

  // Disconnect wallet
  async disconnectWallet(): Promise<User> {
    return apiService.post<User>('/auth/wallet/disconnect');
  }

  // Verify email
  async verifyEmail(token: string): Promise<void> {
    return apiService.post<void>('/auth/verify-email', { token });
  }

  // Resend verification email
  async resendVerificationEmail(): Promise<void> {
    return apiService.post<void>('/auth/resend-verification');
  }

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    return apiService.post<void>('/auth/forgot-password', { email });
  }

  // Reset password
  async resetPassword(token: string, password: string): Promise<void> {
    return apiService.post<void>('/auth/reset-password', { token, password });
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return apiService.post<void>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  // Delete account
  async deleteAccount(password: string): Promise<void> {
    return apiService.post<void>('/auth/delete-account', { password });
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User> {
    return apiService.get<User>(`/users/${userId}`);
  }

  // Search users
  async searchUsers(query: string, filters?: {
    skills?: string[];
    location?: string;
    subscription?: string;
  }): Promise<User[]> {
    const params = new URLSearchParams({ q: query });
    if (filters?.skills) params.append('skills', filters.skills.join(','));
    if (filters?.location) params.append('location', filters.location);
    if (filters?.subscription) params.append('subscription', filters.subscription);

    return apiService.get<User[]>(`/users/search?${params.toString()}`);
  }

  // Get user recommendations
  async getUserRecommendations(): Promise<User[]> {
    return apiService.get<User[]>('/users/recommendations');
  }

  // Follow user
  async followUser(userId: string): Promise<void> {
    return apiService.post<void>(`/users/${userId}/follow`);
  }

  // Unfollow user
  async unfollowUser(userId: string): Promise<void> {
    return apiService.delete<void>(`/users/${userId}/follow`);
  }

  // Get user followers
  async getUserFollowers(userId: string): Promise<User[]> {
    return apiService.get<User[]>(`/users/${userId}/followers`);
  }

  // Get user following
  async getUserFollowing(userId: string): Promise<User[]> {
    return apiService.get<User[]>(`/users/${userId}/following`);
  }

  // Check if user is followed
  async isUserFollowed(userId: string): Promise<boolean> {
    return apiService.get<boolean>(`/users/${userId}/followed`);
  }
}

export const authService = new AuthService(); 