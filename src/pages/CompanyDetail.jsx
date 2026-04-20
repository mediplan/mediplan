import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Phone, Mail, MapPin, Printer, FileText, ClipboardList, MapPinned, Plus } from 'lucide-react';
import CompanyPriceListPanel from '@/components/companies/CompanyPriceListPanel';
import CompanyDocumentsPanel from '@/components/companies/CompanyDocumentsPanel';
import SurveillancePlanPanel from '@/components/companies/SurveillancePlanPanel';
import { useAuth } from '@/lib/AuthContext';
import { canAccess } from '@/lib/roles';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/shared/StatusBadge';
import CompanyWorkers from '@/components/companies/CompanyWorkers';
import CompanyJobRolesDialog from '@/components/companies/CompanyJobRolesDialog';
import { buildProtocolloHTML, buildRelazioneSanitariaHTML, buildVerbaleHTML } from '@/lib/printCompany';
import DocumentPreviewDialog from '@/components/shared/DocumentPreviewDialog';

export default function CompanyDetail() {
  const companyId = window.location.pathname.split('/').pop();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canSeeDVR = user && canAccess(user, 'dvr_sorveglianza');
  const [relazioneDialog, setRelazioneDialog] = useState(false);
  const [relazioneYear, setRelazioneYear] = useState(String(new Date().getFullYear() - 1));
  const [jobRolesDialog, setJobRolesDialog] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null); // { title, html }

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

      {/* Header: titolo + pannello stampe */}
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-foreground">{company.name}</h1>
            <StatusBadge status={company.status} />
          </div>
          {company.sector && <p className="text-sm text-muted-foreground">{company.sector}</p>}
        </div>

        {/* Pannello stampe inline */}
        <div className="shrink-0">
          <div className="bg-muted/40 border border-border rounded-xl p-3 space-y-1.5 min-w-[180px]">
            <div className="flex items-center gap-1.5 px-1 pb-1.5 mb-0.5 border-b border-border/60">
              <Printer className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Documenti</span>
            </div>
            <button
              onClick={() => setPreviewDoc({ title: `Protocollo Sanitario — ${company.name}`, html: buildProtocolloHTML(company, companyPatients, jobRoles, getDoctor(company)) })}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-background hover:shadow-sm transition-all text-left"
            >
              <ClipboardList className="h-4 w-4 text-primary shrink-0" />
              Protocollo Sanitario
            </button>
            <button
              onClick={() => setRelazioneDialog(true)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-background hover:shadow-sm transition-all text-left"
            >
              <FileText className="h-4 w-4 text-accent shrink-0" />
              Relazione Sanitaria
            </button>
            <button
              onClick={() => setPreviewDoc({ title: `Verbale Sopralluogo — ${company.name}`, html: buildVerbaleHTML(company, getDoctor(company)) })}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-background hover:shadow-sm transition-all text-left"
            >
              <MapPinned className="h-4 w-4 text-chart-4 shrink-0" />
              Verbale Sopralluogo
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">

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
              setPreviewDoc({
                title: `Relazione Sanitaria ${relazioneYear} — ${company.name}`,
                html: buildRelazioneSanitariaHTML(company, companyPatients, visits, getDoctor(company), Number(relazioneYear)),
              });
            }}>
              <Printer className="h-4 w-4 mr-2" /> Anteprima
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
          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => setJobRolesDialog(true)}>
            <Plus className="h-3.5 w-3.5" /> Aggiungi / Gestisci
          </Button>
        </div>
        {companyRoles.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna mansione associata. Clicca "Aggiungi" per selezionare dal catalogo o crearne una nuova.</p>
        ) : (
          <div className="space-y-2">
            {companyRoles.map(r => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{r.name}</span>
                <span className="text-muted-foreground">{r.risks?.length || 0} rischi · {r.required_exams?.length || 0} accert.</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Listino prezzi aziendale */}
      <div className="mt-6">
        <CompanyPriceListPanel company={company} />
      </div>

      {/* Archivio DVR + Piano di sorveglianza (solo admin, medico, segreteria) */}
      {canSeeDVR && (
        <div className="mt-6 space-y-6">
          <CompanyDocumentsPanel company={company} />
          <SurveillancePlanPanel company={company} />
        </div>
      )}

      <CompanyJobRolesDialog
        open={jobRolesDialog}
        onOpenChange={setJobRolesDialog}
        company={company}
      />

      <DocumentPreviewDialog
        open={!!previewDoc}
        onOpenChange={v => !v && setPreviewDoc(null)}
        title={previewDoc?.title}
        html={previewDoc?.html}
        defaultEmails={company?.email ? [{ label: 'Invia ad azienda', email: company.email }] : []}
      />
      </div>{/* fine mt-6 */}
    </div>
  );
}