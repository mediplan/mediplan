import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useTenant } from '@/lib/useTenant';
import { filterCompaniesByRole } from '@/lib/roles';
import { Plus, Search, Building2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import CompanyFormDialog from '@/components/companies/CompanyFormDialog';
import { Link } from 'react-router-dom';

export default function Companies() {
  const { user } = useAuth();
  const { tenantId, isPlatformAdmin } = useTenant();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies', tenantId],
    queryFn: () => tenantId
      ? base44.entities.Company.filter({ tenant_id: tenantId }, '-created_date')
      : isPlatformAdmin
        ? base44.entities.Company.list('-created_date')
        : [],
    enabled: isPlatformAdmin || !!tenantId,
  });

  // Per i medici: carica il proprio profilo e filtra le aziende
  const { data: allDoctors = [] } = useQuery({
    queryKey: ['doctorProfiles'],
    queryFn: () => base44.entities.DoctorProfile.list(),
    enabled: user?.role === 'medico',
  });
  const myDoctorProfile = user?.role === 'medico'
    ? allDoctors.find(d => d.user_email === user.email)
    : null;
  const visibleCompanies = filterCompaniesByRole(user, companies, myDoctorProfile);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.create({ ...data, tenant_id: tenantId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['companies'] }); setFormOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Company.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['companies'] }); setFormOpen(false); setEditCompany(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Company.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['companies'] }); setDeleteId(null); },
  });

  const handleSave = (data) => {
    if (editCompany) {
      updateMutation.mutate({ id: editCompany.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = visibleCompanies.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase()) ||
    c.vat_number?.includes(search)
  );

  return (
    <div>
      <PageHeader
        title="Aziende"
        description="Gestisci le aziende clienti"
        action={
          <Button onClick={() => { setEditCompany(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nuova Azienda
          </Button>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca azienda..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState
          icon={Building2}
          title="Nessuna azienda"
          description="Aggiungi la prima azienda cliente per iniziare"
          actionLabel="Nuova Azienda"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ragione sociale</TableHead>
                  <TableHead className="hidden md:table-cell">P.IVA</TableHead>
                  <TableHead className="hidden md:table-cell">Città</TableHead>
                  <TableHead className="hidden sm:table-cell">Settore</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(company => (
                  <TableRow key={company.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link to={`/aziende/${company.id}`} className="font-medium text-foreground hover:text-primary">
                        {company.name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{company.vat_number}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{company.city}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{company.sector}</TableCell>
                    <TableCell><StatusBadge status={company.status} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditCompany(company); setFormOpen(true); }}>
                            <Pencil className="h-4 w-4 mr-2" /> Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(company.id)}>
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

      <CompanyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        company={editCompany}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>Sei sicuro di voler eliminare questa azienda? L'azione è irreversibile.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}