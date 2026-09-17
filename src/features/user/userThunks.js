import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/apiClient";

// Fetch all users (for contact list / search etc.)
export const fetchUsers = createAsyncThunk(
  "user/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/users");
      return res.data; // expected: array of users
    } catch (err) {
      return rejectWithValue("Failed to fetch users");
    }
  }
);

// Fetch user by ID (profile details)
export const fetchUserById = createAsyncThunk(
  "user/fetchUserById",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/users/${userId}`);
      return res.data; // expected: user object
    } catch (err) {
      return rejectWithValue("Failed to fetch user");
    }
  }
);

// Update profile (current logged-in user)
export const updateUserProfile = createAsyncThunk(
  "user/updateUserProfile",
  async (userData, { rejectWithValue }) => {
    try {
      const res = await api.put("/users/me", userData);
      return res.data; // updated user object
    } catch (err) {
      return rejectWithValue("Failed to update profile");
    }
  }
);
