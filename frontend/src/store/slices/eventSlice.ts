import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { eventAPI } from '@/services/api';

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  category: string;
  maxAttendees?: number;
  ticketPrice: number;
  isVirtual: boolean;
  meetingLink?: string;
  tags: string[];
  organizer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  attendees: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  community?: {
    id: string;
    name: string;
  };
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  visibility: 'public' | 'private' | 'community';
  registrationDeadline?: Date;
  capacity: number;
  currentAttendees: number;
  stats: {
    viewCount: number;
    registrationCount: number;
    checkInCount: number;
  };
  settings: {
    allowWaitlist: boolean;
    requireApproval: boolean;
    allowCancellations: boolean;
    sendReminders: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface EventState {
  events: Event[];
  currentEvent: Event | null;
  myEvents: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: EventState = {
  events: [],
  currentEvent: null,
  myEvents: [],
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
export const getEvents = createAsyncThunk(
  'event/getEvents',
  async (params?: any, { rejectWithValue }) => {
    try {
      const response = await eventAPI.getEvents(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get events');
    }
  }
);

export const getEvent = createAsyncThunk(
  'event/getEvent',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await eventAPI.getEvent(id);
      return response.data.event;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get event');
    }
  }
);

export const createEvent = createAsyncThunk(
  'event/createEvent',
  async (eventData: any, { rejectWithValue }) => {
    try {
      const response = await eventAPI.createEvent(eventData);
      return response.data.event;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create event');
    }
  }
);

export const updateEvent = createAsyncThunk(
  'event/updateEvent',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await eventAPI.updateEvent(id, data);
      return response.data.event;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update event');
    }
  }
);

export const deleteEvent = createAsyncThunk(
  'event/deleteEvent',
  async (id: string, { rejectWithValue }) => {
    try {
      await eventAPI.deleteEvent(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete event');
    }
  }
);

export const registerForEvent = createAsyncThunk(
  'event/registerForEvent',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await eventAPI.registerForEvent(id);
      return { id, message: response.data.message };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to register for event');
    }
  }
);

export const unregisterFromEvent = createAsyncThunk(
  'event/unregisterFromEvent',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await eventAPI.unregisterFromEvent(id);
      return { id, message: response.data.message };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unregister from event');
    }
  }
);

export const getMyEvents = createAsyncThunk(
  'event/getMyEvents',
  async (params?: any, { rejectWithValue }) => {
    try {
      const response = await eventAPI.getMyEvents(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get my events');
    }
  }
);

// Event slice
const eventSlice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
    },
    clearEvents: (state) => {
      state.events = [];
    },
    setCurrentEvent: (state, action: PayloadAction<Event>) => {
      state.currentEvent = action.payload;
    },
    updateEvent: (state, action: PayloadAction<Partial<Event>>) => {
      const index = state.events.findIndex(event => event.id === action.payload.id);
      if (index !== -1) {
        state.events[index] = { ...state.events[index], ...action.payload };
      }
      if (state.currentEvent?.id === action.payload.id) {
        state.currentEvent = { ...state.currentEvent, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Get Events
    builder
      .addCase(getEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload.events;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get Event
    builder
      .addCase(getEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentEvent = action.payload;
        state.error = null;
      })
      .addCase(getEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create Event
    builder
      .addCase(createEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events.unshift(action.payload);
        state.error = null;
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Event
    builder
      .addCase(updateEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.events.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
        if (state.currentEvent?.id === action.payload.id) {
          state.currentEvent = action.payload;
        }
        state.error = null;
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete Event
    builder
      .addCase(deleteEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = state.events.filter(e => e.id !== action.payload);
        if (state.currentEvent?.id === action.payload) {
          state.currentEvent = null;
        }
        state.error = null;
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register for Event
    builder
      .addCase(registerForEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerForEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update event attendee count
        const event = state.events.find(e => e.id === action.payload.id);
        if (event) {
          event.currentAttendees += 1;
          event.stats.registrationCount += 1;
        }
        if (state.currentEvent?.id === action.payload.id) {
          state.currentEvent.currentAttendees += 1;
          state.currentEvent.stats.registrationCount += 1;
        }
        state.error = null;
      })
      .addCase(registerForEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Unregister from Event
    builder
      .addCase(unregisterFromEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unregisterFromEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update event attendee count
        const event = state.events.find(e => e.id === action.payload.id);
        if (event) {
          event.currentAttendees = Math.max(0, event.currentAttendees - 1);
          event.stats.registrationCount = Math.max(0, event.stats.registrationCount - 1);
        }
        if (state.currentEvent?.id === action.payload.id) {
          state.currentEvent.currentAttendees = Math.max(0, state.currentEvent.currentAttendees - 1);
          state.currentEvent.stats.registrationCount = Math.max(0, state.currentEvent.stats.registrationCount - 1);
        }
        state.error = null;
      })
      .addCase(unregisterFromEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get My Events
    builder
      .addCase(getMyEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMyEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myEvents = action.payload.events;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getMyEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  clearCurrentEvent, 
  clearEvents, 
  setCurrentEvent, 
  updateEvent 
} = eventSlice.actions;

export default eventSlice.reducer; 