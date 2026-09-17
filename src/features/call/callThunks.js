import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/apiClient";

// start a call
export const startCall = createAsyncThunk(
  "call/startCall",
  async ({ toUserId }, { rejectWithValue }) => {
    try {
      const res = await api.post("/calls/start", { toUserId });
      console.log("res : ",res)
      return res.data;
    } catch (err) {
      return rejectWithValue("Failed to start call");
    }
  }
);

// fetch call history
export const fetchCallHistory = createAsyncThunk(
  "call/fetchCallHistory",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/calls/history");
      return res.data;
    } catch (err) {
      return rejectWithValue("Failed to fetch call history");
    }
  }
);
