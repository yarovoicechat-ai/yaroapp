import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/apiClient";

// get all chats
export const fetchChats = createAsyncThunk(
  "chat/fetchChats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/chats");
      return res.data;
    } catch (err) {
      return rejectWithValue("Failed to fetch chats");
    }
  }
);

// send message
export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ chatId, text }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/chats/${chatId}/messages`, { text });
      return { chatId, message: res.data };
    } catch (err) {
      return rejectWithValue("Failed to send message");
    }
  }
);
