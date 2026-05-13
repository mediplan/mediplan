import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileText, Download, Paperclip } from 'lucide-react';
import { buildGiudizioHTML } from '@/lib/printVisit';

const visitTypeLabel = {
  preventiva: 'Preventiva', periodica: 'Periodica', su_richiesta: 'Su richiesta',
  cambio_mansione: 'Cambio mansione', rientro_malattia: 'Rientro malattia', cessazione: 'Cessazione',
};

const judgmentLabel = {
  idoneo: 'Idoneo',
  idoneo_con_prescrizioni: 'Idoneo con prescrizioni',
  idoneo_con_limitazioni: 'Idoneo con limitazioni',
  temporaneamente_non_idoneo: 'Temp. non idoneo',
  non_idoneo: 'Non idoneo',
};

const judgmentColors = {
  idoneo: 'bg-green-100 text-green-700 border-green-200',
  idoneo_con_prescrizioni: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  idoneo_con_limitazioni: 'bg-orange-100 text-orange-700 border-orange-200',
  temporaneamente_non_idoneo: 'bg-red-100 text-red-700 border-red-200',
  non_idoneo: 'bg-red-200 text-red-800 border-red-300',
};

export default function ClienteReferti({ visits, patients }) {
  const [search, setSearch] = useState('');

  const fmtDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
  };

  const sorted = [...visits].sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));

  const filtered = sorted.filter(v => {
    const name = (v.patient_name || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handlePrintGiudizio = (visit) => {
    const pat = patients.find(p => String(p.id) === String(visit.patient_id));
    const html = buildGiudizioHTML(visit, pat, null, null);
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"/>
      <title>Giudizio - ${visit.patient_name || ''}</title>
      <style>* { box-sizing: border-box; } body { font-family: Arial, sans-serif; font-size: 11px; color: #111827; margin: 0; padding: 24px; background:#fff; }
      @media print { body { padding: 0; } @page { margin: 15mm; size: A4; } }</style>
    </head><body>${html}<script>window.onload=function(){setTimeout(function(){window.print();},200);}<\/script></body></html>`);
    win.document.close();
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca per nome dipendente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="text-sm text-muted-foreground">{filtered.length} referti disponibili</div>

      <div className="grid gap-3">
        {filtered.map(v => (
          <Card key={v.id}>
            <CardContent className="py-3 px-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{v.patient_name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {fmtDate(v.visit_date)} · {visitTypeLabel[v.visit_type] || v.visit_type}
                    </div>
                    {v.diagnosis && (
                      <div className="text-xs text-muted-foreground mt-1 truncate max-w-xs">{v.diagnosis}</div>
                    )}
                    {/* Allegati esami */}
                    {Array.isArray(v.attachments) && v.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {v.attachments.map((att, i) => (
                          <a
                            key={i}
                            href={typeof att === 'object' ? att.url : att}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline border border-primary/20 rounded px-2 py-0.5 bg-primary/5"
                          >
                            <Paperclip className="h-3 w-3" />
                            {typeof att === 'object' ? att.label || 'Allegato' : 'Allegato'}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {v.judgment && (
                    <Badge className={`text-xs border hidden sm:flex ${judgmentColors[v.judgment] || ''}`}>
                      {judgmentLabel[v.judgment] || v.judgment}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePrintGiudizio(v)}
                    className="gap-1 text-xs"
                  >
                    <Download className="h-3 w-3" /> Giudizio
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-12 text-sm">Nessun referto disponibile</div>
        )}
      </div>
    </div>
  );
}