import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Briefcase, FileHeart, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import StatusBadge from '@/components/shared/StatusBadge';

export default function CompanyDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const companyId = window.location.pathname.split('/').pop();
  const navigate = useNavigate();

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });
  const company = companies.find(c => String(c.id) === companyId);

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list(),
  });
  const companyPatients = patients.filter(p => String(p.company_id) === companyId);

  const { data: jobRoles = [] } = useQuery({
    queryKey: ['jobRoles'],
    queryFn: () => base44.entities.JobRole.list(),
  });
  const companyRoles = jobRoles.filter(j => String(j.company_id) === companyId);

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
      </div>

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
        </Card>
      </div>

      {/* Linked data */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Lavoratori ({companyPatients.length})</h2>
            </div>
            <Link to={`/pazienti?company=${companyId}`} className="text-xs text-primary hover:underline">Vai ai lavoratori</Link>
          </div>
          {companyPatients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun lavoratore associato</p>
          ) : (
            <div className="space-y-2">
              {companyPatients.slice(0, 10).map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <Link to={`/pazienti/${p.id}`} className="font-medium hover:text-primary hover:underline">{p.last_name} {p.first_name}</Link>
                  <span className="text-muted-foreground">{p.job_role_name}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold">Mansioni ({companyRoles.length})</h2>
            </div>
            <Link to="/mansioni" className="text-xs text-primary hover:underline">Gestisci</Link>
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
    </div>
  );
}