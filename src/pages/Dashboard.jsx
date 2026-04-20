import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CalendarDays, FileWarning, ShieldAlert, MapPinned, Stethoscope } from 'lucide-react';
import { addDays, addMonths, isBefore, isAfter, parseISO, startOfMonth, endOfMonth, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Link } from 'react-router-dom';
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
  const { data: sopralluoghi = [] } = useQuery({
    queryKey: ['sopralluoghi_all'],
    queryFn: () => base44.entities.Sopralluogo.list('-date', 1000),
  });

  const today = new Date();
  const in30Days = addDays(today, 30);
  const in60Days = addDays(today, 60);

  // Visite in sospeso
  const visiteInCorso = useMemo(() =>
    visits.filter(v => v.visit_status === 'sospesa' || v.visit_status === 'in_corso'),
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

  // Visite scadute + in scadenza entro 30 giorni (ultima visita per paziente)
  const visiteScaduteEInScadenza = useMemo(() => {
    const latestVisitPerPatient = {};
    for (const v of visits) {
      if (!v.next_visit_date || !v.patient_id) continue;
      const existing = latestVisitPerPatient[v.patient_id];
      if (!existing || v.visit_date > existing.visit_date) {
        latestVisitPerPatient[v.patient_id] = v;
      }
    }
    return Object.values(latestVisitPerPatient)
      .filter(v => {
        const d = parseISO(v.next_visit_date);
        return isBefore(d, in30Days); // scadute (< oggi) + in scadenza (oggi..+30gg)
      })
      .sort((a, b) => new Date(a.next_visit_date) - new Date(b.next_visit_date));
  }, [visits, in30Days]);

  // Sopralluoghi: per ogni azienda attiva, l'ultimo sopralluogo e la scadenza annuale
  const sopralluoghiInScadenza = useMemo(() => {
    const activeCompanyIds = new Set(companies.filter(c => c.status === 'active').map(c => c.id));
    // Ultimo sopralluogo per azienda
    const lastPerCompany = {};
    for (const s of sopralluoghi) {
      if (!activeCompanyIds.has(s.company_id)) continue;
      if (!lastPerCompany[s.company_id] || s.date > lastPerCompany[s.company_id].date) {
        lastPerCompany[s.company_id] = s;
      }
    }
    const items = [];
    for (const [companyId, s] of Object.entries(lastPerCompany)) {
      const lastDate = parseISO(s.date);
      const nextDue = addMonths(lastDate, 12);
      if (isBefore(nextDue, in60Days)) {
        const comp = companies.find(c => String(c.id) === String(companyId));
        items.push({ company: comp, lastDate, nextDue, isExpired: isBefore(nextDue, today) });
      }
    }
    // Aziende senza alcun sopralluogo
    for (const c of companies.filter(c => c.status === 'active')) {
      if (!lastPerCompany[c.id]) {
        items.push({ company: c, lastDate: null, nextDue: null, isExpired: true });
      }
    }
    return items.sort((a, b) => {
      if (!a.nextDue) return -1;
      if (!b.nextDue) return 1;
      return a.nextDue - b.nextDue;
    });
  }, [sopralluoghi, companies, today, in60Days]);

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

      {/* Visite scadute/in scadenza + Sopralluoghi — IN CIMA */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">

        {/* Visite scadute e in scadenza */}
        <Card className="border-blue-300/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-blue-600">
              <Stethoscope className="h-4 w-4" />
              Visite scadute e in scadenza ({visiteScaduteEInScadenza.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {visiteScaduteEInScadenza.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nessuna visita scaduta o in scadenza</p>
            ) : visiteScaduteEInScadenza.map(v => {
              const d = parseISO(v.next_visit_date);
              const isExpired = isBefore(d, today);
              return (
                <Link
                  key={v.id}
                  to={`/pazienti/${v.patient_id}`}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors gap-3 ${isExpired ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-blue-50 border-blue-200 hover:bg-blue-100'}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{v.patient_name || '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{v.company_name || '—'}</p>
                  </div>
                  <Badge className={`text-xs shrink-0 ${isExpired ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
                    {isExpired ? 'Scaduta' : 'Scad.'} {d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Sopralluoghi da effettuare */}
        <Card className="border-purple-300/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-purple-600">
              <MapPinned className="h-4 w-4" />
              Sopralluoghi da effettuare ({sopralluoghiInScadenza.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {sopralluoghiInScadenza.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Tutti i sopralluoghi sono in regola</p>
            ) : sopralluoghiInScadenza.map(({ company, lastDate, nextDue, isExpired }) => (
              <Link
                key={company?.id}
                to={`/aziende/${company?.id}`}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors gap-3 ${isExpired ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-purple-50 border-purple-200 hover:bg-purple-100'}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{company?.name || '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {lastDate ? `Ultimo: ${lastDate.toLocaleDateString('it-IT')}` : 'Nessun sopralluogo registrato'}
                  </p>
                </div>
                <Badge className={`text-xs shrink-0 ${isExpired ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-purple-100 text-purple-700 border border-purple-300'}`}>
                  {isExpired && !nextDue ? 'Da fare' : nextDue ? `Scad. ${nextDue.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}` : '—'}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Situazioni in sospeso */}
      <div className="grid lg:grid-cols-2 gap-6">
          {/* Visite in corso */}
          <Card className="border-amber-300/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-amber-600">
                <FileWarning className="h-4 w-4" />
                Visite in sospeso ({visiteInCorso.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {visiteInCorso.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nessuna visita in sospeso</p>
              ) : visiteInCorso.map(v => (
                <Link
                  key={v.id}
                  to={`/visita?visitId=${v.id}`}
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

          {/* Giudizi critici */}
          <Card className="border-orange-300/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-orange-600">
                <ShieldAlert className="h-4 w-4" />
                Non idoneità ({visiteCritiche.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {visiteCritiche.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nessun giudizio di non idoneità</p>
              ) : visiteCritiche.map(v => (
                <Link
                  key={v.id}
                  to={`/visita?visitId=${v.id}`}
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
        </div>

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