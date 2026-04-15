import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JobRoleFormDialog from '@/components/jobroles/JobRoleFormDialog';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, CheckSquare, Square, Copy, Search } from 'lucide-react';

export default function CompanyJobRolesDialog({ open, onOpenChange, company }) {
  const companyId = String(company.id);
  const queryClient = useQueryClient();
  const [newRoleOpen, setNewRoleOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [catalogSearch, setCatalogSearch] = useState('');

  const { data: allRoles = [] } = useQuery({
    queryKey: ['jobRoles'],
    queryFn: () => base44.entities.JobRole.list('name'),
  });

  // Mansioni del catalogo globale (senza company_id)
  const globalRoles = useMemo(() => allRoles.filter(r => !r.company_id), [allRoles]);

  // Mansioni già associate a questa azienda
  const companyRoles = useMemo(() => allRoles.filter(r => r.company_id === companyId), [allRoles, companyId]);

  // IDs delle mansioni globali già aggiunte (tramite based_on_role_id)
  const linkedGlobalIds = useMemo(() => new Set(companyRoles.map(r => r.based_on_role_id).filter(Boolean)), [companyRoles]);

  const filteredGlobalRoles = useMemo(() => {
    if (!catalogSearch.trim()) return globalRoles;
    return globalRoles.filter(r => r.name.toLowerCase().includes(catalogSearch.toLowerCase()));
  }, [globalRoles, catalogSearch]);

  const createMutation = useMutation({
    mutationFn: data => base44.entities.JobRole.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobRoles'] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.JobRole.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobRoles'] }); setEditRole(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.JobRole.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobRoles'] }),
  });

  // Aggiungi mansione globale (copia nella company)
  const handleAddGlobal = (role) => {
    createMutation.mutate({
      name: role.name,
      description: role.description,
      company_id: companyId,
      company_name: company.name,
      based_on_role_id: role.id,
      risks: role.risks || [],
      required_exams: role.required_exams || [],
      surveillance_frequency_months: role.surveillance_frequency_months || 12,
      ppe_required: role.ppe_required || '',
      notes: role.notes || '',
    });
  };

  // Rimuovi mansione dalla company
  const handleRemoveCompanyRole = (role) => {
    deleteMutation.mutate(role.id);
  };

  const handleSaveNew = (data) => {
    createMutation.mutate({
      ...data,
      company_id: companyId,
      company_name: company.name,
    });
    setNewRoleOpen(false);
  };

  const handleSaveEdit = (data) => {
    updateMutation.mutate({ id: editRole.id, data });
    setEditRole(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mansioni — {company.name}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="azienda">
            <TabsList className="mb-4">
              <TabsTrigger value="azienda">Mansioni azienda ({companyRoles.length})</TabsTrigger>
              <TabsTrigger value="catalogo">Aggiungi dal catalogo ({globalRoles.length})</TabsTrigger>
            </TabsList>

            {/* ── Tab mansioni azienda ── */}
            <TabsContent value="azienda">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm text-muted-foreground">Mansioni attive per questa azienda, personalizzabili singolarmente.</p>
                <Button size="sm" className="gap-1.5" onClick={() => setNewRoleOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Nuova
                </Button>
              </div>
              {companyRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nessuna mansione definita. Aggiungila dal catalogo o creane una nuova.</p>
              ) : (
                <div className="space-y-2">
                  {companyRoles.map(role => (
                    <div key={role.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{role.name}</span>
                          {role.based_on_role_id && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">Da catalogo</Badge>
                          )}
                          {role.surveillance_frequency_months && (
                            <Badge variant="secondary" className="text-[10px]">
                              {role.surveillance_frequency_months === 6 ? 'Semestrale' :
                               role.surveillance_frequency_months === 12 ? 'Annuale' :
                               role.surveillance_frequency_months === 24 ? 'Biennale' :
                               `${role.surveillance_frequency_months} mesi`}
                            </Badge>
                          )}
                        </div>
                        {role.description && <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>}
                        {role.risks?.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">{role.risks.length} rischi · {role.required_exams?.length || 0} accertamenti</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditRole(role)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleRemoveCompanyRole(role)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Tab catalogo globale ── */}
            <TabsContent value="catalogo">
              <p className="text-sm text-muted-foreground mb-3">
                Seleziona le mansioni dal catalogo standard. Verranno copiate nell'azienda e potrai personalizzarle.
              </p>
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cerca mansione..."
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
              {globalRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nessuna mansione nel catalogo. Aggiungile dalle Impostazioni → Mansionario.</p>
              ) : (
                <div className="space-y-2">
                  {filteredGlobalRoles.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">Nessuna mansione trovata.</p>
                  )}
                  {filteredGlobalRoles.map(role => {
                    const isLinked = linkedGlobalIds.has(role.id);
                    return (
                      <div key={role.id} className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${isLinked ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/30'}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium text-sm ${isLinked ? 'text-primary' : ''}`}>{role.name}</span>
                            {role.risks?.length > 0 && <Badge variant="outline" className="text-[10px]">{role.risks.length} rischi</Badge>}
                            {role.required_exams?.length > 0 && <Badge variant="outline" className="text-[10px]">{role.required_exams.length} accert.</Badge>}
                          </div>
                          {role.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{role.description}</p>}
                        </div>
                        <Button
                          size="sm"
                          variant={isLinked ? 'secondary' : 'outline'}
                          className="shrink-0 h-7 text-xs gap-1.5"
                          disabled={isLinked || createMutation.isPending}
                          onClick={() => !isLinked && handleAddGlobal(role)}
                        >
                          {isLinked ? (
                            <><CheckSquare className="h-3.5 w-3.5 text-primary" /> Aggiunta</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5" /> Aggiungi</>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog nuova mansione custom */}
      <JobRoleFormDialog
        open={newRoleOpen}
        onOpenChange={setNewRoleOpen}
        jobRole={null}
        onSave={handleSaveNew}
      />

      {/* Dialog modifica mansione azienda */}
      <JobRoleFormDialog
        open={!!editRole}
        onOpenChange={(v) => { if (!v) setEditRole(null); }}
        jobRole={editRole}
        onSave={handleSaveEdit}
      />
    </>
  );
}