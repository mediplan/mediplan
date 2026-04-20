import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, Users, Stethoscope, CheckCircle2, Clock, AlertTriangle, TrendingUp, MapPinned } from 'lucide-react';
import { parseISO, format, startOfMonth, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/shared/StatCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const VISIT_TYPE_LABELS = {
  preventiva: 'Preventiva',
  periodica: 'Periodica',
  su_richiesta: 'Su richiesta',
  cambio_mansione: 'Cambio mansione',
  rientro_malattia: 'Rientro malattia',
  cessazione: 'Cessazione',
};

const JUDGMENT_LABELS = {
  idoneo: 'Idoneo',
  idoneo_con_prescrizioni: 'Con prescrizioni',
  idoneo_con_limitazioni: 'Con limitazioni',
  temporaneamente_non_idoneo: 'Temp. non idoneo',
  non_idoneo: 'Non idoneo',
};

const JUDGMENT_COLORS = {
  idoneo: '#22c55e',
  idoneo_con_prescrizioni: '#f59e0b',
  idoneo_con_limitazioni: '#f97316',
  temporaneamente_non_idoneo: '#ef4444',
  non_idoneo: '#dc2626',
};

export default function Statistiche() {
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

  // KPI base
  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const activePatients = patients.filter(p => p.status === 'active').length;
  const concludedVisits = visits.filter(v => v.visit_status === 'conclusa').length;
  const pendingVisits = visits.filter(v => v.visit_status === 'in_corso' || v.visit_status === 'sospesa').length;

  // Visite per tipo
  const visitsByType = useMemo(() => {
    const counts = {};
    for (const v of visits) {
      if (v.visit_status !== 'conclusa') continue;
      counts[v.visit_type] = (counts[v.visit_type] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([type, count]) => ({ name: VISIT_TYPE_LABELS[type] || type, count }))
      .sort((a, b) => b.count - a.count);
  }, [visits]);

  // Visite per giudizio
  const visitsByJudgment = useMemo(() => {
    const counts = {};
    for (const v of visits) {
      if (!v.judgment) continue;
      counts[v.judgment] = (counts[v.judgment] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([j, count]) => ({ name: JUDGMENT_LABELS[j] || j, count, key: j }))
      .sort((a, b) => b.count - a.count);
  }, [visits]);

  // Visite negli ultimi 6 mesi
  const visitsByMonth = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(new Date(), i);
      const key = format(m, 'yyyy-MM');
      months.push({ key, label: format(m, 'MMM yy', { locale: it }), count: 0 });
    }
    for (const v of visits) {
      if (!v.visit_date) continue;
      const key = format(parseISO(v.visit_date), 'yyyy-MM');
      const entry = months.find(m => m.key === key);
      if (entry) entry.count++;
    }
    return months;
  }, [visits]);

  // Top 5 aziende per numero di visite
  const topCompanies = useMemo(() => {
    const counts = {};
    for (const v of visits) {
      if (!v.company_id) continue;
      counts[v.company_id] = counts[v.company_id] || { name: v.company_name || '—', count: 0 };
      counts[v.company_id].count++;
    }
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [visits]);

  return (
    <div>
      <PageHeader title="Statistiche" description="Panoramica e analisi dei dati" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Aziende attive" value={activeCompanies} icon={Building2} color="blue" />
        <StatCard label="Lavoratori attivi" value={activePatients} icon={Users} color="teal" />
        <StatCard label="Visite concluse" value={concludedVisits} icon={CheckCircle2} color="purple" />
        <StatCard label="Visite in sospeso" value={pendingVisits} icon={Clock} color="orange" />
      </div>

      {/* Grafici riga 1 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">

        {/* Visite ultimi 6 mesi */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              Visite — ultimi 6 mesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={visitsByMonth} barSize={28}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Visite" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Visite per tipo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Stethoscope className="h-4 w-4 text-primary" />
              Visite per tipologia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visitsByType.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nessun dato</p>
            ) : (
              <div className="space-y-2">
                {visitsByType.map(({ name, count }) => {
                  const pct = concludedVisits > 0 ? Math.round((count / concludedVisits) * 100) : 0;
                  return (
                    <div key={name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground">{name}</span>
                        <span className="text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grafici riga 2 */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Giudizi di idoneità */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Giudizi di idoneità
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visitsByJudgment.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nessun dato</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={visitsByJudgment} barSize={28}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Visite" radius={[4,4,0,0]}>
                    {visitsByJudgment.map((entry) => (
                      <Cell key={entry.key} fill={JUDGMENT_COLORS[entry.key] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top aziende per visite */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-primary" />
              Top 5 aziende per visite effettuate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCompanies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nessun dato</p>
            ) : (
              <div className="space-y-3">
                {topCompanies.map(({ name, count }, i) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary shrink-0">{count}</span>
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