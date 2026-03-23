import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const emptyForm = {
  first_name: '', last_name: '', fiscal_code: '', birth_date: '', birth_place: '',
  birth_province: '', nationality: '', ethnicity: '', gender: '', status: 'active',
  company_id: '', company_name: '',
  job_role_id: '', job_role_name: '',
  job_role_secondary1_id: '', job_role_secondary1_name: '',
  job_role_secondary2_id: '', job_role_secondary2_name: '',
  job_role_notes: '',
  hire_date: '', termination_date: '', record_delivery_date: '', employee_number: '',
  disabled_employee: false, military_service: '',
  subject_to_surveillance: true, privacy_delivered: false,
  to_revisit: false, first_visit_expiry: '',
  residence_city: '', residence_province: '', residence_zip: '', residence_address: '', residence_phone: '',
  domicile_city: '', domicile_province: '', domicile_zip: '', domicile_address: '',
  doc_type: '', doc_number: '', doc_issue_date: '', doc_expiry_date: '', doc_issued_by: '',
  contract_type: '', contract_detail: '', marital_status: '', email: '', phone: '',
  gp_name: '', gp_city: '', gp_province: '', gp_address: '', gp_phone: '',
  blood_type: '', allergies: '', chronic_conditions: '', current_medications: '', notes: ''
};

function SectionTitle({ children }) {
  return <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2 pb-1 border-b border-border mb-2">{children}</p>;
}

function CheckField({ id, label, checked, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input type="checkbox" id={id} checked={!!checked} onChange={e => onChange(e.target.checked)} className="h-4 w-4 accent-primary" />
      <Label htmlFor={id} className="font-normal cursor-pointer">{label}</Label>
    </div>
  );
}

export default function PatientFormDialog({ open, onOpenChange, patient, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = !!patient;

  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: () => base44.entities.Company.list() });
  const { data: jobRoles = [] } = useQuery({ queryKey: ['jobRoles'], queryFn: () => base44.entities.JobRole.list() });

  const filteredRoles = jobRoles;

  useEffect(() => {
    setForm(patient ? { ...emptyForm, ...patient } : emptyForm);
  }, [patient, open]);

  const handleChange = (field, value) => {
    const updates = { [field]: value };
    if (field === 'company_id') {
      const comp = companies.find(c => String(c.id) === String(value));
      updates.company_name = comp?.name || '';
      updates.job_role_id = ''; updates.job_role_name = '';
      updates.job_role_secondary1_id = ''; updates.job_role_secondary1_name = '';
      updates.job_role_secondary2_id = ''; updates.job_role_secondary2_name = '';
    }
    if (field === 'job_role_id') {
      const role = jobRoles.find(r => String(r.id) === String(value));
      updates.job_role_name = role?.name || '';
    }
    if (field === 'job_role_secondary1_id') {
      const role = jobRoles.find(r => String(r.id) === String(value));
      updates.job_role_secondary1_name = role?.name || '';
    }
    if (field === 'job_role_secondary2_id') {
      const role = jobRoles.find(r => String(r.id) === String(value));
      updates.job_role_secondary2_name = role?.name || '';
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      company_id: String(form.company_id),
      job_role_id: form.job_role_id ? String(form.job_role_id) : undefined,
      job_role_secondary1_id: form.job_role_secondary1_id ? String(form.job_role_secondary1_id) : undefined,
      job_role_secondary2_id: form.job_role_secondary2_id ? String(form.job_role_secondary2_id) : undefined,
    };
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifica Lavoratore' : 'Nuovo Lavoratore'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Testata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Label>Azienda *</Label>
              <Select value={String(form.company_id)} onValueChange={v => handleChange('company_id', v)}>
                <SelectTrigger><SelectValue placeholder="Seleziona azienda" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stato</Label>
              <Select value={form.status} onValueChange={v => handleChange('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Attivo</SelectItem>
                  <SelectItem value="inactive">Cessato</SelectItem>
                  <SelectItem value="on_leave">In congedo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="generali" className="mt-2">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="generali">Dati generali</TabsTrigger>
              <TabsTrigger value="mansioni">Mansioni</TabsTrigger>
              <TabsTrigger value="residenza">Residenza / Domicilio</TabsTrigger>
              <TabsTrigger value="documento">Documento</TabsTrigger>
              <TabsTrigger value="altri">Altri dati</TabsTrigger>
              <TabsTrigger value="medico">Medico Curante</TabsTrigger>
              <TabsTrigger value="sanitario">Dati sanitari</TabsTrigger>
            </TabsList>

            {/* DATI GENERALI */}
            <TabsContent value="generali" className="space-y-3 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Cognome *</Label>
                  <Input value={form.last_name} onChange={e => handleChange('last_name', e.target.value)} required />
                </div>
                <div>
                  <Label>Nome *</Label>
                  <Input value={form.first_name} onChange={e => handleChange('first_name', e.target.value)} required />
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
                  <Label>Nato a</Label>
                  <Input value={form.birth_place} onChange={e => handleChange('birth_place', e.target.value)} placeholder="Comune" />
                </div>
                <div>
                  <Label>Prov.</Label>
                  <Input value={form.birth_province} onChange={e => handleChange('birth_province', e.target.value)} maxLength={2} placeholder="XX" />
                </div>
                <div>
                  <Label>Data di nascita</Label>
                  <Input type="date" value={form.birth_date} onChange={e => handleChange('birth_date', e.target.value)} />
                </div>
                <div>
                  <Label>Nazionalità</Label>
                  <Input value={form.nationality} onChange={e => handleChange('nationality', e.target.value)} />
                </div>
                <div>
                  <Label>Etnia</Label>
                  <Input value={form.ethnicity} onChange={e => handleChange('ethnicity', e.target.value)} placeholder="es. Caucasica" />
                </div>
                <div>
                  <Label>Codice fiscale</Label>
                  <Input value={form.fiscal_code} onChange={e => handleChange('fiscal_code', e.target.value)} className="uppercase" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Data assunzione</Label>
                  <Input type="date" value={form.hire_date} onChange={e => handleChange('hire_date', e.target.value)} />
                </div>
                <div>
                  <Label>Data fine rapporto / Licenzia</Label>
                  <Input type="date" value={form.termination_date} onChange={e => handleChange('termination_date', e.target.value)} />
                </div>
                <div>
                  <Label>Data consegna cartella</Label>
                  <Input type="date" value={form.record_delivery_date} onChange={e => handleChange('record_delivery_date', e.target.value)} />
                </div>
                <div>
                  <Label>Matricola</Label>
                  <Input value={form.employee_number} onChange={e => handleChange('employee_number', e.target.value)} />
                </div>
                <div>
                  <Label>Servizio militare</Label>
                  <Input value={form.military_service} onChange={e => handleChange('military_service', e.target.value)} />
                </div>
                <div>
                  <Label>Data scadenza 1ª visita</Label>
                  <Input type="date" value={form.first_visit_expiry} onChange={e => handleChange('first_visit_expiry', e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 pt-1">
                <CheckField id="disabled" label="Assunto come invalido" checked={form.disabled_employee} onChange={v => handleChange('disabled_employee', v)} />
                <CheckField id="surveillance" label="Soggetto a Sorveglianza Sanitaria" checked={form.subject_to_surveillance} onChange={v => handleChange('subject_to_surveillance', v)} />
                <CheckField id="privacy" label="Consegnata informativa privacy" checked={form.privacy_delivered} onChange={v => handleChange('privacy_delivered', v)} />
                <CheckField id="revisit" label="Da Rivisitare" checked={form.to_revisit} onChange={v => handleChange('to_revisit', v)} />
              </div>
            </TabsContent>

            {/* MANSIONI */}
            <TabsContent value="mansioni" className="space-y-3 mt-4">
              <div>
                <Label>Mansione principale</Label>
                <Select value={String(form.job_role_id || '')} onValueChange={v => handleChange('job_role_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleziona mansione" /></SelectTrigger>
                  <SelectContent>
                    {filteredRoles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mansione secondaria (1)</Label>
                <Select value={String(form.job_role_secondary1_id || '')} onValueChange={v => handleChange('job_role_secondary1_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleziona mansione" /></SelectTrigger>
                  <SelectContent>
                    {filteredRoles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mansione secondaria (2)</Label>
                <Select value={String(form.job_role_secondary2_id || '')} onValueChange={v => handleChange('job_role_secondary2_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleziona mansione" /></SelectTrigger>
                  <SelectContent>
                    {filteredRoles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mansione (ulteriori info)</Label>
                <Textarea value={form.job_role_notes} onChange={e => handleChange('job_role_notes', e.target.value)} rows={3} placeholder="Note aggiuntive sulle mansioni..." />
              </div>
            </TabsContent>

            {/* RESIDENZA / DOMICILIO */}
            <TabsContent value="residenza" className="space-y-3 mt-4">
              <SectionTitle>Residenza</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <Label>Comune</Label>
                  <Input value={form.residence_city} onChange={e => handleChange('residence_city', e.target.value)} />
                </div>
                <div>
                  <Label>Prov.</Label>
                  <Input value={form.residence_province} onChange={e => handleChange('residence_province', e.target.value)} maxLength={2} placeholder="XX" />
                </div>
                <div>
                  <Label>CAP</Label>
                  <Input value={form.residence_zip} onChange={e => handleChange('residence_zip', e.target.value)} maxLength={5} />
                </div>
                <div className="md:col-span-3">
                  <Label>Indirizzo</Label>
                  <Input value={form.residence_address} onChange={e => handleChange('residence_address', e.target.value)} />
                </div>
                <div>
                  <Label>Telefono</Label>
                  <Input value={form.residence_phone} onChange={e => handleChange('residence_phone', e.target.value)} />
                </div>
              </div>

              <SectionTitle>Domicilio (se diverso dalla residenza)</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <Label>Comune</Label>
                  <Input value={form.domicile_city} onChange={e => handleChange('domicile_city', e.target.value)} />
                </div>
                <div>
                  <Label>Prov.</Label>
                  <Input value={form.domicile_province} onChange={e => handleChange('domicile_province', e.target.value)} maxLength={2} placeholder="XX" />
                </div>
                <div>
                  <Label>CAP</Label>
                  <Input value={form.domicile_zip} onChange={e => handleChange('domicile_zip', e.target.value)} maxLength={5} />
                </div>
                <div className="md:col-span-4">
                  <Label>Indirizzo</Label>
                  <Input value={form.domicile_address} onChange={e => handleChange('domicile_address', e.target.value)} />
                </div>
              </div>
            </TabsContent>

            {/* DOCUMENTO */}
            <TabsContent value="documento" className="space-y-3 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Tipologia documento</Label>
                  <Select value={form.doc_type} onValueChange={v => handleChange('doc_type', v)}>
                    <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carta_identita">Carta d'identità</SelectItem>
                      <SelectItem value="passaporto">Passaporto</SelectItem>
                      <SelectItem value="patente">Patente</SelectItem>
                      <SelectItem value="permesso_soggiorno">Permesso di soggiorno</SelectItem>
                      <SelectItem value="altro">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nr. documento</Label>
                  <Input value={form.doc_number} onChange={e => handleChange('doc_number', e.target.value)} />
                </div>
                <div>
                  <Label>In data (rilascio)</Label>
                  <Input type="date" value={form.doc_issue_date} onChange={e => handleChange('doc_issue_date', e.target.value)} />
                </div>
                <div>
                  <Label>Scade il</Label>
                  <Input type="date" value={form.doc_expiry_date} onChange={e => handleChange('doc_expiry_date', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label>Rilasciato da</Label>
                  <Input value={form.doc_issued_by} onChange={e => handleChange('doc_issued_by', e.target.value)} />
                </div>
              </div>
            </TabsContent>

            {/* ALTRI DATI */}
            <TabsContent value="altri" className="space-y-3 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Tipo contratto</Label>
                  <Select value={form.contract_type} onValueChange={v => handleChange('contract_type', v)}>
                    <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indeterminato">Indeterminato</SelectItem>
                      <SelectItem value="determinato">Determinato</SelectItem>
                      <SelectItem value="apprendistato">Apprendistato</SelectItem>
                      <SelectItem value="part_time">Part-time</SelectItem>
                      <SelectItem value="somministrazione">Somministrazione</SelectItem>
                      <SelectItem value="collaborazione">Collaborazione</SelectItem>
                      <SelectItem value="altro">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dettaglio contratto</Label>
                  <Input value={form.contract_detail} onChange={e => handleChange('contract_detail', e.target.value)} placeholder="es. Tempo pieno, orario ridotto..." />
                </div>
                <div>
                  <Label>Stato civile</Label>
                  <Select value={form.marital_status} onValueChange={v => handleChange('marital_status', v)}>
                    <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="celibe_nubile">Celibe / Nubile</SelectItem>
                      <SelectItem value="coniugato">Coniugato/a</SelectItem>
                      <SelectItem value="separato">Separato/a</SelectItem>
                      <SelectItem value="divorziato">Divorziato/a</SelectItem>
                      <SelectItem value="vedovo">Vedovo/a</SelectItem>
                      <SelectItem value="convivente">Convivente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} />
                </div>
                <div>
                  <Label>Telefono</Label>
                  <Input value={form.phone} onChange={e => handleChange('phone', e.target.value)} />
                </div>
              </div>
            </TabsContent>

            {/* MEDICO CURANTE */}
            <TabsContent value="medico" className="space-y-3 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <Label>Nominativo medico curante</Label>
                  <Input value={form.gp_name} onChange={e => handleChange('gp_name', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label>Comune</Label>
                  <Input value={form.gp_city} onChange={e => handleChange('gp_city', e.target.value)} />
                </div>
                <div>
                  <Label>Prov.</Label>
                  <Input value={form.gp_province} onChange={e => handleChange('gp_province', e.target.value)} maxLength={2} placeholder="XX" />
                </div>
                <div className="md:col-span-2">
                  <Label>Indirizzo</Label>
                  <Input value={form.gp_address} onChange={e => handleChange('gp_address', e.target.value)} />
                </div>
                <div>
                  <Label>Telefono</Label>
                  <Input value={form.gp_phone} onChange={e => handleChange('gp_phone', e.target.value)} />
                </div>
              </div>
            </TabsContent>

            {/* DATI SANITARI */}
            <TabsContent value="sanitario" className="space-y-3 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              </div>
              <div>
                <Label>Allergie</Label>
                <Input value={form.allergies} onChange={e => handleChange('allergies', e.target.value)} />
              </div>
              <div>
                <Label>Patologie croniche</Label>
                <Textarea value={form.chronic_conditions} onChange={e => handleChange('chronic_conditions', e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Terapie in corso</Label>
                <Input value={form.current_medications} onChange={e => handleChange('current_medications', e.target.value)} />
              </div>
              <div>
                <Label>Annotazioni</Label>
                <Textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} rows={3} />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">{isEdit ? 'Salva' : 'Crea Lavoratore'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}