import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const RISCHI = [
  { key: 'mmc', label: 'Movimentazione Manuale dei Carichi' },
  { key: 'sovraccarico', label: 'Sovraccarico Biomeccanico Arti Superiori' },
  { key: 'chimici', label: 'Agenti Chimici' },
  { key: 'cancerogeni', label: 'Agenti Cancerogeni e Mutageni' },
  { key: 'amianto', label: 'Amianto' },
  { key: 'silice', label: 'Silice Libera Cristallina' },
  { key: 'biologici', label: 'Agenti Biologici' },
  { key: 'vdt', label: 'Videoterminali (VDT)' },
  { key: 'vibrazioni_corpo', label: 'Vibrazioni Corpo Intero' },
  { key: 'vibrazioni_mano', label: 'Vibrazioni Mano Braccio' },
  { key: 'rumore', label: 'Rumore' },
  { key: 'campi_em', label: 'Campi Elettromagnetici' },
  { key: 'radiaz_ottiche', label: 'Radiazioni Ottiche Artificiali' },
  { key: 'radiaz_uv', label: 'Radiazioni Ultraviolette Naturali' },
  { key: 'microclima', label: 'Microclima' },
  { key: 'infrasuoni', label: 'Infrasuoni' },
  { key: 'ultrasuoni', label: 'Ultrasuoni' },
  { key: 'polvere', label: 'Polvere' },
  { key: 'lavoro_notturno', label: 'Lavoro Notturno >80gg/anno' },
  { key: 'altri_rischi', label: 'Altri Rischi Evidenziati da V.R.' },
  { key: 'lavori_altezza', label: 'Lavori in Altezza' },
  { key: 'stress', label: 'Stress Lavoro Correlato' },
  { key: 'posture', label: 'Posture Incongrue' },
];

const emptyRischio = { soggetti_m: 0, soggetti_f: 0, visitati_m: 0, visitati_f: 0 };

const defaultForm = {
  anno_riferimento: new Date().getFullYear() - 1,
  company_id: '',
  company_name: '',
  ragione_sociale: '',
  partita_iva: '',
  codice_fiscale_azienda: '',
  indirizzo_sede_legale: '',
  denominazione_up: '',
  indirizzo_up: '',
  codice_ateco: '',
  lavoratori_30_6_m: 0, lavoratori_30_6_f: 0,
  lavoratori_31_12_m: 0, lavoratori_31_12_f: 0,
  medico_nome: '', medico_nascita_luogo: '', medico_nascita_data: '', medico_cf: '', medico_email: '',
  mp_segnalate_m: 0, mp_segnalate_f: 0, mp_tipologia: '',
  sorveglianza_soggetti_m: 0, sorveglianza_soggetti_f: 0,
  sorveglianza_visitati_m: 0, sorveglianza_visitati_f: 0,
  idonei_m: 0, idonei_f: 0,
  idonei_parziali_temp_m: 0, idonei_parziali_temp_f: 0,
  idonei_parziali_perm_m: 0, idonei_parziali_perm_f: 0,
  inidonei_temp_m: 0, inidonei_temp_f: 0,
  inidonei_perm_m: 0, inidonei_perm_f: 0,
  rischi: {},
  art41_stupefacenti_sottoposti_m: 0, art41_stupefacenti_sottoposti_f: 0,
  art41_stupefacenti_positivi_screening_m: 0, art41_stupefacenti_positivi_screening_f: 0,
  art41_stupefacenti_positivi_conferma_m: 0, art41_stupefacenti_positivi_conferma_f: 0,
  art41_stupefacenti_inidonei_m: 0, art41_stupefacenti_inidonei_f: 0,
  art41_alcool_sottoposti_m: 0, art41_alcool_sottoposti_f: 0,
  art41_alcool_positivi_screening_m: 0, art41_alcool_positivi_screening_f: 0,
  art41_alcool_positivi_conferma_m: 0, art41_alcool_positivi_conferma_f: 0,
  art41_alcool_inidonei_m: 0, art41_alcool_inidonei_f: 0,
  note: '',
  status: 'bozza',
};

function NumField({ label, valueM, valueF, onChangeM, onChangeF, compact = false }) {
  return (
    <div className={compact ? 'flex items-center gap-2' : 'grid grid-cols-3 items-center gap-2'}>
      {!compact && <span className="text-xs text-muted-foreground col-span-1">{label}</span>}
      <div className="flex gap-1 items-center col-span-2">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] text-muted-foreground">M</span>
          <Input type="number" min={0} value={valueM} onChange={e => onChangeM(Number(e.target.value))} className="w-16 h-7 text-center text-xs px-1" />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] text-muted-foreground">F</span>
          <Input type="number" min={0} value={valueF} onChange={e => onChangeF(Number(e.target.value))} className="w-16 h-7 text-center text-xs px-1" />
        </div>
      </div>
    </div>
  );
}

export default function Allegato3BDialog({ open, onOpenChange, record, companies, doctors, onSave }) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (record) {
      setForm({ ...defaultForm, ...record });
    } else {
      setForm({ ...defaultForm });
    }
  }, [record, open]);

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const setRischio = (key, subfield, value) => {
    setForm(p => ({
      ...p,
      rischi: {
        ...p.rischi,
        [key]: { ...emptyRischio, ...(p.rischi?.[key] || {}), [subfield]: Number(value) },
      },
    }));
  };

  const getRischio = (key) => ({ ...emptyRischio, ...(form.rischi?.[key] || {}) });

  const handleCompanyChange = (cid) => {
    const c = companies.find(x => x.id === cid);
    setForm(p => ({
      ...p,
      company_id: cid,
      company_name: c?.name || '',
      ragione_sociale: c?.name || p.ragione_sociale,
      partita_iva: c?.vat_number || p.partita_iva,
      codice_fiscale_azienda: c?.fiscal_code || p.codice_fiscale_azienda,
      indirizzo_sede_legale: c ? `${c.address || ''} ${c.city || ''}`.trim() : p.indirizzo_sede_legale,
      codice_ateco: c?.ateco_code || p.codice_ateco,
    }));
  };

  const handleDoctorChange = (did) => {
    const d = doctors.find(x => x.id === did);
    if (d) setForm(p => ({ ...p, medico_nome: d.full_name, medico_email: d.user_email || p.medico_email }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record ? 'Modifica Allegato 3B' : 'Nuovo Allegato 3B'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="azienda">
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="azienda">Azienda</TabsTrigger>
              <TabsTrigger value="medico">Medico</TabsTrigger>
              <TabsTrigger value="sorveglianza">Sorveglianza</TabsTrigger>
              <TabsTrigger value="rischi">Rischi</TabsTrigger>
              <TabsTrigger value="art41">Art. 41</TabsTrigger>
            </TabsList>

            {/* TAB AZIENDA */}
            <TabsContent value="azienda" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Anno di riferimento *</Label>
                  <Input type="number" value={form.anno_riferimento} onChange={e => set('anno_riferimento', Number(e.target.value))} required />
                </div>
                <div>
                  <Label>Stato</Label>
                  <Select value={form.status} onValueChange={v => set('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bozza">Bozza</SelectItem>
                      <SelectItem value="completato">Completato</SelectItem>
                      <SelectItem value="inviato">Inviato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {companies.length > 0 && (
                <div>
                  <Label>Azienda (auto-compila) *</Label>
                  <Select value={form.company_id} onValueChange={handleCompanyChange}>
                    <SelectTrigger><SelectValue placeholder="Seleziona azienda..." /></SelectTrigger>
                    <SelectContent>
                      {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>2 - Ragione Sociale</Label>
                <Input value={form.ragione_sociale} onChange={e => set('ragione_sociale', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>3 - Partita IVA</Label>
                  <Input value={form.partita_iva} onChange={e => set('partita_iva', e.target.value)} />
                </div>
                <div>
                  <Label>4 - Codice Fiscale Azienda</Label>
                  <Input value={form.codice_fiscale_azienda} onChange={e => set('codice_fiscale_azienda', e.target.value)} />
                </div>
              </div>
              <div>
                <Label>5 - Indirizzo Sede Legale</Label>
                <Input value={form.indirizzo_sede_legale} onChange={e => set('indirizzo_sede_legale', e.target.value)} />
              </div>
              <div>
                <Label>6 - Denominazione Unità Produttiva</Label>
                <Input value={form.denominazione_up} onChange={e => set('denominazione_up', e.target.value)} />
              </div>
              <div>
                <Label>7 - Indirizzo Unità Produttiva</Label>
                <Input value={form.indirizzo_up} onChange={e => set('indirizzo_up', e.target.value)} />
              </div>
              <div>
                <Label>8 - Codice ATECO</Label>
                <Input value={form.codice_ateco} onChange={e => set('codice_ateco', e.target.value)} />
              </div>

              <div className="border rounded-lg p-3 space-y-2 bg-muted/20">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">9-10 – Numero Lavoratori Occupati</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Al 30/6</p>
                    <div className="flex gap-2">
                      <div><span className="text-[10px]">M</span><Input type="number" min={0} value={form.lavoratori_30_6_m} onChange={e => set('lavoratori_30_6_m', Number(e.target.value))} className="w-20 h-8 text-center text-sm" /></div>
                      <div><span className="text-[10px]">F</span><Input type="number" min={0} value={form.lavoratori_30_6_f} onChange={e => set('lavoratori_30_6_f', Number(e.target.value))} className="w-20 h-8 text-center text-sm" /></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Al 31/12</p>
                    <div className="flex gap-2">
                      <div><span className="text-[10px]">M</span><Input type="number" min={0} value={form.lavoratori_31_12_m} onChange={e => set('lavoratori_31_12_m', Number(e.target.value))} className="w-20 h-8 text-center text-sm" /></div>
                      <div><span className="text-[10px]">F</span><Input type="number" min={0} value={form.lavoratori_31_12_f} onChange={e => set('lavoratori_31_12_f', Number(e.target.value))} className="w-20 h-8 text-center text-sm" /></div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB MEDICO */}
            <TabsContent value="medico" className="space-y-3">
              {doctors.length > 0 && (
                <div>
                  <Label>Medico (auto-compila)</Label>
                  <Select onValueChange={handleDoctorChange}>
                    <SelectTrigger><SelectValue placeholder="Seleziona medico..." /></SelectTrigger>
                    <SelectContent>
                      {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>11 - Cognome e Nome Medico Competente</Label>
                <Input value={form.medico_nome} onChange={e => set('medico_nome', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>12 - Luogo di nascita</Label>
                  <Input value={form.medico_nascita_luogo} onChange={e => set('medico_nascita_luogo', e.target.value)} />
                </div>
                <div>
                  <Label>12 - Data di nascita</Label>
                  <Input type="date" value={form.medico_nascita_data} onChange={e => set('medico_nascita_data', e.target.value)} />
                </div>
              </div>
              <div>
                <Label>13 - Codice Fiscale Medico</Label>
                <Input value={form.medico_cf} onChange={e => set('medico_cf', e.target.value)} />
              </div>
              <div>
                <Label>14 - Email Medico</Label>
                <Input type="email" value={form.medico_email} onChange={e => set('medico_email', e.target.value)} />
              </div>

              <div className="border rounded-lg p-3 space-y-2 bg-muted/20">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">15-16 – Malattie Professionali Segnalate</p>
                <div className="flex gap-4 items-end">
                  <div>
                    <Label className="text-xs">N. MP Maschi</Label>
                    <Input type="number" min={0} value={form.mp_segnalate_m} onChange={e => set('mp_segnalate_m', Number(e.target.value))} className="w-20 h-8 text-center" />
                  </div>
                  <div>
                    <Label className="text-xs">N. MP Femmine</Label>
                    <Input type="number" min={0} value={form.mp_segnalate_f} onChange={e => set('mp_segnalate_f', Number(e.target.value))} className="w-20 h-8 text-center" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">16 - Tipologia MP (codifica DM 11.12.09)</Label>
                  <Input value={form.mp_tipologia} onChange={e => set('mp_tipologia', e.target.value)} placeholder="es. A01, B02..." />
                </div>
              </div>
            </TabsContent>

            {/* TAB SORVEGLIANZA */}
            <TabsContent value="sorveglianza" className="space-y-3">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold">Campo</th>
                      <th className="text-center px-2 py-2 text-xs">Maschi</th>
                      <th className="text-center px-2 py-2 text-xs">Femmine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { label: '17 – Soggetti a sorveglianza sanitaria', km: 'sorveglianza_soggetti_m', kf: 'sorveglianza_soggetti_f' },
                      { label: '18 – Visitati nell\'anno', km: 'sorveglianza_visitati_m', kf: 'sorveglianza_visitati_f' },
                      { label: '19 – Idonei alla mansione', km: 'idonei_m', kf: 'idonei_f' },
                      { label: '20 – Idoneità parziali temporanee', km: 'idonei_parziali_temp_m', kf: 'idonei_parziali_temp_f' },
                      { label: '21 – Idoneità parziali permanenti', km: 'idonei_parziali_perm_m', kf: 'idonei_parziali_perm_f' },
                      { label: '22 – Temporaneamente inidonei', km: 'inidonei_temp_m', kf: 'inidonei_temp_f' },
                      { label: '23 – Permanentemente inidonei', km: 'inidonei_perm_m', kf: 'inidonei_perm_f' },
                    ].map(row => (
                      <tr key={row.km} className="hover:bg-muted/20">
                        <td className="px-3 py-1.5 text-xs text-muted-foreground">{row.label}</td>
                        <td className="px-2 py-1.5 text-center">
                          <Input type="number" min={0} value={form[row.km]} onChange={e => set(row.km, Number(e.target.value))} className="w-20 h-7 text-center text-xs mx-auto" />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <Input type="number" min={0} value={form[row.kf]} onChange={e => set(row.kf, Number(e.target.value))} className="w-20 h-7 text-center text-xs mx-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* TAB RISCHI */}
            <TabsContent value="rischi" className="space-y-1">
              <p className="text-xs text-muted-foreground mb-2">Per ogni rischio: lavoratori soggetti a sorveglianza sanitaria (M/F) e lavoratori visitati (M/F)</p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold">Rischio</th>
                      <th className="text-center px-1 py-2" colSpan={2}>Soggetti SS</th>
                      <th className="text-center px-1 py-2" colSpan={2}>Visitati</th>
                    </tr>
                    <tr className="border-t border-border bg-muted/20">
                      <th></th>
                      <th className="text-center py-1 px-1 text-muted-foreground">M</th>
                      <th className="text-center py-1 px-1 text-muted-foreground">F</th>
                      <th className="text-center py-1 px-1 text-muted-foreground">M</th>
                      <th className="text-center py-1 px-1 text-muted-foreground">F</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {RISCHI.map(r => {
                      const v = getRischio(r.key);
                      return (
                        <tr key={r.key} className="hover:bg-muted/20">
                          <td className="px-3 py-1.5 text-muted-foreground">{r.label}</td>
                          {['soggetti_m', 'soggetti_f', 'visitati_m', 'visitati_f'].map(sf => (
                            <td key={sf} className="px-1 py-1 text-center">
                              <Input type="number" min={0} value={v[sf]} onChange={e => setRischio(r.key, sf, e.target.value)} className="w-14 h-6 text-center text-xs px-0.5 mx-auto" />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* TAB ART 41 */}
            <TabsContent value="art41" className="space-y-4">
              <p className="text-xs text-muted-foreground">Adempimenti ai sensi dell'art. 41 co 4 – D.Lgs.81/08</p>

              {[
                { label: '47 – Sostanze Psicotrope e Stupefacenti', prefix: 'art41_stupefacenti' },
                { label: '48 – Alcool Dipendenza', prefix: 'art41_alcool' },
              ].map(({ label, prefix }) => (
                <div key={prefix} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                  <p className="text-xs font-semibold">{label}</p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="text-left px-3 py-1.5 font-medium">Campo</th>
                          <th className="text-center py-1.5">M</th>
                          <th className="text-center py-1.5">F</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {[
                          { label: 'Lavoratori sottoposti alle verifiche', km: `${prefix}_sottoposti_m`, kf: `${prefix}_sottoposti_f` },
                          { label: 'Positivi al test di screening', km: `${prefix}_positivi_screening_m`, kf: `${prefix}_positivi_screening_f` },
                          { label: 'Positivi al test di conferma', km: `${prefix}_positivi_conferma_m`, kf: `${prefix}_positivi_conferma_f` },
                          { label: 'Inidonei alla mansione', km: `${prefix}_inidonei_m`, kf: `${prefix}_inidonei_f` },
                        ].map(row => (
                          <tr key={row.km}>
                            <td className="px-3 py-1.5 text-muted-foreground">{row.label}</td>
                            <td className="py-1 text-center">
                              <Input type="number" min={0} value={form[row.km] || 0} onChange={e => set(row.km, Number(e.target.value))} className="w-16 h-6 text-center text-xs mx-auto" />
                            </td>
                            <td className="py-1 text-center">
                              <Input type="number" min={0} value={form[row.kf] || 0} onChange={e => set(row.kf, Number(e.target.value))} className="w-16 h-6 text-center text-xs mx-auto" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              <div>
                <Label>Note</Label>
                <Textarea value={form.note} onChange={e => set('note', e.target.value)} rows={3} placeholder="Note aggiuntive..." />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">{record ? 'Salva modifiche' : 'Crea'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}