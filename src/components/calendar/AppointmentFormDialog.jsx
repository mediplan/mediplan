import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const MOTIVI = [
  { value: 'visite_mediche', label: 'Svolgere visite mediche' },
  { value: 'sopralluogo', label: 'Sopralluogo in azienda' },
  { value: 'riunione_periodica', label: 'Riunione periodica' },
];

export default function AppointmentFormDialog({ open, onOpenChange, appointment, initialDate, onSave }) {
  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    patient_id: '',
    patient_name: '',
    company_id: '',
    company_name: '',
    motivo: '',
    notes: '',
    status: 'schedulato',
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
    enabled: open,
  });
  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list(),
    enabled: open,
  });

  useEffect(() => {
    if (appointment) {
      setForm({ ...appointment });
    } else {
      setForm({
        title: '',
        date: initialDate || '',
        time: '',
        patient_id: '',
        patient_name: '',
        company_id: '',
        company_name: '',
        motivo: '',
        notes: '',
        status: 'schedulato',
      });
    }
  }, [appointment, initialDate, open]);

  const filteredPatients = form.company_id
    ? patients.filter(p => String(p.company_id) === String(form.company_id))
    : patients;

  const handleCompanyChange = (val) => {
    const company = companies.find(c => c.id === val);
    setForm(f => ({
      ...f,
      company_id: val,
      company_name: company?.name || '',
      patient_id: '',
      patient_name: '',
    }));
  };

  const handlePatientChange = (val) => {
    const patient = patients.find(p => p.id === val);
    setForm(f => ({
      ...f,
      patient_id: val,
      patient_name: patient ? `${patient.last_name} ${patient.first_name}` : '',
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{appointment ? 'Modifica appuntamento' : 'Nuovo appuntamento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Titolo *</Label>
            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Es. Visita periodica Mario Rossi"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Data *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Ora</Label>
              <Input
                type="time"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Motivo</Label>
            <Select value={form.motivo} onValueChange={val => setForm(f => ({ ...f, motivo: val }))}>
              <SelectTrigger><SelectValue placeholder="Seleziona motivo..." /></SelectTrigger>
              <SelectContent>
                {MOTIVI.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Azienda</Label>
            <Select value={form.company_id} onValueChange={handleCompanyChange}>
              <SelectTrigger><SelectValue placeholder="Seleziona azienda..." /></SelectTrigger>
              <SelectContent>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Stato</Label>
            <Select value={form.status} onValueChange={val => setForm(f => ({ ...f, status: val }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="schedulato">Schedulato</SelectItem>
                <SelectItem value="completato">Completato</SelectItem>
                <SelectItem value="annullato">Annullato</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Note</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">Salva</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}