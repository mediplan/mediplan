import * as XLSX from 'xlsx';

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

function n(val) {
  return val || 0;
}

function row(label, m, f) {
  return [label, n(m), n(f)];
}

export function generateAllegato3BExcel(rec) {
  const wb = XLSX.utils.book_new();
  const rows = [];

  // Titolo
  rows.push(['ALLEGATO 3B - COMUNICAZIONE ANNUALE AL SERVIZIO DI PREVENZIONE E SICUREZZA NEGLI AMBIENTI DI LAVORO']);
  rows.push([]);

  // Sezione 1 - Dati Azienda
  rows.push(['SEZIONE 1 – DATI AZIENDA E UNITÀ PRODUTTIVA']);
  rows.push(['Campo', 'Valore']);
  rows.push(['1 - Anno di riferimento', rec.anno_riferimento || '']);
  rows.push(['2 - Ragione Sociale', rec.ragione_sociale || rec.company_name || '']);
  rows.push(['3 - Partita IVA', rec.partita_iva || '']);
  rows.push(['4 - Codice Fiscale Azienda', rec.codice_fiscale_azienda || '']);
  rows.push(['5 - Indirizzo Sede Legale', rec.indirizzo_sede_legale || '']);
  rows.push(['6 - Denominazione Unità Produttiva', rec.denominazione_up || '']);
  rows.push(['7 - Indirizzo Unità Produttiva', rec.indirizzo_up || '']);
  rows.push(['8 - Codice ATECO', rec.codice_ateco || '']);
  rows.push([]);

  // Sezione 2 - Lavoratori
  rows.push(['SEZIONE 2 – LAVORATORI OCCUPATI']);
  rows.push(['', 'Maschi', 'Femmine']);
  rows.push(['9 - N. lavoratori al 30/6', n(rec.lavoratori_30_6_m), n(rec.lavoratori_30_6_f)]);
  rows.push(['10 - N. lavoratori al 31/12', n(rec.lavoratori_31_12_m), n(rec.lavoratori_31_12_f)]);
  rows.push([]);

  // Sezione 3 - Medico Competente
  rows.push(['SEZIONE 3 – MEDICO COMPETENTE']);
  rows.push(['Campo', 'Valore']);
  rows.push(['11 - Cognome e Nome', rec.medico_nome || '']);
  rows.push(['12 - Luogo di nascita', rec.medico_nascita_luogo || '']);
  rows.push(['12 - Data di nascita', rec.medico_nascita_data || '']);
  rows.push(['13 - Codice Fiscale', rec.medico_cf || '']);
  rows.push(['14 - E-mail', rec.medico_email || '']);
  rows.push([]);

  // Sezione 4 - Malattie Professionali
  rows.push(['SEZIONE 4 – MALATTIE PROFESSIONALI SEGNALATE']);
  rows.push(['', 'Maschi', 'Femmine']);
  rows.push(['15 - N. MP segnalate', n(rec.mp_segnalate_m), n(rec.mp_segnalate_f)]);
  rows.push(['16 - Tipologia MP (DM 11.12.09)', rec.mp_tipologia || '', '']);
  rows.push([]);

  // Sezione 5 - Sorveglianza Sanitaria
  rows.push(['SEZIONE 5 – SORVEGLIANZA SANITARIA']);
  rows.push(['', 'Maschi', 'Femmine']);
  rows.push(row('17 - Lavoratori soggetti a sorveglianza sanitaria', rec.sorveglianza_soggetti_m, rec.sorveglianza_soggetti_f));
  rows.push(row('18 - Lavoratori visitati nell\'anno', rec.sorveglianza_visitati_m, rec.sorveglianza_visitati_f));
  rows.push(row('19 - Idonei alla mansione', rec.idonei_m, rec.idonei_f));
  rows.push(row('20 - Idoneità parziali temporanee', rec.idonei_parziali_temp_m, rec.idonei_parziali_temp_f));
  rows.push(row('21 - Idoneità parziali permanenti', rec.idonei_parziali_perm_m, rec.idonei_parziali_perm_f));
  rows.push(row('22 - Temporaneamente inidonei', rec.inidonei_temp_m, rec.inidonei_temp_f));
  rows.push(row('23 - Permanentemente inidonei', rec.inidonei_perm_m, rec.inidonei_perm_f));
  rows.push([]);

  // Sezione 6 - Rischi
  rows.push(['SEZIONE 6 – RISCHI LAVORATIVI E SORVEGLIANZA SANITARIA PER RISCHIO']);
  rows.push(['Rischio', 'Sogg. SS M', 'Sogg. SS F', 'Visitati M', 'Visitati F']);
  RISCHI.forEach(r => {
    const v = rec.rischi?.[r.key] || {};
    rows.push([
      r.label,
      n(v.soggetti_m),
      n(v.soggetti_f),
      n(v.visitati_m),
      n(v.visitati_f),
    ]);
  });
  rows.push([]);

  // Sezione 7 - Art. 41
  rows.push(['SEZIONE 7 – ADEMPIMENTI ART. 41 CO.4 D.LGS. 81/08']);
  rows.push(['']);
  rows.push(['47 – SOSTANZE PSICOTROPE E STUPEFACENTI', 'Maschi', 'Femmine']);
  rows.push(row('Lavoratori sottoposti alle verifiche', rec.art41_stupefacenti_sottoposti_m, rec.art41_stupefacenti_sottoposti_f));
  rows.push(row('Positivi al test di screening', rec.art41_stupefacenti_positivi_screening_m, rec.art41_stupefacenti_positivi_screening_f));
  rows.push(row('Positivi al test di conferma', rec.art41_stupefacenti_positivi_conferma_m, rec.art41_stupefacenti_positivi_conferma_f));
  rows.push(row('Inidonei alla mansione', rec.art41_stupefacenti_inidonei_m, rec.art41_stupefacenti_inidonei_f));
  rows.push(['']);
  rows.push(['48 – ALCOOL DIPENDENZA', 'Maschi', 'Femmine']);
  rows.push(row('Lavoratori sottoposti alle verifiche', rec.art41_alcool_sottoposti_m, rec.art41_alcool_sottoposti_f));
  rows.push(row('Positivi al test di screening', rec.art41_alcool_positivi_screening_m, rec.art41_alcool_positivi_screening_f));
  rows.push(row('Positivi al test di conferma', rec.art41_alcool_positivi_conferma_m, rec.art41_alcool_positivi_conferma_f));
  rows.push(row('Inidonei alla mansione', rec.art41_alcool_inidonei_m, rec.art41_alcool_inidonei_f));
  rows.push([]);

  // Note
  if (rec.note) {
    rows.push(['NOTE']);
    rows.push([rec.note]);
    rows.push([]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Larghezze colonne
  ws['!cols'] = [
    { wch: 55 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Allegato 3B');

  const filename = `Allegato3B_${rec.ragione_sociale || rec.company_name || 'azienda'}_${rec.anno_riferimento || ''}.xlsx`
    .replace(/[^\w\-_.]/g, '_');

  XLSX.writeFile(wb, filename);
}