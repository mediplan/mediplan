import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import ExamCatalogCombobox from '@/components/shared/ExamCatalogCombobox';

const RISCHI_ALLEGATO3B = [
  { key: 'mmc', label: 'Movimentazione Manuale dei Carichi' },
  { key: 'sovraccarico', label: 'Sovraccarico Biomeccanico Arti Superiori' },
  { key: 'chimici', label: 'Agenti Chimici' },
  { key: 'cancerogeni', label: 'Agenti Cancerogeni e Mutageni' },
  { key: 'amianto', label: 'Amianto' },
  { key: 'silice', label: 'Silice Libera Cristallina' },
  { key: 'biologici', label: 'Agenti Biologici' },
  { key: 'vdt', label: 'Videoterminali (VDT)' },
  { key: 'vibrazioni_corpo', label: 'Vibrazioni Corpo Intero' },
  { key: 'vibrazioni_mano', label: 'Vibrazioni Mano Braccio' },
  { key: 'rumore', label: 'Rumore' },
  { key: 'campi_em', label: 'Campi Elettromagnetici' },
  { key: 'radiaz_ottiche', label: 'Radiazioni Ottiche Artificiali' },
  { key: 'radiaz_uv', label: 'Radiazioni Ultraviolette Naturali' },
  { key: 'microclima', label: 'Microclima' },
  { key: 'infrasuoni', label: 'Infrasuoni' },
  { key: 'ultrasuoni', label: 'Ultrasuoni' },
  { key: 'polvere', label: 'Polvere' },
  { key: 'lavoro_notturno', label: 'Lavoro Notturno >80gg/anno' },
  { key: 'altri_rischi', label: 'Altri Rischi Evidenziati da V.R.' },
  { key: 'lavori_altezza', label: 'Lavori in Altezza' },
  { key: 'stress', label: 'Stress Lavoro Correlato' },
  { key: 'posture', label: 'Posture Incongrue' },
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
  risks: [], risks_allegato3b: [], required_exams: [], surveillance_frequency_months: 12,
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

          {/* Rischi */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Rischi</Label>

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

          {/* Rischi Allegato 3B */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Rischi espositivi (Allegato 3B)</Label>
            <p className="text-xs text-muted-foreground mb-2">Seleziona i rischi lavorativi dell'elenco ufficiale INAIL. Serviranno per il calcolo automatico dell'Allegato 3B.</p>
            <div className="border rounded-lg p-3 bg-muted/20 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-1 gap-1">
                {RISCHI_ALLEGATO3B.map(r => {
                  const checked = (form.risks_allegato3b || []).includes(r.key);
                  return (
                    <label key={r.key} className="flex items-center gap-2 cursor-pointer hover:bg-muted/40 rounded px-2 py-1 transition-colors">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => {
                          const curr = form.risks_allegato3b || [];
                          setForm(prev => ({
                            ...prev,
                            risks_allegato3b: e.target.checked
                              ? [...curr, r.key]
                              : curr.filter(k => k !== r.key)
                          }));
                        }}
                        className="h-3.5 w-3.5 accent-primary"
                      />
                      <span className="text-xs">{r.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            {(form.risks_allegato3b?.length > 0) && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.risks_allegato3b.map(key => {
                  const r = RISCHI_ALLEGATO3B.find(x => x.key === key);
                  return r ? (
                    <Badge key={key} variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">{r.label}</Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Accertamenti previsti */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Accertamenti previsti</Label>
            <div className="mt-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Aggiungi gli accertamenti sanitari previsti per questa mansione</p>
                <Button type="button" variant="outline" size="sm" onClick={() => setForm(prev => ({ ...prev, required_exams: [...prev.required_exams, { ...emptyExam }] }))}>
                  <Plus className="h-3 w-3 mr-1" /> Aggiungi
                </Button>
              </div>
              {form.required_exams.map((exam, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <ExamCatalogCombobox value={exam.exam_name} onChange={v => updateExam(i, 'exam_name', v)} placeholder="Nome esame" />
                  <Select
                    value={String(exam.frequency_months)}
                    onValueChange={v => updateExam(i, 'frequency_months', Number(v))}
                  >
                    <SelectTrigger className="w-40 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setForm(prev => ({ ...prev, required_exams: prev.required_exams.filter((_, idx) => idx !== i) }))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
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