import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPinned, Plus, Printer, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { buildVerbaleHTML } from '@/lib/printCompany';
import DocumentPreviewDialog from '@/components/shared/DocumentPreviewDialog';

const EMPTY = {
  date: '', time: '', tipo: 'periodico',
  attivita_predominante: '', attrezzature: '',
  presenti_datore: false, presenti_rspp: false, presenti_rls: false,
  servizi_igienici: 'adeguati', servizi_igienici_note: '',
  spogliatoi: 'adeguati', spogliatoi_note: '',
  dpi_dotazione: '', stato_dpi: 'buono', dpi_note: '',
  cassetta_ps: 'adeguata', integrazioni_consigliate: '',
  lavoratori_presenti: '', annotazioni: '',
};

const LABEL_3 = {
  adeguati: 'Adeguati', non_adeguati: 'Non adeguati', non_presenti: 'Non presenti',
  adeguata: 'Adeguata', non_adeguata: 'Non adeguata', non_presente: 'Non presente',
  non_previsti: 'Non previsti', da_sostituire: 'Da sostituire', buono: 'Buono',
};

function CheckRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm">
      <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)}
        className="rounded border-border w-4 h-4" />
      {label}
    </label>
  );
}

function RadioGroup3({ label, value, onChange, options }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-4 flex-wrap">
        {options.map(o => (
          <label key={o.value} className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="radio" checked={value === o.value} onChange={() => onChange(o.value)}
              className="w-4 h-4" />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function SopralluoghiPanel({ company, doctor }) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null); // null = nuovo
  const [form, setForm] = useState(EMPTY);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const { data: sopralluoghi = [] } = useQuery({
    queryKey: ['sopralluoghi', company.id],
    queryFn: () => base44.entities.Sopralluogo.filter({ company_id: company.id }, '-date'),
    enabled: !!company.id,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editItem
      ? base44.entities.Sopralluogo.update(editItem.id, data)
      : base44.entities.Sopralluogo.create({ ...data, company_id: company.id, company_name: company.name }),
    onSuccess: () => { qc.invalidateQueries(['sopralluoghi', company.id]); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Sopralluogo.delete(id),
    onSuccess: () => qc.invalidateQueries(['sopralluoghi', company.id]),
  });

  const openNew = () => { setEditItem(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (s) => { setEditItem(s); setForm({ ...EMPTY, ...s }); setDialogOpen(true); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MapPinned className="h-4 w-4 text-chart-4" />
            Sopralluoghi ({sopralluoghi.length})
          </CardTitle>
          <Button size="sm" variant="outline" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" /> Nuovo sopralluogo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sopralluoghi.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nessun sopralluogo registrato</p>
        ) : (
          <div className="space-y-2">
            {sopralluoghi.map(s => (
              <div key={s.id} className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer"
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs capitalize">{s.tipo || 'periodico'}</Badge>
                    <span className="text-sm font-medium">
                      {s.date ? new Date(s.date).toLocaleDateString('it-IT') : '—'}
                      {s.time ? ` — ore ${s.time}` : ''}
                    </span>
                    {s.attivita_predominante && <span className="text-xs text-muted-foreground hidden sm:block">{s.attivita_predominante}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={e => { e.stopPropagation(); setPreviewDoc({ title: `Verbale Sopralluogo — ${company.name}`, html: buildVerbaleHTML(company, doctor, s) }); }}>
                      <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={e => { e.stopPropagation(); openEdit(s); }}>
                      <span className="text-xs text-muted-foreground">✏️</span>
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); if (confirm('Eliminare il sopralluogo?')) deleteMutation.mutate(s.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    {expanded === s.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
                {expanded === s.id && (
                  <div className="p-4 text-xs space-y-2 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5">
                    <div><span className="font-semibold text-muted-foreground">Attività:</span> {s.attivita_predominante || '—'}</div>
                    <div><span className="font-semibold text-muted-foreground">Attrezzature:</span> {s.attrezzature || '—'}</div>
                    <div><span className="font-semibold text-muted-foreground">Servizi igienici:</span> {LABEL_3[s.servizi_igienici] || '—'}</div>
                    <div><span className="font-semibold text-muted-foreground">Spogliatoi:</span> {LABEL_3[s.spogliatoi] || '—'}</div>
                    <div><span className="font-semibold text-muted-foreground">Stato DPI:</span> {LABEL_3[s.stato_dpi] || '—'}</div>
                    <div><span className="font-semibold text-muted-foreground">Cassetta P.S.:</span> {LABEL_3[s.cassetta_ps] || '—'}</div>
                    {s.annotazioni && <div className="col-span-full"><span className="font-semibold text-muted-foreground">Annotazioni:</span> {s.annotazioni}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Modifica sopralluogo' : 'Nuovo sopralluogo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Intestazione */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Data *</Label>
                <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Ora</Label>
                <Input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => set('tipo', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primo">Primo</SelectItem>
                    <SelectItem value="periodico">Periodico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Figure presenti */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Figure presenti</Label>
              <div className="flex gap-6 flex-wrap">
                <CheckRow label="Datore di lavoro" checked={form.presenti_datore} onChange={v => set('presenti_datore', v)} />
                <CheckRow label="RSPP" checked={form.presenti_rspp} onChange={v => set('presenti_rspp', v)} />
                <CheckRow label="RLS" checked={form.presenti_rls} onChange={v => set('presenti_rls', v)} />
              </div>
            </div>

            {/* Analisi luoghi */}
            <div className="space-y-3 border-t pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Analisi luoghi di lavoro</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Attività predominante</Label>
                  <Input value={form.attivita_predominante} onChange={e => set('attivita_predominante', e.target.value)} placeholder="es. alberghiera" />
                </div>
                <div className="space-y-1">
                  <Label>Attrezzature di lavoro</Label>
                  <Input value={form.attrezzature} onChange={e => set('attrezzature', e.target.value)} />
                </div>
              </div>
              <RadioGroup3 label="Servizi igienici" value={form.servizi_igienici} onChange={v => set('servizi_igienici', v)}
                options={[{value:'adeguati',label:'Adeguati'},{value:'non_adeguati',label:'Non adeguati'},{value:'non_presenti',label:'Non presenti'}]} />
              <Input placeholder="Annotazioni servizi igienici" value={form.servizi_igienici_note} onChange={e => set('servizi_igienici_note', e.target.value)} />
              <RadioGroup3 label="Spogliatoi" value={form.spogliatoi} onChange={v => set('spogliatoi', v)}
                options={[{value:'adeguati',label:'Adeguati'},{value:'non_adeguati',label:'Non adeguati'},{value:'non_presenti',label:'Non presenti'}]} />
              <Input placeholder="Annotazioni spogliatoi" value={form.spogliatoi_note} onChange={e => set('spogliatoi_note', e.target.value)} />
            </div>

            {/* DPI */}
            <div className="space-y-3 border-t pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">DPI</p>
              <div className="space-y-1">
                <Label>D.P.I. in dotazione</Label>
                <Input value={form.dpi_dotazione} onChange={e => set('dpi_dotazione', e.target.value)} />
              </div>
              <RadioGroup3 label="Stato D.P.I." value={form.stato_dpi} onChange={v => set('stato_dpi', v)}
                options={[{value:'non_previsti',label:'Non previsti'},{value:'da_sostituire',label:'Da sostituire'},{value:'buono',label:'Buono'}]} />
              <Input placeholder="Annotazioni DPI" value={form.dpi_note} onChange={e => set('dpi_note', e.target.value)} />
            </div>

            {/* Primo soccorso */}
            <div className="space-y-3 border-t pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Materiale di primo soccorso</p>
              <RadioGroup3 label="Cassetta/Pacchetto P.S." value={form.cassetta_ps} onChange={v => set('cassetta_ps', v)}
                options={[{value:'adeguata',label:'Adeguata'},{value:'non_adeguata',label:'Non adeguata'},{value:'non_presente',label:'Non presente'}]} />
              <div className="space-y-1">
                <Label>Integrazioni consigliate</Label>
                <Input value={form.integrazioni_consigliate} onChange={e => set('integrazioni_consigliate', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Lavoratori presenti</Label>
                <Input value={form.lavoratori_presenti} onChange={e => set('lavoratori_presenti', e.target.value)} />
              </div>
            </div>

            {/* Annotazioni finali */}
            <div className="space-y-1 border-t pt-3">
              <Label>Annotazioni generali</Label>
              <Textarea rows={3} value={form.annotazioni} onChange={e => set('annotazioni', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.date || saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvataggio...' : 'Salva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DocumentPreviewDialog
        open={!!previewDoc}
        onOpenChange={v => !v && setPreviewDoc(null)}
        title={previewDoc?.title}
        html={previewDoc?.html}
        defaultEmails={company?.email ? [{ label: 'Invia ad azienda', email: company.email }] : []}
      />
    </Card>
  );
}