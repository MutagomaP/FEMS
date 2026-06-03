import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '@/services/authService';
import { validateEmail } from '@/utils/validation';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequest = async (event: FormEvent) => {
    event.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      if (res.devOtp) {
        setMessage(
          `${res.message} Your code: ${res.devOtp}${res.devNote ? ` (${res.devNote})` : ''}`,
        );
      } else {
        setMessage(res.message);
      }
      navigate(`/reset-password?email=${encodeURIComponent(email)}`, {
        state: res.devOtp ? { devOtp: res.devOtp, devNote: res.devNote } : undefined,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRequest} className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Forgot password</h2>
        <p className="text-sm text-slate-500">
          Enter the email address linked to your account. We will send a verification code after
          validating it.
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error && !message ? error : undefined}
        required
      />

      <Button type="submit" className="w-full" loading={loading}>
        Send verification code
      </Button>

      <p className="text-center text-sm text-slate-500">
        <Link to="/login" className="font-medium text-fire-600">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
