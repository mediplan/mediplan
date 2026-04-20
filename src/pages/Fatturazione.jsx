import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { canAccess } from '@/lib/roles';
import AccessDenied from '@/components/shared/AccessDenied';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';
import { Receipt, Building2, Download, FileCode } from 'lucide-react';
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

// Accertamenti integrativi: campo → etichetta
const EXAM_FIELDS = [
  { key: 'audiometry_result', label: 'Audiometria' },
  { key: 'spirometry_result', label: 'Spirometria' },
  { key: 'ecg_result', label: 'ECG' },
  { key: 'blood_tests_result', label: 'Esami ematici' },
  { key: 'urine_test_result', label: 'Esame urine' },
  { key: 'visual_acuity', label: 'Acuità visiva' },
  { key: 'drug_test_result', label: 'Droga Test' },
  { key: 'other_exams', label: 'Altri accertamenti' },
];

function getExams(v) {
  return EXAM_FIELDS.filter(f => v[f.key] && String(v[f.key]).trim() !== '');
}

export default function Fatturazione() {
  const { user } = useAuth();
  const today = new Date();
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [groupBy, setGroupBy] = useState('company');

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['medicalVisits'],
    queryFn: () => base44.entities.MedicalVisit.list('-visit_date', 5000),
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

  // Totali accertamenti per tipo
  const examTotals = useMemo(() => {
    const map = {};
    for (const v of filtered) {
      for (const f of EXAM_FIELDS) {
        if (v[f.key] && String(v[f.key]).trim() !== '') {
          map[f.key] = (map[f.key] || 0) + 1;
        }
      }
    }
    return map;
  }, [filtered]);

  const totalExams = Object.values(examTotals).reduce((a, b) => a + b, 0);

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

  if (!canAccess(user, 'fatturazione')) return <AccessDenied />;

  // ─── Export XML Danea EasyFatt ───────────────────────────────────────────────
  const handleExportDanea = () => {
    const rows = filtered.map((v, i) => {
      const exams = getExams(v);
      const desc = [VISIT_TYPE_LABELS[v.visit_type] || v.visit_type, ...exams.map(e => e.label)].join(', ');
      return `
    <Documento>
      <TipoDocumento>F</TipoDocumento>
      <Numero>${i + 1}</Numero>
      <Data>${v.visit_date || ''}</Data>
      <ClienteDescrizione>${escXml(v.company_name || '')}</ClienteDescrizione>
      <Righe>
        <Riga>
          <Descrizione>${escXml(desc)}</Descrizione>
          <Qta>1</Qta>
          <PrezzoUnitario>0.00</PrezzoUnitario>
          <CodiceIVA>22</CodiceIVA>
        </Riga>
      </Righe>
    </Documento>`;
    });
    const xml = `<?xml version="1.0" encoding="utf-8"?>\n<EasyFatt xmlns="http://www.danea.it/software/easyfatt/xml">\n  <Azienda>\n    <Documenti>${rows.join('')}\n    </Documenti>\n  </Azienda>\n</EasyFatt>`;
    downloadXml(xml, `danea_${dateFrom}_${dateTo}.xml`);
  };

  // ─── Export XML FattureInCloud / TeamSystem ───────────────────────────────────
  const handleExportFIC = () => {
    const now = new Date().toISOString().split('T')[0];
    const items = filtered.map((v, i) => {
      const exams = getExams(v);
      const desc = [VISIT_TYPE_LABELS[v.visit_type] || v.visit_type, ...exams.map(e => e.label)].join(', ');
      return `
    <fattura>
      <progressivo>${i + 1}</progressivo>
      <data>${v.visit_date || now}</data>
      <cliente>
        <ragione_sociale>${escXml(v.company_name || '')}</ragione_sociale>
      </cliente>
      <righe>
        <riga>
          <descrizione>${escXml(desc)}</descrizione>
          <quantita>1</quantita>
          <prezzo_netto>0.00</prezzo_netto>
          <aliquota_iva>22</aliquota_iva>
        </riga>
      </righe>
    </fattura>`;
    });
    const xml = `<?xml version="1.0" encoding="utf-8"?>\n<fatture_in_cloud>\n  <fatture>${items.join('')}\n  </fatture>\n</fatture_in_cloud>`;
    downloadXml(xml, `fic_${dateFrom}_${dateTo}.xml`);
  };

  function escXml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function downloadXml(xml, filename) {
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  const handleExportCSV = () => {
    const rows = [
      ['Data', 'Paziente', 'Azienda', 'Tipo visita', 'Giudizio', 'Accertamenti integrativi'],
      ...filtered.map(v => [
        v.visit_date,
        v.patient_name || '',
        v.company_name || '',
        VISIT_TYPE_LABELS[v.visit_type] || v.visit_type || '',
        v.judgment || '',
        getExams(v).map(f => f.label).join(' | '),
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
      <PageHeader title="Fatturazione" description="Conteggio prestazioni eseguite per periodo" />

      {/* Filtri periodo */}
      <Card className="mb-6">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Dal</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 w-40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Al</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 w-40" />
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
              <Button variant="outline" size="sm" onClick={handleExportDanea}>
                <FileCode className="h-4 w-4 mr-1" />
                XML Danea
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportFIC}>
                <FileCode className="h-4 w-4 mr-1" />
                XML FattureInCloud
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Riepilogo visite */}
      <div className="mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Visite</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Totale visite</div>
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
      </div>

      {/* Riepilogo accertamenti integrativi */}
      {totalExams > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Accertamenti integrativi</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <Card className="p-4 border-accent/30">
              <div className="text-xs text-muted-foreground mb-1">Totale accertamenti</div>
              <div className="text-2xl font-bold text-accent">{totalExams}</div>
            </Card>
            {EXAM_FIELDS.filter(f => examTotals[f.key]).map(f => (
              <Card key={f.key} className="p-4">
                <div className="text-xs text-muted-foreground mb-1">{f.label}</div>
                <div className="text-2xl font-bold">{examTotals[f.key]}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tabella */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Caricamento...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground text-sm border-dashed">
          Nessuna prestazione nel periodo selezionato
        </Card>
      ) : groupBy === 'company' ? (
        <div className="space-y-6">
          {byCompany.map(group => {
            const groupExamTotal = group.visits.reduce((sum, v) => sum + getExams(v).length, 0);
            return (
              <Card key={group.company_id || 'nessuna'}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-primary" />
                    {group.company_name}
                    <div className="ml-auto flex gap-2">
                      <Badge variant="secondary">{group.visits.length} visite</Badge>
                      {groupExamTotal > 0 && <Badge variant="outline" className="text-accent border-accent/40">{groupExamTotal} accertamenti</Badge>}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VisitTable visits={group.visits} />
                </CardContent>
              </Card>
            );
          })}
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
            <TableHead className="hidden sm:table-cell">Tipo visita</TableHead>
            <TableHead>Accertamenti</TableHead>
            <TableHead className="hidden md:table-cell">Giudizio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(v => {
            const exams = getExams(v);
            return (
              <TableRow key={v.id}>
                <TableCell className="text-sm whitespace-nowrap">
                  {v.visit_date ? format(parseISO(v.visit_date), 'dd/MM/yyyy') : '—'}
                </TableCell>
                <TableCell className="font-medium text-sm">{v.patient_name || '—'}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline" className="text-xs">
                    {VISIT_TYPE_LABELS[v.visit_type] || v.visit_type || '—'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {exams.length === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {exams.map(f => (
                        <Badge key={f.key} className="text-xs bg-accent/10 text-accent border-0">{f.label}</Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {v.judgment ? v.judgment.replace(/_/g, ' ') : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}