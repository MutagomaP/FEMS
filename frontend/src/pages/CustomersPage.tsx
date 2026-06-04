import { useEffect, useState } from 'react';
import { Badge, DataTable, PageHeader, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { extinguisherService } from '@/services/extinguisherService';
import type { Customer, FireExtinguisher } from '@/types';
import { assignExtinguisher, fetchExtinguishers } from '@/store/slices/extinguisherSlice';
import { validateLocation, validateRequired } from '@/utils/validation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  deleteCustomer,
  createCustomer,
  fetchCustomers,
  updateCustomer,
} from '@/store/slices/customerSlice';
import { formatDate } from '@/utils';
import { validateCustomerForm } from '@/utils/validation';

export function CustomersPage() {
  const dispatch = useAppDispatch();
  const { items, meta, loading, saving, error } = useAppSelector((state) => state.customers);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    nationalId: '',
    phone: '',
    email: '',
    address: '',
  });
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [assignTarget, setAssignTarget] = useState<Customer | null>(null);
  const [stockOptions, setStockOptions] = useState<FireExtinguisher[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignForm, setAssignForm] = useState({ extinguisherId: '', location: '' });
  const [assignErrors, setAssignErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    dispatch(fetchCustomers({ page, limit: 10, search: search || undefined }));
  }, [dispatch, page, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      fullName: '',
      nationalId: '',
      phone: '',
      email: '',
      address: '',
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setForm({
      fullName: customer.fullName,
      nationalId: customer.nationalId,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const openAssign = async (customer: Customer) => {
    setAssignTarget(customer);
    setAssignForm({ extinguisherId: '', location: '' });
    setAssignErrors({});
    setStockLoading(true);
    try {
      const result = await extinguisherService.listStock({ page: 1, limit: 100 });
      setStockOptions(result.data);
    } finally {
      setStockLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignTarget) return;
    const errors: Record<string, string> = {};
    const extErr = validateRequired(assignForm.extinguisherId, 'Extinguisher');
    if (extErr) errors.extinguisherId = extErr;
    const locErr = validateLocation(assignForm.location);
    if (locErr) errors.location = locErr;
    setAssignErrors(errors);
    if (Object.keys(errors).length) return;

    setAssignSaving(true);
    try {
      const result = await dispatch(
        assignExtinguisher({
          id: assignForm.extinguisherId,
          payload: {
            customerId: assignTarget.id,
            location: assignForm.location,
          },
        }),
      );
      if (assignExtinguisher.rejected.match(result)) return;

      setAssignTarget(null);
      const refreshed = await extinguisherService.listStock({ page: 1, limit: 100 });
      setStockOptions(refreshed.data);
      dispatch(
        fetchExtinguishers({
          scope: 'admin',
          page: 1,
          limit: 10,
        }),
      );
    } finally {
      setAssignSaving(false);
    }
  };

  const handleSave = async () => {
    const errors = validateCustomerForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    if (editing) {
      await dispatch(updateCustomer({ id: editing.id, payload: form }));
    } else {
      const result = await dispatch(createCustomer(form));
      if (createCustomer.rejected.match(result)) return;
    }

    setModalOpen(false);
    dispatch(fetchCustomers({ page, limit: 10, search: search || undefined }));
  };

  const columns: Column<Customer>[] = [
    { key: 'fullName', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'nationalId', header: 'National ID' },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => openAssign(row)}>
            Assign extinguisher
          </Button>
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Customers"
        description="View all customer profiles — self-registered via the portal or created by an admin."
        action={<Button onClick={openCreate}>Add customer</Button>}
      />

      <div className="mb-4 max-w-md">
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>

      {error && <Badge tone="danger">{error}</Badge>}

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        rowKey={(row) => row.id}
        page={meta?.page}
        totalPages={meta?.totalPages}
        onPageChange={setPage}
      />

      <Modal
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title={assignTarget ? `Assign extinguisher — ${assignTarget.fullName}` : 'Assign extinguisher'}
        footer={
          <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setAssignTarget(null)}>
              Cancel
            </Button>
            <Button
              loading={assignSaving}
              disabled={stockLoading || stockOptions.length === 0}
              onClick={handleAssign}
            >
              Assign
            </Button>
          </div>
        }
      >
        {stockLoading ? (
          <p className="text-sm text-slate-600">Loading stock…</p>
        ) : stockOptions.length === 0 ? (
          <p className="text-sm text-slate-600">
            No extinguishers in stock. Add units on the Extinguishers page (Add to Stock) or run
            seed.
          </p>
        ) : (
          <div className="space-y-3">
            <Select
              label="Extinguisher in stock"
              value={assignForm.extinguisherId}
              onChange={(e) => setAssignForm({ ...assignForm, extinguisherId: e.target.value })}
              error={assignErrors.extinguisherId}
              options={[
                { value: '', label: 'Select extinguisher' },
                ...stockOptions.map((x) => ({
                  value: x.id,
                  label: `${x.serialNumber} — ${x.type} (${x.location})`,
                })),
              ]}
            />
            <Input
              label="Installation location at customer site"
              value={assignForm.location}
              onChange={(e) => setAssignForm({ ...assignForm, location: e.target.value })}
              error={assignErrors.location}
              placeholder="e.g. Building A — Floor 2"
            />
          </div>
        )}
      </Modal>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Customer' : 'Add Customer'}
        footer={
          <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleSave}>
              Save
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Full name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            error={fieldErrors.fullName}
          />
          <Input
            label="National ID"
            value={form.nationalId}
            onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
            error={fieldErrors.nationalId}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            error={fieldErrors.phone}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={fieldErrors.email}
            disabled={!!editing}
          />
          <TextArea
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            error={fieldErrors.address}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete customer"
        message={`Delete customer ${deleteTarget?.fullName}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={async () => {
          if (deleteTarget) {
            await dispatch(deleteCustomer(deleteTarget.id));
            dispatch(fetchCustomers({ page, limit: 10, search: search || undefined }));
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
