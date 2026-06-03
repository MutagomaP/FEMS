import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Badge, DataTable, PageHeader, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { inspectionService } from '@/services/inspectionService';
import { maintenanceService } from '@/services/maintenanceService';
import { extinguisherService } from '@/services/extinguisherService';
import { userService } from '@/services/userService';
import { Card } from '@/components/ui/Card';
import type {
  InspectionSchedule,
  InspectionStatus,
  FireExtinguisher,
  MaintenanceLog,
  User,
} from '@/types';
import { formatDate, formatExtinguisherType } from '@/utils';
import { toast } from '@/utils/toast';
import {
  EXTINGUISHER_MAX_DATE,
  validateDateNotPast,
  validateInspectionTime,
  validateMaintenanceForm,
  validateRequired,
} from '@/utils/validation';

const statusTone = (s: InspectionStatus) => {
  if (s === 'OVERDUE') return 'danger';
  if (s === 'COMPLETED') return 'success';
  if (s === 'CANCELLED') return 'neutral';
  return 'warning';
};

export function InspectionsPage() {
  const { user, isAdmin, isCustomer, isInspector } = useAuth();
  const [items, setItems] = useState<InspectionSchedule[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [extinguishers, setExtinguishers] = useState<FireExtinguisher[]>([]);
  const [inspectors, setInspectors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [maintOpen, setMaintOpen] = useState(false);
  const [form, setForm] = useState({
    extinguisherId: '',
    customerId: '',
    inspectorUserId: '',
    inspectionDate: '',
    inspectionTime: '09:00',
    notes: '',
  });
  const [maintForm, setMaintForm] = useState({
    extinguisherId: '',
    actionTaken: '',
    maintenanceDate: '',
    issuesIdentified: '',
    notes: '',
    recommendations: '',
  });
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>({});
  const [maintErrors, setMaintErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<InspectionSchedule | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteMaintTarget, setDeleteMaintTarget] = useState<MaintenanceLog | null>(null);
  const [deletingMaint, setDeletingMaint] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = isCustomer
        ? await inspectionService.listMine({ page: 1, limit: 50 })
        : isInspector
          ? await inspectionService.listAssigned({ page: 1, limit: 50 })
          : await inspectionService.list({ page: 1, limit: 50 });
      setItems(data.data);

      if (isInspector) {
        const maint = await maintenanceService.listMine({ page: 1, limit: 50 });
        setMaintenanceLogs(maint.data);
      } else if (isAdmin) {
        const maint = await maintenanceService.list({ page: 1, limit: 50 });
        setMaintenanceLogs(maint.data);
      } else {
        setMaintenanceLogs([]);
      }

      const extData = isAdmin || isInspector
        ? await extinguisherService.listAll({ page: 1, limit: 100, assignedOnly: true })
        : await extinguisherService.listMine({ page: 1, limit: 100 });
      setExtinguishers(extData.data);

      if (isAdmin) {
        setInspectors(await userService.listInspectors());
      }
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes('401') || /unauthorized/i.test(message)) {
        toast.error('Session expired. Please sign in again.');
      } else {
        toast.error(message || 'Failed to load inspections');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isCustomer, isAdmin, isInspector]);

  const extinguisherById = useMemo(
    () => new Map(extinguishers.map((e) => [e.id, e])),
    [extinguishers],
  );

  const inspectorById = useMemo(
    () => new Map(inspectors.map((i) => [i.id, i])),
    [inspectors],
  );

  const resolveExtinguisher = (extinguisherId: string) =>
    extinguisherById.get(extinguisherId);

  const onExtinguisherChange = (extinguisherId: string) => {
    const ext = extinguisherById.get(extinguisherId);
    setForm((prev) => ({
      ...prev,
      extinguisherId,
      customerId: ext?.customerId ?? '',
    }));
    if (scheduleErrors.extinguisherId) {
      setScheduleErrors((prev) => {
        const next = { ...prev };
        delete next.extinguisherId;
        return next;
      });
    }
  };

  const schedule = async () => {
    const e: Record<string, string> = {};
    if (validateRequired(form.extinguisherId, 'Extinguisher')) e.extinguisherId = 'Required';
    if (isAdmin) {
      if (validateRequired(form.inspectorUserId, 'Inspector')) e.inspectorUserId = 'Required';
      if (!form.customerId) e.extinguisherId = 'Extinguisher must belong to a customer';
    }
    const d = validateDateNotPast(form.inspectionDate, 'Inspection date');
    if (d) e.inspectionDate = d;
    const t = validateInspectionTime(form.inspectionTime);
    if (t) e.inspectionTime = t;
    setScheduleErrors(e);
    if (Object.keys(e).length) return;

    try {
      await inspectionService.create({
        extinguisherId: form.extinguisherId,
        inspectionDate: form.inspectionDate,
        inspectionTime: form.inspectionTime,
        notes: form.notes.trim() || undefined,
        ...(isAdmin
          ? {
              customerId: form.customerId,
              inspectorUserId: form.inspectorUserId,
            }
          : {}),
      });
      toast.success(
        isCustomer
          ? 'Inspection requested. You and site administrators have been notified by email.'
          : 'Inspection scheduled successfully',
      );
      setScheduleOpen(false);
      setForm({
        extinguisherId: '',
        customerId: '',
        inspectorUserId: '',
        inspectionDate: '',
        inspectionTime: '09:00',
        notes: '',
      });
      load();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to schedule inspection');
    }
  };

  const logMaintenance = async () => {
    const e = validateMaintenanceForm(maintForm);
    setMaintErrors(e);
    if (Object.keys(e).length) return;

    try {
      await maintenanceService.create({
        extinguisherId: maintForm.extinguisherId,
        actionTaken: maintForm.actionTaken.trim(),
        maintenanceDate: maintForm.maintenanceDate,
        issuesIdentified: maintForm.issuesIdentified.trim() || undefined,
        notes: maintForm.notes.trim() || undefined,
        recommendations: maintForm.recommendations.trim() || undefined,
      });
      toast.success('Maintenance record saved successfully');
      setMaintOpen(false);
      setMaintErrors({});
      load();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save maintenance log');
    }
  };

  const openMaintenanceModal = () => {
    setMaintErrors({});
    setMaintForm({
      extinguisherId: '',
      actionTaken: '',
      maintenanceDate: '',
      issuesIdentified: '',
      notes: '',
      recommendations: '',
    });
    setMaintOpen(true);
  };

  const openScheduleModal = () => {
    setScheduleErrors({});
    setForm({
      extinguisherId: '',
      customerId: '',
      inspectorUserId: '',
      inspectionDate: '',
      inspectionTime: '09:00',
      notes: '',
    });
    setScheduleOpen(true);
  };

  const canComplete = (row: InspectionSchedule) =>
    row.status === 'PENDING' &&
    (isAdmin || !row.inspectorUserId || row.inspectorUserId === user?.id);

  const canCancelInspection = (row: InspectionSchedule) =>
    row.status === 'PENDING' && (isCustomer || isAdmin);

  const canDeleteInspection = (row: InspectionSchedule) => {
    if (row.status === 'COMPLETED') return isAdmin;
    if (isAdmin || isCustomer) return true;
    if (isInspector) {
      return !row.inspectorUserId || row.inspectorUserId === user?.id;
    }
    return false;
  };

  const confirmDeleteMaintenance = async () => {
    if (!deleteMaintTarget) return;
    setDeletingMaint(true);
    try {
      await maintenanceService.remove(deleteMaintTarget.id);
      toast.success('Maintenance log deleted');
      setDeleteMaintTarget(null);
      load();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete maintenance log');
    } finally {
      setDeletingMaint(false);
    }
  };

  const confirmDeleteInspection = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await inspectionService.remove(deleteTarget.id);
      toast.success('Inspection deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete inspection');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<InspectionSchedule>[] = [
    {
      key: 'serialNumber',
      header: 'Serial number',
      render: (r) => {
        const ext = resolveExtinguisher(r.extinguisherId);
        return ext?.serialNumber ?? '—';
      },
    },
    {
      key: 'location',
      header: 'Name',
      render: (r) => {
        const ext = resolveExtinguisher(r.extinguisherId);
        return ext?.location ?? '—';
      },
    },
    {
      key: 'type',
      header: 'Type',
      render: (r) => {
        const ext = resolveExtinguisher(r.extinguisherId);
        return ext ? formatExtinguisherType(ext.type) : '—';
      },
    },
    {
      key: 'inspectionDate',
      header: 'Date',
      render: (r) => `${formatDate(r.inspectionDate)} ${r.inspectionTime}`,
    },
    ...(isAdmin
      ? [
          {
            key: 'inspector',
            header: 'Assigned inspector',
            render: (r: InspectionSchedule) => {
              if (!r.inspectorUserId) return '—';
              const insp = inspectorById.get(r.inspectorUserId);
              return insp?.fullName ?? r.inspectorUserId.slice(0, 8);
            },
          },
        ]
      : []),
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: InspectionSchedule) => {
        const showComplete = canComplete(row) && (isInspector || isAdmin);
        const showCancel = canCancelInspection(row);
        const showDelete = canDeleteInspection(row);
        if (!showComplete && !showCancel && !showDelete) return null;
        return (
          <div className="flex flex-wrap gap-2">
            {showComplete && (
              <Button
                size="sm"
                onClick={() =>
                  inspectionService
                    .complete(row.id)
                    .then(() => {
                      toast.success('Inspection marked complete');
                      load();
                    })
                    .catch((err) =>
                      toast.error((err as Error).message || 'Failed to complete'),
                    )
                }
              >
                Complete
              </Button>
            )}
            {showCancel && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  inspectionService
                    .cancel(row.id)
                    .then(() => {
                      toast.success('Inspection cancelled');
                      load();
                    })
                    .catch((err) =>
                      toast.error((err as Error).message || 'Failed to cancel'),
                    )
                }
              >
                Cancel
              </Button>
            )}
            {showDelete && (
              <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>
                Delete
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const maintenanceColumns: Column<MaintenanceLog>[] = [
    {
      key: 'serialNumber',
      header: 'Serial number',
      render: (r) => resolveExtinguisher(r.extinguisherId)?.serialNumber ?? '—',
    },
    {
      key: 'location',
      header: 'Location',
      render: (r) => resolveExtinguisher(r.extinguisherId)?.location ?? '—',
    },
    {
      key: 'actionTaken',
      header: 'Action taken',
      render: (r) => r.actionTaken,
    },
    {
      key: 'maintenanceDate',
      header: 'Date',
      render: (r) => formatDate(r.maintenanceDate),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (r) => r.notes ?? '—',
    },
    {
      key: 'issuesIdentified',
      header: 'Issues',
      render: (r) => r.issuesIdentified ?? '—',
    },
    {
      key: 'recommendations',
      header: 'Recommendations',
      render: (r) => r.recommendations ?? '—',
    },
    {
      key: 'maintActions',
      header: 'Actions',
      render: (r) => (
        <Button size="sm" variant="danger" onClick={() => setDeleteMaintTarget(r)}>
          Delete
        </Button>
      ),
    },
  ];

  const showMaintenance = isAdmin || isInspector;

  return (
    <div className="page-container">
      <PageHeader
        title="Inspections"
        description={
          isInspector
            ? 'Assigned inspections and maintenance logs you recorded'
            : isAdmin
              ? 'Schedule inspections and view maintenance history'
              : 'Schedule inspections and view inspection history'
        }
        action={
          <div className="flex gap-2">
            {(isCustomer || isAdmin) && (
              <Button onClick={openScheduleModal}>Schedule Inspection</Button>
            )}
            {(isInspector || isAdmin) && (
              <Button variant="secondary" onClick={openMaintenanceModal}>
                Log Maintenance
              </Button>
            )}
          </div>
        }
      />

      <Card title="Scheduled inspections" className="mb-6">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          rowKey={(r) => r.id}
          emptyMessage="No inspections scheduled"
        />
      </Card>

      {showMaintenance && (
        <Card title="Maintenance logs" description="Recorded maintenance activity">
          <DataTable
            columns={maintenanceColumns}
            data={maintenanceLogs}
            loading={loading}
            rowKey={(r) => r.id}
            emptyMessage="No maintenance logs yet"
          />
        </Card>
      )}

      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Schedule inspection">
        <div className="space-y-3">
          {isCustomer && (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
              Choose one of your registered extinguishers. After you submit, you will receive a
              confirmation email and administrators will be notified to arrange the visit.
            </p>
          )}
          {isCustomer && extinguishers.length === 0 && (
            <p className="text-sm text-slate-600">
              You have no registered extinguishers yet.{' '}
              <Link to="/extinguishers" className="font-medium text-fire-600 hover:underline">
                View My Extinguishers
              </Link>
            </p>
          )}
          <Select
            label="Extinguisher"
            disabled={isCustomer && extinguishers.length === 0}
            value={form.extinguisherId}
            onChange={(e) => onExtinguisherChange(e.target.value)}
            error={scheduleErrors.extinguisherId}
            options={[
              { value: '', label: 'Select' },
              ...extinguishers.map((x) => ({
                value: x.id,
                label: `${x.serialNumber} — ${x.location}`,
              })),
            ]}
          />
          {isAdmin && (
            <Select
              label="Assign inspector"
              value={form.inspectorUserId}
              onChange={(e) => setForm({ ...form, inspectorUserId: e.target.value })}
              error={scheduleErrors.inspectorUserId}
              options={[
                { value: '', label: 'Select inspector' },
                ...inspectors.map((i) => ({
                  value: i.id,
                  label: `${i.fullName} (${i.email})`,
                })),
              ]}
            />
          )}
          <Input
            label="Inspection date"
            type="date"
            value={form.inspectionDate}
            onChange={(e) => setForm({ ...form, inspectionDate: e.target.value })}
            error={scheduleErrors.inspectionDate}
          />
          <Input
            label="Inspection time (HH:mm)"
            value={form.inspectionTime}
            onChange={(e) => setForm({ ...form, inspectionTime: e.target.value })}
            error={scheduleErrors.inspectionTime}
          />
          <TextArea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <Button
            onClick={schedule}
            disabled={isCustomer && extinguishers.length === 0}
          >
            {isCustomer ? 'Request inspection' : 'Schedule'}
          </Button>
        </div>
      </Modal>

      <Modal open={maintOpen} onClose={() => setMaintOpen(false)} title="Log maintenance" footer={null}>
        <div className="space-y-3">
          <Select
            label="Extinguisher"
            value={maintForm.extinguisherId}
            onChange={(e) => {
              setMaintForm({ ...maintForm, extinguisherId: e.target.value });
              if (maintErrors.extinguisherId) {
                setMaintErrors((prev) => {
                  const next = { ...prev };
                  delete next.extinguisherId;
                  return next;
                });
              }
            }}
            error={maintErrors.extinguisherId}
            options={[
              { value: '', label: 'Select' },
              ...extinguishers.map((x) => ({ value: x.id, label: x.serialNumber })),
            ]}
          />
          <Input
            label="Action taken"
            value={maintForm.actionTaken}
            onChange={(e) => {
              setMaintForm({ ...maintForm, actionTaken: e.target.value });
              if (maintErrors.actionTaken) {
                setMaintErrors((prev) => {
                  const next = { ...prev };
                  delete next.actionTaken;
                  return next;
                });
              }
            }}
            error={maintErrors.actionTaken}
          />
          <Input
            label="Maintenance date"
            type="date"
            max={EXTINGUISHER_MAX_DATE}
            value={maintForm.maintenanceDate}
            onChange={(e) => {
              setMaintForm({ ...maintForm, maintenanceDate: e.target.value });
              if (maintErrors.maintenanceDate) {
                setMaintErrors((prev) => {
                  const next = { ...prev };
                  delete next.maintenanceDate;
                  return next;
                });
              }
            }}
            error={maintErrors.maintenanceDate}
          />
          <TextArea
            label="Issues identified"
            value={maintForm.issuesIdentified}
            onChange={(e) => {
              setMaintForm({ ...maintForm, issuesIdentified: e.target.value });
              if (maintErrors.issuesIdentified) {
                setMaintErrors((prev) => {
                  const next = { ...prev };
                  delete next.issuesIdentified;
                  return next;
                });
              }
            }}
            error={maintErrors.issuesIdentified}
          />
          <TextArea
            label="Notes"
            value={maintForm.notes}
            onChange={(e) => {
              setMaintForm({ ...maintForm, notes: e.target.value });
              if (maintErrors.notes) {
                setMaintErrors((prev) => {
                  const next = { ...prev };
                  delete next.notes;
                  return next;
                });
              }
            }}
            error={maintErrors.notes}
          />
          <TextArea
            label="Recommendations"
            value={maintForm.recommendations}
            onChange={(e) => {
              setMaintForm({ ...maintForm, recommendations: e.target.value });
              if (maintErrors.recommendations) {
                setMaintErrors((prev) => {
                  const next = { ...prev };
                  delete next.recommendations;
                  return next;
                });
              }
            }}
            error={maintErrors.recommendations}
          />
          <Button onClick={logMaintenance}>Save log</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteMaintTarget}
        title="Delete maintenance log"
        message={
          deleteMaintTarget
            ? `Delete maintenance "${deleteMaintTarget.actionTaken}" on ${formatDate(deleteMaintTarget.maintenanceDate)}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deletingMaint}
        onConfirm={confirmDeleteMaintenance}
        onCancel={() => setDeleteMaintTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete inspection"
        message={
          deleteTarget
            ? `Delete inspection on ${formatDate(deleteTarget.inspectionDate)} at ${deleteTarget.inspectionTime}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDeleteInspection}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
