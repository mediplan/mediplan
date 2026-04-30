import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Paperclip, Briefcase, Plus, X } from 'lucide-react';
import ExamCatalogCombobox from '@/components/shared/ExamCatalogCombobox';
import { cn } from '@/lib/utils';
import PdfExamUpload from '@/components/visits/PdfExamUpload';
import DianaIntegration from '@/components/visits/DianaIntegration';
import VisitAttachments from '@/components/visits/VisitAttachments';
import { canAccess } from '@/lib/roles';

// Accertamenti standard disponibili nel sistema
export const ACCERTAMENTI = [
  { key: 'audiometry_result', label: 'Audiometria', type: 'textarea', pdfKey: 'audiometro', pdfColor: 'text-chart-3', pdfBorder: 'border-chart-3/20', pdfBg: 'bg-chart-3/5' },
  { key: 'spirometry_result', label: 'Spirometria', type: 'textarea', pdfKey: 'spirometro', pdfColor: 'text-chart-2', pdfBorder: 'border-chart-2/20', pdfBg: 'bg-chart-2/5' },
  { key: 'ecg_result', label: 'ECG', type: 'textarea', pdfKey: 'ecg', pdfColor: 'text-destructive', pdfBorder: 'border-destructive/20', pdfBg: 'bg-destructive/5' },
  { key: 'visiotest_result', label: 'Visiotest', type: 'textarea' },
  { key: 'upper_limbs_eval_result', label: 'Valutazione Arti Superiori', type: 'textarea' },
  { key: 'drug_test_result', label: 'Drug Test', type: 'textarea' },
  { key: 'alcohol_test_result', label: 'Alcol Test', type: 'textarea' },
  { key: 'audit_c_result', label: 'Questionario AUDIT-C', type: 'textarea' },
  { key: 'blood_tests_result', label: 'Esami ematochimici', type: 'textarea', placeholder: 'Emocromo, glicemia, creatinina, AST, ALT, GGT...' },
  { key: 'other_exams', label: 'Esami strumentali aggiuntivi', type: 'textarea' },
  { key: 'specialist_visits_result', label: 'Visite specialistiche aggiuntive', type: 'textarea' },
];

function ExamRow({ exam, form, onChange, extraContent, onAttachment, attachmentsForExam = [], highlighted = false }) {
  const doneKey = `${exam.key}_done`;
  const dateKey = `${exam.key}_date`;
  const outcomeKey = `${exam.key}_outcome`;
  const isDone = !!form[doneKey];
  const outcome = form[outcomeKey] || '';

  return (
    <Card className={cn(
      'transition-all',
      highlighted && !isDone && 'border-primary/40 bg-primary/5 ring-1 ring-primary/20',
      isDone && outcome === 'normale' && 'border-accent/40 bg-accent/5',
      isDone && outcome === 'irregolare' && 'border-destructive/40 bg-destructive/5',
      isDone && !outcome && 'border-accent/40 bg-accent/5',
    )}>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={doneKey}
              checked={isDone}
              onChange={e => onChange(doneKey, e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-teal-500"
            />
            <label htmlFor={doneKey} className={cn(
              'text-sm font-semibold cursor-pointer',
              isDone && outcome === 'irregolare' ? 'text-destructive' : isDone && 'text-accent'
            )}>
              {exam.label}
            </label>
            {highlighted && !isDone && (
              <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border border-primary/30 gap-1">
                <Briefcase className="h-2.5 w-2.5" /> previsto
              </Badge>
            )}
            {isDone && outcome === 'normale' && <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />}
            {isDone && outcome === 'irregolare' && <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">IRREGOLARE</span>}
          </div>
          {isDone && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onChange(outcomeKey, 'normale')}
                  className={cn(
                    'px-2.5 py-1 rounded-l-md text-xs border font-medium transition-colors',
                    outcome === 'normale'
                      ? 'bg-accent text-white border-accent'
                      : 'bg-background text-muted-foreground border-input hover:bg-muted'
                  )}
                >
                  Nella norma
                </button>
                <button
                  type="button"
                  onClick={() => onChange(outcomeKey, 'irregolare')}
                  className={cn(
                    'px-2.5 py-1 rounded-r-md text-xs border-t border-b border-r font-medium transition-colors',
                    outcome === 'irregolare'
                      ? 'bg-destructive text-white border-destructive'
                      : 'bg-background text-muted-foreground border-input hover:bg-muted'
                  )}
                >
                  Irregolare
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Data:</Label>
                <Input
                  type="date"
                  value={form[dateKey] || ''}
                  onChange={e => onChange(dateKey, e.target.value)}
                  className="h-7 text-xs w-36"
                />
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      {isDone && (
        <CardContent className="px-4 pb-3 space-y-2">
          {extraContent}
          {exam.pdfKey && (
            <PdfExamUpload
              label={exam.label}
              settingsKey={exam.pdfKey}
              examDate={form[`${exam.key}_date`] || ''}
              color={exam.pdfColor}
              borderColor={exam.pdfBorder}
              bgColor={exam.pdfBg}
              onResult={text => onChange(exam.key, form[exam.key] ? form[exam.key] + '\n' + text : text)}
              onAttachment={onAttachment}
              attachments={attachmentsForExam}
            />
          )}
          {exam.type === 'input' ? (
            <Input
              value={form[exam.key] || ''}
              onChange={e => onChange(exam.key, e.target.value)}
              placeholder={exam.placeholder || ''}
            />
          ) : (
            <Textarea
              value={form[exam.key] || ''}
              onChange={e => onChange(exam.key, e.target.value)}
              rows={2}
              placeholder={exam.placeholder || ''}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function AccertamentiTab({ form, onChange, onAttachment, patient, jobRoles, user }) {
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState('');

  // Ricava gli accertamenti previsti dalle mansioni del lavoratore
  const requiredExamNames = useMemo(() => {
    if (!patient || !jobRoles?.length) return [];
    const roleIds = [patient.job_role_id, patient.job_role_secondary1_id, patient.job_role_secondary2_id].filter(Boolean);
    const names = new Set();
    for (const rid of roleIds) {
      const role = jobRoles.find(r => String(r.id) === String(rid));
      if (role?.required_exams?.length) {
        role.required_exams.forEach(e => names.add(e.exam_name?.toLowerCase().trim()));
      }
    }
    return [...names];
  }, [patient, jobRoles]);

  // Mappa label accertamento → match con quelli della mansione
  const isRequiredByRole = (label) => {
    if (!requiredExamNames.length) return false;
    const l = label.toLowerCase().trim();
    return requiredExamNames.some(n => n && (n.includes(l) || l.includes(n)));
  };

  // Accertamenti custom aggiuntivi salvati nel form
  const customExams = useMemo(() => {
    return Array.isArray(form.custom_exams) ? form.custom_exams : [];
  }, [form.custom_exams]);

  const addCustomExam = () => {
    if (!customLabel.trim()) return;
    const updated = [...customExams, { label: customLabel.trim(), result: '', done: false, date: '', outcome: '' }];
    onChange('custom_exams', updated);
    setCustomLabel('');
    setShowAddCustom(false);
  };

  const removeCustomExam = (idx) => {
    const updated = customExams.filter((_, i) => i !== idx);
    onChange('custom_exams', updated);
  };

  const updateCustomExam = (idx, field, value) => {
    const updated = customExams.map((e, i) => i === idx ? { ...e, [field]: value } : e);
    onChange('custom_exams', updated);
  };

  const getAttachmentsForExam = (examLabel) => {
    const all = Array.isArray(form.attachments) ? form.attachments : [];
    return all.filter(a => {
      const lbl = typeof a === 'object' ? (a.label || '') : '';
      return lbl.startsWith(examLabel);
    });
  };

  const doneCount = ACCERTAMENTI.filter(a => form[`${a.key}_done`]).length
    + customExams.filter(e => e.done).length;
  const totalCount = ACCERTAMENTI.length + customExams.length;

  // Ordina: prima quelli previsti dalla mansione, poi gli altri
  const sortedAccertamenti = useMemo(() => {
    const required = ACCERTAMENTI.filter(a => isRequiredByRole(a.label));
    const others = ACCERTAMENTI.filter(a => !isRequiredByRole(a.label));
    return { required, others };
  }, [requiredExamNames]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Spunta gli accertamenti eseguiti. Solo quelli spuntati verranno conteggiati.
        </p>
        <Badge variant="outline" className="gap-1">
          <CheckCircle2 className="h-3 w-3 text-accent" />
          {doneCount} / {totalCount} eseguiti
        </Badge>
      </div>

      {/* Previsti dalla mansione */}
      {sortedAccertamenti.required.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 py-1">
            <Briefcase className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Previsti dalla mansione</span>
            <Badge className="text-[10px] px-1.5 bg-primary/10 text-primary border border-primary/30">{sortedAccertamenti.required.length}</Badge>
          </div>
          {sortedAccertamenti.required.map(exam => (
            <ExamRow
              key={exam.key}
              exam={exam}
              form={form}
              onChange={onChange}
              onAttachment={onAttachment}
              attachmentsForExam={getAttachmentsForExam(exam.label)}
              highlighted={true}
              extraContent={exam.key === 'drug_test_result' ? (
                <DianaIntegration
                  patient={patient}
                  onResult={text => onChange('drug_test_result', form.drug_test_result ? form.drug_test_result + '\n' + text : text)}
                />
              ) : undefined}
            />
          ))}
        </div>
      )}

      {/* Altri accertamenti */}
      <div className="space-y-2">
        {sortedAccertamenti.required.length > 0 && (
          <div className="flex items-center gap-2 py-1 border-t border-border pt-3 mt-2">
            <span className="text-sm font-semibold text-muted-foreground">Altri accertamenti</span>
          </div>
        )}
        {sortedAccertamenti.others.map(exam => (
          <ExamRow
            key={exam.key}
            exam={exam}
            form={form}
            onChange={onChange}
            onAttachment={onAttachment}
            attachmentsForExam={getAttachmentsForExam(exam.label)}
            highlighted={false}
            extraContent={exam.key === 'drug_test_result' ? (
              <DianaIntegration
                patient={patient}
                onResult={text => onChange('drug_test_result', form.drug_test_result ? form.drug_test_result + '\n' + text : text)}
              />
            ) : undefined}
          />
        ))}
      </div>

      {/* Accertamenti custom aggiuntivi */}
      {customExams.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 py-1 border-t border-border pt-3 mt-2">
            <span className="text-sm font-semibold text-muted-foreground">Accertamenti aggiuntivi</span>
          </div>
          {customExams.map((exam, idx) => (
            <Card key={idx} className={cn(
              'transition-all',
              exam.done && exam.outcome === 'normale' && 'border-accent/40 bg-accent/5',
              exam.done && exam.outcome === 'irregolare' && 'border-destructive/40 bg-destructive/5',
              exam.done && !exam.outcome && 'border-accent/40 bg-accent/5',
            )}>
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`custom_${idx}_done`}
                      checked={!!exam.done}
                      onChange={e => updateCustomExam(idx, 'done', e.target.checked)}
                      className="h-4 w-4 cursor-pointer accent-teal-500"
                    />
                    <label htmlFor={`custom_${idx}_done`} className={cn(
                      'text-sm font-semibold cursor-pointer',
                      exam.done && exam.outcome === 'irregolare' ? 'text-destructive' : exam.done && 'text-accent'
                    )}>
                      {exam.label}
                    </label>
                    {exam.done && exam.outcome === 'normale' && <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />}
                    {exam.done && exam.outcome === 'irregolare' && <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">IRREGOLARE</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {exam.done && (
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => updateCustomExam(idx, 'outcome', 'normale')}
                            className={cn('px-2.5 py-1 rounded-l-md text-xs border font-medium transition-colors',
                              exam.outcome === 'normale' ? 'bg-accent text-white border-accent' : 'bg-background text-muted-foreground border-input hover:bg-muted'
                            )}>Nella norma</button>
                          <button type="button" onClick={() => updateCustomExam(idx, 'outcome', 'irregolare')}
                            className={cn('px-2.5 py-1 rounded-r-md text-xs border-t border-b border-r font-medium transition-colors',
                              exam.outcome === 'irregolare' ? 'bg-destructive text-white border-destructive' : 'bg-background text-muted-foreground border-input hover:bg-muted'
                            )}>Irregolare</button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Data:</Label>
                          <Input type="date" value={exam.date || ''} onChange={e => updateCustomExam(idx, 'date', e.target.value)} className="h-7 text-xs w-36" />
                        </div>
                      </div>
                    )}
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeCustomExam(idx)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {exam.done && (
                <CardContent className="px-4 pb-3">
                  <Textarea
                    value={exam.result || ''}
                    onChange={e => updateCustomExam(idx, 'result', e.target.value)}
                    rows={2}
                    placeholder="Note / risultato..."
                  />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Aggiungi accertamento custom */}
      {showAddCustom ? (
        <div className="flex items-center gap-2 p-3 border border-dashed border-primary/40 rounded-lg bg-primary/5">
          <ExamCatalogCombobox
            value={customLabel}
            onChange={setCustomLabel}
            placeholder="Nome accertamento..."
            className="h-8 text-sm"
          />
          <Button type="button" size="sm" onClick={addCustomExam} disabled={!customLabel.trim()}>Aggiungi</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => { setShowAddCustom(false); setCustomLabel(''); }}>Annulla</Button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" className="gap-2 border-dashed" onClick={() => setShowAddCustom(true)}>
          <Plus className="h-3.5 w-3.5" /> Aggiungi accertamento
        </Button>
      )}

      {/* Archivio allegati */}
      {canAccess(user, 'allegati_accertamenti') && Array.isArray(form.attachments) && form.attachments.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Archivio allegati ({form.attachments.length})</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <VisitAttachments attachments={form.attachments} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}