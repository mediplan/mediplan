import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ClienteScadenze({ visits, patients }) {
  const [filter, setFilter] = useState('all'); // all | expired | expiring | ok

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in30 = new Date(today); in30.setDate(today.getDate() + 30);
  const in60 = new Date(today); in60.setDate(today.getDate() + 60);

  const fmtDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
  };

  // Ultima visita conclusa per ogni paziente
  const patientLastVisit = {};
  visits.forEach(v => {
    if (v.visit_status !== 'conclusa' || !v.next_visit_date) return;
    const pid = String(v.patient_id);
    if (!patientLastVisit[pid] || new Date(v.visit_date) > new Date(patientLastVisit[pid].visit_date)) {
      patientLastVisit[pid] = v;
    }
  });

  const rows = Object.values(patientLastVisit).map(v => {
    const nextDate = new Date(v.next_visit_date);
    nextDate.setHours(0, 0, 0, 0);
    let status;
    if (nextDate < today) status = 'expired';
    else if (nextDate <= in30) status = 'urgent';
    else if (nextDate <= in60) status = 'expiring';
    else status = 'ok';
    return { ...v, nextDate, status };
  }).sort((a, b) => a.nextDate - b.nextDate);

  const filtered = filter === 'all' ? rows : rows.filter(r => {
    if (filter === 'expired') return r.status === 'expired';
    if (filter === 'expiring') return r.status === 'urgent' || r.status === 'expiring';
    if (filter === 'ok') return r.status === 'ok';
    return true;
  });

  const counts = {
    expired: rows.filter(r => r.status === 'expired').length,
    urgent: rows.filter(r => r.status === 'urgent').length,
    expiring: rows.filter(r => r.status === 'expiring').length,
    ok: rows.filter(r => r.status === 'ok').length,
  };

  const statusConfig = {
    expired: { label: 'Scaduta', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
    urgent: { label: 'Urgente (< 30gg)', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle },
    expiring: { label: 'In scadenza (< 60gg)', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
    ok: { label: 'Regolare', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  };

  return (
    <div className="space-y-4">
      {/* Filtri rapidi */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: `Tutti (${rows.length})` },
          { key: 'expired', label: `Scadute (${counts.expired})` },
          { key: 'expiring', label: `In scadenza (${counts.urgent + counts.expiring})` },
          { key: 'ok', label: `Regolari (${counts.ok})` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === f.key
                ? 'bg-primary text-white border-primary'
                : 'bg-background border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.map(v => {
          const cfg = statusConfig[v.status];
          const Icon = cfg.icon;
          const pat = patients.find(p => String(p.id) === String(v.patient_id));

          return (
            <Card key={v.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{v.patient_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {pat?.job_role_name || '—'} · Ultima visita: {fmtDate(v.visit_date)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-muted-foreground">Prossima visita</div>
                      <div className="text-sm font-semibold">{fmtDate(v.next_visit_date)}</div>
                    </div>
                    <Badge className={`text-xs border ${cfg.color}`}>
                      {cfg.label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-12 text-sm">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-400" />
            Nessuna scadenza in questa categoria
          </div>
        )}
      </div>
    </div>
  );
}