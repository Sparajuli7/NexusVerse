import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userAPI } from '@/services/api';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  walletAddress?: string;
  profile: {
    bio: string;
    skills: string[];
    interests: string[];
    location: string;
    website: string;
    socialLinks: {
      linkedin?: string;
      twitter?: string;
      github?: string;
      portfolio?: string;
    };
    avatar: string;
    isVerified: boolean;
    verifiedBy?: string;
  };
  subscription: {
    status: 'free' | 'premium' | 'canceled' | 'past_due';
    plan: 'free' | 'premium';
    stripeSubscriptionId?: string;
    currentPeriodEnd?: Date;
  };
  connections: Array<{
    userId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
  }>;
  stats: {
    connectionsCount: number;
    communitiesCount: number;
    eventsAttended: number;
    reputationScore: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Connection {
  userId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profile: {
      avatar: string;
      location: string;
    };
  };
}

export interface UserState {
  profile: UserProfile | null;
  connections: Connection[];
  searchResults: UserProfile[];
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  connections: [],
  searchResults: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const getProfile = createAsyncThunk(
  'user/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.getProfile();
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get profile');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData: Partial<UserProfile>, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateProfile(profileData);
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'user/searchUsers',
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await userAPI.searchUsers(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search users');
    }
  }
);

export const sendConnectionRequest = createAsyncThunk(
  'user/sendConnectionRequest',
  async (targetUserId: string, { rejectWithValue }) => {
    try {
      const response = await userAPI.sendConnectionRequest(targetUserId);
      return { targetUserId, message: response.data.message };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send connection request');
    }
  }
);

export const acceptConnection = createAsyncThunk(
  'user/acceptConnection',
  async (connectionId: string, { rejectWithValue }) => {
    try {
      const response = await userAPI.acceptConnection(connectionId);
      return { connectionId, status: 'accepted', message: response.data.message };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept connection');
    }
  }
);

export const rejectConnection = createAsyncThunk(
  'user/rejectConnection',
  async (connectionId: string, { rejectWithValue }) => {
    try {
      const response = await userAPI.rejectConnection(connectionId);
      return { connectionId, status: 'rejected', message: response.data.message };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject connection');
    }
  }
);

export const removeConnection = createAsyncThunk(
  'user/removeConnection',
  async (connectionId: string, { rejectWithValue }) => {
    try {
      const response = await userAPI.removeConnection(connectionId);
      return { connectionId, message: response.data.message };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove connection');
    }
  }
);

// User slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    updateProfileField: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Get Profile
    builder
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Search Users
    builder
      .addCase(searchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload.users;
        state.error = null;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Send Connection Request
    builder
      .addCase(sendConnectionRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendConnectionRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(sendConnectionRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Accept Connection
    builder
      .addCase(acceptConnection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptConnection.fulfilled, (state, action) => {
        state.isLoading = false;
        const connection = state.connections.find(c => c.userId === action.payload.connectionId);
        if (connection) {
          connection.status = 'accepted';
        }
        state.error = null;
      })
      .addCase(acceptConnection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Reject Connection
    builder
      .addCase(rejectConnection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rejectConnection.fulfilled, (state, action) => {
        state.isLoading = false;
        const connection = state.connections.find(c => c.userId === action.payload.connectionId);
        if (connection) {
          connection.status = 'rejected';
        }
        state.error = null;
      })
      .addCase(rejectConnection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Remove Connection
    builder
      .addCase(removeConnection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeConnection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.connections = state.connections.filter(c => c.userId !== action.payload.connectionId);
        state.error = null;
      })
      .addCase(removeConnection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSearchResults, updateProfileField } = userSlice.actions;
export default userSlice.reducer; 