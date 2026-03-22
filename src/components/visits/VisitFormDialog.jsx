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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const emptyForm = {
  patient_id: '', patient_name: '', company_id: '', company_name: '',
  visit_date: '', visit_type: '', 
  anamnesis_family: '', anamnesis_physiological: '', anamnesis_pathological: '', anamnesis_work: '',
  current_symptoms: '', physical_exam: '',
  height_cm: '', weight_kg: '', blood_pressure_systolic: '', blood_pressure_diastolic: '', heart_rate: '',
  visual_acuity: '', audiometry_result: '', spirometry_result: '',
  blood_tests_result: '', urine_test_result: '', ecg_result: '', other_exams: '',
  judgment: '', judgment_details: '', next_visit_date: '', notes: ''
};

const visitTypes = [
  { value: 'preventiva', label: 'Preventiva' },
  { value: 'periodica', label: 'Periodica' },
  { value: 'su_richiesta', label: 'Su richiesta' },
  { value: 'cambio_mansione', label: 'Cambio mansione' },
  { value: 'rientro_malattia', label: 'Rientro malattia' },
  { value: 'cessazione', label: 'Cessazione' },
];

const judgments = [
  { value: 'idoneo', label: 'Idoneo' },
  { value: 'idoneo_con_prescrizioni', label: 'Idoneo con prescrizioni' },
  { value: 'idoneo_con_limitazioni', label: 'Idoneo con limitazioni' },
  { value: 'temporaneamente_non_idoneo', label: 'Temporaneamente non idoneo' },
  { value: 'non_idoneo', label: 'Non idoneo' },
];

export default function VisitFormDialog({ open, onOpenChange, visit, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const isEdit = !!visit;

  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: () => base44.entities.Company.list() });
  const { data: patients = [] } = useQuery({ queryKey: ['patients'], queryFn: () => base44.entities.Patient.list() });

  const filteredPatients = selectedCompanyId 
    ? patients.filter(p => String(p.company_id) === selectedCompanyId)
    : patients;

  useEffect(() => {
    if (visit) {
      setForm({ ...emptyForm, ...visit });
      setSelectedCompanyId(String(visit.company_id || ''));
    } else {
      setForm(emptyForm);
      setSelectedCompanyId('');
    }
  }, [visit, open]);

  const handleChange = (field, value) => {
    const updates = { [field]: value };
    if (field === 'patient_id') {
      const p = patients.find(pt => String(pt.id) === String(value));
      if (p) {
        updates.patient_name = `${p.last_name} ${p.first_name}`;
        updates.company_id = p.company_id;
        updates.company_name = p.company_name;
        setSelectedCompanyId(String(p.company_id));
      }
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      patient_id: String(form.patient_id),
      company_id: String(form.company_id || selectedCompanyId),
      height_cm: form.height_cm ? Number(form.height_cm) : undefined,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      blood_pressure_systolic: form.blood_pressure_systolic ? Number(form.blood_pressure_systolic) : undefined,
      blood_pressure_diastolic: form.blood_pressure_diastolic ? Number(form.blood_pressure_diastolic) : undefined,
      heart_rate: form.heart_rate ? Number(form.heart_rate) : undefined,
    };
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifica Visita' : 'Nuova Visita Medica'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Azienda</Label>
              <Select value={selectedCompanyId} onValueChange={v => { setSelectedCompanyId(v); }}>
                <SelectTrigger><SelectValue placeholder="Filtra per azienda" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lavoratore *</Label>
              <Select value={String(form.patient_id)} onValueChange={v => handleChange('patient_id', v)}>
                <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  {filteredPatients.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.last_name} {p.first_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data visita *</Label>
              <Input type="date" value={form.visit_date} onChange={e => handleChange('visit_date', e.target.value)} required />
            </div>
            <div>
              <Label>Tipo visita *</Label>
              <Select value={form.visit_type} onValueChange={v => handleChange('visit_type', v)}>
                <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  {visitTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="anamnesi" className="mt-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="anamnesi">Anamnesi</TabsTrigger>
              <TabsTrigger value="esame">Esame obiettivo</TabsTrigger>
              <TabsTrigger value="accertamenti">Accertamenti</TabsTrigger>
              <TabsTrigger value="giudizio">Giudizio</TabsTrigger>
            </TabsList>

            <TabsContent value="anamnesi" className="space-y-3 mt-4">
              <div>
                <Label>Anamnesi familiare</Label>
                <Textarea value={form.anamnesis_family} onChange={e => handleChange('anamnesis_family', e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Anamnesi fisiologica</Label>
                <Textarea value={form.anamnesis_physiological} onChange={e => handleChange('anamnesis_physiological', e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Anamnesi patologica remota</Label>
                <Textarea value={form.anamnesis_pathological} onChange={e => handleChange('anamnesis_pathological', e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Anamnesi lavorativa</Label>
                <Textarea value={form.anamnesis_work} onChange={e => handleChange('anamnesis_work', e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Sintomatologia attuale</Label>
                <Textarea value={form.current_symptoms} onChange={e => handleChange('current_symptoms', e.target.value)} rows={2} />
              </div>
            </TabsContent>

            <TabsContent value="esame" className="space-y-3 mt-4">
              <div>
                <Label>Esame obiettivo</Label>
                <Textarea value={form.physical_exam} onChange={e => handleChange('physical_exam', e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <Label>Altezza (cm)</Label>
                  <Input type="number" value={form.height_cm} onChange={e => handleChange('height_cm', e.target.value)} />
                </div>
                <div>
                  <Label>Peso (kg)</Label>
                  <Input type="number" value={form.weight_kg} onChange={e => handleChange('weight_kg', e.target.value)} />
                </div>
                <div>
                  <Label>PA sist.</Label>
                  <Input type="number" value={form.blood_pressure_systolic} onChange={e => handleChange('blood_pressure_systolic', e.target.value)} />
                </div>
                <div>
                  <Label>PA diast.</Label>
                  <Input type="number" value={form.blood_pressure_diastolic} onChange={e => handleChange('blood_pressure_diastolic', e.target.value)} />
                </div>
                <div>
                  <Label>FC (bpm)</Label>
                  <Input type="number" value={form.heart_rate} onChange={e => handleChange('heart_rate', e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Acuità visiva</Label>
                <Input value={form.visual_acuity} onChange={e => handleChange('visual_acuity', e.target.value)} />
              </div>
            </TabsContent>

            <TabsContent value="accertamenti" className="space-y-3 mt-4">
              <div>
                <Label>Audiometria</Label>
                <Textarea value={form.audiometry_result} onChange={e => handleChange('audiometry_result', e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Spirometria</Label>
                <Textarea value={form.spirometry_result} onChange={e => handleChange('spirometry_result', e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Esami ematochimici</Label>
                <Textarea value={form.blood_tests_result} onChange={e => handleChange('blood_tests_result', e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Esame urine</Label>
                <Textarea value={form.urine_test_result} onChange={e => handleChange('urine_test_result', e.target.value)} rows={2} />
              </div>
              <div>
                <Label>ECG</Label>
                <Textarea value={form.ecg_result} onChange={e => handleChange('ecg_result', e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Altri accertamenti</Label>
                <Textarea value={form.other_exams} onChange={e => handleChange('other_exams', e.target.value)} rows={2} />
              </div>
            </TabsContent>

            <TabsContent value="giudizio" className="space-y-3 mt-4">
              <div>
                <Label>Giudizio di idoneità</Label>
                <Select value={form.judgment || ''} onValueChange={v => handleChange('judgment', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleziona giudizio" /></SelectTrigger>
                  <SelectContent>
                    {judgments.map(j => <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dettaglio prescrizioni/limitazioni</Label>
                <Textarea value={form.judgment_details} onChange={e => handleChange('judgment_details', e.target.value)} rows={3} />
              </div>
              <div>
                <Label>Data prossima visita</Label>
                <Input type="date" value={form.next_visit_date} onChange={e => handleChange('next_visit_date', e.target.value)} />
              </div>
              <div>
                <Label>Note</Label>
                <Textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} rows={2} />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">{isEdit ? 'Salva' : 'Registra Visita'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}