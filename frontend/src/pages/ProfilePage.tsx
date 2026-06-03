import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/DataTable';
import { authService } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/utils/toast';
import { validateName, validatePassword, validateRequired } from '@/utils/validation';

export function ProfilePage() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
    }
  }, [user]);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    const fn = validateName(firstName, 'First name');
    const ln = validateName(lastName, 'Last name');
    if (fn) err.firstName = fn;
    if (ln) err.lastName = ln;
    setErrors(err);
    if (Object.keys(err).length) return;

    await authService.updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
    toast.success('Profile updated successfully');
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (validateRequired(currentPassword, 'Current password')) err.current = 'Required';
    const np = validatePassword(newPassword);
    if (np) err.newPassword = np;
    setErrors(err);
    if (Object.keys(err).length) return;

    await authService.changePassword({ currentPassword, newPassword });
    setCurrentPassword('');
    setNewPassword('');
    toast.success('Password changed successfully');
  };

  return (
    <div className="page-container">
      <PageHeader title="Profile" description="Manage your account settings" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile information">
          <form onSubmit={saveProfile} className="space-y-3">
            <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} error={errors.firstName} />
            <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} error={errors.lastName} />
            <Input label="Email" value={user?.email ?? ''} disabled />
            <Button type="submit">Save profile</Button>
          </form>
        </Card>

        <Card title="Change password">
          <form onSubmit={changePassword} className="space-y-3">
            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              error={errors.current}
            />
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={errors.newPassword}
            />
            <Button type="submit">Update password</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
