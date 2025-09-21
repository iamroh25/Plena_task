import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type LastUpdatedState = { value: string | null };

const initialState: LastUpdatedState = { value: null };

const lastUpdatedSlice = createSlice({
  name: "lastUpdated",
  initialState,
  reducers: {
    updateTime: (state, action: PayloadAction<string | null>) => {
      state.value = action.payload;
    },
  },
});

export const { updateTime } = lastUpdatedSlice.actions;
export default lastUpdatedSlice.reducer;
