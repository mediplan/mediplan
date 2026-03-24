import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, CheckCircle, XCircle, FlaskConical } from 'lucide-react';

/**
 * Genera il file XML --config per diana.exe
 */
function generateDianaConfig(patient, doctor) {
  const birthDate = patient.birth_date
    ? new Date(patient.birth_date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<diana>
  <patient>
    <firstname>${escapeXml(patient.first_name || '')}</firstname>
    <lastname>${escapeXml(patient.last_name || '')}</lastname>
    <job>${escapeXml(patient.job_role_name || '')}</job>
    <company>${escapeXml(patient.company_name || '')}</company>
    <birth_date>${birthDate}</birth_date>
    <fiscal_code>${escapeXml(patient.fiscal_code || '')}</fiscal_code>
    <document_number>${escapeXml(patient.doc_number || '')}</document_number>
  </patient>
  <doctor>
    <firstname>${escapeXml(doctor.firstName || '')}</firstname>
    <lastname>${escapeXml(doctor.lastName || '')}</lastname>
    <fiscal_code>${escapeXml(doctor.fiscalCode || '')}</fiscal_code>
  </doctor>
</diana>`;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Parsa il file XML HL7 CDA prodotto da diana.exe
 * Restituisce array di { name, result } per ogni substanza testata
 */
function parseDianaHL7(xmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  const ns = 'urn:hl7-org:v3';
  const observations = doc.getElementsByTagNameNS(ns, 'observation');
  const results = [];

  for (const obs of observations) {
    const codeEl = obs.getElementsByTagNameNS(ns, 'code')[0];
    const valueEl = obs.getElementsByTagNameNS(ns, 'value')[0];
    if (!codeEl || !valueEl) continue;

    const name = codeEl.getAttribute('displayName') || codeEl.getAttribute('code') || '?';
    const resultName = valueEl.getAttribute('displayName') || '';
    const resultCode = valueEl.getAttribute('code') || '';

    // SNOMED: 260385009 = Negative, 10828004 = Positive
    const isPositive = resultCode === '10828004' || resultName.toLowerCase() === 'positive';
    const isNegative = resultCode === '260385009' || resultName.toLowerCase() === 'negative';

    results.push({ name, resultName: isPositive ? 'Positivo' : isNegative ? 'Negativo' : resultName, isPositive });
  }

  // Legge anche il timestamp
  const effectiveTime = doc.getElementsByTagNameNS(ns, 'effectiveTime')[0];
  const timestamp = effectiveTime ? effectiveTime.getAttribute('value') : null;

  return { results, timestamp };
}

function formatTimestamp(ts) {
  if (!ts || ts.length < 8) return ts || '';
  const y = ts.substring(0, 4);
  const m = ts.substring(4, 6);
  const d = ts.substring(6, 8);
  return `${d}/${m}/${y}`;
}

/**
 * Componente integrazione Diana per droga test
 * Props:
 *   patient: oggetto paziente (con first_name, last_name, fiscal_code, birth_date, job_role_name, company_name, doc_number)
 *   onResult: callback(resultText) chiamato con il testo formattato da incollare nel campo accertamenti
 */
export default function DianaIntegration({ patient, onResult }) {
  const fileInputRef = useRef(null);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');

  // Dati medico: in assenza di entità doctor usiamo valori placeholder editabili
  const doctor = { firstName: 'Medico', lastName: 'Competente', fiscalCode: '' };

  const handleExport = () => {
    if (!patient || !patient.first_name) return;
    const xml = generateDianaConfig(patient, doctor);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diana_config_${patient.last_name || 'paziente'}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setParsed(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const xml = ev.target.result;
      const { results, timestamp } = parseDianaHL7(xml);
      if (results.length === 0) {
        setError('Nessun risultato trovato nel file HL7. Verificare che sia il file di output corretto di Diana.');
        return;
      }
      setParsed({ results, timestamp });
    };
    reader.readAsText(file, 'UTF-8');
    // Reset input per consentire reimport
    e.target.value = '';
  };

  const handleApply = () => {
    if (!parsed) return;
    const dateStr = parsed.timestamp ? ` del ${formatTimestamp(parsed.timestamp)}` : '';
    const lines = [`Droga Test (Diana)${dateStr}:`];
    for (const r of parsed.results) {
      lines.push(`  - ${r.name}: ${r.resultName}`);
    }
    onResult(lines.join('\n'));
    setParsed(null);
  };

  const hasPositive = parsed?.results.some(r => r.isPositive);

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-primary">Integrazione Diana – Droga Test</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={!patient?.first_name}
          className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
        >
          <Download className="h-3.5 w-3.5" />
          Esporta config per Diana
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="h-3.5 w-3.5" />
          Importa risultato HL7
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml"
          className="hidden"
          onChange={handleImport}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        1. Esporta il file config → passalo a <code className="font-mono bg-muted px-1 rounded">diana.exe --config</code> → 2. Importa il file HL7 prodotto da Diana per caricare i risultati.
      </p>

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <XCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      {parsed && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-foreground flex items-center gap-2">
            Risultati rilevati:
            {hasPositive
              ? <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]">POSITIVO</Badge>
              : <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px]">NEGATIVO</Badge>
            }
          </div>
          <div className="rounded-md border bg-background p-2 space-y-1">
            {parsed.results.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{r.name}</span>
                <span className={r.isPositive ? 'font-semibold text-destructive' : 'text-accent font-medium'}>
                  {r.isPositive ? '⚠ ' : '✓ '}{r.resultName}
                </span>
              </div>
            ))}
          </div>
          <Button type="button" size="sm" onClick={handleApply} className="gap-2">
            <CheckCircle className="h-3.5 w-3.5" />
            Applica risultati alla visita
          </Button>
        </div>
      )}
    </div>
  );
}