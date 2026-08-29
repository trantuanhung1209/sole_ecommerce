import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authServices } from "@/services/authServices";
import type { User } from "@/types/user.type";
import type { UpdateProfileDto } from "@/types/auth.types";

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isLoggedIn?: boolean;
  tempAvatar?: string | null; // Temporary avatar for optimistic UI
}

const initialState: AuthState = {
  user: null, // Always null on init - must fetch from server
  loading: localStorage.getItem("userLoggedIn") === "true", // Start loading if logged in
  error: null,
  isLoggedIn: localStorage.getItem("userLoggedIn") === "true",
  tempAvatar: null,
};

// Get user profile thunk
export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, thunkAPI) => {
    try {
      const res = await authServices.getProfile();

      return res.data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        return thunkAPI.rejectWithValue(err.message);
      }
      return thunkAPI.rejectWithValue("Failed to fetch profile");
    }
  }
);

// Update profile thunk
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (data: UpdateProfileDto, thunkAPI) => {
    try {
      const res = await authServices.updateProfile(data);
      return res.data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        return thunkAPI.rejectWithValue(err.message);
      }
      return thunkAPI.rejectWithValue("Failed to update profile");
    }
  }
);

// Logout thunk
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, thunkAPI) => {
    try {
      await authServices.logout();
      return;
    } catch (err: unknown) {
      if (err instanceof Error) {
        return thunkAPI.rejectWithValue(err.message);
      }
      return thunkAPI.rejectWithValue("Failed to logout");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setIsLogging: (state, action) => {
      state.isLoggedIn = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setAuth: (state, action) => {
      state.user = action.payload.user;
      state.isLoggedIn = action.payload.isLoggedIn;
      // Only store login flag - never store user data in localStorage
      if (action.payload.isLoggedIn) {
        localStorage.setItem("userLoggedIn", "true");
      } else {
        localStorage.removeItem("userLoggedIn");
      }
    },
    setTempAvatar: (state, action) => {
      state.tempAvatar = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        localStorage.setItem("userLoggedIn", "true");
        state.user = action.payload;
        state.loading = false;
        state.isLoggedIn = true;
        state.error = null;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        localStorage.removeItem("userLoggedIn");
        state.loading = false;
        state.error = action.payload as string;
        state.isLoggedIn = false;
        state.user = null;
      });

    // Update profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
        state.tempAvatar = null; // Clear temp avatar after successful update
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.tempAvatar = null; // Clear temp avatar on error
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        localStorage.removeItem("userLoggedIn");
        state.loading = false;
        state.isLoggedIn = false;
        state.user = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setIsLogging, setUser, setAuth, setTempAvatar } = authSlice.actions;
export default authSlice.reducer;
