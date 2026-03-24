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
  name: '', vat_number: '', fiscal_code: '', address: '', city: '', province: '',
  zip_code: '', phone: '', email: '', pec: '', ateco_code: '', sector: '',
  legal_representative: '', rspp: '', rls: '', employee_count: '',
  contract_start: '', contract_end: '', notes: '', status: 'active',
  assigned_doctor_id: '', assigned_doctor_name: ''
};

export default function CompanyFormDialog({ open, onOpenChange, company, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = !!company;

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctorProfiles'],
    queryFn: () => base44.entities.DoctorProfile.list('full_name'),
  });

  useEffect(() => {
    if (company) {
      setForm({ ...emptyForm, ...company, employee_count: company.employee_count ?? '' });
    } else {
      setForm(emptyForm);
    }
  }, [company, open]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleDoctorChange = (doctorId) => {
    const doc = doctors.find(d => d.id === doctorId);
    setForm(prev => ({
      ...prev,
      assigned_doctor_id: doctorId === 'none' ? '' : doctorId,
      assigned_doctor_name: doc ? doc.full_name : '',
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, employee_count: form.employee_count ? Number(form.employee_count) : undefined };
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifica Azienda' : 'Nuova Azienda'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Ragione sociale *</Label>
              <Input value={form.name} onChange={e => handleChange('name', e.target.value)} required />
            </div>
            <div>
              <Label>Partita IVA</Label>
              <Input value={form.vat_number} onChange={e => handleChange('vat_number', e.target.value)} />
            </div>
            <div>
              <Label>Codice Fiscale</Label>
              <Input value={form.fiscal_code} onChange={e => handleChange('fiscal_code', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Indirizzo</Label>
              <Input value={form.address} onChange={e => handleChange('address', e.target.value)} />
            </div>
            <div>
              <Label>Città</Label>
              <Input value={form.city} onChange={e => handleChange('city', e.target.value)} />
            </div>
            <div>
              <Label>Provincia</Label>
              <Input value={form.province} onChange={e => handleChange('province', e.target.value)} />
            </div>
            <div>
              <Label>CAP</Label>
              <Input value={form.zip_code} onChange={e => handleChange('zip_code', e.target.value)} />
            </div>
            <div>
              <Label>Telefono</Label>
              <Input value={form.phone} onChange={e => handleChange('phone', e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} />
            </div>
            <div>
              <Label>PEC</Label>
              <Input value={form.pec} onChange={e => handleChange('pec', e.target.value)} />
            </div>
            <div>
              <Label>Codice ATECO</Label>
              <Input value={form.ateco_code} onChange={e => handleChange('ateco_code', e.target.value)} />
            </div>
            <div>
              <Label>Settore</Label>
              <Input value={form.sector} onChange={e => handleChange('sector', e.target.value)} />
            </div>
            <div>
              <Label>Rappresentante legale</Label>
              <Input value={form.legal_representative} onChange={e => handleChange('legal_representative', e.target.value)} />
            </div>
            <div>
              <Label>RSPP</Label>
              <Input value={form.rspp} onChange={e => handleChange('rspp', e.target.value)} />
            </div>
            <div>
              <Label>RLS</Label>
              <Input value={form.rls} onChange={e => handleChange('rls', e.target.value)} />
            </div>
            <div>
              <Label>N. dipendenti</Label>
              <Input type="number" value={form.employee_count} onChange={e => handleChange('employee_count', e.target.value)} />
            </div>
            <div>
              <Label>Inizio contratto</Label>
              <Input type="date" value={form.contract_start} onChange={e => handleChange('contract_start', e.target.value)} />
            </div>
            <div>
              <Label>Fine contratto</Label>
              <Input type="date" value={form.contract_end} onChange={e => handleChange('contract_end', e.target.value)} />
            </div>
            <div>
              <Label>Stato</Label>
              <Select value={form.status} onValueChange={v => handleChange('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Attivo</SelectItem>
                  <SelectItem value="inactive">Inattivo</SelectItem>
                  <SelectItem value="suspended">Sospeso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Medico Incaricato</Label>
              <Select value={form.assigned_doctor_id || 'none'} onValueChange={handleDoctorChange}>
                <SelectTrigger><SelectValue placeholder="Nessun medico assegnato" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Nessun medico assegnato —</SelectItem>
                  {doctors.filter(d => d.active !== false).map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.full_name}{d.specialization ? ` — ${d.specialization}` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Note</Label>
              <Textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">{isEdit ? 'Salva' : 'Crea Azienda'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}