import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { client } from '../feathers';

export const fetchSeatMaps = createAsyncThunk('seatMaps/fetch', async (params: { company?: string } | undefined = {}, { rejectWithValue }) => {
  try {
    const query: Record<string, any> = { $limit: 200 };
    if (params.company) query.company = params.company;
    const res = await client.service('seatmap').find({ query });
    return Array.isArray(res) ? res : (res.data ?? []);
  }
  catch (err: any) { return rejectWithValue(err.message || 'Failed to fetch seat maps'); }
});

export const createSeatMap = createAsyncThunk('seatMaps/create', async (data: any, { rejectWithValue }) => {
  console.log(data)
  try { return await client.service('seatmap').create(data); }
  catch (err: any) { return rejectWithValue(err.message || 'Failed to create seat map'); }
});

export const updateSeatMap = createAsyncThunk('seatMaps/update', async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
  try { return await client.service('seatmap').patch(id, data); }
  catch (err: any) { return rejectWithValue(err.message || 'Failed to update seat map'); }
});

export const deleteSeatMap = createAsyncThunk('seatMaps/delete', async (id: string, { rejectWithValue }) => {
  try { await client.service('seatmap').remove(id); return id; }
  catch (err: any) { return rejectWithValue(err.message || 'Failed to delete seat map'); }
});

interface SeatMapState { data: any[]; loading: boolean; error: string | null; }

const seatMapSlice = createSlice({
  name: 'seatMaps',
  initialState: { data: [], loading: false, error: null } as SeatMapState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSeatMaps.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSeatMaps.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchSeatMaps.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createSeatMap.fulfilled, (state, action) => { state.data.unshift(action.payload); })
      .addCase(updateSeatMap.fulfilled, (state, action) => {
        const i = state.data.findIndex(s => s._id === action.payload._id);
        if (i !== -1) state.data[i] = action.payload;
      })
      .addCase(deleteSeatMap.fulfilled, (state, action) => {
        state.data = state.data.filter(s => s._id !== action.payload);
      });
  },
});

export default seatMapSlice.reducer;
