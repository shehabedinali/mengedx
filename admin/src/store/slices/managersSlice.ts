import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { client } from '../feathers';

export const fetchManagersByCompany = createAsyncThunk(
  'managers/fetchByCompany',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const query: Record<string, any> = { $limit: 200, role: { $in: ['Manager', 'Admin'] } };
      if (companyId) query.company = companyId;
      const res = await client.service('users').find({ query });
      return res.data ?? res;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch managers');
    }
  }
);

export const createManager = createAsyncThunk(
  'managers/create',
  async (data: any, { rejectWithValue }) => {
    try {
      const payload = { ...data };
      if (!payload.company) delete payload.company;
      return await client.service('users').create(payload);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create manager');
    }
  }
);

export const updateManager = createAsyncThunk(
  'managers/update',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      return await client.service('users').patch(id, data);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update manager');
    }
  }
);

export const deleteManager = createAsyncThunk(
  'managers/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await client.service('users').remove(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete manager');
    }
  }
);

interface ManagersState { data: any[]; loading: boolean; error: string | null; }

const managersSlice = createSlice({
  name: 'managers',
  initialState: { data: [], loading: false, error: null } as ManagersState,
  reducers: { clearManagers(state) { state.data = []; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagersByCompany.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchManagersByCompany.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchManagersByCompany.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createManager.fulfilled, (state, action) => { state.data.unshift(action.payload); })
      .addCase(updateManager.fulfilled, (state, action) => {
        const i = state.data.findIndex(m => m._id === action.payload._id);
        if (i !== -1) state.data[i] = action.payload;
      })
      .addCase(deleteManager.fulfilled, (state, action) => {
        state.data = state.data.filter(m => m._id !== action.payload);
      });
  },
});

export const { clearManagers } = managersSlice.actions;
export default managersSlice.reducer;
