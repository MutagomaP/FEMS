import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from '@/routes';
import { useAppDispatch } from '@/store/hooks';
import { fetchCurrentUser, sessionExpired } from '@/store/slices/authSlice';
import { applyTheme, themeStorage, tokenStorage } from '@/utils/storage';

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    applyTheme(themeStorage.get());
    if (tokenStorage.getAccessToken()) {
      dispatch(fetchCurrentUser());
    }

    const onLogout = () => dispatch(sessionExpired());
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, [dispatch]);

  return <RouterProvider router={router} />;
}
