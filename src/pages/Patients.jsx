import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Users, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import PatientFormDialog from '@/components/patients/PatientFormDialog';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';

export default function Patients() {
  const urlParams = new URLSearchParams(window.location.search);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState(urlParams.get('company') || 'all');
  const [formOpen, setFormOpen] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list('-created_date'),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Patient.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['patients'] }); setFormOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Patient.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['patients'] }); setFormOpen(false); setEditPatient(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Patient.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['patients'] }); setDeleteId(null); },
  });

  const handleSave = (data) => {
    if (editPatient) {
      updateMutation.mutate({ id: editPatient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = patients.filter(p => {
    const matchSearch = `${p.last_name} ${p.first_name} ${p.fiscal_code || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchCompany = companyFilter === 'all' || String(p.company_id) === companyFilter;
    return matchSearch && matchCompany;
  });

  return (
    <div>
      <PageHeader
        title="Lavoratori"
        description="Anagrafica dei lavoratori/pazienti"
        action={
          <Button onClick={() => { setEditPatient(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nuovo Lavoratore
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cerca lavoratore..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtra per azienda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le aziende</SelectItem>
            {companies.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState
          icon={Users}
          title="Nessun lavoratore"
          description="Aggiungi il primo lavoratore per iniziare"
          actionLabel="Nuovo Lavoratore"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cognome e Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Cod. Fiscale</TableHead>
                  <TableHead className="hidden sm:table-cell">Azienda</TableHead>
                  <TableHead className="hidden lg:table-cell">Mansione</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link to={`/pazienti/${p.id}`} className="font-medium text-foreground hover:text-primary">
                        {p.last_name} {p.first_name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground font-mono text-xs">{p.fiscal_code}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{p.company_name}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{p.job_role_name}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditPatient(p); setFormOpen(true); }}>
                            <Pencil className="h-4 w-4 mr-2" /> Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(p.id)}>
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

      <PatientFormDialog open={formOpen} onOpenChange={setFormOpen} patient={editPatient} onSave={handleSave} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>Sei sicuro di voler eliminare questo lavoratore?</AlertDialogDescription>
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