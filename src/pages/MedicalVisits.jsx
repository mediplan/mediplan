import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, FileHeart, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import VisitFormDialog from '@/components/visits/VisitFormDialog';
import PreventiveVisitFormDialog from '@/components/visits/PreventiveVisitFormDialog';

const visitTypeLabels = {
  preventiva: 'Preventiva',
  periodica: 'Periodica',
  su_richiesta: 'Su richiesta',
  cambio_mansione: 'Cambio mansione',
  rientro_malattia: 'Rientro malattia',
  cessazione: 'Cessazione',
};

export default function MedicalVisits() {
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [preventiveOpen, setPreventiveOpen] = useState(false);
  const [editVisit, setEditVisit] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.MedicalVisit.list('-visit_date'),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MedicalVisit.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['visits'] }); setFormOpen(false); setPreventiveOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MedicalVisit.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['visits'] }); setFormOpen(false); setPreventiveOpen(false); setEditVisit(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MedicalVisit.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['visits'] }); setDeleteId(null); },
  });

  const handleSave = (data) => {
    if (editVisit) {
      updateMutation.mutate({ id: editVisit.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = visits.filter(v => {
    const matchSearch = v.patient_name?.toLowerCase().includes(search.toLowerCase());
    const matchCompany = companyFilter === 'all' || String(v.company_id) === companyFilter;
    return matchSearch && matchCompany;
  });

  return (
    <div>
      <PageHeader
        title="Visite Mediche"
        description="Cartelle sanitarie e visite periodiche"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditVisit(null); setPreventiveOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Visita Preventiva
            </Button>
            <Button onClick={() => { setEditVisit(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Altra Visita
            </Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cerca per paziente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
          icon={FileHeart}
          title="Nessuna visita"
          description="Registra la prima visita medica"
          actionLabel="Nuova Visita"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paziente</TableHead>
                  <TableHead className="hidden sm:table-cell">Azienda</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead>Giudizio</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.patient_name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{v.company_name}</TableCell>
                    <TableCell className="text-muted-foreground">{v.visit_date ? format(new Date(v.visit_date), 'dd/MM/yyyy') : ''}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{visitTypeLabels[v.visit_type] || v.visit_type}</TableCell>
                    <TableCell><StatusBadge status={v.judgment} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditVisit(v); v.visit_type === 'preventiva' ? setPreventiveOpen(true) : setFormOpen(true); }}>
                            <Pencil className="h-4 w-4 mr-2" /> Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(v.id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <VisitFormDialog open={formOpen} onOpenChange={setFormOpen} visit={editVisit} onSave={handleSave} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>Sei sicuro di voler eliminare questa visita?</AlertDialogDescription>
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