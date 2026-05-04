import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { canAccess } from '@/lib/roles';
import { Plus, Search, Users, MoreHorizontal, Pencil, Trash2, Stethoscope, AlertTriangle, Clock, CheckCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import StatusBadge from '@/components/shared/StatusBadge';
import PatientFormDialog from '@/components/patients/PatientFormDialog';
import { Link, useNavigate } from 'react-router-dom';
import { format, differenceInDays, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

function getExpiryInfo(patient, visits) {
  // Trova la visita più recente con next_visit_date oppure first_visit_expiry sul paziente
  const patientVisits = visits.filter(v => String(v.patient_id) === String(patient.id));
  
  // Ultima visita con next_visit_date impostato
  const withNextDate = patientVisits
    .filter(v => v.next_visit_date)
    .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));

  let expiryDate = null;

  if (withNextDate.length > 0) {
    expiryDate = withNextDate[0].next_visit_date;
  } else if (patient.first_visit_expiry) {
    expiryDate = patient.first_visit_expiry;
  }

  if (!expiryDate) {
    // Nessuna visita e nessuna scadenza impostata
    if (patientVisits.length === 0 && patient.subject_to_surveillance) {
      return { status: 'missing', label: 'Nessuna visita', color: 'text-destructive', bgColor: 'bg-destructive/10', icon: AlertTriangle };
    }
    return null;
  }

  const today = new Date();
  const expiry = parseISO(expiryDate);
  const daysLeft = differenceInDays(expiry, today);

  if (daysLeft < 0) {
    return { status: 'expired', label: `Scaduta ${format(expiry, 'dd/MM/yyyy')}`, color: 'text-destructive', bgColor: 'bg-destructive/10', icon: AlertTriangle, daysLeft };
  } else if (daysLeft <= 30) {
    return { status: 'expiring', label: `Scade ${format(expiry, 'dd/MM/yyyy')}`, color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Clock, daysLeft };
  } else {
    return { status: 'ok', label: format(expiry, 'dd/MM/yyyy'), color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircle, daysLeft };
  }
}

export default function CompanyWorkers({ company, onScheduleVisit }) {
  const companyId = String(company.id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, licenseRole, tenantId } = useAuth();
  const canSeeClinic = canAccess(user, 'dati_clinici', licenseRole);
  const canWriteVisit = canAccess(user, 'visite_write', licenseRole);
  const canWriteAccertamenti = canAccess(user, 'accertamenti_write', licenseRole);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list('-created_date'),
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['medicalVisits'],
    queryFn: () => base44.entities.MedicalVisit.list('-visit_date'),
  });

  const companyPatients = patients.filter(p => String(p.company_id) === companyId);

  const filtered = companyPatients.filter(p =>
    `${p.last_name} ${p.first_name} ${p.fiscal_code || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Patient.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['patients'] }); setFormOpen(false); },
    onError: (err) => { alert('Errore nella creazione del lavoratore: ' + (err?.message || err)); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Patient.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['patients'] }); setFormOpen(false); setEditPatient(null); },
    onError: (err) => { alert('Errore nel salvataggio: ' + (err?.message || err)); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Patient.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['patients'] }); setDeleteId(null); },
  });

  const handleSave = (data) => {
    if (editPatient) {
      updateMutation.mutate({ id: editPatient.id, data });
    } else {
      createMutation.mutate({ ...data, company_id: companyId, company_name: company.name, tenant_id: tenantId || undefined });
    }
  };

  const handleVisitNow = (e, patient) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/visita?patientId=${patient.id}`);
  };

  return (
    <Card className="p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
         <div className="flex items-center gap-2">
           <Users className="h-4 w-4 text-primary" />
           <h2 className="text-sm font-semibold">Lavoratori ({companyPatients.length})</h2>
         </div>
         <div className="flex items-center gap-2">
           <div className="relative">
             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
             <Input
               placeholder="Cerca..."
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="pl-8 h-8 text-sm w-44"
             />
           </div>
           {onScheduleVisit && (
             <Button size="sm" variant="outline" onClick={onScheduleVisit} className="h-8 text-xs gap-1">
               <Calendar className="h-3 w-3" />
               Programma visite
             </Button>
           )}
           <Button size="sm" onClick={() => { setEditPatient(null); setFormOpen(true); }}>
             <Plus className="h-4 w-4 mr-1" /> Nuovo
           </Button>
         </div>
       </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {companyPatients.length === 0 ? 'Nessun lavoratore associato' : 'Nessun risultato'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cognome e Nome</TableHead>
                <TableHead className="hidden md:table-cell">Data di nascita</TableHead>
                <TableHead className="hidden md:table-cell">Mansione</TableHead>
                <TableHead>Scadenza visita</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead></TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => {
                const expiry = getExpiryInfo(p, visits);
                const ExpiryIcon = expiry?.icon;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link to={`/pazienti/${p.id}`} className="font-medium hover:text-primary hover:underline">
                        {p.last_name} {p.first_name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {p.birth_date ? format(parseISO(p.birth_date), 'dd/MM/yyyy') : '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{p.job_role_name || '—'}</TableCell>
                    <TableCell>
                      {expiry ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${expiry.bgColor} ${expiry.color}`}>
                          <ExpiryIcon className="h-3 w-3" />
                          {expiry.label}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell>
                      {(canWriteVisit || canWriteAccertamenti) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2 gap-1 text-primary border-primary/40 hover:bg-primary/10"
                          onClick={(e) => handleVisitNow(e, p)}
                        >
                          <Stethoscope className="h-3 w-3" />
                          {canWriteVisit ? 'Visita ora' : 'Accertamenti'}
                        </Button>
                      )}
                    </TableCell>
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
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <PatientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        patient={editPatient}
        onSave={handleSave}
        defaultCompany={company}
      />

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
    </Card>
  );
}