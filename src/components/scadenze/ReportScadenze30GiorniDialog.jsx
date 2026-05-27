import React, { useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format, parseISO, addDays, isBefore, isAfter } from 'date-fns';
import { it } from 'date-fns/locale';
import { Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';

const VISIT_TYPE_LABELS = {
  preventiva: 'Preventiva',
  periodica: 'Periodica',
  su_richiesta: 'Su richiesta',
  cambio_mansione: 'Cambio mansione',
  rientro_malattia: 'Rientro malattia',
  cessazione: 'Cessazione',
};

export default function ReportScadenze30GiorniDialog({ open, onClose, visits, patients, companies }) {
  const today = new Date();
  const in30days = addDays(today, 30);

  const patientMap = useMemo(() => {
    const m = {};
    patients.forEach(p => { m[p.id] = p; });
    return m;
  }, [patients]);

  const companyMap = useMemo(() => {
    const m = {};
    companies.forEach(c => { m[c.id] = c; });
    return m;
  }, [companies]);

  const results = useMemo(() => {
    return visits
      .filter(v => {
        if (!v.next_visit_date) return false;
        const d = parseISO(v.next_visit_date);
        return !isBefore(d, today) && !isAfter(d, in30days);
      })
      .sort((a, b) => a.next_visit_date.localeCompare(b.next_visit_date))
      .map((v, i) => ({
        nr: i + 1,
        ...v,
        patient: patientMap[v.patient_id],
      }));
  }, [visits, patients]);

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;

    // Header
    doc.setFontSize(15);
    doc.setTextColor(13, 42, 77);
    doc.text('MEDIPLAN — Report Scadenze Sanitarie', margin, 15);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Prossimi 30 giorni: ${format(today, 'dd/MM/yyyy')} — ${format(in30days, 'dd/MM/yyyy')}   |   Totale: ${results.length} lavoratori   |   Generato il ${format(today, 'dd/MM/yyyy HH:mm')}`, margin, 21);

    // Table headers
    const cols = ['Nr.', 'Azienda', 'Lavoratore', 'Mansione', 'Data visita', 'Tipo', 'Scadenza', 'Giudizio'];
    const colWidths = [10, 55, 50, 40, 26, 30, 26, 40];
    let y = 28;
    const rowH = 7;

    const drawHeader = () => {
      doc.setFillColor(13, 42, 77);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      let x = margin;
      cols.forEach((col, i) => {
        doc.rect(x, y, colWidths[i], rowH, 'F');
        doc.text(col, x + 2, y + 4.5);
        x += colWidths[i];
      });
      y += rowH;
    };

    drawHeader();

    doc.setFont('helvetica', 'normal');
    results.forEach((row, idx) => {
      if (y + rowH > pageH - 12) {
        doc.addPage();
        y = 14;
        drawHeader();
      }
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 245, isEven ? 255 : 247, isEven ? 255 : 250);
      doc.setTextColor(40, 40, 40);
      let x = margin;
      const cells = [
        String(row.nr),
        row.company_name || '—',
        row.patient_name || '—',
        row.patient?.job_role_name || '—',
        row.visit_date ? format(parseISO(row.visit_date), 'dd/MM/yyyy') : '—',
        VISIT_TYPE_LABELS[row.visit_type] || row.visit_type || '—',
        row.next_visit_date ? format(parseISO(row.next_visit_date), 'dd/MM/yyyy') : '—',
        row.judgment ? row.judgment.replace(/_/g, ' ') : '—',
      ];
      cells.forEach((cell, i) => {
        doc.rect(x, y, colWidths[i], rowH, 'F');
        // clip text to column width
        const maxChars = Math.floor(colWidths[i] / 2.1);
        const txt = cell.length > maxChars ? cell.substring(0, maxChars - 1) + '…' : cell;
        doc.setFontSize(7.5);
        doc.text(txt, x + 2, y + 4.5);
        x += colWidths[i];
      });
      // row border
      doc.setDrawColor(220, 220, 220);
      doc.rect(margin, y, colWidths.reduce((a, b) => a + b, 0), rowH, 'S');
      y += rowH;
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(`Pagina ${i} di ${pageCount} — MEDIPLAN D.Lgs. 81/2008`, pageW / 2, pageH - 5, { align: 'center' });
    }

    doc.save(`scadenze_30gg_${format(today, 'yyyyMMdd')}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">
            Scadenze prossimi 30 giorni
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {format(today, 'dd/MM/yyyy')} → {format(in30days, 'dd/MM/yyyy')}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">
            {results.length === 0
              ? 'Nessuna scadenza nei prossimi 30 giorni'
              : `${results.length} lavorator${results.length === 1 ? 'e' : 'i'} in scadenza`}
          </span>
          {results.length > 0 && (
            <Button size="sm" className="gap-2" onClick={handleExportPDF}>
              <Download className="h-4 w-4" />
              Esporta PDF
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-auto rounded border">
          {results.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Nessuna visita in scadenza nei prossimi 30 giorni.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-primary text-primary-foreground sticky top-0">
                <tr>
                  <th className="px-3 py-2.5 text-left font-medium w-10">Nr.</th>
                  <th className="px-3 py-2.5 text-left font-medium">Azienda</th>
                  <th className="px-3 py-2.5 text-left font-medium">Lavoratore</th>
                  <th className="px-3 py-2.5 text-left font-medium">Mansione</th>
                  <th className="px-3 py-2.5 text-left font-medium">Data visita</th>
                  <th className="px-3 py-2.5 text-left font-medium">Tipo</th>
                  <th className="px-3 py-2.5 text-left font-medium">Scadenza</th>
                  <th className="px-3 py-2.5 text-left font-medium">Giudizio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map((row, idx) => (
                  <tr key={row.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                    <td className="px-3 py-2 text-muted-foreground">{row.nr}</td>
                    <td className="px-3 py-2 font-medium">{row.company_name}</td>
                    <td className="px-3 py-2">{row.patient_name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.patient?.job_role_name || '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.visit_date ? format(parseISO(row.visit_date), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {VISIT_TYPE_LABELS[row.visit_type] || row.visit_type || '—'}
                    </td>
                    <td className="px-3 py-2 font-semibold text-primary">
                      {row.next_visit_date ? format(parseISO(row.next_visit_date), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-[10px]">
                      {row.judgment ? row.judgment.replace(/_/g, ' ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}