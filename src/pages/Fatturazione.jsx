import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';
import { Receipt, Building2, Stethoscope, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/shared/PageHeader';

const VISIT_TYPE_LABELS = {
  preventiva: 'Visita preventiva',
  periodica: 'Visita periodica',
  su_richiesta: 'Visita su richiesta',
  cambio_mansione: 'Cambio mansione',
  rientro_malattia: 'Rientro malattia',
  cessazione: 'Visita cessazione',
};

export default function Fatturazione() {
  const today = new Date();
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [groupBy, setGroupBy] = useState('company'); // 'company' | 'none'

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['medicalVisits'],
    queryFn: () => base44.entities.MedicalVisit.list('-visit_date', 5000),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const filtered = useMemo(() => {
    const from = dateFrom ? parseISO(dateFrom) : null;
    const to = dateTo ? parseISO(dateTo) : null;
    return visits.filter(v => {
      if (!v.visit_date) return false;
      const d = parseISO(v.visit_date);
      if (from && isBefore(d, from)) return false;
      if (to && isAfter(d, to)) return false;
      return true;
    });
  }, [visits, dateFrom, dateTo]);

  // Raggruppa per azienda
  const byCompany = useMemo(() => {
    const map = {};
    for (const v of filtered) {
      const key = v.company_id || '__nessuna__';
      if (!map[key]) {
        map[key] = {
          company_id: v.company_id,
          company_name: v.company_name || 'Azienda non specificata',
          visits: [],
        };
      }
      map[key].visits.push(v);
    }
    return Object.values(map).sort((a, b) => a.company_name.localeCompare(b.company_name));
  }, [filtered]);

  // Conteggio per tipo visita
  const countByType = useMemo(() => {
    const map = {};
    for (const v of filtered) {
      const t = v.visit_type || 'altro';
      map[t] = (map[t] || 0) + 1;
    }
    return map;
  }, [filtered]);

  const handleExportCSV = () => {
    const rows = [
      ['Data', 'Paziente', 'Azienda', 'Tipo visita', 'Giudizio'],
      ...filtered.map(v => [
        v.visit_date,
        v.patient_name || '',
        v.company_name || '',
        VISIT_TYPE_LABELS[v.visit_type] || v.visit_type || '',
        v.judgment || '',
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fatturazione_${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Fatturazione"
        description="Conteggio prestazioni eseguite per periodo"
      />

      {/* Filtri periodo */}
      <Card className="mb-6">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Dal</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="h-9 w-40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Al</label>
              <Input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="h-9 w-40"
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <Button
                variant={groupBy === 'company' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGroupBy(groupBy === 'company' ? 'none' : 'company')}
              >
                <Building2 className="h-4 w-4 mr-1" />
                Raggruppa per azienda
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-1" />
                Esporta CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Riepilogo totali */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Totale prestazioni</div>
          <div className="text-2xl font-bold text-primary">{filtered.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Aziende coinvolte</div>
          <div className="text-2xl font-bold">{byCompany.length}</div>
        </Card>
        {Object.entries(countByType).map(([type, count]) => (
          <Card key={type} className="p-4">
            <div className="text-xs text-muted-foreground mb-1">{VISIT_TYPE_LABELS[type] || type}</div>
            <div className="text-2xl font-bold">{count}</div>
          </Card>
        ))}
      </div>

      {/* Tabella */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Caricamento...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground text-sm border-dashed">
          Nessuna prestazione nel periodo selezionato
        </Card>
      ) : groupBy === 'company' ? (
        <div className="space-y-6">
          {byCompany.map(group => (
            <Card key={group.company_id || 'nessuna'}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-primary" />
                  {group.company_name}
                  <Badge variant="secondary" className="ml-auto">{group.visits.length} prestazioni</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VisitTable visits={group.visits} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <VisitTable visits={filtered} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function VisitTable({ visits }) {
  const sorted = [...visits].sort((a, b) => (a.visit_date > b.visit_date ? -1 : 1));
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Paziente</TableHead>
            <TableHead className="hidden sm:table-cell">Azienda</TableHead>
            <TableHead>Tipo visita</TableHead>
            <TableHead className="hidden md:table-cell">Giudizio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(v => (
            <TableRow key={v.id}>
              <TableCell className="text-sm whitespace-nowrap">
                {v.visit_date ? format(parseISO(v.visit_date), 'dd/MM/yyyy') : '—'}
              </TableCell>
              <TableCell className="font-medium text-sm">{v.patient_name || '—'}</TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{v.company_name || '—'}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {VISIT_TYPE_LABELS[v.visit_type] || v.visit_type || '—'}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                {v.judgment ? v.judgment.replace(/_/g, ' ') : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}