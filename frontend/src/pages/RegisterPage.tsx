import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuthError, register } from '@/store/slices/authSlice';
import { toast } from '@/utils/toast';
import { validateEmail, validateName, validatePassword } from '@/utils/validation';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading } = useAppSelector((state) => state.auth);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    dispatch(clearAuthError());

    const errors: Record<string, string> = {};
    const fn = validateName(firstName, 'First name');
    const ln = validateName(lastName, 'Last name');
    const em = validateEmail(email);
    const pw = validatePassword(password);
    if (fn) errors.firstName = fn;
    if (ln) errors.lastName = ln;
    if (em) errors.email = em;
    if (pw) errors.password = pw;
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    const result = await dispatch(
      register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
      }),
    );
    if (register.fulfilled.match(result)) {
      toast.success('Account created successfully');
      navigate('/dashboard');
    } else if (register.rejected.match(result)) {
      const msg = (result.payload as string) || 'Registration failed';
      toast.error(msg);
      if (/already registered/i.test(msg)) {
        setFieldErrors({ email: msg });
      }
      dispatch(clearAuthError());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Create account</h2>
        <p className="text-sm text-slate-500">Register as a user to manage your extinguishers</p>
      </div>

      <Input
        label="First name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        error={fieldErrors.firstName}
        required
      />
      <Input
        label="Last name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        error={fieldErrors.lastName}
        required
      />
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
        Register
      </Button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-fire-600 hover:text-fire-500">
          Sign in
        </Link>
      </p>
    </form>
  );
}
