import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const emptyForm = {
  first_name: '', last_name: '', fiscal_code: '', birth_date: '', birth_place: '',
  gender: '', address: '', city: '', phone: '', email: '',
  company_id: '', company_name: '', job_role_id: '', job_role_name: '',
  hire_date: '', status: 'active', blood_type: '',
  allergies: '', chronic_conditions: '', current_medications: '', notes: ''
};

export default function PatientFormDialog({ open, onOpenChange, patient, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = !!patient;

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: jobRoles = [] } = useQuery({
    queryKey: ['jobRoles'],
    queryFn: () => base44.entities.JobRole.list(),
  });

  const filteredRoles = jobRoles.filter(r => String(r.company_id) === String(form.company_id));

  useEffect(() => {
    if (patient) {
      setForm({ ...emptyForm, ...patient });
    } else {
      setForm(emptyForm);
    }
  }, [patient, open]);

  const handleChange = (field, value) => {
    const updates = { [field]: value };
    if (field === 'company_id') {
      const comp = companies.find(c => String(c.id) === String(value));
      updates.company_name = comp?.name || '';
      updates.job_role_id = '';
      updates.job_role_name = '';
    }
    if (field === 'job_role_id') {
      const role = jobRoles.find(r => String(r.id) === String(value));
      updates.job_role_name = role?.name || '';
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, company_id: Number(form.company_id), job_role_id: form.job_role_id ? Number(form.job_role_id) : undefined };
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifica Lavoratore' : 'Nuovo Lavoratore'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Cognome *</Label>
              <Input value={form.last_name} onChange={e => handleChange('last_name', e.target.value)} required />
            </div>
            <div>
              <Label>Nome *</Label>
              <Input value={form.first_name} onChange={e => handleChange('first_name', e.target.value)} required />
            </div>
            <div>
              <Label>Codice fiscale</Label>
              <Input value={form.fiscal_code} onChange={e => handleChange('fiscal_code', e.target.value)} />
            </div>
            <div>
              <Label>Sesso</Label>
              <Select value={form.gender} onValueChange={v => handleChange('gender', v)}>
                <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Maschio</SelectItem>
                  <SelectItem value="F">Femmina</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data di nascita</Label>
              <Input type="date" value={form.birth_date} onChange={e => handleChange('birth_date', e.target.value)} />
            </div>
            <div>
              <Label>Luogo di nascita</Label>
              <Input value={form.birth_place} onChange={e => handleChange('birth_place', e.target.value)} />
            </div>
            <div>
              <Label>Telefono</Label>
              <Input value={form.phone} onChange={e => handleChange('phone', e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Indirizzo</Label>
              <Input value={form.address} onChange={e => handleChange('address', e.target.value)} />
            </div>
            <div>
              <Label>Azienda *</Label>
              <Select value={String(form.company_id)} onValueChange={v => handleChange('company_id', v)}>
                <SelectTrigger><SelectValue placeholder="Seleziona azienda" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mansione</Label>
              <Select value={String(form.job_role_id || '')} onValueChange={v => handleChange('job_role_id', v)}>
                <SelectTrigger><SelectValue placeholder="Seleziona mansione" /></SelectTrigger>
                <SelectContent>
                  {filteredRoles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data assunzione</Label>
              <Input type="date" value={form.hire_date} onChange={e => handleChange('hire_date', e.target.value)} />
            </div>
            <div>
              <Label>Gruppo sanguigno</Label>
              <Select value={form.blood_type || ''} onValueChange={v => handleChange('blood_type', v)}>
                <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  {['A+','A-','B+','B-','AB+','AB-','0+','0-','unknown'].map(bt => (
                    <SelectItem key={bt} value={bt}>{bt === 'unknown' ? 'Sconosciuto' : bt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Allergie</Label>
              <Input value={form.allergies} onChange={e => handleChange('allergies', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Patologie croniche</Label>
              <Textarea value={form.chronic_conditions} onChange={e => handleChange('chronic_conditions', e.target.value)} rows={2} />
            </div>
            <div className="md:col-span-2">
              <Label>Terapie in corso</Label>
              <Input value={form.current_medications} onChange={e => handleChange('current_medications', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Note</Label>
              <Textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">{isEdit ? 'Salva' : 'Crea Lavoratore'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}