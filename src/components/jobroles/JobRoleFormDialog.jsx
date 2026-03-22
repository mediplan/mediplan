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
import { Plus, Trash2 } from 'lucide-react';

const emptyRisk = { risk_name: '', risk_category: '', risk_level: '', description: '' };
const emptyExam = { exam_name: '', frequency_months: 12 };

const emptyForm = {
  name: '', company_id: '', company_name: '', description: '',
  risks: [], required_exams: [], surveillance_frequency_months: 12,
  ppe_required: '', notes: ''
};

export default function JobRoleFormDialog({ open, onOpenChange, jobRole, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = !!jobRole;

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  useEffect(() => {
    if (jobRole) {
      setForm({ ...emptyForm, ...jobRole });
    } else {
      setForm(emptyForm);
    }
  }, [jobRole, open]);

  const handleChange = (field, value) => {
    const updates = { [field]: value };
    if (field === 'company_id') {
      const comp = companies.find(c => String(c.id) === String(value));
      updates.company_name = comp?.name || '';
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  const updateRisk = (index, field, value) => {
    const newRisks = [...form.risks];
    newRisks[index] = { ...newRisks[index], [field]: value };
    setForm(prev => ({ ...prev, risks: newRisks }));
  };

  const updateExam = (index, field, value) => {
    const newExams = [...form.required_exams];
    newExams[index] = { ...newExams[index], [field]: value };
    setForm(prev => ({ ...prev, required_exams: newExams }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      company_id: Number(form.company_id),
      surveillance_frequency_months: Number(form.surveillance_frequency_months) || 12,
    };
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifica Mansione' : 'Nuova Mansione'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Nome mansione *</Label>
              <Input value={form.name} onChange={e => handleChange('name', e.target.value)} required />
            </div>
            <div>
              <Label>Azienda *</Label>
              <Select value={String(form.company_id)} onValueChange={v => handleChange('company_id', v)}>
                <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Periodicità sorveglianza (mesi)</Label>
              <Input type="number" value={form.surveillance_frequency_months} onChange={e => handleChange('surveillance_frequency_months', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Descrizione</Label>
              <Textarea value={form.description} onChange={e => handleChange('description', e.target.value)} rows={2} />
            </div>
            <div className="md:col-span-2">
              <Label>DPI richiesti</Label>
              <Input value={form.ppe_required} onChange={e => handleChange('ppe_required', e.target.value)} placeholder="es. guanti, casco, occhiali..." />
            </div>
          </div>

          {/* Risks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Rischi specifici</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setForm(prev => ({ ...prev, risks: [...prev.risks, { ...emptyRisk }] }))}>
                <Plus className="h-3 w-3 mr-1" /> Aggiungi rischio
              </Button>
            </div>
            {form.risks?.map((risk, i) => (
              <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2 p-3 border rounded-lg bg-muted/30">
                <Input placeholder="Nome rischio" value={risk.risk_name} onChange={e => updateRisk(i, 'risk_name', e.target.value)} />
                <Select value={risk.risk_category} onValueChange={v => updateRisk(i, 'risk_category', v)}>
                  <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chimico">Chimico</SelectItem>
                    <SelectItem value="fisico">Fisico</SelectItem>
                    <SelectItem value="biologico">Biologico</SelectItem>
                    <SelectItem value="ergonomico">Ergonomico</SelectItem>
                    <SelectItem value="psicosociale">Psicosociale</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={risk.risk_level} onValueChange={v => updateRisk(i, 'risk_level', v)}>
                  <SelectTrigger><SelectValue placeholder="Livello" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basso">Basso</SelectItem>
                    <SelectItem value="medio">Medio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-1">
                  <Input placeholder="Descrizione" value={risk.description} onChange={e => updateRisk(i, 'description', e.target.value)} className="flex-1" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setForm(prev => ({ ...prev, risks: prev.risks.filter((_, idx) => idx !== i) }))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Required exams */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Accertamenti previsti</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setForm(prev => ({ ...prev, required_exams: [...prev.required_exams, { ...emptyExam }] }))}>
                <Plus className="h-3 w-3 mr-1" /> Aggiungi esame
              </Button>
            </div>
            {form.required_exams?.map((exam, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <Input placeholder="Nome esame" value={exam.exam_name} onChange={e => updateExam(i, 'exam_name', e.target.value)} className="flex-1" />
                <Input type="number" placeholder="Mesi" value={exam.frequency_months} onChange={e => updateExam(i, 'frequency_months', Number(e.target.value))} className="w-20" />
                <Button type="button" variant="ghost" size="icon" onClick={() => setForm(prev => ({ ...prev, required_exams: prev.required_exams.filter((_, idx) => idx !== i) }))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">{isEdit ? 'Salva' : 'Crea Mansione'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}