import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Badge, DataTable, PageHeader, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import type { ExtinguisherSize, ExtinguisherStatus, ExtinguisherType, FireExtinguisher } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { extinguisherService } from '@/services/extinguisherService';
import {
  assignExtinguisher,
  deleteExtinguisher,
  fetchExtinguishers,
  updateExtinguisher,
} from '@/store/slices/extinguisherSlice';
import { fetchCustomers } from '@/store/slices/customerSlice';
import { formatDate, formatExtinguisherSize } from '@/utils';
import {
  EXTINGUISHER_MAX_DATE,
  dayAfterIsoDate,
  getExtinguisherDateFieldErrors,
  validateLocation,
  validateRequired,
  validateSerialNumber,
} from '@/utils/validation';

const statusTone = (status: ExtinguisherStatus) => {
  if (status === 'EXPIRED') return 'danger';
  if (status === 'EXPIRING_SOON') return 'warning';
  if (status === 'RENEWED') return 'success';
  if (status === 'IN_STOCK') return 'neutral';
  return 'info';
};

const TYPE_OPTIONS: { value: ExtinguisherType; label: string }[] = [
  { value: 'WATER', label: 'Water' },
  { value: 'CO2', label: 'CO₂' },
  { value: 'FOAM', label: 'Foam' },
  { value: 'DRY_CHEMICAL', label: 'Dry Chemical' },
];

const SIZE_OPTIONS: { value: ExtinguisherSize; label: string }[] = [
  { value: '2.5_LB', label: '2.5 lbs.' },
  { value: '5_LB', label: '5 lbs.' },
  { value: '9_LB', label: '9 lbs.' },
  { value: '12_LB', label: '12 lbs.' },
];

const emptyEditForm = {
  serialNumber: '',
  location: '',
  type: 'DRY_CHEMICAL' as ExtinguisherType,
  size: '5_LB' as ExtinguisherSize,
  installationDate: '',
  expiryDate: '',
  customerId: '',
  status: 'ACTIVE' as ExtinguisherStatus,
};

const emptyAssignForm = {
  extinguisherId: '',
  customerId: '',
  location: '',
};

const emptyStockForm = {
  serialNumber: '',
  location: 'Central warehouse',
  type: 'DRY_CHEMICAL' as ExtinguisherType,
  size: '5_LB' as ExtinguisherSize,
  installationDate: '',
  expiryDate: '',
};

export function ExtinguishersPage() {
  const dispatch = useAppDispatch();
  const { isAdmin, apiScope } = useAuth();
  const { items, meta, loading, saving, error } = useAppSelector((state) => state.extinguishers);
  const customers = useAppSelector((state) => state.customers.items);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [editing, setEditing] = useState<FireExtinguisher | null>(null);
  const [form, setForm] = useState(emptyEditForm);
  const [assignForm, setAssignForm] = useState(emptyAssignForm);
  const [assignSaving, setAssignSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<FireExtinguisher | null>(null);
  const [stockItems, setStockItems] = useState<FireExtinguisher[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockForm, setStockForm] = useState(emptyStockForm);
  const [stockSaving, setStockSaving] = useState(false);

  useEffect(() => {
    dispatch(
      fetchExtinguishers({
        scope: apiScope,
        page,
        limit: 10,
        search: search || undefined,
        status: (status as ExtinguisherStatus) || undefined,
      }),
    );
  }, [dispatch, apiScope, page, search, status]);

  useEffect(() => {
    if (isAdmin) dispatch(fetchCustomers({ page: 1, limit: 100 }));
  }, [dispatch, isAdmin]);

  const loadStock = async () => {
    if (!isAdmin) return;
    setStockLoading(true);
    try {
      const result = await extinguisherService.listStock({ page: 1, limit: 100 });
      setStockItems(result.data);
    } finally {
      setStockLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadStock();
  }, [isAdmin]);

  const reload = () =>
    dispatch(
      fetchExtinguishers({
        scope: apiScope,
        page,
        limit: 10,
        search: search || undefined,
        status: (status as ExtinguisherStatus) || undefined,
      }),
    );

  const validateEditForm = () => {
    const errors: Record<string, string> = {};
    const checks: [string, string | null, string][] = [
      ['serialNumber', validateSerialNumber(form.serialNumber), 'serialNumber'],
      ['location', validateLocation(form.location), 'location'],
      ['customerId', validateRequired(form.customerId, 'Customer'), 'customerId'],
    ];
    for (const [, err, key] of checks) {
      if (err) errors[key] = err;
    }
    Object.assign(
      errors,
      getExtinguisherDateFieldErrors(form.installationDate, form.expiryDate),
    );
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAssignForm = () => {
    const errors: Record<string, string> = {};
    const extErr = validateRequired(assignForm.extinguisherId, 'Extinguisher');
    if (extErr) errors.extinguisherId = extErr;
    const custErr = validateRequired(assignForm.customerId, 'Customer');
    if (custErr) errors.customerId = custErr;
    const locErr = validateLocation(assignForm.location);
    if (locErr) errors.location = locErr;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openRegister = async () => {
    setAssignForm(emptyAssignForm);
    setFieldErrors({});
    await loadStock();
    setRegisterModalOpen(true);
  };

  const openEdit = (item: FireExtinguisher) => {
    setEditing(item);
    setForm({
      serialNumber: item.serialNumber,
      location: item.location,
      type: item.type,
      size: item.size,
      installationDate: item.installationDate,
      expiryDate: item.expiryDate,
      customerId: item.customerId ?? '',
      status: item.status,
    });
    setFieldErrors({});
    setEditModalOpen(true);
  };

  const handleAssignToCustomer = async () => {
    if (!validateAssignForm()) return;

    setAssignSaving(true);
    try {
      const result = await dispatch(
        assignExtinguisher({
          id: assignForm.extinguisherId,
          payload: {
            customerId: assignForm.customerId,
            location: assignForm.location,
          },
        }),
      );
      if (assignExtinguisher.rejected.match(result)) return;

      setRegisterModalOpen(false);
      reload();
      await loadStock();
    } finally {
      setAssignSaving(false);
    }
  };

  const handleEditSave = async () => {
    if (!editing || !validateEditForm()) return;

    const result = await dispatch(
      updateExtinguisher({
        id: editing.id,
        payload: { ...form },
      }),
    );
    if (updateExtinguisher.rejected.match(result)) return;

    setEditModalOpen(false);
    reload();
  };

  const selectedStock = stockItems.find((e) => e.id === assignForm.extinguisherId);

  const validateStockForm = () => {
    const errors: Record<string, string> = {};
    const serialErr = validateSerialNumber(stockForm.serialNumber);
    if (serialErr) errors.serialNumber = serialErr;
    const locErr = validateLocation(stockForm.location);
    if (locErr) errors.location = locErr;
    Object.assign(
      errors,
      getExtinguisherDateFieldErrors(stockForm.installationDate, stockForm.expiryDate),
    );
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openStockCreate = () => {
    setStockForm(emptyStockForm);
    setFieldErrors({});
    setStockModalOpen(true);
  };

  const handleStockSave = async () => {
    if (!validateStockForm()) return;
    setStockSaving(true);
    try {
      await extinguisherService.createStock({
        serialNumber: stockForm.serialNumber,
        location: stockForm.location || undefined,
        type: stockForm.type,
        size: stockForm.size,
        installationDate: stockForm.installationDate,
        expiryDate: stockForm.expiryDate,
      });
      setStockModalOpen(false);
      await loadStock();
    } catch {
      /* error surfaced by api client interceptor if configured */
    } finally {
      setStockSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(deleteExtinguisher(deleteTarget.id));
    setDeleteTarget(null);
    reload();
    if (isAdmin) loadStock();
  };

  const columns: Column<FireExtinguisher>[] = [
    {
      key: 'serialNumber',
      header: 'Serial',
      render: (row) => (
        <Link to={`/extinguishers/${row.id}`} className="font-medium text-fire-600 hover:underline">
          {row.serialNumber}
        </Link>
      ),
    },
    { key: 'location', header: 'Location' },
    { key: 'type', header: 'Type' },
    {
      key: 'size',
      header: 'Size',
      render: (row) => formatExtinguisherSize(row.size),
    },
    {
      key: 'expiryDate',
      header: 'Expiry',
      render: (row) => formatDate(row.expiryDate),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
    },
    ...(isAdmin
      ? [
          {
            key: 'customerId',
            header: 'Customer',
            render: (row: FireExtinguisher) =>
              row.customerId
                ? (customers.find((c) => c.id === row.customerId)?.fullName ??
                  row.customerId.slice(0, 8))
                : '—',
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (row: FireExtinguisher) => (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>
                  Delete
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="page-container">
      <PageHeader
        title={isAdmin ? 'Extinguishers' : 'My Extinguishers'}
        description="Track fire extinguisher inventory, expiry dates, and status"
        action={
          isAdmin ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={openStockCreate}>
                Add to Stock
              </Button>
              <Button onClick={openRegister}>Register to Customer</Button>
            </div>
          ) : undefined
        }
      />

      {isAdmin && (
        <section className="mb-8">
          <h2 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
            Warehouse stock
          </h2>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
            Unassigned units — use Register to Customer or Assign on the Customers page.
          </p>
          <DataTable
            columns={[
              {
                key: 'serialNumber',
                header: 'Serial',
                render: (row) => (
                  <Link
                    to={`/extinguishers/${row.id}`}
                    className="font-medium text-fire-600 hover:underline"
                  >
                    {row.serialNumber}
                  </Link>
                ),
              },
              { key: 'location', header: 'Location' },
              { key: 'type', header: 'Type' },
              {
                key: 'size',
                header: 'Size',
                render: (row) => formatExtinguisherSize(row.size),
              },
              {
                key: 'expiryDate',
                header: 'Expiry',
                render: (row) => formatDate(row.expiryDate),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
              },
            ]}
            data={stockItems}
            loading={stockLoading}
            rowKey={(row) => row.id}
          />
        </section>
      )}

      {isAdmin && (
        <h2 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
          Assigned extinguishers
        </h2>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 sm:items-end lg:max-w-2xl">
        <Input
          label="Search"
          placeholder="Search serial or location..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <Select
          label="Status filter"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'EXPIRING_SOON', label: 'Expiring Soon' },
            { value: 'EXPIRED', label: 'Expired' },
            { value: 'RENEWED', label: 'Renewed' },
          ]}
        />
      </div>

      {error && <p className="mb-3 text-sm text-ember-600">{error}</p>}

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        rowKey={(row) => row.id}
        page={meta?.page}
        totalPages={meta?.totalPages}
        onPageChange={setPage}
      />

      {isAdmin && (
        <Modal
          open={registerModalOpen}
          onClose={() => setRegisterModalOpen(false)}
          title="Register to Customer"
          footer={
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setRegisterModalOpen(false)}>
                Cancel
              </Button>
              <Button
                loading={assignSaving}
                disabled={stockLoading || stockItems.length === 0}
                onClick={handleAssignToCustomer}
              >
                Register
              </Button>
            </div>
          }
        >
          {stockLoading ? (
            <p className="text-sm text-slate-600">Loading stock…</p>
          ) : stockItems.length === 0 ? (
            <p className="text-sm text-slate-600">
              No extinguishers in stock. Use Add to Stock first.
            </p>
          ) : (
            <div className="space-y-3">
              <Select
                label="Extinguisher in stock"
                value={assignForm.extinguisherId}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, extinguisherId: e.target.value })
                }
                error={fieldErrors.extinguisherId}
                options={[
                  { value: '', label: 'Select extinguisher' },
                  ...stockItems.map((x) => ({
                    value: x.id,
                    label: `${x.serialNumber} — ${x.type}, ${formatExtinguisherSize(x.size)}`,
                  })),
                ]}
              />
              {selectedStock && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                  <p>
                    <span className="font-medium">Warehouse:</span> {selectedStock.location}
                  </p>
                  <p>
                    <span className="font-medium">Expiry:</span>{' '}
                    {formatDate(selectedStock.expiryDate)}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span> {selectedStock.status}
                  </p>
                </div>
              )}
              <Select
                label="Customer"
                value={assignForm.customerId}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, customerId: e.target.value })
                }
                error={fieldErrors.customerId}
                options={[
                  { value: '', label: 'Select customer' },
                  ...customers.map((c) => ({ value: c.id, label: c.fullName })),
                ]}
              />
              <Input
                label="Installation location at customer site"
                value={assignForm.location}
                onChange={(e) => setAssignForm({ ...assignForm, location: e.target.value })}
                error={fieldErrors.location}
                placeholder="e.g. Building A — Floor 2"
              />
            </div>
          )}
        </Modal>
      )}

      {isAdmin && (
        <Modal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditing(null);
          }}
          title="Edit Extinguisher"
          footer={
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button loading={saving} onClick={handleEditSave}>
                Save
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <Input
              label="Serial number"
              value={form.serialNumber}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              error={fieldErrors.serialNumber}
            />
            <Input
              label="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              error={fieldErrors.location}
            />
            <Select
              label="Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as ExtinguisherType })}
              options={TYPE_OPTIONS}
            />
            <Select
              label="Size"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value as ExtinguisherSize })}
              options={SIZE_OPTIONS}
            />
            <Input
              label="Installation date"
              type="date"
              max={EXTINGUISHER_MAX_DATE}
              value={form.installationDate}
              onChange={(e) => setForm({ ...form, installationDate: e.target.value })}
              error={fieldErrors.installationDate}
            />
            <Input
              label="Expiry date"
              type="date"
              max={EXTINGUISHER_MAX_DATE}
              min={
                form.installationDate
                  ? dayAfterIsoDate(form.installationDate)
                  : undefined
              }
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              error={fieldErrors.expiryDate}
            />
            <Select
              label="Customer"
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              error={fieldErrors.customerId}
              options={[
                { value: '', label: 'Select customer' },
                ...customers.map((c) => ({ value: c.id, label: c.fullName })),
              ]}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ExtinguisherStatus })}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'EXPIRING_SOON', label: 'Expiring Soon' },
                { value: 'EXPIRED', label: 'Expired' },
                { value: 'RENEWED', label: 'Renewed' },
              ]}
            />
          </div>
        </Modal>
      )}

      {isAdmin && (
        <Modal
          open={stockModalOpen}
          onClose={() => setStockModalOpen(false)}
          title="Add to Stock"
          footer={
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setStockModalOpen(false)}>
                Cancel
              </Button>
              <Button loading={stockSaving} onClick={handleStockSave}>
                Save
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <Input
              label="Serial number"
              value={stockForm.serialNumber}
              onChange={(e) => setStockForm({ ...stockForm, serialNumber: e.target.value })}
              error={fieldErrors.serialNumber}
            />
            <Input
              label="Warehouse location"
              value={stockForm.location}
              onChange={(e) => setStockForm({ ...stockForm, location: e.target.value })}
              error={fieldErrors.location}
            />
            <Select
              label="Type"
              value={stockForm.type}
              onChange={(e) => setStockForm({ ...stockForm, type: e.target.value as ExtinguisherType })}
              options={TYPE_OPTIONS}
            />
            <Select
              label="Size"
              value={stockForm.size}
              onChange={(e) => setStockForm({ ...stockForm, size: e.target.value as ExtinguisherSize })}
              options={SIZE_OPTIONS}
            />
            <Input
              label="Installation date"
              type="date"
              max={EXTINGUISHER_MAX_DATE}
              value={stockForm.installationDate}
              onChange={(e) => setStockForm({ ...stockForm, installationDate: e.target.value })}
              error={fieldErrors.installationDate}
            />
            <Input
              label="Expiry date"
              type="date"
              max={EXTINGUISHER_MAX_DATE}
              min={
                stockForm.installationDate
                  ? dayAfterIsoDate(stockForm.installationDate)
                  : undefined
              }
              value={stockForm.expiryDate}
              onChange={(e) => setStockForm({ ...stockForm, expiryDate: e.target.value })}
              error={fieldErrors.expiryDate}
            />
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete extinguisher"
        message={`Delete extinguisher ${deleteTarget?.serialNumber}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
