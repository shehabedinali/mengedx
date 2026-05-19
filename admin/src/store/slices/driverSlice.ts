import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { client } from '../feathers';

export const fetchDrivers = createAsyncThunk('drivers/fetch', async (params: { company?: string } | undefined = {}, { rejectWithValue }) => {
  try {
    const query: Record<string, any> = { $populate: ['user'] };
    if (params.company) query.company = params.company;
    const res = await client.service('drivers').find({ query });
    return res.data ?? res;
  }
  catch (err: any) { return rejectWithValue(err.message || 'Failed to fetch drivers'); }
});

export const createDriver = createAsyncThunk('drivers/create', async (data: any, { rejectWithValue, getState }) => {
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
    
    const res = await client.service('drivers').create(data);
    return res;
  } catch (err: any) { return rejectWithValue(err.message || 'Failed to create driver'); }
});

export const updateDriver = createAsyncThunk('drivers/update', async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
  try { const res = await client.service('drivers').patch(id, data); return res; }
  catch (err: any) { return rejectWithValue(err.message || 'Failed to update driver'); }
});



export const deleteDriver = createAsyncThunk('drivers/delete', async (id: string, { rejectWithValue }) => {
  try { await client.service('drivers').remove(id); return id; }
  catch (err: any) { return rejectWithValue(err.message || 'Failed to delete driver'); }
});

interface DriverState { data: any[]; loading: boolean; error: string | null; }

const driverSlice = createSlice({
  name: 'drivers',
  initialState: { data: [], loading: false, error: null } as DriverState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDrivers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDrivers.fulfilled, (state, action) => { state.loading = false; state.data = action.payload.data ?? action.payload; })
      .addCase(fetchDrivers.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createDriver.fulfilled, (state, action) => { state.data.unshift(action.payload); })
      .addCase(updateDriver.fulfilled, (state, action) => { const i = state.data.findIndex(d => d._id === action.payload._id); if (i !== -1) state.data[i] = action.payload; })
      .addCase(deleteDriver.fulfilled, (state, action) => { state.data = state.data.filter(d => d._id !== action.payload); });
  },
});

export default driverSlice.reducer;
