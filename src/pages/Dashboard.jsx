import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, Users, Stethoscope, AlertTriangle, Clock } from 'lucide-react';
import { addDays, isBefore, isAfter, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import StatCard from '@/components/shared/StatCard';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });
  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list(),
  });
  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.MedicalVisit.list('-visit_date', 1000),
  });

  const today = new Date();
  const in30Days = addDays(today, 30);

  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const activePatients = patients.filter(p => p.status === 'active').length;

  // Per ogni azienda attiva, troviamo la next_visit_date minima tra i suoi lavoratori
  const companyAlerts = useMemo(() => {
    const activeCompanyList = companies.filter(c => c.status === 'active');

    return activeCompanyList.map(company => {
      // Visite passate di questa azienda con next_visit_date
      const companyVisits = visits.filter(v => v.company_id === company.id && v.next_visit_date);

      // Troviamo la scadenza più urgente per questa azienda
      let earliestExpiry = null;
      for (const v of companyVisits) {
        const d = parseISO(v.next_visit_date);
        if (!earliestExpiry || isBefore(d, earliestExpiry)) {
          earliestExpiry = d;
        }
      }

      // Anche i lavoratori con first_visit_expiry
      const companyPatients = patients.filter(p => p.company_id === company.id && p.first_visit_expiry);
      for (const p of companyPatients) {
        const d = parseISO(p.first_visit_expiry);
        if (!earliestExpiry || isBefore(d, earliestExpiry)) {
          earliestExpiry = d;
        }
      }

      if (!earliestExpiry) return null;

      const isExpired = isBefore(earliestExpiry, today);
      const isExpiringSoon = !isExpired && isBefore(earliestExpiry, in30Days);

      if (!isExpired && !isExpiringSoon) return null;

      return {
        company,
        earliestExpiry,
        isExpired,
        isExpiringSoon,
      };
    }).filter(Boolean).sort((a, b) => a.earliestExpiry - b.earliestExpiry);
  }, [companies, visits, patients, today, in30Days]);

  const expiredAlerts = companyAlerts.filter(a => a.isExpired);
  const expiringSoonAlerts = companyAlerts.filter(a => a.isExpiringSoon);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Panoramica della sorveglianza sanitaria"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Aziende attive" value={activeCompanies} icon={Building2} color="blue" />
        <StatCard label="Lavoratori attivi" value={activePatients} icon={Users} color="teal" />
        <StatCard label="Visite eseguite" value={visits.length} icon={Stethoscope} color="purple" />
      </div>

      {/* Alert aziende */}
      {(expiredAlerts.length > 0 || expiringSoonAlerts.length > 0) && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Scadute */}
          {expiredAlerts.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Adempimenti scaduti ({expiredAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {expiredAlerts.map(({ company, earliestExpiry }) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10"
                  >
                    <Link to={`/aziende/${company.id}`} className="text-sm font-medium text-foreground hover:text-primary hover:underline">
                      {company.name}
                    </Link>
                    <Badge variant="destructive" className="text-xs shrink-0">
                      Scad. {earliestExpiry.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* In scadenza entro 30 giorni */}
          {expiringSoonAlerts.length > 0 && (
            <Card className="border-amber-300/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-amber-600">
                  <Clock className="h-4 w-4" />
                  In scadenza entro 30 giorni ({expiringSoonAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {expiringSoonAlerts.map(({ company, earliestExpiry }) => (
                  <Link
                    key={company.id}
                    to={`/aziende/${company.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground">{company.name}</span>
                    <Badge className="text-xs bg-amber-100 text-amber-700 border border-amber-300 shrink-0">
                      Scad. {earliestExpiry.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Nessun alert */}
      {expiredAlerts.length === 0 && expiringSoonAlerts.length === 0 && (
        <Card className="p-6 text-center text-muted-foreground text-sm border-dashed">
          Nessuna scadenza imminente o adempimento scaduto
        </Card>
      )}
    </div>
  );
}