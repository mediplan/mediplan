import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, Users, Briefcase, AlertTriangle, CalendarClock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { format, isBefore, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import StatCard from '@/components/shared/StatCard';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';

export default function Dashboard() {
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });
  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list(),
  });
  const { data: jobRoles = [] } = useQuery({
    queryKey: ['jobRoles'],
    queryFn: () => base44.entities.JobRole.list(),
  });
  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.MedicalVisit.list('-visit_date', 100),
  });

  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const activePatients = patients.filter(p => p.status === 'active').length;

  // Upcoming visits (next 30 days)
  const today = new Date();
  const in30Days = addDays(today, 30);
  const upcomingVisits = visits.filter(v => {
    if (!v.next_visit_date) return false;
    const d = new Date(v.next_visit_date);
    return d >= today && d <= in30Days;
  });

  // Overdue visits
  const overdueVisits = visits.filter(v => {
    if (!v.next_visit_date) return false;
    return isBefore(new Date(v.next_visit_date), today);
  });

  const recentVisits = visits.slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Panoramica della sorveglianza sanitaria"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Aziende attive" value={activeCompanies} icon={Building2} color="blue" />
        <StatCard label="Lavoratori attivi" value={activePatients} icon={Users} color="teal" />
        <StatCard label="Mansioni" value={jobRoles.length} icon={Briefcase} color="purple" />
        <StatCard label="Visite totali" value={visits.length} icon={FileHeart} color="amber" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h2 className="text-sm font-semibold text-foreground">Scadenze imminenti</h2>
          </div>
          {overdueVisits.length === 0 && upcomingVisits.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna scadenza imminente</p>
          ) : (
            <div className="space-y-3">
              {overdueVisits.slice(0, 3).map(v => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                  <div>
                    <p className="text-sm font-medium text-foreground">{v.patient_name}</p>
                    <p className="text-xs text-muted-foreground">{v.company_name}</p>
                  </div>
                  <span className="text-xs font-medium text-destructive">
                    Scaduta il {v.next_visit_date ? format(new Date(v.next_visit_date), 'dd MMM yyyy', { locale: it }) : ''}
                  </span>
                </div>
              ))}
              {upcomingVisits.slice(0, 3).map(v => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-chart-4/5 border border-chart-4/10">
                  <div>
                    <p className="text-sm font-medium text-foreground">{v.patient_name}</p>
                    <p className="text-xs text-muted-foreground">{v.company_name}</p>
                  </div>
                  <span className="text-xs font-medium text-chart-4">
                    {v.next_visit_date ? format(new Date(v.next_visit_date), 'dd MMM yyyy', { locale: it }) : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent visits */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Ultime visite</h2>
            </div>
            <Link to="/visite" className="text-xs text-primary font-medium hover:underline">
              Vedi tutte
            </Link>
          </div>
          {recentVisits.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna visita registrata</p>
          ) : (
            <div className="space-y-3">
              {recentVisits.map(v => (
                <div key={v.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{v.patient_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.visit_date ? format(new Date(v.visit_date), 'dd/MM/yyyy') : ''} · {v.visit_type?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  {v.judgment && <StatusBadge status={v.judgment} />}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}