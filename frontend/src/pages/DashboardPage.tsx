import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatCard } from '@/components/ui/Card';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { customerService } from '@/services/customerService';
import { extinguisherService } from '@/services/extinguisherService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDashboardSummary, setDashboardCounts } from '@/store/slices/reportSlice';
import { recordToChartData } from '@/utils';
import { getDashboardWelcomeDescription, getDisplayName } from '@/utils/welcome';

const CHART_COLORS = ['#ea580c', '#dc2626', '#f97316', '#fb923c', '#fdba74'];
const CHART_HEIGHT = 288;

function ChartBody({
  loading,
  data,
  emptyLabel,
  children,
}: {
  loading: boolean;
  data: { name: string; value: number }[];
  emptyLabel: string;
  children: ReactNode;
}) {
  if (loading) {
    return <p className="text-sm text-slate-500">Loading charts…</p>;
  }
  if (!data.length) {
    return <p className="py-12 text-center text-sm text-slate-500">{emptyLabel}</p>;
  }
  return (
    <div style={{ width: '100%', height: CHART_HEIGHT }}>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const { user, isAdmin, isCustomer, apiScope } = useAuth();
  const { dashboard, totalCustomers, totalExtinguishers, loading, error } = useAppSelector(
    (state) => state.reports,
  );

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        if (isAdmin) {
          dispatch(fetchDashboardSummary({ days: '90' }));
          const [customers, extinguishers] = await Promise.all([
            customerService.list({ page: 1, limit: 1 }),
            extinguisherService.listAll({ page: 1, limit: 1 }),
          ]);
          dispatch(
            setDashboardCounts({
              totalCustomers: customers.meta.total,
              totalExtinguishers: extinguishers.meta.total,
            }),
          );
        } else if (apiScope === 'admin') {
          const extinguishers = await extinguisherService.listAll({ page: 1, limit: 1 });
          dispatch(
            setDashboardCounts({
              totalCustomers: 0,
              totalExtinguishers: extinguishers.meta.total,
            }),
          );
        } else {
          const extinguishers = await extinguisherService.listMine({ page: 1, limit: 1 });
          dispatch(
            setDashboardCounts({
              totalCustomers: 0,
              totalExtinguishers: extinguishers.meta.total,
            }),
          );
        }
      } catch {
        // Errors surface via apiClient; avoid uncaught promise on dashboard
      }
    };
    load();
  }, [dispatch, isAdmin, apiScope, user]);

  const charts = dashboard?.charts;
  const breakdown = dashboard?.breakdown;
  const expiredByMonth = recordToChartData(breakdown?.expiredByMonth ?? {});
  const expiringByDays = recordToChartData(breakdown?.expiringByDays ?? {});
  const complianceByStatus = recordToChartData(breakdown?.complianceByStatus ?? {});

  return (
    <div className="page-container">
      <PageHeader
        title={`Welcome, ${getDisplayName(user)}`}
        description={getDashboardWelcomeDescription(user?.role)}
      />

      {error && isAdmin && (
        <p className="mb-4 text-sm text-ember-600">{error}</p>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isAdmin && <StatCard label="Total Customers" value={totalCustomers} accent="slate" />}
        <StatCard label="Total Extinguishers" value={totalExtinguishers} accent="fire" />
        {isAdmin ? (
          <>
            <StatCard label="Expiring Soon" value={charts?.expiringSoonCount ?? '—'} accent="amber" />
            <StatCard label="Expired" value={charts?.expiredCount ?? '—'} accent="ember" />
            <StatCard label="Compliance Cases" value={charts?.complianceIssues ?? '—'} accent="ember" />
          </>
        ) : (
          <>
            <StatCard label="My Extinguishers" value={totalExtinguishers} accent="fire" />
            <StatCard label="Status" value="Active monitoring" accent="slate" />
          </>
        )}
      </div>

      {isCustomer && (
        <Card
          title="Schedule an inspection"
          description="Request a safety inspection for one of your fire extinguishers. Administrators are notified by email."
          className="mb-6"
        >
          <Link to="/inspections">
            <Button>Go to Inspections</Button>
          </Link>
        </Card>
      )}

      {isAdmin && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Expired by Month" description="Monthly distribution of expired units">
            <ChartBody
              loading={loading}
              data={expiredByMonth}
              emptyLabel="No expired extinguishers in this period"
            >
              <BarChart data={expiredByMonth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartBody>
          </Card>

          <Card title="Expiring Soon" description="Days until expiry breakdown">
            <ChartBody
              loading={loading}
              data={expiringByDays}
              emptyLabel="No extinguishers expiring soon"
            >
              <BarChart data={expiringByDays}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartBody>
          </Card>

          <Card title="Compliance by Status" description="Open and escalated case distribution">
            <ChartBody
              loading={loading}
              data={complianceByStatus}
              emptyLabel="No compliance cases to chart"
            >
              <PieChart>
                <Pie
                  data={complianceByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {complianceByStatus.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ChartBody>
          </Card>

          <Card title="Summary Metrics">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">Recent Notifications</dt>
                <dd className="text-2xl font-bold text-fire-600">{charts?.recentNotifications ?? 0}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Generated At</dt>
                <dd className="text-sm font-medium">
                  {dashboard?.generatedAt
                    ? new Date(dashboard.generatedAt).toLocaleString()
                    : '—'}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      )}
    </div>
  );
}
