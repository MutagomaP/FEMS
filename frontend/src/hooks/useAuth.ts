import { useAppSelector } from '@/store/hooks';

export function useAuth() {
  const { user, isAuthenticated, loading, initializing, error } = useAppSelector(
    (state) => state.auth,
  );

  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';
  const isInspector = user?.role === 'inspector';
  /** Admin and inspector use staff list APIs (GET /extinguishers), not /mine */
  const isStaff = isAdmin || isInspector;
  const apiScope: 'admin' | 'customer' = isStaff ? 'admin' : 'customer';

  return {
    user,
    isAuthenticated,
    loading,
    initializing,
    error,
    isAdmin,
    isCustomer,
    isInspector,
    isStaff,
    apiScope,
  };
}
