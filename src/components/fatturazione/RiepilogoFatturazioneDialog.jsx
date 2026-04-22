import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, FileText, Printer, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

const VISIT_TYPE_LABELS = {
  preventiva: 'Visita preventiva',
  periodica: 'Visita periodica',
  su_richiesta: 'Visita su richiesta',
  cambio_mansione: 'Cambio mansione',
  rientro_malattia: 'Rientro malattia',
  cessazione: 'Visita cessazione',
};

const EXAM_FIELDS = [
  { key: 'audiometry_result', label: 'Audiometria' },
  { key: 'spirometry_result', label: 'Spirometria' },
  { key: 'ecg_result', label: 'ECG' },
  { key: 'blood_tests_result', label: 'Esami ematici' },
  { key: 'drug_test_result', label: 'Droga Test' },
  { key: 'alcohol_test_result', label: 'Alcol Test' },
  { key: 'visiotest_result', label: 'Visiotest' },
  { key: 'upper_limbs_eval_result', label: 'Val. arti superiori' },
  { key: 'other_exams', label: 'Altri accertamenti' },
];

function getExams(v) {
  return EXAM_FIELDS.filter(f => v[f.key] && String(v[f.key]).trim() !== '');
}

// Raggruppa per azienda, calcola importi da listino aziendale
function buildGroups(visits, companyPriceLists) {
  const map = {};
  for (const v of visits) {
    if (v.billed) continue; // già fatturate
    const key = v.company_id || '__nessuna__';
    if (!map[key]) {
      map[key] = {
        company_id: v.company_id,
        company_name: v.company_name || 'Azienda non specificata',
        visits: [],
        priceList: companyPriceLists.find(pl => pl.company_id === v.company_id) || null,
      };
    }
    map[key].visits.push(v);
  }
  return Object.values(map).sort((a, b) => a.company_name.localeCompare(b.company_name));
}

function calcTotal(visits, priceList) {
  if (!priceList?.items?.length) return null;
  // Stima: somma importi delle prime voci del listino (visita + accertamenti)
  // Mapping semplice: prima voce = visita, voci successive = accertamenti
  const items = priceList.items;
  let total = 0;
  for (const v of visits) {
    const exams = getExams(v);
    // Prima voce = visita medica
    if (items[0]) total += Number(items[0].amount) || 0;
    // Voci successive matchate per numero accertamento
    for (let i = 0; i < exams.length; i++) {
      if (items[i + 1]) total += Number(items[i + 1].amount) || 0;
    }
  }
  return total;
}

// Genera HTML proforma per la stampa
function generateProformaHTML(group, dateFrom, dateTo) {
  const today = format(new Date(), 'dd/MM/yyyy');
  const rows = group.visits.map(v => {
    const exams = getExams(v);
    const desc = [VISIT_TYPE_LABELS[v.visit_type] || v.visit_type, ...exams.map(e => e.label)].join(', ');
    const amount = group.priceList?.items?.[0] ? Number(group.priceList.items[0].amount).toFixed(2) : '—';
    return `<tr>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;">${v.visit_date ? format(parseISO(v.visit_date), 'dd/MM/yyyy') : '—'}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;">${v.patient_name || '—'}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;">${desc}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;">${amount}</td>
    </tr>`;
  }).join('');

  const total = group.priceList ? calcTotal(group.visits, group.priceList) : null;

  return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8">
  <title>Proforma – ${group.company_name}</title>
  <style>body{font-family:Arial,sans-serif;font-size:13px;color:#222;padding:40px;}h1{font-size:18px;margin-bottom:4px;}table{width:100%;border-collapse:collapse;margin-top:20px;}th{background:#f5f5f5;padding:8px 10px;text-align:left;font-size:12px;border-bottom:2px solid #ddd;}tfoot td{font-weight:bold;padding:8px 10px;border-top:2px solid #ddd;}</style>
  </head><body>
  <h1>Documento Proforma</h1>
  <p style="color:#666;margin-bottom:20px;">Periodo: ${dateFrom} – ${dateTo} &nbsp;|&nbsp; Emesso il: ${today}</p>
  <hr/>
  <p><strong>Cliente:</strong> ${group.company_name}</p>
  <table>
    <thead><tr><th>Data</th><th>Paziente</th><th>Prestazione</th><th style="text-align:right">Importo €</th></tr></thead>
    <tbody>${rows}</tbody>
    ${total !== null ? `<tfoot><tr><td colspan="3">Totale stimato</td><td style="text-align:right">${total.toFixed(2)} €</td></tr></tfoot>` : ''}
  </table>
  <p style="margin-top:30px;font-size:11px;color:#888;">Documento non avente valore fiscale. Emesso a fini di riepilogo interno.</p>
  </body></html>`;
}

export default function RiepilogoFatturazioneDialog({ open, onClose, visits, dateFrom, dateTo, onBilled }) {
  const [emitting, setEmitting] = useState(false);
  const [done, setDone] = useState(false);
  const queryClient = useQueryClient();

  const { data: companyPriceLists = [] } = useQuery({
    queryKey: ['companyPriceLists-all'],
    queryFn: () => base44.entities.CompanyPriceList.list(),
    enabled: open,
  });

  const groups = useMemo(() => buildGroups(visits, companyPriceLists), [visits, companyPriceLists]);

  const totalUnbilled = groups.reduce((s, g) => s + g.visits.length, 0);

  const handlePrintProforma = (group) => {
    const html = generateProformaHTML(
      group,
      dateFrom ? format(parseISO(dateFrom), 'dd/MM/yyyy') : '',
      dateTo ? format(parseISO(dateTo), 'dd/MM/yyyy') : ''
    );
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
  };

  const handleEmitAll = async () => {
    setEmitting(true);
    const now = new Date().toISOString();
    const allVisitIds = groups.flatMap(g => g.visits.map(v => v.id));
    // Marca tutte le visite come fatturate
    await Promise.all(allVisitIds.map(id =>
      base44.entities.MedicalVisit.update(id, { billed: true, billed_at: now })
    ));
    // Stampa un proforma per ogni azienda
    for (const group of groups) {
      handlePrintProforma(group);
    }
    queryClient.invalidateQueries({ queryKey: ['medicalVisits'] });
    setEmitting(false);
    setDone(true);
    if (onBilled) onBilled();
  };

  const handleClose = () => {
    setDone(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Riepilogo prestazioni da fatturare
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="py-12 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="font-semibold text-lg">Fatture proforma emesse!</p>
            <p className="text-sm text-muted-foreground">Le {totalUnbilled} prestazioni sono state marcate come fatturate e non compariranno nei prossimi cicli.</p>
            <Button onClick={handleClose}>Chiudi</Button>
          </div>
        ) : (
          <>
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <span>Le prestazioni già fatturate sono escluse. Vengono mostrate solo le <strong>{totalUnbilled} prestazioni</strong> non ancora fatturate nel periodo selezionato.</span>
            </div>

            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nessuna prestazione da fatturare nel periodo selezionato.</p>
            ) : (
              <div className="space-y-4">
                {groups.map(group => {
                  const total = calcTotal(group.visits, group.priceList);
                  return (
                    <div key={group.company_id || 'nessuna'} className="border border-border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-muted/40">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-sm">{group.company_name}</span>
                          <Badge variant="secondary" className="text-xs">{group.visits.length} visite</Badge>
                          {total !== null && (
                            <Badge variant="outline" className="text-xs font-mono">{total.toFixed(2)} €</Badge>
                          )}
                          {!group.priceList && (
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">nessun listino</Badge>
                          )}
                        </div>
                        <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => handlePrintProforma(group)}>
                          <Printer className="h-3.5 w-3.5" />
                          Proforma
                        </Button>
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground border-b border-border">
                            <th className="text-left px-4 py-2 font-medium">Data</th>
                            <th className="text-left px-4 py-2 font-medium">Paziente</th>
                            <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Prestazione</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.visits.map(v => (
                            <tr key={v.id} className="border-b border-border/50 last:border-0">
                              <td className="px-4 py-2 whitespace-nowrap">
                                {v.visit_date ? format(parseISO(v.visit_date), 'dd/MM/yyyy') : '—'}
                              </td>
                              <td className="px-4 py-2">{v.patient_name || '—'}</td>
                              <td className="px-4 py-2 hidden sm:table-cell text-muted-foreground">
                                {VISIT_TYPE_LABELS[v.visit_type] || v.visit_type}
                                {getExams(v).length > 0 && ` + ${getExams(v).length} acc.`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}

            <DialogFooter className="mt-6 gap-2">
              <Button variant="outline" onClick={handleClose}>Annulla</Button>
              {groups.length > 0 && (
                <Button
                  onClick={handleEmitAll}
                  disabled={emitting}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {emitting ? 'Emissione in corso...' : `Emetti ${groups.length} proforma e segna come fatturate`}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}