import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { client } from '../feathers';

interface User {
  _id: string;
  name: string;
  phone: string;
  role: string;
  company:string
  email?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  originalCompany: string | null;
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { phone: string; password: string }, { rejectWithValue }) => {
    try {
      console.log(credentials.password,credentials.phone)      
      let users:any, accessToken:any;
      try {
        const authResult = await client.authenticate({
          strategy: 'local',
          phone: credentials.phone,
          password: credentials.password,
        });

        console.log("authentication result", authResult);
        
        accessToken = authResult.accessToken;
        users = authResult.credential;
      } catch (error) {
        console.log("authentication failed", error);
        return rejectWithValue('Login failed');
      }

      console.log(users)
      
      // if (users && users.status !== 'active') throw new Error('User is not active');

      localStorage.setItem('feathers-jwt', accessToken);

      const user: User = {
        _id: users._id,
        name: users.name,
        phone: users.phone,
        role: users.role,
        company: users.company,
        email: users.email,
      };

  
     
      return { user, accessToken };
    } catch (e: any) {
      return rejectWithValue(e.message ?? 'Login failed');
    }
  }
);

export const reAuthenticate = createAsyncThunk(
  'auth/reAuthenticate',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('feathers-jwt');
      if (!token) return rejectWithValue('No token found');

      // check expiry locally before hitting the server
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('feathers-jwt');
        return rejectWithValue('Token expired');
      }

      const { users, accessToken } = await client.reAuthenticate();
      const user: User = {
        _id: users._id,
        name: users.name,
        phone: users.phone,
        role: users.role,
        company: users.company,
        email: users.email,
      };
      return { user, accessToken };
    } catch (e: any) {
      localStorage.removeItem('feathers-jwt');
      return rejectWithValue(e.message ?? 'Session expired');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null, loading: false, error: null, originalCompany: null } as AuthState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.originalCompany = null;
      localStorage.removeItem('feathers-jwt');
      client.logout();
    },
    restoreSession(state, action) {
      const p = action.payload;
      state.user = {
        _id: p._id ?? p.sub,
        name: p.name,
        phone: p.phone,
        role: p.role,
        company: p.company,
        email: p.email,
      };
      state.originalCompany = p.company ?? null;
      state.token = localStorage.getItem('feathers-jwt');
    },
    setActiveCompany(state, action: { payload: string | null }) {
      if (!state.user) return;
      if (action.payload === null) {
        state.user.company = state.originalCompany ?? state.user.company;
      } else {
        if (!state.originalCompany) state.originalCompany = state.user.company;
        state.user.company = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.originalCompany = action.payload.user.company ?? null;
      })
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(reAuthenticate.pending, (state) => { state.loading = true; })
      .addCase(reAuthenticate.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.originalCompany = action.payload.user.company ?? null;
      })
      .addCase(reAuthenticate.rejected, (state) => { state.loading = false; });
  },
});

export const { logout, restoreSession, setActiveCompany } = authSlice.actions;
export default authSlice.reducer;
