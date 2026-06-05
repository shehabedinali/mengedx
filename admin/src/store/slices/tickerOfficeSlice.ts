import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { client } from '../feathers';

/** Normalize Mongo ObjectId / populated ref to string id */
export function resolveCompanyId(company: unknown): string | undefined {
    if (company == null || company === '') return undefined;
    if (typeof company === 'string') return company;
    if (typeof company === 'object') {
        const id = (company as { _id?: unknown })._id;
        if (id != null) return String(id);
    }
    return String(company);
}

/** Available cashiers: company id + role Cashier + status Active (e.g. dispatcher's company) */
export const fetchCompanyCashiers = createAsyncThunk(
    'tickerOffices/fetchCashiers',
    async (companyId: string, { rejectWithValue }) => {
        if (!companyId) {
            return rejectWithValue('Company is required to load cashiers');
        }
        try {
            const res = await client.service('users').find({
                query: {
                    company: companyId,
                    role: 'Cashier',
                    status: 'Active',
                    $limit: 200,
                },
            });
            return res.data ?? res;
        } catch (err: any) {
            return rejectWithValue(err.message || 'Failed to fetch cashiers');
        }
    }
);

export const fetchTickerOffices = createAsyncThunk(
    'tickerOffices/fetch',
    async (params: { company?: string } | undefined = {}, { rejectWithValue }) => {
        try {
            const query: Record<string, any> = {};
            if (params?.company) query.company = params.company;
            const res = await client.service('ticker-office').find({ query });
            return res.data ?? res;
        } catch (err: any) {
            return rejectWithValue(err.message || 'Failed to fetch ticker offices');
        }
    }
);

export const fetchTickerOfficeById = createAsyncThunk(
    'tickerOffices/fetchById',
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await client.service('ticker-office').get(id);
            return res;
        } catch (err: any) {
            return rejectWithValue(err.message || 'Failed to fetch ticker office');
        }
    }
);

export const createTickerOffice = createAsyncThunk(
    'tickerOffices/create',
    async (data: any, { rejectWithValue, getState }) => {
        try {
            const { auth } = getState() as { auth: { user: any } };
            const user = auth.user;
            if (!data.company) {
                data.company = user?.role?.toLowerCase() === 'superadmin' ? data.company : user?.company;
            }
            const res = await client.service('ticker-office').create(data);
            return res;
        } catch (err: any) {
            return rejectWithValue(err.message || 'Failed to create ticker office');
        }
    }
);

export const updateTickerOffice = createAsyncThunk(
    'tickerOffices/update',
    async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
        try {
            const res = await client.service('ticker-office').patch(id, data);
            return res;
        } catch (err: any) {
            return rejectWithValue(err.message || 'Failed to update ticker office');
        }
    }
);

export const deleteTickerOffice = createAsyncThunk(
    'tickerOffices/delete',
    async (id: string, { rejectWithValue }) => {
        try {
            await client.service('ticker-office').remove(id);
            return id;
        } catch (err: any) {
            return rejectWithValue(err.message || 'Failed to delete ticker office');
        }
    }
);

/** Add cashier to office and mark user status Assigned */
export const addUserToOffice = createAsyncThunk(
    'tickerOffices/addUser',
    async ({ officeId, userId }: { officeId: string; userId: string }, { rejectWithValue }) => {
        try {
            const res = await client.service('ticker-office').patch(officeId, {
                $push: { users: userId },
            });
            await client.service('users').patch(userId, { status: 'Assigned' });
            return res;
        } catch (err: any) {
            return rejectWithValue(err.message || 'Failed to add user');
        }
    }
);

/** Remove cashier from office and restore user status Active */
export const removeUserFromOffice = createAsyncThunk(
    'tickerOffices/removeUser',
    async ({ officeId, userId }: { officeId: string; userId: string }, { rejectWithValue }) => {
        try {
            const res = await client.service('ticker-office').patch(officeId, {
                $pull: { users: userId },
            });
            await client.service('users').patch(userId, { status: 'Active' });
            return res;
        } catch (err: any) {
            return rejectWithValue(err.message || 'Failed to remove user');
        }
    }
);

interface TickerOfficeState {
    data: any[];
    current: any | null;
    companyCashiers: any[];
    cashiersLoading: boolean;
    loading: boolean;
    detailLoading: boolean;
    error: string | null;
}

const tickerOfficeSlice = createSlice({
    name: 'tickerOffices',
    initialState: {
        data: [],
        current: null,
        companyCashiers: [],
        cashiersLoading: false,
        loading: false,
        detailLoading: false,
        error: null,
    } as TickerOfficeState,
    reducers: {
        clearCurrent(state) {
            state.current = null;
            state.companyCashiers = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTickerOffices.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchTickerOffices.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
            .addCase(fetchTickerOffices.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

            .addCase(fetchTickerOfficeById.pending, (state) => { state.detailLoading = true; state.error = null; })
            .addCase(fetchTickerOfficeById.fulfilled, (state, action) => { state.detailLoading = false; state.current = action.payload; })
            .addCase(fetchTickerOfficeById.rejected, (state, action) => { state.detailLoading = false; state.error = action.payload as string; })

            .addCase(fetchCompanyCashiers.pending, (state) => { state.cashiersLoading = true; })
            .addCase(fetchCompanyCashiers.fulfilled, (state, action) => {
                state.cashiersLoading = false;
                state.companyCashiers = action.payload;
            })
            .addCase(fetchCompanyCashiers.rejected, (state) => {
                state.cashiersLoading = false;
                state.companyCashiers = [];
            })

            .addCase(createTickerOffice.fulfilled, (state, action) => { state.data.unshift(action.payload); })
            .addCase(updateTickerOffice.fulfilled, (state, action) => {
                const i = state.data.findIndex(o => o._id === action.payload._id);
                if (i !== -1) state.data[i] = action.payload;
                if (state.current?._id === action.payload._id) state.current = action.payload;
            })
            .addCase(deleteTickerOffice.fulfilled, (state, action) => {
                state.data = state.data.filter(o => o._id !== action.payload);
            })
            .addCase(addUserToOffice.fulfilled, (state, action) => {
                const i = state.data.findIndex(o => o._id === action.payload._id);
                if (i !== -1) state.data[i] = action.payload;
                if (state.current?._id === action.payload._id) state.current = action.payload;
            })
            .addCase(removeUserFromOffice.fulfilled, (state, action) => {
                const i = state.data.findIndex(o => o._id === action.payload._id);
                if (i !== -1) state.data[i] = action.payload;
                if (state.current?._id === action.payload._id) state.current = action.payload;
            });
    },
});

export const { clearCurrent } = tickerOfficeSlice.actions;
export default tickerOfficeSlice.reducer;
