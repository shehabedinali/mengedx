import { createSlice } from '@reduxjs/toolkit';

interface SelectedCompanyState { companyId: string | null; }

const selectedCompanySlice = createSlice({
  name: 'selectedCompany',
  initialState: { companyId: null } as SelectedCompanyState,
  reducers: {
    setSelectedCompany(state, action: { payload: string | null }) {
      state.companyId = action.payload;
    },
  },
});

export const { setSelectedCompany } = selectedCompanySlice.actions;
export default selectedCompanySlice.reducer;
