import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuthError, login } from '@/store/slices/authSlice';
import { toast } from '@/utils/toast';
import { validateEmail, validateRequired } from '@/utils/validation';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const validate = () => {
    const errors: Record<string, string> = {};
    const emailErr = validateEmail(email);
    const passErr = validateRequired(password, 'Password');
    if (emailErr) errors.email = emailErr;
    if (passErr) errors.password = passErr;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    dispatch(clearAuthError());
    if (!validate()) return;
    setConfirmOpen(true);
  };

  const confirmLogin = async () => {
    const result = await dispatch(login({ email, password }));
    setConfirmOpen(false);
    if (login.fulfilled.match(result)) {
      toast.success('Signed in successfully');
      navigate('/dashboard');
    } else if (login.rejected.match(result)) {
      toast.error((result.payload as string) || 'Sign in failed');
      dispatch(clearAuthError());
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Sign in</h2>
          <p className="text-sm text-slate-500">Access your fire safety dashboard</p>
        </div>

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
        />

        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>

        <p className="text-center text-sm text-slate-500">
          <Link to="/forgot-password" className="font-medium text-fire-600 hover:text-fire-500">
            Forgot password?
          </Link>
        </p>

        <p className="text-center text-sm text-slate-500">
          No account?{' '}
          <Link to="/register" className="font-medium text-fire-600 hover:text-fire-500">
            Register
          </Link>
        </p>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm sign in"
        message="You are about to sign in to the Fire Extinguisher Management System. Continue?"
        confirmLabel="Sign in"
        onConfirm={confirmLogin}
        onCancel={() => setConfirmOpen(false)}
        loading={loading}
      />
    </>
  );
}
