import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil, Printer } from 'lucide-react';

const RISCHI = [
  { key: 'mmc', label: 'MOVIMENTAZIONE MANUALE DEI CARICHI', num: 24 },
  { key: 'sovraccarico', label: 'SOVRACCARICO BIOMECCANICO ARTI SUPERIORI', num: 25 },
  { key: 'chimici', label: 'AGENTI CHIMICI', num: 26 },
  { key: 'cancerogeni', label: 'AGENTI CANCEROGENI E MUTAGENI', num: 27 },
  { key: 'amianto', label: 'AMIANTO', num: 28 },
  { key: 'silice', label: 'SILICE LIBERA CRISTALLINA', num: 29 },
  { key: 'biologici', label: 'AGENTI BIOLOGICI', num: 30 },
  { key: 'vdt', label: 'VIDEOTERMINALI (VDT)', num: 31 },
  { key: 'vibrazioni_corpo', label: 'VIBRAZIONI CORPO INTERO', num: 32 },
  { key: 'vibrazioni_mano', label: 'VIBRAZIONI MANO BRACCIO', num: 33 },
  { key: 'rumore', label: 'RUMORE', num: 34 },
  { key: 'campi_em', label: 'CAMPI ELETTROMAGNETICI', num: 35 },
  { key: 'radiaz_ottiche', label: 'RADIAZIONI OTTICHE ARTIFICIALI', num: 36 },
  { key: 'radiaz_uv', label: 'RADIAZIONI ULTRAVIOLETTE NATURALI', num: 37 },
  { key: 'microclima', label: 'MICROCLIMA', num: 38 },
  { key: 'infrasuoni', label: 'INFRASUONI', num: 39 },
  { key: 'ultrasuoni', label: 'ULTRASUONI', num: 40 },
  { key: 'polvere', label: 'POLVERE', num: 41 },
  { key: 'lavoro_notturno', label: 'LAVORO NOTTURNO (D.lgs n.66 del 2003) >80gg/anno', num: 42 },
  { key: 'altri_rischi', label: 'ALTRI RISCHI EVIDENZIATI DA V.R.', num: 43 },
  { key: 'lavori_altezza', label: 'LAVORI IN ALTEZZA', num: 44 },
  { key: 'stress', label: 'STRESS LAVORO CORRELATO', num: 45 },
  { key: 'posture', label: 'POSTURE INCONGRUE', num: 46 },
];

const n = (v) => v ?? 0;
const emptyR = { soggetti_m: 0, soggetti_f: 0, visitati_m: 0, visitati_f: 0 };
const getR = (rischi, key) => ({ ...emptyR, ...(rischi?.[key] || {}) });

function Th({ children, className = '' }) {
  return <th className={`border border-gray-400 bg-gray-100 px-1 py-0.5 text-[10px] font-semibold text-center ${className}`}>{children}</th>;
}
function Td({ children, className = '' }) {
  return <td className={`border border-gray-400 px-1 py-0.5 text-[10px] text-center ${className}`}>{children}</td>;
}
function TdL({ children }) {
  return <td className="border border-gray-400 px-1 py-0.5 text-[10px] text-left">{children}</td>;
}
function SectionHeader({ children }) {
  return (
    <tr>
      <td colSpan={10} className="border border-gray-400 bg-gray-200 text-[10px] font-bold text-center py-0.5 px-1">{children}</td>
    </tr>
  );
}
function Row({ num, label, valM, valF }) {
  return (
    <tr>
      <TdL><span className="font-semibold mr-1">{num}</span>{label}</TdL>
      <Td>{valM}</Td>
      <Td>{valF}</Td>
    </tr>
  );
}

export default function Allegato3BPreview({ open, onOpenChange, record: r, onEdit }) {
  if (!r) return null;

  const handlePrint = () => {
    const el = document.getElementById('allegato3b-print-area');
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Allegato 3B – ${r.ragione_sociale} – ${r.anno_riferimento}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 10px; margin: 10px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #666; padding: 2px 4px; font-size: 9px; }
        .bg-gray { background: #e5e5e5; }
        .bg-light { background: #f5f5f5; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
      </style></head><body>
      ${el.innerHTML}
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Anteprima Allegato 3B – {r.ragione_sociale} ({r.anno_riferimento})</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
                <Printer className="h-3.5 w-3.5" /> Stampa
              </Button>
              <Button size="sm" onClick={onEdit} className="gap-1">
                <Pencil className="h-3.5 w-3.5" /> Modifica
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div id="allegato3b-print-area" className="text-[10px]">
          <table className="w-full border-collapse text-[10px]">
            <tbody>
              {/* HEADER */}
              <tr>
                <TdL><span className="font-bold">1</span> Anno di riferimento della Comunicazione</TdL>
                <Td className="font-bold text-lg w-32">{r.anno_riferimento}</Td>
              </tr>

              {/* DATI AZIENDA */}
              <SectionHeader>INFORMAZIONI FORNITE DAL DATORE DI LAVORO AL MEDICO COMPETENTE – DATI IDENTIFICATIVI DELL'AZIENDA</SectionHeader>
              <tr><TdL><span className="font-bold">2</span> Ragione Sociale</TdL><Td>{r.ragione_sociale}</Td></tr>
              <tr><TdL><span className="font-bold">3</span> Partita IVA</TdL><Td>{r.partita_iva}</Td></tr>
              <tr><TdL><span className="font-bold">4</span> Codice Fiscale della Ragione Sociale</TdL><Td>{r.codice_fiscale_azienda}</Td></tr>
              <tr><TdL><span className="font-bold">5</span> Indirizzo sede legale</TdL><Td>{r.indirizzo_sede_legale}</Td></tr>
              <tr><TdL><span className="font-bold">6</span> Denominazione unità produttiva</TdL><Td>{r.denominazione_up}</Td></tr>
              <tr><TdL><span className="font-bold">7</span> Indirizzo Unità produttiva</TdL><Td>{r.indirizzo_up}</Td></tr>
              <tr><TdL><span className="font-bold">8</span> Codice attività economica (ATECO)</TdL><Td>{r.codice_ateco}</Td></tr>

              {/* LAVORATORI */}
              <SectionHeader>NUMERO LAVORATORI OCCUPATI</SectionHeader>
              <tr>
                <td className="border border-gray-400"></td>
                <Th>Maschi</Th>
                <Th>Femmine</Th>
              </tr>
              <Row num="9" label="N. totale lavoratori occupati al 30/6" valM={n(r.lavoratori_30_6_m)} valF={n(r.lavoratori_30_6_f)} />
              <Row num="10" label="N. totale lavoratori occupati al 31/12" valM={n(r.lavoratori_31_12_m)} valF={n(r.lavoratori_31_12_f)} />

              {/* DATI MEDICO */}
              <SectionHeader>INFORMAZIONI FORNITE DAL MEDICO COMPETENTE – DATI IDENTIFICATIVI DEL MEDICO COMPETENTE</SectionHeader>
              <tr><TdL><span className="font-bold">11</span> Cognome Nome del Medico Competente</TdL><Td colSpan={2}>{r.medico_nome}</Td></tr>
              <tr><TdL><span className="font-bold">12</span> Luogo e data di nascita del medico</TdL><Td colSpan={2}>{r.medico_nascita_luogo}{r.medico_nascita_data ? ' – ' + r.medico_nascita_data : ''}</Td></tr>
              <tr><TdL><span className="font-bold">13</span> Codice Fiscale del Medico Competente</TdL><Td colSpan={2}>{r.medico_cf}</Td></tr>
              <tr><TdL><span className="font-bold">14</span> E-mail del Medico Competente</TdL><Td colSpan={2}>{r.medico_email}</Td></tr>

              {/* MP */}
              <SectionHeader>PROBABILI/POSSIBILI MALATTIE PROFESSIONALI SEGNALATE ex. Art 139 DPR 1124/65</SectionHeader>
              <tr><td className="border border-gray-400"></td><Th>Maschi</Th><Th>Femmine</Th></tr>
              <Row num="15" label="N. MP segnalate" valM={n(r.mp_segnalate_m)} valF={n(r.mp_segnalate_f)} />
              <tr><TdL><span className="font-bold">16</span> Tipologia MP segnalate (codifica DM 11.12.09)</TdL><Td colSpan={2}>{r.mp_tipologia}</Td></tr>

              {/* SORVEGLIANZA */}
              <SectionHeader>DATI RELATIVI ALLA SORVEGLIANZA SANITARIA</SectionHeader>
              <tr><td className="border border-gray-400"></td><Th>Maschi</Th><Th>Femmine</Th></tr>
              <Row num="17" label="N. totale lavoratori soggetti a sorveglianza sanitaria" valM={n(r.sorveglianza_soggetti_m)} valF={n(r.sorveglianza_soggetti_f)} />
              <Row num="18" label="N. totale lavoratori sottoposti a sorveglianza sanitaria (visitati)" valM={n(r.sorveglianza_visitati_m)} valF={n(r.sorveglianza_visitati_f)} />
              <Row num="19" label="N. lavoratori idonei alla mansione specifica" valM={n(r.idonei_m)} valF={n(r.idonei_f)} />
              <Row num="20" label="N. lavoratori con idoneità parziali temporanee" valM={n(r.idonei_parziali_temp_m)} valF={n(r.idonei_parziali_temp_f)} />
              <Row num="21" label="N. lavoratori con idoneità parziali permanenti" valM={n(r.idonei_parziali_perm_m)} valF={n(r.idonei_parziali_perm_f)} />
              <Row num="22" label="N. lavoratori temporaneamente inidonei alla mansione specifica" valM={n(r.inidonei_temp_m)} valF={n(r.inidonei_temp_f)} />
              <Row num="23" label="N. lavoratori permanentemente inidonei alla mansione specifica" valM={n(r.inidonei_perm_m)} valF={n(r.inidonei_perm_f)} />

              {/* RISCHI */}
              <SectionHeader>ESPOSIZIONE A RISCHI LAVORATIVI DEI LAVORATORI SOTTOPOSTI A SORVEGLIANZA SANITARIA</SectionHeader>
              <tr>
                <td className="border border-gray-400"></td>
                <Th colSpan={2}>lavoratori soggetti a sorveglianza sanitaria</Th>
                <Th colSpan={2}>lavoratori visitati nell'anno</Th>
              </tr>
              <tr>
                <Th className="text-left">RISCHI LAVORATIVI</Th>
                <Th>Maschi</Th><Th>Femmine</Th>
                <Th>Maschi</Th><Th>Femmine</Th>
              </tr>
              {RISCHI.map(risk => {
                const v = getR(r.rischi, risk.key);
                return (
                  <tr key={risk.key}>
                    <TdL><span className="font-semibold mr-1">{risk.num}</span>{risk.label}</TdL>
                    <Td>{n(v.soggetti_m)}</Td><Td>{n(v.soggetti_f)}</Td>
                    <Td>{n(v.visitati_m)}</Td><Td>{n(v.visitati_f)}</Td>
                  </tr>
                );
              })}

              {/* ART 41 */}
              <SectionHeader>Adempimenti ai sensi dell'art. 41 co 4 – D.Lgs.81/08</SectionHeader>
              <tr>
                <td className="border border-gray-400"></td>
                <Th colSpan={2}>n. lavoratori sottoposti alle verifiche ex art. 41 co 4 nell'anno</Th>
                <Th colSpan={2}>N. positivi al test di screening</Th>
                <Th colSpan={2}>N. positivi al test di conferma</Th>
                <Th colSpan={2}>Lavoratori inidonei alla mansione</Th>
              </tr>
              <tr>
                <td className="border border-gray-400"></td>
                <Th>M</Th><Th>F</Th><Th>M</Th><Th>F</Th><Th>M</Th><Th>F</Th><Th>M</Th><Th>F</Th>
              </tr>
              {[
                { num: 47, label: 'SOSTANZE PSICOTROPE E STUPEFACENTI', prefix: 'art41_stupefacenti' },
                { num: 48, label: 'ALCOOL DIPENDENZA', prefix: 'art41_alcool' },
              ].map(({ num, label, prefix }) => (
                <tr key={prefix}>
                  <TdL><span className="font-semibold mr-1">{num}</span>{label}</TdL>
                  <Td>{n(r[`${prefix}_sottoposti_m`])}</Td>
                  <Td>{n(r[`${prefix}_sottoposti_f`])}</Td>
                  <Td>{n(r[`${prefix}_positivi_screening_m`])}</Td>
                  <Td>{n(r[`${prefix}_positivi_screening_f`])}</Td>
                  <Td>{n(r[`${prefix}_positivi_conferma_m`])}</Td>
                  <Td>{n(r[`${prefix}_positivi_conferma_f`])}</Td>
                  <Td>{n(r[`${prefix}_inidonei_m`])}</Td>
                  <Td>{n(r[`${prefix}_inidonei_f`])}</Td>
                </tr>
              ))}
            </tbody>
          </table>

          {r.note && (
            <div className="mt-2 border border-gray-400 rounded p-2 text-[10px]">
              <span className="font-semibold">Note: </span>{r.note}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}