import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

export const fetchBookings = createAsyncThunk('bookings/fetch', async (_, { rejectWithValue }) => {
  try { const res = await api.get('/booktrips'); return res.data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch bookings'); }
});

interface BookingState { data: any[]; loading: boolean; error: string | null; }

const bookingSlice = createSlice({
  name: 'bookings',
  initialState: { data: [], loading: false, error: null } as BookingState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBookings.fulfilled, (state, action) => { state.loading = false; state.data = action.payload.data ?? action.payload; })
      .addCase(fetchBookings.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export default bookingSlice.reducer;
