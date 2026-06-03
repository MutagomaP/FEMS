import { type FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '@/services/authService';
import { toast } from '@/utils/toast';
import { validateEmail, validateOtp, validatePassword } from '@/utils/validation';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const devOtp = (location.state as { devOtp?: string; devNote?: string } | null)?.devOtp;
  const devNote = (location.state as { devOtp?: string; devNote?: string } | null)?.devNote;
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const emailErr = validateEmail(email);
    const otpErr = validateOtp(otp);
    const passwordErr = validatePassword(newPassword);
    if (emailErr || otpErr || passwordErr) {
      setError(emailErr ?? otpErr ?? passwordErr ?? '');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.resetPassword({ email, otp, newPassword });
      toast.success('Password updated. You can sign in with your new password.');
      navigate('/login');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Reset password</h2>
        <p className="text-sm text-slate-500">
          Enter the 6-digit verification code sent to your email and choose a new password.
        </p>
      </div>

      {devOtp && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-medium">Development verification code</p>
          <p className="mt-1 font-mono text-lg tracking-widest">{devOtp}</p>
          {devNote && <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">{devNote}</p>}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-ember-200 bg-ember-50 px-3 py-2 text-sm text-ember-700">
          {error}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="Verification code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        required
      />
      <Input
        label="New password"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
      <Input
        label="Confirm new password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <Button type="submit" className="w-full" loading={loading}>
        Reset password
      </Button>

      <p className="text-center text-sm text-slate-500">
        <Link to="/forgot-password" className="font-medium text-fire-600">
          Request a new code
        </Link>
        {' · '}
        <Link to="/login" className="font-medium text-fire-600">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
