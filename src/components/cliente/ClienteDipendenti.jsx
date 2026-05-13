import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, User } from 'lucide-react';

const judgmentColors = {
  idoneo: 'bg-green-100 text-green-700 border-green-200',
  idoneo_con_prescrizioni: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  idoneo_con_limitazioni: 'bg-orange-100 text-orange-700 border-orange-200',
  temporaneamente_non_idoneo: 'bg-red-100 text-red-700 border-red-200',
  non_idoneo: 'bg-red-200 text-red-800 border-red-300',
};
const judgmentLabel = {
  idoneo: 'Idoneo',
  idoneo_con_prescrizioni: 'Idoneo con prescrizioni',
  idoneo_con_limitazioni: 'Idoneo con limitazioni',
  temporaneamente_non_idoneo: 'Temp. non idoneo',
  non_idoneo: 'Non idoneo',
};

export default function ClienteDipendenti({ patients, visits }) {
  const [search, setSearch] = useState('');

  const active = patients.filter(p => p.status !== 'inactive');

  const filtered = active.filter(p => {
    const name = `${p.last_name} ${p.first_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) || (p.job_role_name || '').toLowerCase().includes(search.toLowerCase());
  });

  const getLastVisit = (patientId) => {
    return visits
      .filter(v => String(v.patient_id) === String(patientId) && v.visit_status === 'conclusa')
      .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date))[0];
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca dipendente o mansione..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="text-sm text-muted-foreground">{filtered.length} dipendenti</div>

      <div className="grid gap-3">
        {filtered.map(p => {
          const lastVisit = getLastVisit(p.id);
          return (
            <Card key={p.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{p.last_name} {p.first_name}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.job_role_name || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 text-right">
                    <div className="hidden sm:block">
                      <div className="text-xs text-muted-foreground">Ultima visita</div>
                      <div className="text-xs font-medium">{lastVisit ? fmtDate(lastVisit.visit_date) : '—'}</div>
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-xs text-muted-foreground">Prossima visita</div>
                      <div className="text-xs font-medium">{lastVisit?.next_visit_date ? fmtDate(lastVisit.next_visit_date) : '—'}</div>
                    </div>
                    {lastVisit?.judgment ? (
                      <Badge className={`text-xs border ${judgmentColors[lastVisit.judgment] || 'bg-muted text-muted-foreground'}`}>
                        {judgmentLabel[lastVisit.judgment] || lastVisit.judgment}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">Nessuna visita</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-12 text-sm">Nessun dipendente trovato</div>
        )}
      </div>
    </div>
  );
}