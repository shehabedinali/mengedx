import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { client } from '../feathers';
import { toEthiopianPhone } from '@/lib/phone';

export interface CreateBookingPayload {
  trip: string;
  seats: string[];
  phoneNumber: string;
  passengerName?: string;
  emergencyContact?: { name: string; phoneNumber: string };
  totalAmount: number;
  paidAmount: number;
  paymentMethod: 'Cash' | 'MobileMoney' | 'BankTransfer';
  paymentStatus?: 'Unpaid' | 'Partial' | 'Paid';
  status?: string;
}

export const fetchBookings = createAsyncThunk(
  'bookings/fetch',
  async (params: { company?: string; bookedBy?: string } | undefined = {}, { rejectWithValue }) => {
    try {
      const query: Record<string, any> = {
        $limit: 500,
        $sort: { createdAt: -1 },
        $populate: ['trip', 'bookedBy'],
      };
      if (params?.company) query.company = params.company;
      if (params?.bookedBy) query.bookedBy = params.bookedBy;
      const res = await client.service('booktrips').find({ query });
      return res.data ?? res;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch bookings');
    }
  }
);

export const createBooking = createAsyncThunk(
  'bookings/create',
  async (payload: CreateBookingPayload, { rejectWithValue }) => {
    try {
      const phone = toEthiopianPhone(payload.phoneNumber);
      const res = await client.service('booktrips').create({
        trip: payload.trip,
        seats: payload.seats,
        phoneNumber: phone,
        passengerName: payload.passengerName,
        emergencyContact: payload.emergencyContact ?? {
          name: payload.passengerName ?? '',
          phoneNumber: phone,
        },
        totalAmount: payload.totalAmount,
        paidAmount: payload.paidAmount,
        paymentMethod: payload.paymentMethod,
        paymentStatus: payload.paymentStatus ?? (payload.paidAmount >= payload.totalAmount ? 'Paid' : 'Unpaid'),
        status: payload.status ?? 'Booked',
      });
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create booking');
    }
  }
);

interface BookingState { data: any[]; loading: boolean; creating: boolean; error: string | null; }

const bookingSlice = createSlice({
  name: 'bookings',
  initialState: { data: [], loading: false, creating: false, error: null } as BookingState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data ?? action.payload;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createBooking.pending, (state) => { state.creating = true; state.error = null; })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.creating = false;
        state.data.unshift(action.payload);
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      });
  },
});

export default bookingSlice.reducer;
