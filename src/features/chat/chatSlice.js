import { createSlice } from "@reduxjs/toolkit";
import { fetchChats, sendMessage } from "./chatThunks";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    chats: [], // conversations
    loading: false,
    error: null,
  },
  reducers: {
    addMessage: (state, action) => {
      const { chatId, message } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) {
        chat.messages.push(message);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { chatId, message } = action.payload;
        const chat = state.chats.find((c) => c.id === chatId);
        if (chat) chat.messages.push(message);
      });
  },
});

export const { addMessage } = chatSlice.actions;
export default chatSlice.reducer;
