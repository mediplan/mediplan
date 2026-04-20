import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, Users, Stethoscope, AlertTriangle, Clock, CalendarDays, FileWarning, ShieldAlert } from 'lucide-react';
import { addDays, isBefore, isAfter, parseISO, startOfMonth, endOfMonth, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import StatCard from '@/components/shared/StatCard';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppointmentCalendar from '@/components/calendar/AppointmentCalendar';

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

  // Per ogni azienda attiva, troviamo la next_visit_date più urgente considerando
  // solo l'ULTIMA visita per ogni paziente (quella con visit_date più recente)
  const companyAlerts = useMemo(() => {
    const activeCompanyList = companies.filter(c => c.status === 'active');

    // Per ogni paziente, troviamo la sua ultima visita (con next_visit_date)
    const latestVisitPerPatient = {};
    for (const v of visits) {
      if (!v.next_visit_date || !v.patient_id) continue;
      const existing = latestVisitPerPatient[v.patient_id];
      if (!existing || v.visit_date > existing.visit_date) {
        latestVisitPerPatient[v.patient_id] = v;
      }
    }

    return activeCompanyList.map(company => {
      // Prendi solo le ultime visite dei pazienti di questa azienda
      const companyLatestVisits = Object.values(latestVisitPerPatient)
        .filter(v => v.company_id === company.id);

      // Troviamo la scadenza più urgente per questa azienda
      let earliestExpiry = null;
      for (const v of companyLatestVisits) {
        const d = parseISO(v.next_visit_date);
        if (!earliestExpiry || isBefore(d, earliestExpiry)) {
          earliestExpiry = d;
        }
      }

      // Anche i lavoratori con first_visit_expiry (solo se non hanno visite)
      const companyPatients = patients.filter(p => p.company_id === company.id && p.first_visit_expiry);
      for (const p of companyPatients) {
        if (latestVisitPerPatient[p.id]) continue; // già coperto dalla visita
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

  // Visite in corso (non concluse)
  const visiteInCorso = useMemo(() =>
    visits.filter(v => v.visit_status === 'in_corso'),
    [visits]
  );

  // Visite con giudizio negativo o condizionato
  const GIUDIZI_CRITICI = ['non_idoneo', 'temporaneamente_non_idoneo'];
  const GIUDIZIO_LABELS = {
    non_idoneo: 'Non idoneo',
    temporaneamente_non_idoneo: 'Temporaneamente non idoneo',
    idoneo_con_prescrizioni: 'Idoneo con prescrizioni',
    idoneo_con_limitazioni: 'Idoneo con limitazioni',
  };
  const visiteCritiche = useMemo(() =>
    visits.filter(v => GIUDIZI_CRITICI.includes(v.judgment)),
    [visits]
  );

  // Attività del mese successivo: lavoratori con scadenza nel mese prossimo
  const nextMonthStart = startOfMonth(addDays(today, 31));
  const nextMonthEnd = endOfMonth(nextMonthStart);
  const nextMonthLabel = format(nextMonthStart, 'MMMM yyyy', { locale: it });

  const nextMonthActivities = useMemo(() => {
    const items = [];

    // Da visite con next_visit_date
    for (const v of visits) {
      if (!v.next_visit_date) continue;
      const d = parseISO(v.next_visit_date);
      if (isAfter(d, nextMonthStart) || d.toDateString() === nextMonthStart.toDateString()) {
        if (isBefore(d, nextMonthEnd) || d.toDateString() === nextMonthEnd.toDateString()) {
          const patient = patients.find(p => String(p.id) === String(v.patient_id));
          const company = companies.find(c => String(c.id) === String(v.company_id));
          items.push({
            date: d,
            patientName: v.patient_name || (patient ? `${patient.last_name} ${patient.first_name}` : '—'),
            patientId: v.patient_id,
            companyName: v.company_name || company?.name || '—',
            companyId: v.company_id,
            type: 'Visita periodica',
          });
        }
      }
    }

    // Da pazienti con first_visit_expiry
    for (const p of patients) {
      if (!p.first_visit_expiry) continue;
      const d = parseISO(p.first_visit_expiry);
      if (isAfter(d, nextMonthStart) || d.toDateString() === nextMonthStart.toDateString()) {
        if (isBefore(d, nextMonthEnd) || d.toDateString() === nextMonthEnd.toDateString()) {
          // Evita duplicati se già inserito da visita
          const alreadyIn = items.some(i => String(i.patientId) === String(p.id));
          if (!alreadyIn) {
            const company = companies.find(c => String(c.id) === String(p.company_id));
            items.push({
              date: d,
              patientName: `${p.last_name} ${p.first_name}`,
              patientId: p.id,
              companyName: p.company_name || company?.name || '—',
              companyId: p.company_id,
              type: 'Prima visita',
            });
          }
        }
      }
    }

    return items.sort((a, b) => a.date - b.date);
  }, [visits, patients, companies, nextMonthStart, nextMonthEnd]);

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

      {/* Situazioni in sospeso */}
      {(visiteInCorso.length > 0 || visiteCritiche.length > 0) && (
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Visite in corso */}
          {visiteInCorso.length > 0 && (
            <Card className="border-amber-300/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-amber-600">
                  <FileWarning className="h-4 w-4" />
                  Visite in sospeso ({visiteInCorso.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {visiteInCorso.map(v => (
                  <Link
                    key={v.id}
                    to={`/visita?id=${v.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{v.patient_name || '—'}</p>
                      <p className="text-xs text-muted-foreground truncate">{v.company_name || '—'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge className="text-xs bg-amber-100 text-amber-700 border border-amber-300">{v.visit_date ? new Date(v.visit_date).toLocaleDateString('it-IT') : '—'}</Badge>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">{v.visit_type?.replace(/_/g, ' ')}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Giudizi critici */}
          {visiteCritiche.length > 0 && (
            <Card className="border-orange-300/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-orange-600">
                  <ShieldAlert className="h-4 w-4" />
                  Giudizi critici/condizionati ({visiteCritiche.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {visiteCritiche.map(v => (
                  <Link
                    key={v.id}
                    to={`/visita?id=${v.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{v.patient_name || '—'}</p>
                      <p className="text-xs text-muted-foreground truncate">{v.company_name || '—'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge className="text-xs bg-orange-100 text-orange-700 border border-orange-300">
                        {GIUDIZIO_LABELS[v.judgment] || v.judgment}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-0.5">{v.visit_date ? new Date(v.visit_date).toLocaleDateString('it-IT') : '—'}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Calendario appuntamenti */}
      <div className="mt-8">
        <AppointmentCalendar />
      </div>

      {/* Attività mese successivo */}
      <div className="mt-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              Attività programmate — <span className="capitalize">{nextMonthLabel}</span>
              <Badge variant="secondary" className="ml-auto">{nextMonthActivities.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextMonthActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nessuna attività programmata per il mese di {nextMonthLabel}</p>
            ) : (
              <div className="space-y-2">
                {nextMonthActivities.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-muted-foreground w-16 shrink-0">
                        {format(item.date, 'dd/MM/yyyy')}
                      </span>
                      <div className="min-w-0">
                        <Link to={`/pazienti/${item.patientId}`} className="text-sm font-medium hover:text-primary hover:underline truncate block">
                          {item.patientName}
                        </Link>
                        <Link to={`/aziende/${item.companyId}`} className="text-xs text-muted-foreground hover:text-primary hover:underline truncate block">
                          {item.companyName}
                        </Link>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{item.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}