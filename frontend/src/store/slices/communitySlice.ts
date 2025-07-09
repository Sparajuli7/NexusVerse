import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { communityAPI } from '@/services/api';

export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  isPrivate: boolean;
  rules: string[];
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  members: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  moderators: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  tags: string[];
  avatar: string;
  banner: string;
  stats: {
    memberCount: number;
    postCount: number;
    eventCount: number;
  };
  settings: {
    allowMemberInvites: boolean;
    requireApproval: boolean;
    allowAnonymousPosts: boolean;
    maxMembers: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  content: string;
  type: 'text' | 'link' | 'image' | 'poll';
  title?: string;
  link?: string;
  imageUrl?: string;
  pollOptions?: Array<{
    text: string;
    votes: number;
  }>;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  community: {
    id: string;
    name: string;
  };
  parentPost?: string;
  likes: string[];
  dislikes: string[];
  comments: string[];
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
  isAnonymous: boolean;
  stats: {
    viewCount: number;
    likeCount: number;
    dislikeCount: number;
    commentCount: number;
    shareCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityState {
  communities: Community[];
  currentCommunity: Community | null;
  posts: Post[];
  currentPost: Post | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: CommunityState = {
  communities: [],
  currentCommunity: null,
  posts: [],
  currentPost: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  isLoading: false,
  error: null,
};

// Async thunks
export const getCommunities = createAsyncThunk(
  'community/getCommunities',
  async (params?: any, { rejectWithValue }) => {
    try {
      const response = await communityAPI.getCommunities(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get communities');
    }
  }
);

export const getCommunity = createAsyncThunk(
  'community/getCommunity',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await communityAPI.getCommunity(id);
      return response.data.community;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get community');
    }
  }
);

export const createCommunity = createAsyncThunk(
  'community/createCommunity',
  async (communityData: any, { rejectWithValue }) => {
    try {
      const response = await communityAPI.createCommunity(communityData);
      return response.data.community;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create community');
    }
  }
);

export const updateCommunity = createAsyncThunk(
  'community/updateCommunity',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await communityAPI.updateCommunity(id, data);
      return response.data.community;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update community');
    }
  }
);

export const joinCommunity = createAsyncThunk(
  'community/joinCommunity',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await communityAPI.joinCommunity(id);
      return { id, message: response.data.message };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join community');
    }
  }
);

export const leaveCommunity = createAsyncThunk(
  'community/leaveCommunity',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await communityAPI.leaveCommunity(id);
      return { id, message: response.data.message };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to leave community');
    }
  }
);

export const getCommunityPosts = createAsyncThunk(
  'community/getCommunityPosts',
  async ({ communityId, params }: { communityId: string; params?: any }, { rejectWithValue }) => {
    try {
      const response = await communityAPI.getCommunityPosts(communityId, params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get community posts');
    }
  }
);

export const createPost = createAsyncThunk(
  'community/createPost',
  async ({ communityId, postData }: { communityId: string; postData: any }, { rejectWithValue }) => {
    try {
      const response = await communityAPI.createPost(communityId, postData);
      return response.data.post;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create post');
    }
  }
);

// Community slice
const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentCommunity: (state) => {
      state.currentCommunity = null;
    },
    clearPosts: (state) => {
      state.posts = [];
      state.currentPost = null;
    },
    setCurrentPost: (state, action: PayloadAction<Post>) => {
      state.currentPost = action.payload;
    },
    updatePost: (state, action: PayloadAction<Partial<Post>>) => {
      const index = state.posts.findIndex(post => post.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = { ...state.posts[index], ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Get Communities
    builder
      .addCase(getCommunities.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCommunities.fulfilled, (state, action) => {
        state.isLoading = false;
        state.communities = action.payload.communities;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getCommunities.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get Community
    builder
      .addCase(getCommunity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCommunity.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCommunity = action.payload;
        state.error = null;
      })
      .addCase(getCommunity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create Community
    builder
      .addCase(createCommunity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCommunity.fulfilled, (state, action) => {
        state.isLoading = false;
        state.communities.unshift(action.payload);
        state.error = null;
      })
      .addCase(createCommunity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Community
    builder
      .addCase(updateCommunity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCommunity.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.communities.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.communities[index] = action.payload;
        }
        if (state.currentCommunity?.id === action.payload.id) {
          state.currentCommunity = action.payload;
        }
        state.error = null;
      })
      .addCase(updateCommunity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Join Community
    builder
      .addCase(joinCommunity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(joinCommunity.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update community member count
        const community = state.communities.find(c => c.id === action.payload.id);
        if (community) {
          community.stats.memberCount += 1;
        }
        if (state.currentCommunity?.id === action.payload.id) {
          state.currentCommunity.stats.memberCount += 1;
        }
        state.error = null;
      })
      .addCase(joinCommunity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Leave Community
    builder
      .addCase(leaveCommunity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(leaveCommunity.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update community member count
        const community = state.communities.find(c => c.id === action.payload.id);
        if (community) {
          community.stats.memberCount = Math.max(0, community.stats.memberCount - 1);
        }
        if (state.currentCommunity?.id === action.payload.id) {
          state.currentCommunity.stats.memberCount = Math.max(0, state.currentCommunity.stats.memberCount - 1);
        }
        state.error = null;
      })
      .addCase(leaveCommunity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get Community Posts
    builder
      .addCase(getCommunityPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCommunityPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = action.payload.posts;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getCommunityPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create Post
    builder
      .addCase(createPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts.unshift(action.payload);
        if (state.currentCommunity) {
          state.currentCommunity.stats.postCount += 1;
        }
        state.error = null;
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  clearCurrentCommunity, 
  clearPosts, 
  setCurrentPost, 
  updatePost 
} = communitySlice.actions;

export default communitySlice.reducer; 