import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

const PREDEFINED_RISKS = [
  'Agenti Biologici',
  'Agenti Cancerogeni',
  'Agenti Chimici',
  'Agenti Mutageni',
  'Alcoldipendenza',
  'Amianto',
  'Atmosfere Iperbariche',
  'Attività in quota sup. 2 m',
  'Autista Patente B',
  'Campi Elettromagnetici',
  'Infrasuoni',
  'Lavoro Notturno',
  'Lavoro in altezza',
  'Microclima Severo',
  'Movimentazione Manuale dei Carichi',
  'Movimentazione Ripetitiva Arti Superiori',
  'Polvere Legno Duro',
  'Polveri miste',
  'Posture Incongrue',
  'Prova rischio',
  'Radiazioni Ionizzanti',
  'Radiazioni Ottiche Artificiali',
  'Raggi U.V e IR',
  'Rumore',
  'Sovraccarico Biomeccanico Arti Superiori',
  'Stress Lavoro Correlato',
  'Tossicodipendenza',
  'Ultrasuoni',
  'Vibrazioni Corpo Intero',
  'Vibrazioni Mano Braccio',
  'Videoterminali (VDT)',
];

const PREDEFINED_EXAMS = [
  'Titmus',
  'Visiotest',
  'Stampa Verbale Prelievo Liquidi Biologici',
  'Test Droghe 1° Liv.',
  'Visita Spec. Tossicologica',
  'Audit',
  'Audit-C',
  'Questionario Disturbi Nasali',
  'Questionario Videoterminali',
  'Rachide',
  'Arti superiori',
  'Questionario addetti gestione emergenze',
  'Questionario Lavoro Notturno',
  'Audiometria',
  'Questionario App. Muscholo-Scheletrico',
  'Elettrocardiogramma',
  'Matrice di West',
  'Sonno - OSAS',
  'Rientro da trasferta estero',
  'CECA',
  'Covid',
  'Covid (Test Antigenico)',
  'Esegui Monitoraggio Biologico',
  'Esame urine / sangue',
  'Vestibolare',
  'Radiazioni Ionizzanti',
  'Campi Elettromagnetici',
  'Tetan Test',
  "E' un Test Alcol",
  "E' un Test Droghe",
];

const FREQUENCY_OPTIONS = [
  { label: 'Annuale', value: 12 },
  { label: 'Semestrale', value: 6 },
  { label: 'Biennale', value: 24 },
  { label: 'Quadriennale', value: 48 },
  { label: 'Quinquennale', value: 60 },
];

const emptyCustomRisk = { risk_name: '', risk_category: '', risk_level: '', description: '' };
const emptyExam = { exam_name: '', frequency_months: 12 };

const emptyForm = {
  name: '', description: '',
  risks: [], required_exams: [], surveillance_frequency_months: 12,
  ppe_required: '', notes: ''
};

export default function JobRoleFormDialog({ open, onOpenChange, jobRole, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = !!jobRole;

  useEffect(() => {
    if (jobRole) {
      setForm({ ...emptyForm, ...jobRole });
    } else {
      setForm(emptyForm);
    }
  }, [jobRole, open]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Rischi predefiniti: toggle checkbox
  const isPredefinedSelected = (name) =>
    form.risks.some(r => r.risk_name === name && !r._custom);

  const togglePredefined = (name) => {
    const already = form.risks.some(r => r.risk_name === name && !r._custom);
    if (already) {
      setForm(prev => ({ ...prev, risks: prev.risks.filter(r => !(r.risk_name === name && !r._custom)) }));
    } else {
      setForm(prev => ({ ...prev, risks: [...prev.risks, { risk_name: name, risk_category: '', risk_level: '', description: '', _custom: false }] }));
    }
  };

  // Rischi personalizzati
  const customRisks = form.risks.filter(r => r._custom);

  const addCustomRisk = () => {
    setForm(prev => ({ ...prev, risks: [...prev.risks, { ...emptyCustomRisk, _custom: true }] }));
  };

  const updateCustomRisk = (index, field, value) => {
    const customIndexes = form.risks.reduce((acc, r, i) => { if (r._custom) acc.push(i); return acc; }, []);
    const realIndex = customIndexes[index];
    const newRisks = [...form.risks];
    newRisks[realIndex] = { ...newRisks[realIndex], [field]: value };
    setForm(prev => ({ ...prev, risks: newRisks }));
  };

  const removeCustomRisk = (index) => {
    const customIndexes = form.risks.reduce((acc, r, i) => { if (r._custom) acc.push(i); return acc; }, []);
    const realIndex = customIndexes[index];
    setForm(prev => ({ ...prev, risks: prev.risks.filter((_, i) => i !== realIndex) }));
  };

  const updateExam = (index, field, value) => {
    const newExams = [...form.required_exams];
    newExams[index] = { ...newExams[index], [field]: value };
    setForm(prev => ({ ...prev, required_exams: newExams }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Rimuovi il flag _custom prima di salvare
    const cleanRisks = form.risks.map(({ _custom, ...rest }) => rest);
    const data = {
      ...form,
      risks: cleanRisks,
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
          {/* Info base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Nome mansione *</Label>
              <Input value={form.name} onChange={e => handleChange('name', e.target.value)} required />
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

          {/* Rischi predefiniti */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Rischi</Label>
            <div className="border rounded-lg p-3 max-h-52 overflow-y-auto bg-muted/20 grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
              {PREDEFINED_RISKS.map(name => (
                <label key={name} className="flex items-center gap-2 cursor-pointer hover:text-foreground text-sm text-foreground/80">
                  <input
                    type="checkbox"
                    checked={isPredefinedSelected(name)}
                    onChange={() => togglePredefined(name)}
                    className="h-4 w-4 accent-primary rounded"
                  />
                  {name}
                </label>
              ))}
            </div>

            {/* Dettagli per i rischi predefiniti selezionati */}
            {form.risks.filter(r => !r._custom).length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Dettagli rischi selezionati</p>
                {form.risks.filter(r => !r._custom).map((risk, i) => {
                  const realIndex = form.risks.indexOf(risk);
                  return (
                    <div key={i} className="grid grid-cols-3 gap-2 p-2 border rounded-lg bg-muted/10">
                      <span className="text-sm font-medium col-span-3 text-foreground">{risk.risk_name}</span>
                      <Select value={risk.risk_category} onValueChange={v => {
                        const newRisks = [...form.risks];
                        newRisks[realIndex] = { ...newRisks[realIndex], risk_category: v };
                        setForm(prev => ({ ...prev, risks: newRisks }));
                      }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chimico">Chimico</SelectItem>
                          <SelectItem value="fisico">Fisico</SelectItem>
                          <SelectItem value="biologico">Biologico</SelectItem>
                          <SelectItem value="ergonomico">Ergonomico</SelectItem>
                          <SelectItem value="psicosociale">Psicosociale</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={risk.risk_level} onValueChange={v => {
                        const newRisks = [...form.risks];
                        newRisks[realIndex] = { ...newRisks[realIndex], risk_level: v };
                        setForm(prev => ({ ...prev, risks: newRisks }));
                      }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Livello" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basso">Basso</SelectItem>
                          <SelectItem value="medio">Medio</SelectItem>
                          <SelectItem value="alto">Alto</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Descrizione"
                        value={risk.description}
                        onChange={e => {
                          const newRisks = [...form.risks];
                          newRisks[realIndex] = { ...newRisks[realIndex], description: e.target.value };
                          setForm(prev => ({ ...prev, risks: newRisks }));
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rischi personalizzati */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Rischi aggiuntivi</p>
                <Button type="button" variant="outline" size="sm" onClick={addCustomRisk}>
                  <Plus className="h-3 w-3 mr-1" /> Aggiungi
                </Button>
              </div>
              {customRisks.map((risk, i) => (
                <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2 p-3 border rounded-lg bg-muted/30">
                  <Input placeholder="Nome rischio" value={risk.risk_name} onChange={e => updateCustomRisk(i, 'risk_name', e.target.value)} className="text-sm" />
                  <Select value={risk.risk_category} onValueChange={v => updateCustomRisk(i, 'risk_category', v)}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Categoria" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chimico">Chimico</SelectItem>
                      <SelectItem value="fisico">Fisico</SelectItem>
                      <SelectItem value="biologico">Biologico</SelectItem>
                      <SelectItem value="ergonomico">Ergonomico</SelectItem>
                      <SelectItem value="psicosociale">Psicosociale</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={risk.risk_level} onValueChange={v => updateCustomRisk(i, 'risk_level', v)}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Livello" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basso">Basso</SelectItem>
                      <SelectItem value="medio">Medio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    <Input placeholder="Descrizione" value={risk.description} onChange={e => updateCustomRisk(i, 'description', e.target.value)} className="flex-1 text-sm" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomRisk(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accertamenti previsti */}
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