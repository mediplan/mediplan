import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Phone, Mail, MapPin, Printer, FileText, ClipboardList, MapPinned, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/shared/StatusBadge';
import CompanyWorkers from '@/components/companies/CompanyWorkers';
import { openProtocolloSanitario, openRelazioneSanitaria, openVerbaleSupralluogo } from '@/lib/printCompany';

export default function CompanyDetail() {
  const companyId = window.location.pathname.split('/').pop();
  const navigate = useNavigate();
  const [relazioneDialog, setRelazioneDialog] = useState(false);
  const [relazioneYear, setRelazioneYear] = useState(String(new Date().getFullYear() - 1));

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });
  const company = companies.find(c => String(c.id) === companyId);

  const { data: jobRoles = [] } = useQuery({
    queryKey: ['jobRoles'],
    queryFn: () => base44.entities.JobRole.list(),
  });
  const companyRoles = jobRoles.filter(j => String(j.company_id) === companyId);

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list(),
  });
  const companyPatients = patients.filter(p => String(p.company_id) === companyId);

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.MedicalVisit.list(),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctorProfiles'],
    queryFn: () => base44.entities.DoctorProfile.list(),
  });

  const getDoctor = (co) => co?.assigned_doctor_id
    ? doctors.find(d => String(d.id) === String(co.assigned_doctor_id))
    : doctors[0] || null;

  // Anni disponibili per relazione sanitaria
  const availableYears = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 5; y--) availableYears.push(String(y));

  if (!company) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/aziende')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Torna alle aziende
      </Button>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{company.name}</h1>
            <StatusBadge status={company.status} />
          </div>
          {company.sector && <p className="text-sm text-muted-foreground mt-1">{company.sector}</p>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Printer className="h-4 w-4" /> Stampa documenti <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Documenti aziendali</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openProtocolloSanitario(company, companyPatients, jobRoles, getDoctor(company))}>
              <ClipboardList className="h-4 w-4 mr-2 text-primary" />
              Protocollo Sanitario
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRelazioneDialog(true)}>
              <FileText className="h-4 w-4 mr-2 text-accent" />
              Relazione Sanitaria
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openVerbaleSupralluogo(company, getDoctor(company))}>
              <MapPinned className="h-4 w-4 mr-2 text-chart-4" />
              Verbale di Sopralluogo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialog selezione anno relazione sanitaria */}
      <Dialog open={relazioneDialog} onOpenChange={setRelazioneDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Relazione Sanitaria</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Anno di riferimento</Label>
            <Select value={relazioneYear} onValueChange={setRelazioneYear}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRelazioneDialog(false)}>Annulla</Button>
            <Button onClick={() => {
              setRelazioneDialog(false);
              openRelazioneSanitaria(company, companyPatients, visits, getDoctor(company), Number(relazioneYear));
            }}>
              <Printer className="h-4 w-4 mr-2" /> Stampa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contatti</p>
          {company.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{company.phone}</div>}
          {company.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{company.email}</div>}
          {company.city && <div className="flex items-center gap-2 text-sm"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{company.address ? `${company.address}, ` : ''}{company.city} {company.province}</div>}
        </Card>
        <Card className="p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dati aziendali</p>
          {company.vat_number && <p className="text-sm">P.IVA: <span className="font-medium">{company.vat_number}</span></p>}
          {company.ateco_code && <p className="text-sm">ATECO: <span className="font-medium">{company.ateco_code}</span></p>}
          {company.legal_representative && <p className="text-sm">Rapp. legale: <span className="font-medium">{company.legal_representative}</span></p>}
        </Card>
        <Card className="p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sicurezza</p>
          {company.rspp && <p className="text-sm">RSPP: <span className="font-medium">{company.rspp}</span></p>}
          {company.rls && <p className="text-sm">RLS: <span className="font-medium">{company.rls}</span></p>}
          {company.employee_count && <p className="text-sm">Dipendenti: <span className="font-medium">{company.employee_count}</span></p>}
          {company.assigned_doctor_name && <p className="text-sm">Medico incaricato: <span className="font-medium">{company.assigned_doctor_name}</span></p>}
        </Card>
      </div>

      {/* Workers list */}
      <div className="mb-6">
        <CompanyWorkers company={company} />
      </div>

      {/* Job roles */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold">Mansioni ({companyRoles.length})</h2>
          </div>
          <Link to="/impostazioni" className="text-xs text-primary hover:underline">Gestisci</Link>
        </div>
        {companyRoles.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna mansione definita</p>
        ) : (
          <div className="space-y-2">
            {companyRoles.map(r => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{r.name}</span>
                <span className="text-muted-foreground">{r.risks?.length || 0} rischi</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}