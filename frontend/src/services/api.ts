import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    walletAddress?: string;
  }) => api.post('/auth/register', userData),
  
  logout: () => api.post('/auth/logout'),
  
  refreshToken: () => api.post('/auth/refresh'),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  
  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),
  
  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  
  updateProfile: (profileData: any) =>
    api.put('/users/profile', profileData),
  
  updateAvatar: (formData: FormData) =>
    api.put('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  searchUsers: (params: any) =>
    api.get('/users/search', { params }),
  
  getUser: (id: string) => api.get(`/users/${id}`),
  
  sendConnectionRequest: (targetUserId: string) =>
    api.post('/users/connections', { targetUserId }),
  
  acceptConnection: (connectionId: string) =>
    api.put(`/users/connections/${connectionId}/accept`),
  
  rejectConnection: (connectionId: string) =>
    api.put(`/users/connections/${connectionId}/reject`),
  
  removeConnection: (connectionId: string) =>
    api.delete(`/users/connections/${connectionId}`),
  
  getConnections: (params?: any) =>
    api.get('/users/connections', { params }),
  
  getConnectionRequests: () =>
    api.get('/users/connection-requests'),
  
  updateSettings: (settings: any) =>
    api.put('/users/settings', settings),
  
  getNotifications: (params?: any) =>
    api.get('/users/notifications', { params }),
  
  markNotificationRead: (notificationId: string) =>
    api.put(`/users/notifications/${notificationId}/read`),
  
  markAllNotificationsRead: () =>
    api.put('/users/notifications/read-all'),
  
  deleteNotification: (notificationId: string) =>
    api.delete(`/users/notifications/${notificationId}`),
};

// Community API
export const communityAPI = {
  getCommunities: (params?: any) =>
    api.get('/communities', { params }),
  
  getCommunity: (id: string) =>
    api.get(`/communities/${id}`),
  
  createCommunity: (communityData: any) =>
    api.post('/communities', communityData),
  
  updateCommunity: (id: string, data: any) =>
    api.put(`/communities/${id}`, data),
  
  deleteCommunity: (id: string) =>
    api.delete(`/communities/${id}`),
  
  joinCommunity: (id: string) =>
    api.post(`/communities/${id}/join`),
  
  leaveCommunity: (id: string) =>
    api.post(`/communities/${id}/leave`),
  
  getCommunityMembers: (id: string, params?: any) =>
    api.get(`/communities/${id}/members`, { params }),
  
  inviteMember: (communityId: string, email: string) =>
    api.post(`/communities/${communityId}/invite`, { email }),
  
  removeMember: (communityId: string, memberId: string) =>
    api.delete(`/communities/${communityId}/members/${memberId}`),
  
  promoteToModerator: (communityId: string, memberId: string) =>
    api.put(`/communities/${communityId}/members/${memberId}/promote`),
  
  demoteFromModerator: (communityId: string, memberId: string) =>
    api.put(`/communities/${communityId}/members/${memberId}/demote`),
  
  getCommunityPosts: (communityId: string, params?: any) =>
    api.get(`/communities/${communityId}/posts`, { params }),
  
  createPost: (communityId: string, postData: any) =>
    api.post(`/communities/${communityId}/posts`, postData),
  
  updatePost: (communityId: string, postId: string, data: any) =>
    api.put(`/communities/${communityId}/posts/${postId}`, data),
  
  deletePost: (communityId: string, postId: string) =>
    api.delete(`/communities/${communityId}/posts/${postId}`),
  
  likePost: (communityId: string, postId: string) =>
    api.post(`/communities/${communityId}/posts/${postId}/like`),
  
  unlikePost: (communityId: string, postId: string) =>
    api.delete(`/communities/${communityId}/posts/${postId}/like`),
  
  getPostComments: (communityId: string, postId: string, params?: any) =>
    api.get(`/communities/${communityId}/posts/${postId}/comments`, { params }),
  
  addComment: (communityId: string, postId: string, commentData: any) =>
    api.post(`/communities/${communityId}/posts/${postId}/comments`, commentData),
  
  updateComment: (communityId: string, postId: string, commentId: string, data: any) =>
    api.put(`/communities/${communityId}/posts/${postId}/comments/${commentId}`, data),
  
  deleteComment: (communityId: string, postId: string, commentId: string) =>
    api.delete(`/communities/${communityId}/posts/${postId}/comments/${commentId}`),
  
  getMyCommunities: (params?: any) =>
    api.get('/communities/my', { params }),
  
  getCommunityEvents: (communityId: string, params?: any) =>
    api.get(`/communities/${communityId}/events`, { params }),
};

// Event API
export const eventAPI = {
  getEvents: (params?: any) =>
    api.get('/events', { params }),
  
  getEvent: (id: string) =>
    api.get(`/events/${id}`),
  
  createEvent: (eventData: any) =>
    api.post('/events', eventData),
  
  updateEvent: (id: string, data: any) =>
    api.put(`/events/${id}`, data),
  
  deleteEvent: (id: string) =>
    api.delete(`/events/${id}`),
  
  registerForEvent: (id: string) =>
    api.post(`/events/${id}/register`),
  
  unregisterFromEvent: (id: string) =>
    api.post(`/events/${id}/unregister`),
  
  getEventAttendees: (id: string, params?: any) =>
    api.get(`/events/${id}/attendees`, { params }),
  
  checkInAttendee: (eventId: string, attendeeId: string) =>
    api.post(`/events/${eventId}/attendees/${attendeeId}/checkin`),
  
  getMyEvents: (params?: any) =>
    api.get('/events/my', { params }),
  
  getMyRegistrations: (params?: any) =>
    api.get('/events/registrations', { params }),
  
  cancelRegistration: (eventId: string) =>
    api.post(`/events/${eventId}/cancel-registration`),
  
  getEventStats: (id: string) =>
    api.get(`/events/${id}/stats`),
  
  sendEventReminder: (id: string) =>
    api.post(`/events/${id}/send-reminder`),
  
  duplicateEvent: (id: string) =>
    api.post(`/events/${id}/duplicate`),
};

// Payment API
export const paymentAPI = {
  createCheckoutSession: (data: any) =>
    api.post('/payments/create-checkout-session', data),
  
  createPortalSession: () =>
    api.post('/payments/create-portal-session'),
  
  getSubscription: () =>
    api.get('/payments/subscription'),
  
  cancelSubscription: () =>
    api.post('/payments/cancel-subscription'),
  
  updatePaymentMethod: (data: any) =>
    api.put('/payments/payment-method', data),
  
  getPaymentHistory: (params?: any) =>
    api.get('/payments/history', { params }),
  
  getInvoice: (invoiceId: string) =>
    api.get(`/payments/invoices/${invoiceId}`),
  
  downloadInvoice: (invoiceId: string) =>
    api.get(`/payments/invoices/${invoiceId}/download`),
};

// AI API
export const aiAPI = {
  analyzeSentiment: (text: string) =>
    api.post('/ai/sentiment', { text }),
  
  extractTopics: (text: string) =>
    api.post('/ai/topics', { text }),
  
  moderateContent: (content: string) =>
    api.post('/ai/moderate', { content }),
  
  translateText: (text: string, targetLanguage: string) =>
    api.post('/ai/translate', { text, targetLanguage }),
  
  extractEntities: (text: string) =>
    api.post('/ai/entities', { text }),
  
  generateRecommendations: (userId: string) =>
    api.get(`/ai/recommendations/${userId}`),
  
  getMatchingUsers: (userId: string, params?: any) =>
    api.get(`/ai/matching/${userId}`, { params }),
  
  analyzeProfile: (profileData: any) =>
    api.post('/ai/analyze-profile', profileData),
  
  generateContent: (prompt: string, type: string) =>
    api.post('/ai/generate', { prompt, type }),
};

// Web3 API
export const web3API = {
  connectWallet: (walletData: any) =>
    api.post('/web3/connect', walletData),
  
  disconnectWallet: () =>
    api.post('/web3/disconnect'),
  
  getWalletBalance: (address: string) =>
    api.get(`/web3/balance/${address}`),
  
  getTokenBalance: (address: string, tokenAddress: string) =>
    api.get(`/web3/token-balance/${address}/${tokenAddress}`),
  
  transferTokens: (data: any) =>
    api.post('/web3/transfer', data),
  
  getTransactionHistory: (address: string, params?: any) =>
    api.get(`/web3/transactions/${address}`, { params }),
  
  verifyIdentity: (identityData: any) =>
    api.post('/web3/verify-identity', identityData),
  
  getIdentityVerification: (userId: string) =>
    api.get(`/web3/identity/${userId}`),
  
  mintNFT: (nftData: any) =>
    api.post('/web3/mint-nft', nftData),
  
  getNFTs: (address: string) =>
    api.get(`/web3/nfts/${address}`),
};

// Analytics API
export const analyticsAPI = {
  getDashboardStats: () =>
    api.get('/analytics/dashboard'),
  
  getUserStats: (userId: string) =>
    api.get(`/analytics/users/${userId}`),
  
  getCommunityStats: (communityId: string) =>
    api.get(`/analytics/communities/${communityId}`),
  
  getEventStats: (eventId: string) =>
    api.get(`/analytics/events/${eventId}`),
  
  getEngagementMetrics: (params?: any) =>
    api.get('/analytics/engagement', { params }),
  
  getGrowthMetrics: (params?: any) =>
    api.get('/analytics/growth', { params }),
  
  exportData: (type: string, params?: any) =>
    api.get(`/analytics/export/${type}`, { params }),
};

// Notification API
export const notificationAPI = {
  getNotifications: (params?: any) =>
    api.get('/notifications', { params }),
  
  markAsRead: (notificationId: string) =>
    api.put(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () =>
    api.put('/notifications/read-all'),
  
  deleteNotification: (notificationId: string) =>
    api.delete(`/notifications/${notificationId}`),
  
  updatePreferences: (preferences: any) =>
    api.put('/notifications/preferences', preferences),
  
  getPreferences: () =>
    api.get('/notifications/preferences'),
  
  subscribeToPush: (subscription: any) =>
    api.post('/notifications/push-subscription', subscription),
  
  unsubscribeFromPush: () =>
    api.delete('/notifications/push-subscription'),
};

export default api; 