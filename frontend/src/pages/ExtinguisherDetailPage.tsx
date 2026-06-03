import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Badge, PageHeader } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { extinguisherService } from '@/services/extinguisherService';
import type { FireExtinguisher } from '@/types';
import { formatDate, formatExtinguisherSize } from '@/utils';

export function ExtinguisherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [item, setItem] = useState<FireExtinguisher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    extinguisherService
      .getById(id)
      .then(setItem)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="page-container text-slate-500">Loading…</p>;
  }

  if (error || !item) {
    return (
      <div className="page-container">
        <p className="text-ember-600">{error || 'Extinguisher not found'}</p>
        <Link to="/extinguishers" className="mt-4 inline-block text-fire-600">
          Back to list
        </Link>
      </div>
    );
  }

  const rows: [string, string][] = [
    ['Serial number', item.serialNumber],
    ['Location', item.location],
    ['Type', item.type],
    ['Size', formatExtinguisherSize(item.size)],
    ['Installation date', formatDate(item.installationDate)],
    ['Expiry date', formatDate(item.expiryDate)],
    ['Status', item.status],
    ['Customer ID', item.customerId],
  ];

  return (
    <div className="page-container">
      <PageHeader
        title={item.serialNumber}
        description="Fire extinguisher details"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/extinguishers')}>
              Back
            </Button>
            {isAdmin && (
              <Button onClick={() => navigate('/extinguishers', { state: { editId: item.id } })}>
                Edit
              </Button>
            )}
          </div>
        }
      />

      <Card className="max-w-xl p-6">
        <div className="mb-4">
          <Badge tone={item.status === 'EXPIRED' ? 'danger' : 'info'}>{item.status}</Badge>
        </div>
        <dl className="space-y-3">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-3 gap-2 text-sm">
              <dt className="font-medium text-slate-500">{label}</dt>
              <dd className="col-span-2 text-slate-900 dark:text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
