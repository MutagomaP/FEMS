import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import customerReducer from './slices/customerSlice';
import extinguisherReducer from './slices/extinguisherSlice';
import notificationReducer from './slices/notificationSlice';
import complianceReducer from './slices/complianceSlice';
import reportReducer from './slices/reportSlice';
import { crudToastMiddleware } from './crudToastMiddleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    customers: customerReducer,
    extinguishers: extinguisherReducer,
    notifications: notificationReducer,
    compliance: complianceReducer,
    reports: reportReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(crudToastMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
