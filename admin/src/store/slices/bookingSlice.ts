import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { client } from '../feathers';

export const fetchBookings = createAsyncThunk(
  'bookings/fetch',
  async (params: { company?: string } | undefined = {}, { rejectWithValue }) => {
    try {
      const query: Record<string, any> = { $limit: 500, $populate: ['trip', 'bookedBy'] };
      if (params?.company) query.company = params.company;
      const res = await client.service('booktrips').find({ query });
      return res.data ?? res;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch bookings');
    }
  }
);

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
