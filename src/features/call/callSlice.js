import { createSlice } from "@reduxjs/toolkit";
import { fetchCallHistory, startCall } from "./callThunks";

const callSlice = createSlice({
  name: "call",
  initialState: {
    currentCall: null,
    history: [],
    loading: false,
    error: null,
  },
  reducers: {
    endCall: (state) => {
      state.currentCall = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startCall.pending, (state) => {
        state.loading = true;
      })
      .addCase(startCall.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCall = action.payload;
      })
      .addCase(startCall.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCallHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      });
  },
});

export const { endCall } = callSlice.actions;
export default callSlice.reducer;
