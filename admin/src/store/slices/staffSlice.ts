import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { client } from '../feathers';

export const fetchStaff = createAsyncThunk('staff/fetch', async (params: { company?: string } = {}, { rejectWithValue }) => {
  try {
    const query: Record<string, any> = { role: { $in: ['Ticketer', 'Admin'] } };
    if (params.company) query.company = params.company;
    const res = await client.service('users').find({ query });
    return res.data ?? res;
  } catch (err: any) { return rejectWithValue(err.message || 'Failed to fetch staff'); }
});

export const createStaff = createAsyncThunk('staff/create', async (data: any, { rejectWithValue, getState }) => {
  try {
    const { auth } = getState() as { auth: { user: any } };
    const res = await client.service('users').create({ ...data, company: auth.user?.company });
    return res;
  } catch (err: any) { return rejectWithValue(err.message || 'Failed to create staff'); }
});

export const updateStaff = createAsyncThunk('staff/update', async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
  try { const res = await client.service('users').patch(id, data); return res; }
  catch (err: any) { return rejectWithValue(err.message || 'Failed to update staff'); }
});

interface StaffState { data: any[]; loading: boolean; error: string | null; }

const staffSlice = createSlice({
  name: 'staff',
  initialState: { data: [], loading: false, error: null } as StaffState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaff.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchStaff.fulfilled, (state, action) => { state.loading = false; state.data = action.payload.data ?? action.payload; })
      .addCase(fetchStaff.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createStaff.fulfilled, (state, action) => { state.data.unshift(action.payload); })
      .addCase(updateStaff.fulfilled, (state, action) => { const i = state.data.findIndex(s => s._id === action.payload._id); if (i !== -1) state.data[i] = action.payload; });
  },
});

export default staffSlice.reducer;
