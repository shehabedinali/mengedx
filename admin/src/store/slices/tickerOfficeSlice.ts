import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { client } from '../feathers';

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

/** Add a dispatcher user to the office's users array */
export const addUserToOffice = createAsyncThunk(
    'tickerOffices/addUser',
    async ({ officeId, userId }: { officeId: string; userId: string }, { rejectWithValue }) => {
        try {
            const res = await client.service('ticker-office').patch(officeId, {
                $push: { users: userId },
            });
            return res;
        } catch (err: any) {
            return rejectWithValue(err.message || 'Failed to add user');
        }
    }
);

/** Remove a dispatcher user from the office's users array */
export const removeUserFromOffice = createAsyncThunk(
    'tickerOffices/removeUser',
    async ({ officeId, userId }: { officeId: string; userId: string }, { rejectWithValue }) => {
        try {
            const res = await client.service('ticker-office').patch(officeId, {
                $pull: { users: userId },
            });
            return res;
        } catch (err: any) {
            return rejectWithValue(err.message || 'Failed to remove user');
        }
    }
);

interface TickerOfficeState {
    data: any[];
    current: any | null;
    loading: boolean;
    detailLoading: boolean;
    error: string | null;
}

const tickerOfficeSlice = createSlice({
    name: 'tickerOffices',
    initialState: { data: [], current: null, loading: false, detailLoading: false, error: null } as TickerOfficeState,
    reducers: {
        clearCurrent(state) { state.current = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTickerOffices.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchTickerOffices.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
            .addCase(fetchTickerOffices.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

            .addCase(fetchTickerOfficeById.pending, (state) => { state.detailLoading = true; state.error = null; })
            .addCase(fetchTickerOfficeById.fulfilled, (state, action) => { state.detailLoading = false; state.current = action.payload; })
            .addCase(fetchTickerOfficeById.rejected, (state, action) => { state.detailLoading = false; state.error = action.payload as string; })

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
