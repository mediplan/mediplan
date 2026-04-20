import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';

function getExpiryInfo(patient, visits) {
  const patientVisits = visits.filter(v => String(v.patient_id) === String(patient.id));
  const withNextDate = patientVisits
    .filter(v => v.next_visit_date)
    .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));

  let expiryDate = null;
  if (withNextDate.length > 0) {
    expiryDate = withNextDate[0].next_visit_date;
  } else if (patient.first_visit_expiry) {
    expiryDate = patient.first_visit_expiry;
  }

  if (!expiryDate) {
    if (patientVisits.length === 0 && patient.subject_to_surveillance) {
      return { status: 'missing', label: 'Nessuna visita', color: 'text-destructive', bgColor: 'bg-destructive/10', icon: AlertTriangle };
    }
    return null;
  }

  const today = new Date();
  const expiry = parseISO(expiryDate);
  const daysLeft = differenceInDays(expiry, today);

  if (daysLeft < 0) {
    return { status: 'expired', label: `Scaduta ${format(expiry, 'dd/MM/yyyy')}`, color: 'text-destructive', bgColor: 'bg-destructive/10', icon: AlertTriangle, daysLeft };
  } else if (daysLeft <= 30) {
    return { status: 'expiring', label: `Scade ${format(expiry, 'dd/MM/yyyy')}`, color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Clock, daysLeft };
  } else {
    return { status: 'ok', label: format(expiry, 'dd/MM/yyyy'), color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircle, daysLeft };
  }
}

export default function ScheduleVisitsDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
}) {
  const [selected, setSelected] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list(),
    enabled: open,
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['medicalVisits'],
    queryFn: () => base44.entities.MedicalVisit.list('-visit_date'),
    enabled: open,
  });

  const companyPatients = useMemo(() => {
    return patients.filter(p => String(p.company_id) === String(companyId));
  }, [patients, companyId]);

  const groupedPatients = useMemo(() => {
    const groups = {
      expired: [],
      expiring: [],
      ok: [],
      missing: [],
    };

    companyPatients.forEach(p => {
      const expiry = getExpiryInfo(p, visits);
      if (!expiry) {
        groups.ok.push({ patient: p, expiry });
      } else {
        groups[expiry.status].push({ patient: p, expiry });
      }
    });

    return groups;
  }, [companyPatients, visits]);

  const createAppointmentsMutation = useMutation({
    mutationFn: async (patientIds) => {
      const appointments = patientIds.map(patientId => {
        const patient = companyPatients.find(p => p.id === patientId);
        return {
          title: `Visita medica — ${companyName}`,
          date: formData.date,
          time: formData.time,
          patient_id: patientId,
          patient_name: patient ? `${patient.last_name} ${patient.first_name}` : '',
          company_id: companyId,
          company_name: companyName,
          appointment_type: 'visita_medica',
          visit_type: 'periodica',
          notes: formData.notes,
          status: 'schedulato',
        };
      });

      await Promise.all(
        appointments.map(a => base44.entities.Appointment.create(a))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setSelected([]);
      setFormData({ date: '', time: '', notes: '' });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date || selected.length === 0) return;
    createAppointmentsMutation.mutate(selected);
  };

  const toggleSelect = (patientId) => {
    setSelected(prev =>
      prev.includes(patientId) ? prev.filter(id => id !== patientId) : [...prev, patientId]
    );
  };

  const selectGroup = (groupKey) => {
    const groupIds = groupedPatients[groupKey].map(item => item.patient.id);
    setSelected(prev => {
      const newSelected = new Set(prev);
      groupIds.forEach(id => {
        if (newSelected.has(id)) {
          newSelected.delete(id);
        } else {
          newSelected.add(id);
        }
      });
      return Array.from(newSelected);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Programma Visite</DialogTitle>
          <DialogDescription>{companyName}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <Label htmlFor="date" className="text-xs">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="time" className="text-xs">Ora</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <Label className="text-xs mb-2">Note</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Note aggiuntive..."
            className="h-12 text-xs mb-4"
          />

          {/* Lavoratori scaduti */}
          {groupedPatients.expired.length > 0 && (
            <div className="mb-3">
              <button
                type="button"
                onClick={() => selectGroup('expired')}
                className="text-xs font-medium mb-2 p-2 rounded hover:bg-muted text-destructive"
              >
                Scaduti ({groupedPatients.expired.length})
              </button>
              <ScrollArea className="border rounded-lg h-24 p-2 bg-destructive/5">
                <div className="space-y-1">
                  {groupedPatients.expired.map(({ patient, expiry }) => (
                    <label key={patient.id} className="flex items-center gap-2 p-1 rounded hover:bg-destructive/10 cursor-pointer text-xs">
                      <Checkbox
                        checked={selected.includes(patient.id)}
                        onCheckedChange={() => toggleSelect(patient.id)}
                      />
                      <span className="flex-1">{patient.last_name} {patient.first_name}</span>
                      <span className="text-destructive text-xs">{expiry.label}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Lavoratori in scadenza */}
          {groupedPatients.expiring.length > 0 && (
            <div className="mb-3">
              <button
                type="button"
                onClick={() => selectGroup('expiring')}
                className="text-xs font-medium mb-2 p-2 rounded hover:bg-muted text-amber-600"
              >
                In scadenza ({groupedPatients.expiring.length})
              </button>
              <ScrollArea className="border rounded-lg h-24 p-2 bg-amber-50">
                <div className="space-y-1">
                  {groupedPatients.expiring.map(({ patient, expiry }) => (
                    <label key={patient.id} className="flex items-center gap-2 p-1 rounded hover:bg-amber-100 cursor-pointer text-xs">
                      <Checkbox
                        checked={selected.includes(patient.id)}
                        onCheckedChange={() => toggleSelect(patient.id)}
                      />
                      <span className="flex-1">{patient.last_name} {patient.first_name}</span>
                      <span className="text-amber-600 text-xs">{expiry.label}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Nuovi lavoratori (senza visita) */}
          {groupedPatients.missing.length > 0 && (
            <div className="mb-3">
              <button
                type="button"
                onClick={() => selectGroup('missing')}
                className="text-xs font-medium mb-2 p-2 rounded hover:bg-muted text-destructive"
              >
                Nuovi (senza visita) ({groupedPatients.missing.length})
              </button>
              <ScrollArea className="border rounded-lg h-24 p-2 bg-destructive/5">
                <div className="space-y-1">
                  {groupedPatients.missing.map(({ patient }) => (
                    <label key={patient.id} className="flex items-center gap-2 p-1 rounded hover:bg-destructive/10 cursor-pointer text-xs">
                      <Checkbox
                        checked={selected.includes(patient.id)}
                        onCheckedChange={() => toggleSelect(patient.id)}
                      />
                      <span className="flex-1">{patient.last_name} {patient.first_name}</span>
                      <span className="text-destructive text-xs">Nessuna visita</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Lavoratori in regola */}
          {groupedPatients.ok.length > 0 && (
            <div className="mb-3">
              <button
                type="button"
                onClick={() => selectGroup('ok')}
                className="text-xs font-medium mb-2 p-2 rounded hover:bg-muted text-emerald-600"
              >
                In regola ({groupedPatients.ok.length})
              </button>
              <ScrollArea className="border rounded-lg h-24 p-2 bg-emerald-50">
                <div className="space-y-1">
                  {groupedPatients.ok.map(({ patient, expiry }) => (
                    <label key={patient.id} className="flex items-center gap-2 p-1 rounded hover:bg-emerald-100 cursor-pointer text-xs">
                      <Checkbox
                        checked={selected.includes(patient.id)}
                        onCheckedChange={() => toggleSelect(patient.id)}
                      />
                      <span className="flex-1">{patient.last_name} {patient.first_name}</span>
                      {expiry && <span className="text-emerald-600 text-xs">{expiry.label}</span>}
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createAppointmentsMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={!formData.date || selected.length === 0 || createAppointmentsMutation.isPending}
            >
              {createAppointmentsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Programma {selected.length} visite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}