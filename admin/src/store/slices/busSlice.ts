import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { client } from '../feathers';
import api from '@/lib/axios';

interface FetchBusesQuery { search?: string; status?: string; }

export const fetchBuses = createAsyncThunk('buses/fetch', async (params: (FetchBusesQuery & { company?: string }) | undefined = {}, { rejectWithValue }) => {
  try {
    const query: Record<string, any> = { $populate: ['driver', 'company', 'seatMap'] };
    if (params.search) query.search = params.search;
    if (params.status && params.status !== 'All') query.status = params.status;
    if (params.company) query.company = params.company;
    const res = await client.service('buses').find({ query });
    return res.data ?? res;
  } catch (err: any) { return rejectWithValue(err.message || 'Failed to fetch buses'); }
});

export const createBus = createAsyncThunk('buses/create', async (data: any, { rejectWithValue, getState }) => {
  try {
    const { auth } = getState() as { auth: { user: any } };
    const user = auth.user;
    
    // For super admins, use the selected company ID; for others, use their own company
    if (!data.company) {
      data.company = user?.role?.toLowerCase() === 'superadmin' ? null : user?.company;
    }
    
    // Validate company is provided
    if (!data.company) {
      return rejectWithValue('Company is required');
    }
    
    const bus = await client.service('buses').create({ ...data, company: data.company });
    return bus;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to create bus');
  }
});

export const updateBus = createAsyncThunk('buses/update', async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
  try {
    const bus = await client.service("buses").patch(id, data);
    return bus;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to update bus');
  }
});

export const deleteBus = createAsyncThunk('buses/delete', async (id: string, { rejectWithValue }) => {
  try {
    await client.service("buses").remove(id);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to delete bus');
  }
});

export const assignSeatMap = createAsyncThunk(
  'buses/assignSeatMap',
  async ({ busId, seatMapId }: { busId: string; seatMapId: string }, { rejectWithValue }) => {
    try {
   
      const res = await client.service('assignseat').patch(busId, { seatMap: seatMapId });
    
      return res;
    } catch (err: any) { return rejectWithValue(err.message || 'Failed to assign seat map'); }
  }
);

export const assignDriverAsync = createAsyncThunk(
  'buses/assignDriver',
  async ({ busId, driverId }: { busId: string; driverId: string | null }, { rejectWithValue }) => {
    try {
      const res = await client.service('assign-drivers').patch(busId, { driver: driverId });
      return res;
    } catch (err: any) { 
            
      return rejectWithValue(err.message || 'Failed to assign driver'); }
  }
);

export const saveExceptions = createAsyncThunk(
  'buses/saveExceptions',
  async ({ busId, exceptions }: { busId: string; exceptions: Record<number, string> }, { rejectWithValue }) => {
    try {
      const SeatWithExeption = Object.entries(exceptions)
        .filter(([, status]) => status !== 'Available')
        .map(([seatNumber, status]) => ({
          identifier: `seat-${seatNumber}`,
          seatNumber: Number(seatNumber),
          status,
        }));
      const res = await api.post('/exeptional-seat', { bus: busId, SeatWithExeption });
      return res.data;
    } catch (err: any) { return rejectWithValue(err.response?.data?.message || 'Failed to save exceptions'); }
  }
);

interface SeatLayout { rows: number; leftCols: number; rightCols: number; rearBench: number; blockedSeats: number[]; }
interface BusState { data: any[]; loading: boolean; error: string | null; }

const busSlice = createSlice({
  name: 'buses',
  initialState: { data: [], loading: false, error: null } as BusState,
  reducers: {
    assignDriver(state, action: { payload: { busId: string; driverId: string | null } }) {
      const bus = state.data.find(b => b._id === action.payload.busId);
      if (bus) bus.assignedDriver = action.payload.driverId;
    },
    setSeatLayout(state, action: { payload: { busId: string; layout: SeatLayout } }) {
      const bus = state.data.find(b => b._id === action.payload.busId);
      if (bus) bus.seatLayout = action.payload.layout;
    },
    toggleBlockedSeat(state, action: { payload: { busId: string; seat: number } }) {
      const bus = state.data.find(b => b._id === action.payload.busId);
      if (!bus?.seatLayout) return;
      const idx = bus.seatLayout.blockedSeats.indexOf(action.payload.seat);
      if (idx === -1) bus.seatLayout.blockedSeats.push(action.payload.seat);
      else bus.seatLayout.blockedSeats.splice(idx, 1);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBuses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBuses.fulfilled, (state, action) => { state.loading = false; state.data = action.payload.data ?? action.payload; })
      .addCase(fetchBuses.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createBus.fulfilled, (state, action) => { state.data.unshift(action.payload); })
      .addCase(updateBus.fulfilled, (state, action) => { const i = state.data.findIndex(b => b._id === action.payload._id); if (i !== -1) state.data[i] = action.payload; })
      .addCase(deleteBus.fulfilled, (state, action) => { state.data = state.data.filter(b => b._id !== action.payload); })
      .addCase(assignSeatMap.fulfilled, (state, action) => { const i = state.data.findIndex(b => b._id === action.payload._id); if (i !== -1) state.data[i] = { ...state.data[i], seatMap: action.payload.seatMap ?? action.payload.seatmap }; })
      .addCase(assignSeatMap.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(assignDriverAsync.fulfilled, (state, action) => { const i = state.data.findIndex(b => b._id === action.payload._id); if (i !== -1) { state.data[i] = { ...state.data[i], driver: action.payload.driver ?? null }; } })
      .addCase(assignDriverAsync.rejected, (state, action) => { state.error = action.payload as string; });
  },
});

export const { assignDriver, setSeatLayout, toggleBlockedSeat } = busSlice.actions;
export default busSlice.reducer;
