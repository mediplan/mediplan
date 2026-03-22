import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Briefcase, MoreHorizontal, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import JobRoleFormDialog from '@/components/jobroles/JobRoleFormDialog';
import { cn } from '@/lib/utils';

const riskLevelColors = {
  basso: 'bg-accent/10 text-accent border-accent/20',
  medio: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  alto: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function JobRoles() {
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const { data: jobRoles = [], isLoading } = useQuery({
    queryKey: ['jobRoles'],
    queryFn: () => base44.entities.JobRole.list('-created_date'),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.JobRole.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobRoles'] }); setFormOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.JobRole.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobRoles'] }); setFormOpen(false); setEditRole(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.JobRole.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobRoles'] }); setDeleteId(null); },
  });

  const handleSave = (data) => {
    if (editRole) {
      updateMutation.mutate({ id: editRole.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = jobRoles.filter(r => {
    const matchSearch = r.name?.toLowerCase().includes(search.toLowerCase());
    const matchCompany = companyFilter === 'all' || String(r.company_id) === companyFilter;
    return matchSearch && matchCompany;
  });

  return (
    <div>
      <PageHeader
        title="Mansionario"
        description="Mansioni e rischi specifici per azienda"
        action={
          <Button onClick={() => { setEditRole(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nuova Mansione
          </Button>
        }
      />

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
      </div>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState
          icon={Briefcase}
          title="Nessuna mansione"
          description="Definisci le mansioni con i rischi specifici"
          actionLabel="Nuova Mansione"
          onAction={() => setFormOpen(true)}
        />
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
                  <p className="text-xs text-muted-foreground">
                    {role.required_exams.map(e => e.exam_name).join(', ')}
                  </p>
                </div>
              )}

              {role.ppe_required && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">DPI: {role.ppe_required}</p>
                </div>
              )}
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