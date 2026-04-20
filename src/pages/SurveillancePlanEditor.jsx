import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ShieldCheck, Sparkles, CheckCircle2, Pencil, Plus, Trash2,
  ChevronDown, ChevronUp, Save, ThumbsUp, ArrowLeft, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const STATUS_LABELS = { bozza_ai: 'Bozza AI', in_revisione: 'In revisione', approvato: 'Approvato' };
const STATUS_COLORS = {
  bozza_ai: 'bg-amber-100 text-amber-800',
  in_revisione: 'bg-blue-100 text-blue-800',
  approvato: 'bg-green-100 text-green-800',
};

function RoleCard({ role, onChange, onDelete, editable }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 bg-muted/30 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
      >
        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1">
          <span className="font-medium text-sm">{role.role_name || 'Mansione senza nome'}</span>
          {role.frequency_months > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">Periodicità visita: ogni {role.frequency_months} mesi</span>
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
        <div className="p-4 space-y-3 text-sm border-t bg-white">
          {editable ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nome mansione</Label>
                  <Input value={role.role_name || ''} onChange={e => onChange({ ...role, role_name: e.target.value })} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Periodicità visita (mesi)</Label>
                  <Input type="number" value={role.frequency_months || ''} onChange={e => onChange({ ...role, frequency_months: Number(e.target.value) })} className="h-8 text-sm mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Fattori di rischio attivi</Label>
                <Textarea value={role.risks || ''} onChange={e => onChange({ ...role, risks: e.target.value })} rows={2} className="text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Accertamenti sanitari</Label>
                <div className="space-y-1.5">
                  {(role.exams || []).map((ex, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input value={ex.exam_name || ''} placeholder="Nome esame"
                        onChange={e => { const exs = [...(role.exams || [])]; exs[idx] = { ...ex, exam_name: e.target.value }; onChange({ ...role, exams: exs }); }}
                        className="h-7 text-xs flex-1" />
                      <div className="flex items-center gap-1 shrink-0">
                        <Input type="number" value={ex.frequency_months || ''} placeholder="Mesi"
                          onChange={e => { const exs = [...(role.exams || [])]; exs[idx] = { ...ex, frequency_months: Number(e.target.value) }; onChange({ ...role, exams: exs }); }}
                          className="h-7 text-xs w-20" />
                        <span className="text-xs text-muted-foreground">mesi</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                          onClick={() => { const exs = (role.exams || []).filter((_, i) => i !== idx); onChange({ ...role, exams: exs }); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="mt-2 h-7 text-xs"
                  onClick={() => onChange({ ...role, exams: [...(role.exams || []), { exam_name: '', frequency_months: 24 }] })}>
                  <Plus className="h-3 w-3 mr-1" /> Aggiungi accertamento
                </Button>
              </div>
              <div>
                <Label className="text-xs">Note</Label>
                <Textarea value={role.notes || ''} onChange={e => onChange({ ...role, notes: e.target.value })} rows={1} className="text-sm mt-1" />
              </div>
            </>
          ) : (
            <>
              {role.risks && (
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fattori di rischio</span>
                  <p className="mt-0.5">{role.risks}</p>
                </div>
              )}
              {role.exams?.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Accertamenti</span>
                  <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {role.exams.map((ex, i) => (
                      <div key={i} className="flex items-center justify-between bg-muted/40 rounded px-2 py-1 text-xs">
                        <span>{ex.exam_name}</span>
                        {ex.frequency_months > 0
                          ? <Badge variant="outline" className="text-xs h-4 px-1">{ex.frequency_months} mesi</Badge>
                          : <Badge variant="outline" className="text-xs h-4 px-1">sec. protocollo</Badge>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {role.notes && (
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Note</span>
                  <p className="mt-0.5 text-muted-foreground">{role.notes}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SurveillancePlanEditor() {
  const params = new URLSearchParams(window.location.search);
  const planId = params.get('plan_id');
  const companyId = params.get('company_id');

  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [localPlan, setLocalPlan] = useState(null);
  const [approveOpen, setApproveOpen] = useState(false);

  const { data: plan, isLoading } = useQuery({
    queryKey: ['surveillance_plan', planId],
    queryFn: async () => {
      const all = await base44.entities.SurveillancePlan.filter({ company_id: companyId });
      return all.find(p => p.id === planId) || null;
    },
    enabled: !!planId && !!companyId,
  });

  useEffect(() => {
    if (plan && !localPlan) setLocalPlan(plan);
  }, [plan]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SurveillancePlan.update(id, data),
    onSuccess: (_, { data }) => {
      qc.invalidateQueries(['surveillance_plan', planId]);
      qc.invalidateQueries(['surveillance_plans', companyId]);
      setLocalPlan(prev => ({ ...prev, ...data }));
      setEditing(false);
      if (data.status === 'approvato') setApproveOpen(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: planId,
      data: { roles: localPlan.roles, notes: localPlan.notes, status: 'in_revisione' }
    });
  };

  const handleApprove = async () => {
    const user = await base44.auth.me();
    updateMutation.mutate({
      id: planId,
      data: { status: 'approvato', approved_by: user.email, approved_at: new Date().toISOString().split('T')[0] }
    });
  };

  const displayPlan = localPlan || plan;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!displayPlan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Piano non trovato.</p>
        <Button variant="outline" onClick={() => window.close()}>Chiudi scheda</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => window.close()}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Chiudi
            </Button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">{displayPlan.company_name}</span>
              <span className="text-muted-foreground text-sm">— Piano {displayPlan.version_label}</span>
              <Badge className={`text-xs px-1.5 py-0 ${STATUS_COLORS[displayPlan.status]}`}>
                {STATUS_LABELS[displayPlan.status]}
              </Badge>
              {displayPlan.is_ai_generated && (
                <Badge className="text-xs px-1.5 py-0 bg-violet-100 text-violet-800">
                  <Sparkles className="h-3 w-3 mr-0.5" /> AI
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {displayPlan.status !== 'approvato' && !editing && (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Modifica
              </Button>
            )}
            {editing && (
              <>
                <Button size="sm" variant="outline" onClick={() => { setEditing(false); setLocalPlan(plan); }}>
                  Annulla
                </Button>
                <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                  Salva modifiche
                </Button>
              </>
            )}
            {displayPlan.status !== 'approvato' && !editing && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setApproveOpen(true)}>
                <ThumbsUp className="h-3.5 w-3.5 mr-1" /> Approva piano
              </Button>
            )}
            {displayPlan.status === 'approvato' && (
              <span className="text-xs text-green-700 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Approvato {displayPlan.approved_at ? `il ${format(new Date(displayPlan.approved_at), 'dd/MM/yyyy')}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Sommario AI */}
        {displayPlan.ai_summary && (
          <Card className="border-violet-200 bg-violet-50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start gap-2 text-sm text-violet-800">
                <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <strong className="block mb-0.5">Analisi AI</strong>
                  {displayPlan.ai_summary}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {displayPlan.source_document_title && (
          <p className="text-xs text-muted-foreground">
            Basato su: <strong>{displayPlan.source_document_title}</strong>
            {displayPlan.created_date && ` • Generato il ${format(new Date(displayPlan.created_date), 'dd/MM/yyyy HH:mm', { locale: it })}`}
          </p>
        )}

        {/* Mansioni */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Mansioni ({(localPlan?.roles || displayPlan.roles || []).length})
              </CardTitle>
              {editing && (
                <Button size="sm" variant="outline" className="h-7 text-xs"
                  onClick={() => setLocalPlan(p => ({
                    ...p,
                    roles: [...(p.roles || []), { role_name: '', risks: '', exams: [], frequency_months: 24, notes: '' }]
                  }))}>
                  <Plus className="h-3 w-3 mr-1" /> Aggiungi mansione
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {(localPlan?.roles || displayPlan.roles || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nessuna mansione presente.</p>
            ) : (
              (localPlan?.roles || displayPlan.roles || []).map((role, idx) => (
                <RoleCard
                  key={idx}
                  role={role}
                  editable={editing}
                  onChange={(updated) => {
                    const roles = [...localPlan.roles];
                    roles[idx] = updated;
                    setLocalPlan(p => ({ ...p, roles }));
                  }}
                  onDelete={() => {
                    setLocalPlan(p => ({ ...p, roles: p.roles.filter((_, i) => i !== idx) }));
                  }}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Note medico */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Note del medico</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {editing ? (
              <Textarea
                value={localPlan?.notes || ''}
                onChange={e => setLocalPlan(p => ({ ...p, notes: e.target.value }))}
                rows={3}
                className="text-sm"
                placeholder="Annotazioni, prescrizioni particolari, deroghe..."
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {displayPlan.notes || 'Nessuna nota.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog approvazione */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Approva piano di sorveglianza</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Confermando, il piano <strong>{displayPlan.version_label}</strong> sarà marcato come approvato dal Medico Competente e non sarà più modificabile.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>Annulla</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApprove} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4 mr-1" />}
              Approva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}