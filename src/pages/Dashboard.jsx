import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CalendarDays, FileWarning, ShieldAlert, MapPinned, Stethoscope, Plus, PlayCircle, CheckCircle2 } from 'lucide-react';
import { useTenant } from '@/lib/useTenant';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDays, addMonths, isBefore, isAfter, parseISO, startOfMonth, endOfMonth, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppointmentCalendar from '@/components/calendar/AppointmentCalendar';
import ScheduleAppointmentDialog from '@/components/appointments/ScheduleAppointmentDialog';

export default function Dashboard() {
  const { tenantId, isPlatformAdmin } = useTenant();
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDialogContext, setScheduleDialogContext] = useState({
    type: 'visita_medica',
    patientId: null,
    patientName: null,
    companyId: null,
    companyName: null,
  });
  const [expandedVisits, setExpandedVisits] = useState(false);
  const [expandedSopralluoghi, setExpandedSopralluoghi] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState(false);

  const queryClient = useQueryClient();
  const tenantFilter = tenantId ? { tenant_id: tenantId } : null;
  const tenantEnabled = isPlatformAdmin || !!tenantId;

  const markCompletedMutation = useMutation({
    mutationFn: (appointmentId) => base44.entities.Appointment.update(appointmentId, { status: 'completato' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', tenantId],
    queryFn: () => tenantFilter ? base44.entities.Company.filter(tenantFilter) : base44.entities.Company.list(),
    enabled: tenantEnabled,
  });
  const { data: patients = [] } = useQuery({
    queryKey: ['patients', tenantId],
    queryFn: () => tenantFilter ? base44.entities.Patient.filter(tenantFilter, '-created_date', 1000) : base44.entities.Patient.list('-created_date', 1000),
    enabled: tenantEnabled,
  });
  const { data: visits = [] } = useQuery({
    queryKey: ['visits', tenantId],
    queryFn: () => tenantFilter ? base44.entities.MedicalVisit.filter(tenantFilter, '-visit_date', 1000) : base44.entities.MedicalVisit.list('-visit_date', 1000),
    enabled: tenantEnabled,
  });
  const { data: sopralluoghi = [] } = useQuery({
    queryKey: ['sopralluoghi_all', tenantId],
    queryFn: () => tenantFilter ? base44.entities.Sopralluogo.filter(tenantFilter, '-date', 1000) : base44.entities.Sopralluogo.list('-date', 1000),
    enabled: tenantEnabled,
  });
  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', tenantId],
    queryFn: () => tenantFilter ? base44.entities.Appointment.filter(tenantFilter) : base44.entities.Appointment.list(),
    enabled: tenantEnabled,
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
  // Se programmato un appuntamento, mostra il badge sull'elemento visita
  const visiteScaduteEInScadenza = useMemo(() => {
    const latestVisitPerPatient = {};
    for (const v of visits) {
      if (!v.next_visit_date || !v.patient_id) continue;
      const existing = latestVisitPerPatient[v.patient_id];
      if (!existing || v.visit_date > existing.visit_date) {
        latestVisitPerPatient[v.patient_id] = v;
      }
    }
    
    // Visite scadute/in scadenza con appuntamenti programmati associati
    return Object.values(latestVisitPerPatient)
      .filter(v => {
        const d = parseISO(v.next_visit_date);
        return isBefore(d, in30Days);
      })
      .map(v => {
        // Cerca appuntamento programmato per questo paziente
        const scheduledAppt = appointments.find(a => 
          String(a.patient_id) === String(v.patient_id) && 
          a.appointment_type === 'visita_medica' && 
          a.status === 'schedulato'
        );
        return { ...v, source: 'visit', scheduledAppt };
      })
      .sort((a, b) => {
        const dateA = new Date(a.next_visit_date);
        const dateB = new Date(b.next_visit_date);
        return dateA - dateB;
      });
  }, [visits, appointments, in30Days]);

  // Sopralluoghi: per ogni azienda attiva, l'ultimo sopralluogo e la scadenza annuale
  // Se programmato un appuntamento, mostra il badge sull'elemento sopralluogo
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
        // Cerca appuntamento programmato per questa azienda
        const scheduledAppt = appointments.find(a => 
          String(a.company_id) === String(companyId) && 
          a.appointment_type === 'sopralluogo' && 
          a.status === 'schedulato'
        );
        items.push({ company: comp, lastDate, nextDue, isExpired: isBefore(nextDue, today), source: 'sopralluogo', scheduledAppt });
      }
    }
    // Aziende senza alcun sopralluogo
    for (const c of companies.filter(c => c.status === 'active')) {
      if (!lastPerCompany[c.id]) {
        const scheduledAppt = appointments.find(a => 
          String(a.company_id) === String(c.id) && 
          a.appointment_type === 'sopralluogo' && 
          a.status === 'schedulato'
        );
        items.push({ company: c, lastDate: null, nextDue: null, isExpired: true, source: 'sopralluogo', scheduledAppt });
      }
    }

    return items.sort((a, b) => {
      if (!a.nextDue && !b.nextDue) return 0;
      if (!a.nextDue) return -1;
      if (!b.nextDue) return 1;
      return a.nextDue - b.nextDue;
    });
  }, [sopralluoghi, companies, appointments, today, in60Days]);

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

    // Da appuntamenti programmati (visite mediche e sopralluoghi)
    for (const a of appointments) {
      if (a.status !== 'schedulato') continue;
      const d = parseISO(a.date);
      if (isAfter(d, nextMonthStart) || d.toDateString() === nextMonthStart.toDateString()) {
        if (isBefore(d, nextMonthEnd) || d.toDateString() === nextMonthEnd.toDateString()) {
          const typeLabel = a.appointment_type === 'visita_medica' 
            ? (a.visit_type ? a.visit_type.replace(/_/g, ' ') : 'Visita medica')
            : 'Sopralluogo';
          items.push({
            date: d,
            patientName: a.patient_name || '—',
            patientId: a.patient_id,
            companyName: a.company_name || '—',
            companyId: a.company_id,
            type: typeLabel,
          });
        }
      }
    }

    return items.sort((a, b) => a.date - b.date);
  }, [visits, patients, companies, appointments, nextMonthStart, nextMonthEnd]);

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
              Visite scadute e in scadenza ({visiteScaduteEInScadenza.filter(v => !v.scheduledAppt).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {visiteScaduteEInScadenza.filter(v => !v.scheduledAppt).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nessuna visita scaduta o in scadenza</p>
            ) : (
              <>
                {visiteScaduteEInScadenza.filter(v => !v.scheduledAppt).slice(0, 3).map(v => {
              const d = parseISO(v.next_visit_date);
              const isExpired = isBefore(d, today);

              return (
                <div
                  key={v.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors gap-3 ${isExpired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}
                >
                  <Link
                    to={`/pazienti/${v.patient_id}`}
                    className="min-w-0 hover:opacity-75"
                  >
                    <p className="text-sm font-medium truncate">{v.patient_name || '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{v.company_name || '—'}</p>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setScheduleDialogContext({
                          type: 'visita_medica',
                          patientId: v.patient_id,
                          patientName: v.patient_name,
                          companyId: v.company_id,
                          companyName: v.company_name,
                        });
                        setScheduleDialogOpen(true);
                      }}
                      className="h-7 px-2 text-xs gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Programma
                    </Button>
                    <Badge className={`text-xs ${isExpired ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
                      {isExpired ? 'Scaduta' : 'Scad.'} {d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Badge>
                  </div>
                </div>
              );
            })}
                {visiteScaduteEInScadenza.filter(v => !v.scheduledAppt).length > 3 && !expandedVisits && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedVisits(true)}
                    className="w-full text-xs"
                  >
                    Vedi altre {visiteScaduteEInScadenza.filter(v => !v.scheduledAppt).length - 3}
                  </Button>
                )}
                {expandedVisits && visiteScaduteEInScadenza.filter(v => !v.scheduledAppt).slice(3).map(v => {
                  const d = parseISO(v.next_visit_date);
                  const isExpired = isBefore(d, today);
                  return (
                    <div
                      key={v.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors gap-3 ${isExpired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}
                    >
                      <Link
                        to={`/pazienti/${v.patient_id}`}
                        className="min-w-0 hover:opacity-75"
                      >
                        <p className="text-sm font-medium truncate">{v.patient_name || '—'}</p>
                        <p className="text-xs text-muted-foreground truncate">{v.company_name || '—'}</p>
                      </Link>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setScheduleDialogContext({
                              type: 'visita_medica',
                              patientId: v.patient_id,
                              patientName: v.patient_name,
                              companyId: v.company_id,
                              companyName: v.company_name,
                            });
                            setScheduleDialogOpen(true);
                          }}
                          className="h-7 px-2 text-xs gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Programma
                        </Button>
                        <Badge className={`text-xs ${isExpired ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
                          {isExpired ? 'Scaduta' : 'Scad.'} {d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {expandedVisits && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedVisits(false)}
                    className="w-full text-xs"
                  >
                    Nascondi
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Sopralluoghi da effettuare */}
        <Card className="border-purple-300/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-purple-600">
              <MapPinned className="h-4 w-4" />
              Sopralluoghi da effettuare ({sopralluoghiInScadenza.filter(s => !s.scheduledAppt).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sopralluoghiInScadenza.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Tutti i sopralluoghi sono in regola</p>
            ) : (
              <>
                {sopralluoghiInScadenza.filter(s => !s.scheduledAppt).slice(0, 3).map(({ company, lastDate, nextDue, isExpired, scheduledAppt }) => (
              <div
                key={company?.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors gap-3 ${isExpired ? 'bg-red-50 border-red-200' : 'bg-purple-50 border-purple-200'}`}
              >
                <Link
                  to={`/aziende/${company?.id}`}
                  className="min-w-0 hover:opacity-75"
                >
                  <p className="text-sm font-medium truncate">{company?.name || '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {lastDate ? `Ultimo: ${lastDate.toLocaleDateString('it-IT')}` : 'Nessun sopralluogo registrato'}
                  </p>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setScheduleDialogContext({
                        type: 'sopralluogo',
                        patientId: null,
                        patientName: null,
                        companyId: company?.id,
                        companyName: company?.name,
                      });
                      setScheduleDialogOpen(true);
                    }}
                    className="h-7 px-2 text-xs gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Programma
                  </Button>
                  <Badge className={`text-xs ${isExpired ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-purple-100 text-purple-700 border border-purple-300'}`}>
                    {isExpired && !nextDue ? 'Da fare' : nextDue ? `Scad. ${nextDue.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}` : '—'}
                  </Badge>
                </div>
              </div>
            ))}
                {sopralluoghiInScadenza.filter(s => !s.scheduledAppt).length > 3 && !expandedSopralluoghi && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedSopralluoghi(true)}
                    className="w-full text-xs"
                  >
                    Vedi altri {sopralluoghiInScadenza.filter(s => !s.scheduledAppt).length - 3}
                  </Button>
                )}
                {expandedSopralluoghi && sopralluoghiInScadenza.filter(s => !s.scheduledAppt).slice(3).map(({ company, lastDate, nextDue, isExpired, scheduledAppt }) => (
                  <div
                    key={company?.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors gap-3 ${isExpired ? 'bg-red-50 border-red-200' : 'bg-purple-50 border-purple-200'}`}
                  >
                    <Link
                      to={`/aziende/${company?.id}`}
                      className="min-w-0 hover:opacity-75"
                    >
                      <p className="text-sm font-medium truncate">{company?.name || '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        {lastDate ? `Ultimo: ${lastDate.toLocaleDateString('it-IT')}` : 'Nessun sopralluogo registrato'}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setScheduleDialogContext({
                            type: 'sopralluogo',
                            patientId: null,
                            patientName: null,
                            companyId: company?.id,
                            companyName: company?.name,
                          });
                          setScheduleDialogOpen(true);
                        }}
                        className="h-7 px-2 text-xs gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Programma
                      </Button>
                      <Badge className={`text-xs ${isExpired ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-purple-100 text-purple-700 border border-purple-300'}`}>
                        {isExpired && !nextDue ? 'Da fare' : nextDue ? `Scad. ${nextDue.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}` : '—'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {expandedSopralluoghi && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedSopralluoghi(false)}
                    className="w-full text-xs"
                  >
                    Nascondi
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attività programmate — SPOSTATA QUI */}
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              Attività programmate
              <Badge variant="secondary" className="ml-auto">
                {appointments.filter(a => a.status === 'schedulato').length} da eseguire
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
           {appointments.filter(a => a.status === 'schedulato' || a.status === 'completato').length === 0 ? (
             <p className="text-sm text-muted-foreground text-center py-4">Nessuna attività programmata</p>
           ) : (
             <>
               <div className="space-y-2">
                 {appointments.filter(a => a.status === 'schedulato' || a.status === 'completato').sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5).map((item) => {
                   const isCompleted = item.status === 'completato';
                   return (
                     <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border gap-3 ${isCompleted ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-emerald-50 border-emerald-200'}`}>
                       <div className="min-w-0 flex-1">
                         {item.patient_name && (
                           <Link to={`/pazienti/${item.patient_id}`} className={`text-base font-semibold hover:text-primary hover:underline truncate block ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                             {item.patient_name}
                           </Link>
                         )}
                         {item.company_name && (
                           <Link to={`/aziende/${item.company_id}`} className="text-sm text-muted-foreground hover:text-primary hover:underline truncate block">
                             {item.company_name}
                           </Link>
                         )}
                       </div>
                       <div className="flex items-center gap-2 shrink-0">
                         <div className="flex flex-col items-end gap-1">
                           <Badge className={`text-xs ${isCompleted ? 'bg-slate-100 text-slate-500 border border-slate-300' : 'bg-amber-100 text-amber-700 border border-amber-300'}`}>
                             {format(parseISO(item.date), 'dd/MM/yyyy')}
                           </Badge>
                           <Badge className={`text-xs ${isCompleted ? 'bg-slate-100 text-slate-500 border border-slate-300' : item.appointment_type === 'sopralluogo' ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
                             {isCompleted ? '✓ Eseguita' : (item.appointment_type === 'sopralluogo' ? 'Sopralluogo' : item.visit_type ? item.visit_type.replace(/_/g, ' ') : 'Visita medica')}
                           </Badge>
                         </div>
                         {!isCompleted && (
                           <div className="flex gap-1">
                             <Link to={item.appointment_type === 'sopralluogo'
                               ? `/aziende/${item.company_id}`
                               : `/visita?patientId=${item.patient_id}&appointmentId=${item.id}`
                             }>
                               <Button size="sm" className="h-8 px-2 text-xs gap-1 bg-primary hover:bg-primary/90">
                                 <PlayCircle className="h-3 w-3" />
                                 Esegui ora
                               </Button>
                             </Link>
                             <Button
                               size="sm"
                               variant="outline"
                               className="h-8 px-2 text-xs gap-1 border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                               onClick={() => markCompletedMutation.mutate(item.id)}
                               disabled={markCompletedMutation.isPending}
                             >
                               <CheckCircle2 className="h-3 w-3" />
                               Eseguito
                             </Button>
                           </div>
                         )}
                       </div>
                     </div>
                   );
                 })}
               </div>
               {appointments.filter(a => a.status === 'schedulato' || a.status === 'completato').length > 5 && !expandedActivities && (
                 <Button variant="outline" size="sm" onClick={() => setExpandedActivities(true)} className="w-full text-xs mt-2">
                   Vedi altre {appointments.filter(a => a.status === 'schedulato' || a.status === 'completato').length - 5}
                 </Button>
               )}
               {expandedActivities && (
                 <div className="space-y-2 mt-2">
                   {appointments.filter(a => a.status === 'schedulato' || a.status === 'completato').sort((a, b) => new Date(a.date) - new Date(b.date)).slice(5).map((item) => {
                     const isCompleted = item.status === 'completato';
                     return (
                       <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border gap-3 ${isCompleted ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-emerald-50 border-emerald-200'}`}>
                         <div className="min-w-0 flex-1">
                           {item.patient_name && (
                             <Link to={`/pazienti/${item.patient_id}`} className={`text-base font-semibold hover:text-primary hover:underline truncate block ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                               {item.patient_name}
                             </Link>
                           )}
                           {item.company_name && (
                             <Link to={`/aziende/${item.company_id}`} className="text-sm text-muted-foreground hover:text-primary hover:underline truncate block">
                               {item.company_name}
                             </Link>
                           )}
                         </div>
                         <div className="flex items-center gap-2 shrink-0">
                           <div className="flex flex-col items-end gap-1">
                             <Badge className={`text-xs ${isCompleted ? 'bg-slate-100 text-slate-500 border border-slate-300' : 'bg-amber-100 text-amber-700 border border-amber-300'}`}>
                               {format(parseISO(item.date), 'dd/MM/yyyy')}
                             </Badge>
                             <Badge className={`text-xs ${isCompleted ? 'bg-slate-100 text-slate-500 border border-slate-300' : item.appointment_type === 'sopralluogo' ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
                               {isCompleted ? '✓ Eseguita' : (item.appointment_type === 'sopralluogo' ? 'Sopralluogo' : item.visit_type ? item.visit_type.replace(/_/g, ' ') : 'Visita medica')}
                             </Badge>
                           </div>
                           {!isCompleted && (
                             <div className="flex gap-1">
                               <Link to={item.appointment_type === 'sopralluogo'
                                 ? `/aziende/${item.company_id}`
                                 : `/visita?patientId=${item.patient_id}&appointmentId=${item.id}`
                               }>
                                 <Button size="sm" className="h-8 px-2 text-xs gap-1 bg-primary hover:bg-primary/90">
                                   <PlayCircle className="h-3 w-3" />
                                   Esegui ora
                                 </Button>
                               </Link>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 className="h-8 px-2 text-xs gap-1 border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                                 onClick={() => markCompletedMutation.mutate(item.id)}
                                 disabled={markCompletedMutation.isPending}
                               >
                                 <CheckCircle2 className="h-3 w-3" />
                                 Eseguito
                               </Button>
                             </div>
                           )}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               )}
               {expandedActivities && (
                 <Button variant="outline" size="sm" onClick={() => setExpandedActivities(false)} className="w-full text-xs mt-2">
                   Nascondi
                 </Button>
               )}
             </>
           )}
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

      {/* Schedule Appointment Dialog */}
      <ScheduleAppointmentDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        appointmentType={scheduleDialogContext.type}
        patientId={scheduleDialogContext.patientId}
        patientName={scheduleDialogContext.patientName}
        companyId={scheduleDialogContext.companyId}
        companyName={scheduleDialogContext.companyName}
      />
    </div>
  );
}