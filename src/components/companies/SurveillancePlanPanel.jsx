import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ShieldCheck, Sparkles, CheckCircle2, Clock, Pencil, Plus, Trash2,
  ChevronDown, ChevronUp, Loader2, History, Save, ThumbsUp, Search
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const STATUS_LABELS = { bozza_ai: 'Bozza AI', in_revisione: 'In revisione', approvato: 'Approvato' };
const STATUS_COLORS = {
  bozza_ai: 'bg-amber-100 text-amber-800',
  in_revisione: 'bg-blue-100 text-blue-800',
  approvato: 'bg-green-100 text-green-800',
};

function RoleCard({ role, onChange, onDelete, editable, jobRoles = [] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = search.length > 0
    ? jobRoles.filter(j => j.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : jobRoles.slice(0, 8);

  const selectJobRole = (jr) => {
    onChange({
      ...role,
      role_name: jr.name,
      risks: jr.risks?.map(r => r.risk_name).join(', ') || role.risks || '',
      exams: jr.required_exams?.length > 0
        ? jr.required_exams.map(e => ({ exam_name: e.exam_name, frequency_months: e.frequency_months || 12 }))
        : role.exams,
      frequency_months: jr.surveillance_frequency_months || role.frequency_months || 12,
      notes: jr.notes || role.notes || '',
    });
    setSearch('');
    setShowSuggestions(false);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 bg-muted/30 cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1">
          <span className="font-medium text-sm">{role.role_name || 'Mansione senza nome'}</span>
          {role.frequency_months && (
            <span className="ml-2 text-xs text-muted-foreground">Periodicità: {role.frequency_months} mesi</span>
          )}
        </div>
        {editable && (
          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive"
            onClick={e => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </div>
      {open && (
        <div className="p-3 space-y-3 text-sm border-t bg-white">
          {editable ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Label className="text-xs">Nome mansione</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      value={search || role.role_name || ''}
                      onChange={e => {
                        setSearch(e.target.value);
                        onChange({ ...role, role_name: e.target.value });
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      placeholder="Cerca o scrivi mansione..."
                      className="h-8 text-sm pl-7"
                    />
                  </div>
                  {showSuggestions && filtered.length > 0 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filtered.map(jr => (
                        <button
                          key={jr.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-xs hover:bg-muted border-b last:border-0"
                          onMouseDown={() => selectJobRole(jr)}
                        >
                          <span className="font-medium">{jr.name}</span>
                          {jr.risks?.length > 0 && (
                            <span className="text-muted-foreground ml-1">— {jr.risks.map(r => r.risk_name).join(', ')}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs">Periodicità visita (mesi)</Label>
                  <Input type="number" value={role.frequency_months || ''} onChange={e => onChange({ ...role, frequency_months: Number(e.target.value) })} className="h-8 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Rischi identificati</Label>
                <Textarea value={role.risks || ''} onChange={e => onChange({ ...role, risks: e.target.value })} rows={2} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs">Accertamenti sanitari</Label>
                {(role.exams || []).map((ex, idx) => (
                  <div key={idx} className="flex gap-2 mt-1">
                    <Input value={ex.exam_name || ''} placeholder="Nome esame"
                      onChange={e => { const exs = [...(role.exams || [])]; exs[idx] = { ...ex, exam_name: e.target.value }; onChange({ ...role, exams: exs }); }}
                      className="h-7 text-xs flex-1" />
                    <Input type="number" value={ex.frequency_months || ''} placeholder="Mesi"
                      onChange={e => { const exs = [...(role.exams || [])]; exs[idx] = { ...ex, frequency_months: Number(e.target.value) }; onChange({ ...role, exams: exs }); }}
                      className="h-7 text-xs w-20" />
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                      onClick={() => { const exs = (role.exams || []).filter((_, i) => i !== idx); onChange({ ...role, exams: exs }); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="mt-2 h-7 text-xs"
                  onClick={() => onChange({ ...role, exams: [...(role.exams || []), { exam_name: '', frequency_months: 12 }] })}>
                  <Plus className="h-3 w-3 mr-1" /> Aggiungi esame
                </Button>
              </div>
              <div>
                <Label className="text-xs">Note</Label>
                <Textarea value={role.notes || ''} onChange={e => onChange({ ...role, notes: e.target.value })} rows={1} className="text-sm" />
              </div>
            </>
          ) : (
            <>
              {role.risks && <p className="text-muted-foreground"><strong>Rischi:</strong> {role.risks}</p>}
              {role.exams?.length > 0 && (
                <div>
                  <strong>Accertamenti:</strong>
                  <ul className="mt-1 space-y-0.5">
                    {role.exams.map((ex, i) => (
                      <li key={i} className="text-muted-foreground">– {ex.exam_name}{ex.frequency_months ? ` (ogni ${ex.frequency_months} mesi)` : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
              {role.notes && <p className="text-muted-foreground"><strong>Note:</strong> {role.notes}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SurveillancePlanPanel({ company }) {
  const qc = useQueryClient();
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [editingPlan, setEditingPlan] = useState(null); // piano in editing
  const [historyOpen, setHistoryOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);

  const { data: plans = [] } = useQuery({
    queryKey: ['surveillance_plans', company?.id],
    queryFn: () => base44.entities.SurveillancePlan.filter({ company_id: company.id }, '-created_date'),
    enabled: !!company?.id,
  });

  const { data: docs = [] } = useQuery({
    queryKey: ['company_documents', company?.id],
    queryFn: () => base44.entities.CompanyDocument.filter({ company_id: company.id }, '-created_date'),
    enabled: !!company?.id,
  });

  const { data: jobRoles = [] } = useQuery({
    queryKey: ['jobRoles'],
    queryFn: () => base44.entities.JobRole.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SurveillancePlan.create(data),
    onSuccess: () => qc.invalidateQueries(['surveillance_plans', company.id]),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SurveillancePlan.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['surveillance_plans', company.id]); setEditingPlan(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SurveillancePlan.delete(id),
    onSuccess: () => qc.invalidateQueries(['surveillance_plans', company.id]),
  });

  const dvrs = docs.filter(d => d.doc_type === 'dvr' && d.file_url);
  const latestPlan = plans[0] || null;

  const handleAnalyzeDVR = async (doc) => {
    setAnalyzing(true);
    setAiError('');
    try {
      const res = await base44.functions.invoke('analyzeDVR', { file_url: doc.file_url, company_name: company.name });
      const plan = res.data.plan;
      const nextVersion = `v${plans.length + 1}-AI`;
      const created = await createMutation.mutateAsync({
        company_id: company.id,
        company_name: company.name,
        version_label: nextVersion,
        source_document_id: doc.id,
        source_document_title: doc.title,
        is_ai_generated: true,
        status: 'bozza_ai',
        roles: plan.roles || [],
        ai_summary: plan.summary || '',
      });
      // Apri la scheda di revisione/approvazione
      window.open(`/piano-sorveglianza?plan_id=${created.id}&company_id=${company.id}`, '_blank');
    } catch (e) {
      setAiError(e.message || 'Errore durante l\'analisi AI');
    }
    setAnalyzing(false);
  };

  const handleSaveEdit = () => {
    if (!editingPlan) return;
    updateMutation.mutate({ id: editingPlan.id, data: { roles: editingPlan.roles, notes: editingPlan.notes, status: 'in_revisione' } });
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    const user = await base44.auth.me();
    updateMutation.mutate({
      id: approveTarget.id,
      data: { status: 'approvato', approved_by: user.email, approved_at: new Date().toISOString().split('T')[0] }
    });
    setApproveDialogOpen(false);
    setApproveTarget(null);
  };

  const handleNewManualPlan = async () => {
    const nextVersion = `v${plans.length + 1}`;
    const created = await createMutation.mutateAsync({
      company_id: company.id,
      company_name: company.name,
      version_label: nextVersion,
      is_ai_generated: false,
      status: 'in_revisione',
      roles: [],
    });
    setEditingPlan({ ...created, roles: [] });
  };

  const displayPlan = editingPlan || latestPlan;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Protocollo Sanitario
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {plans.length > 1 && (
              <Button size="sm" variant="ghost" onClick={() => setHistoryOpen(true)}>
                <History className="h-4 w-4 mr-1" /> Storico ({plans.length})
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleNewManualPlan}>
              <Plus className="h-4 w-4 mr-1" /> Nuovo piano
            </Button>
            {dvrs.length > 0 && !analyzing && (
              <div className="relative group">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-700 hover:to-blue-600 text-white gap-1.5"
                  onClick={() => dvrs.length === 1 ? handleAnalyzeDVR(dvrs[0]) : null}
                >
                  <Sparkles className="h-4 w-4" />
                  AI Analizza DVR
                </Button>
                {dvrs.length > 1 && (
                  <div className="absolute top-full right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-48 hidden group-hover:block">
                    {dvrs.map(d => (
                      <button key={d.id} className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => handleAnalyzeDVR(d)}>
                        {d.title} {d.version && `(v${d.version})`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {analyzing && (
              <Button size="sm" disabled className="gap-1.5 bg-violet-100 text-violet-700">
                <Loader2 className="h-4 w-4 animate-spin" /> Analisi in corso...
              </Button>
            )}
          </div>
        </div>
        {aiError && <p className="text-sm text-destructive mt-2">{aiError}</p>}
        {dvrs.length === 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Carica un DVR nell'archivio documenti per abilitare l'analisi AI.
          </p>
        )}
      </CardHeader>

      <CardContent>
        {!displayPlan ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Nessun piano di sorveglianza. Crea un piano manuale o usa l'AI per analizzare il DVR.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header piano */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{displayPlan.version_label}</span>
                <Badge className={`text-xs px-1.5 py-0 ${STATUS_COLORS[displayPlan.status]}`}>
                  {STATUS_LABELS[displayPlan.status]}
                </Badge>
                {displayPlan.is_ai_generated && (
                  <Badge className="text-xs px-1.5 py-0 bg-violet-100 text-violet-800">
                    <Sparkles className="h-3 w-3 mr-0.5" /> AI
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {displayPlan.status !== 'approvato' && !editingPlan && (
                  <Button size="sm" variant="outline" onClick={() => setEditingPlan({ ...displayPlan })}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Modifica
                  </Button>
                )}
                {editingPlan && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setEditingPlan(null)}>Annulla</Button>
                    <Button size="sm" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                      Salva
                    </Button>
                  </>
                )}
                {displayPlan.status !== 'approvato' && !editingPlan && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => { setApproveTarget(displayPlan); setApproveDialogOpen(true); }}>
                    <ThumbsUp className="h-3.5 w-3.5 mr-1" /> Approva
                  </Button>
                )}
                {displayPlan.status === 'approvato' && (
                  <span className="text-xs text-green-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approvato {displayPlan.approved_at ? `il ${format(new Date(displayPlan.approved_at), 'dd/MM/yyyy')}` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Sommario AI */}
            {displayPlan.ai_summary && (
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-sm text-violet-800">
                <strong className="flex items-center gap-1 mb-1"><Sparkles className="h-3.5 w-3.5" /> Sommario AI:</strong>
                {displayPlan.ai_summary}
              </div>
            )}

            {displayPlan.source_document_title && (
              <p className="text-xs text-muted-foreground">Basato su: {displayPlan.source_document_title}</p>
            )}

            {/* Mansioni */}
            <div className="space-y-2">
              {(editingPlan ? editingPlan.roles : displayPlan.roles || []).map((role, idx) => (
                <RoleCard
                  key={idx}
                  role={role}
                  editable={!!editingPlan}
                  jobRoles={jobRoles}
                  onChange={(updated) => {
                    const roles = [...editingPlan.roles];
                    roles[idx] = updated;
                    setEditingPlan({ ...editingPlan, roles });
                  }}
                  onDelete={() => {
                    const roles = editingPlan.roles.filter((_, i) => i !== idx);
                    setEditingPlan({ ...editingPlan, roles });
                  }}
                />
              ))}
              {editingPlan && (
                <Button size="sm" variant="outline" className="w-full"
                  onClick={() => setEditingPlan({ ...editingPlan, roles: [...(editingPlan.roles || []), { role_name: '', risks: '', exams: [], frequency_months: 12, notes: '' }] })}>
                  <Plus className="h-4 w-4 mr-1" /> Aggiungi mansione
                </Button>
              )}
            </div>

            {/* Note medico */}
            {editingPlan ? (
              <div>
                <Label className="text-xs">Note del medico</Label>
                <Textarea value={editingPlan.notes || ''} onChange={e => setEditingPlan({ ...editingPlan, notes: e.target.value })} rows={2} className="text-sm" />
              </div>
            ) : displayPlan.notes ? (
              <p className="text-sm text-muted-foreground"><strong>Note:</strong> {displayPlan.notes}</p>
            ) : null}
          </div>
        )}
      </CardContent>

      {/* Storico versioni */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Storico piani di sorveglianza</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {plans.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{p.version_label}</span>
                    <Badge className={`text-xs px-1.5 py-0 ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</Badge>
                    {p.is_ai_generated && <Badge className="text-xs px-1.5 py-0 bg-violet-100 text-violet-800"><Sparkles className="h-3 w-3 mr-0.5" />AI</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(p.created_date), 'dd/MM/yyyy HH:mm', { locale: it })}
                    {p.source_document_title && ` • ${p.source_document_title}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs"
                    onClick={() => { setEditingPlan(null); qc.setQueryData(['surveillance_plans', company.id], old => [p, ...old.filter(x => x.id !== p.id)]); setHistoryOpen(false); }}>
                    Visualizza
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                    onClick={() => deleteMutation.mutate(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryOpen(false)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog approvazione */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Approva piano di sorveglianza</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Confermando, il piano <strong>{approveTarget?.version_label}</strong> verrà marcato come approvato e non sarà più modificabile.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>Annulla</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApprove}>
              <ThumbsUp className="h-4 w-4 mr-1" /> Approva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}