import { configureStore } from "@reduxjs/toolkit";
import deviceReducer from "./deviceSlice";

export const store = configureStore({
  reducer: {
    device: deviceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export default store;
