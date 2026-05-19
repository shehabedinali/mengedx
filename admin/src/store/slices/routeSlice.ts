import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { client } from '../feathers';

export const fetchRoutes = createAsyncThunk('routes/fetch', async (params: { company?: string } | undefined = {}, { rejectWithValue }) => {
  try {
    const query: Record<string, any> = {};
    if (params.company) query.company = params.company;
    const res = await client.service('routes').find({ query });
    return res.data ?? res;
  }
  catch (err: any) { return rejectWithValue(err.message || 'Failed to fetch routes'); }
});

export const createRoute = createAsyncThunk('routes/create', async (data: any, { rejectWithValue }) => {
  try { const res = await client.service('routes').create(data); return res; }
  catch (err: any) { return rejectWithValue(err.message || 'Failed to create route'); }
});

export const updateRoute = createAsyncThunk('routes/update', async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
  try { const res = await client.service('routes').patch(id, data); return res; }
  catch (err: any) { return rejectWithValue(err.message || 'Failed to update route'); }
});

interface RouteState { data: any[]; loading: boolean; error: string | null; }

const routeSlice = createSlice({
  name: 'routes',
  initialState: { data: [], loading: false, error: null } as RouteState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoutes.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchRoutes.fulfilled, (state, action) => { state.loading = false; state.data = action.payload.data ?? action.payload; })
      .addCase(fetchRoutes.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createRoute.fulfilled, (state, action) => { state.data.unshift(action.payload); })
      .addCase(updateRoute.fulfilled, (state, action) => { const i = state.data.findIndex(r => r._id === action.payload._id); if (i !== -1) state.data[i] = action.payload; });
  },
});

export default routeSlice.reducer;
