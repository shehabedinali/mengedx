import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { client } from '../feathers';

export const fetchCompanies = createAsyncThunk('companies/fetch', async (_, { rejectWithValue }) => {
  try { const res = await client.service('companies').find({ query: { $populate: ['owner'] } }); return res.data ?? res; }
  catch (err: any) { return rejectWithValue(err.message || 'Failed to fetch companies'); }
});

export const createCompany = createAsyncThunk('companies/create', async (data: any, { rejectWithValue }) => {
  console.log(data)
  try { const res = await client.service('companies').create(data); return res; }
  catch (err: any) { 
    console.log(err.message)   
    return rejectWithValue(err.message || 'Failed to create company'); }
});

export const updateCompany = createAsyncThunk('companies/update', async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
  try { const res = await client.service('companies').patch(id, data); return res; }
  catch (err: any) { return rejectWithValue(err.message || 'Failed to update company'); }
});

export const deleteCompany = createAsyncThunk('companies/delete', async (id: string, { rejectWithValue }) => {
  try { await client.service('companies').remove(id); return id; }
  catch (err: any) { return rejectWithValue(err.message || 'Failed to delete company'); }
});

interface CompanyState { data: any[]; loading: boolean; error: string | null; }

const companySlice = createSlice({
  name: 'companies',
  initialState: { data: [], loading: false, error: null } as CompanyState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCompanies.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchCompanies.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createCompany.fulfilled, (state, action) => { state.data.unshift(action.payload); })
      .addCase(updateCompany.fulfilled, (state, action) => { const i = state.data.findIndex(c => c._id === action.payload._id); if (i !== -1) state.data[i] = action.payload; })
      .addCase(deleteCompany.fulfilled, (state, action) => { state.data = state.data.filter(c => c._id !== action.payload); });
  },
});

export default companySlice.reducer;
