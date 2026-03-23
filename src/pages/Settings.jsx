import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import JobRoleFormDialog from '@/components/jobroles/JobRoleFormDialog';
import { Plus, Pencil, Trash2, FileText, Briefcase, Search, ShieldAlert, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Modulistica ─────────────────────────────────────────────────────────────

const categoryLabels = {
  standard: { label: 'Standard', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  stampa_multipla: { label: 'Stampa Multipla', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  comunicazione: { label: 'Comunicazione', className: 'bg-teal-50 text-teal-700 border-teal-200' },
};

const emptyModulo = { name: '', category: 'standard', description: '', active: true, notes: '' };

function ModuloDialog({ open, onOpenChange, modulo, onSave }) {
  const [form, setForm] = useState(emptyModulo);

  React.useEffect(() => {
    setForm(modulo ? { ...emptyModulo, ...modulo } : emptyModulo);
  }, [modulo, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{modulo ? 'Modifica Modello' : 'Nuovo Modello'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-3">
          <div>
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="stampa_multipla">Stampa Multipla</SelectItem>
                <SelectItem value="comunicazione">Comunicazione</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descrizione</Label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
          </div>
          <div>
            <Label>Note</Label>
            <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={!!form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="h-4 w-4 accent-primary" />
            <Label htmlFor="active" className="font-normal cursor-pointer">Modello attivo</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">{modulo ? 'Salva' : 'Crea'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ModulisticaTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const { data: moduli = [] } = useQuery({
    queryKey: ['modulistica'],
    queryFn: () => base44.entities.Modulistica.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.Modulistica.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['modulistica'] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Modulistica.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['modulistica'] }); setDialogOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.Modulistica.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modulistica'] }),
  });

  const handleSave = (form) => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const filtered = moduli.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || m.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <Input placeholder="Cerca modello..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le categorie</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="stampa_multipla">Stampa Multipla</SelectItem>
            <SelectItem value="comunicazione">Comunicazione</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="ml-auto gap-2">
          <Plus className="h-4 w-4" /> Nuovo modello
        </Button>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline">{moduli.length} modelli totali</Badge>
      </div>
      <div className="space-y-1.5">
        {filtered.map(m => (
          <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-muted/40 transition-colors">
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${!m.active ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{m.name}</span>
            </div>
            <Badge variant="outline" className={`text-xs ${categoryLabels[m.category]?.className}`}>
              {categoryLabels[m.category]?.label}
            </Badge>
            {!m.active && <Badge variant="outline" className="text-xs text-muted-foreground">Inattivo</Badge>}
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(m); setDialogOpen(true); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(m.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nessun modello trovato</p>}
      </div>
      <ModuloDialog open={dialogOpen} onOpenChange={setDialogOpen} modulo={editing} onSave={handleSave} />
    </div>
  );
}

// ─── Mansionario ─────────────────────────────────────────────────────────────

const riskLevelColors = {
  basso: 'bg-accent/10 text-accent border-accent/20',
  medio: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  alto: 'bg-destructive/10 text-destructive border-destructive/20',
};

function MansionarioTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: jobRoles = [], isLoading } = useQuery({
    queryKey: ['jobRoles'],
    queryFn: () => base44.entities.JobRole.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.JobRole.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobRoles'] }); setFormOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.JobRole.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobRoles'] }); setFormOpen(false); setEditRole(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.JobRole.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobRoles'] }); setDeleteId(null); },
  });

  const handleSave = (data) => {
    if (editRole) updateMutation.mutate({ id: editRole.id, data });
    else createMutation.mutate(data);
  };

  const filtered = jobRoles.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cerca mansione..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filtra per azienda" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le aziende</SelectItem>
            {companies.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => { setEditRole(null); setFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nuova Mansione
        </Button>
      </div>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={Briefcase} title="Nessuna mansione" description="Definisci le mansioni con i rischi specifici" actionLabel="Nuova Mansione" onAction={() => setFormOpen(true)} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(role => (
            <Card key={role.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{role.name}</h3>
                  <p className="text-xs text-muted-foreground">{role.company_name}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditRole(role); setFormOpen(true); }}>
                      <Pencil className="h-4 w-4 mr-2" /> Modifica
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(role.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Elimina
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {role.description && <p className="text-sm text-muted-foreground mb-3">{role.description}</p>}
              {role.risks?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> Rischi
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.risks.map((risk, i) => (
                      <Badge key={i} variant="outline" className={cn('text-[10px]', riskLevelColors[risk.risk_level] || '')}>
                        {risk.risk_name} ({risk.risk_level})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {role.required_exams?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Accertamenti</p>
                  <p className="text-xs text-muted-foreground">{role.required_exams.map(e => e.exam_name).join(', ')}</p>
                </div>
              )}
              {role.ppe_required && <div className="mt-2"><p className="text-xs text-muted-foreground">DPI: {role.ppe_required}</p></div>}
            </Card>
          ))}
        </div>
      )}

      <JobRoleFormDialog open={formOpen} onOpenChange={setFormOpen} jobRole={editRole} onSave={handleSave} />
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>Sei sicuro di voler eliminare questa mansione?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function Settings() {
  return (
    <div>
      <PageHeader title="Impostazioni" description="Configurazioni e dati di riferimento" />
      <Tabs defaultValue="modulistica">
        <TabsList className="mb-6">
          <TabsTrigger value="modulistica" className="gap-2">
            <FileText className="h-4 w-4" /> Modulistica
          </TabsTrigger>
          <TabsTrigger value="mansionario" className="gap-2">
            <Briefcase className="h-4 w-4" /> Mansionario
          </TabsTrigger>
        </TabsList>
        <TabsContent value="modulistica">
          <ModulisticaTab />
        </TabsContent>
        <TabsContent value="mansionario">
          <MansionarioTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}