import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, XCircle, FileText, Loader2, FolderOpen, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STRUMENTI_SETTINGS_KEY = 'mediplan_strumenti_settings';

function getStrumentoPath(key) {
  try {
    const s = JSON.parse(localStorage.getItem(STRUMENTI_SETTINGS_KEY)) || {};
    return s[key] || '';
  } catch { return ''; }
}

/**
 * Componente generico per caricare il PDF di un esame strumentale,
 * estrarne il contenuto con AI e compilare automaticamente il campo della visita.
 *
 * Props:
 *   label        - Nome strumento (es. "Spirometro")
 *   settingsKey  - Chiave in localStorage per il percorso cartella (es. "spirometro")
 *   color / borderColor / bgColor - Classi Tailwind per lo stile
 *   onResult     - callback(text) testo da inserire nel campo della visita
 */
export default function PdfExamUpload({
  label,
  settingsKey,
  examDate = '',   // data di esecuzione dell'accertamento (yyyy-MM-dd)
  color = 'text-primary',
  borderColor = 'border-primary/20',
  bgColor = 'bg-primary/5',
  onResult,
  onAttachment,   // callback(url, label) - per salvare il file nell'archivio allegati
  attachments = [], // allegati già caricati per questo accertamento
}) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('idle'); // idle | uploading | analyzing | done | error
  const [errorMsg, setErrorMsg] = useState('');

  const folderPath = settingsKey ? getStrumentoPath(settingsKey) : '';

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setFileName(file.name);
    setStatus('uploading');

    // Carica il file e salva nell'archivio allegati
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const dateStr = examDate ? ` (${examDate.split('-').reverse().join('/')})` : '';
    if (onAttachment) onAttachment(file_url, `${label}${dateStr}`);

    setStatus('done');
    e.target.value = '';
  };

  const statusLabel = {
    uploading: 'Caricamento...',
    done: 'File salvato negli allegati.',
    error: errorMsg,
  };

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-4 space-y-3`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className={`h-4 w-4 ${color}`} />
          <span className={`text-sm font-semibold ${color}`}>{label}</span>
        </div>
        {folderPath && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-muted rounded px-1.5 py-0.5 truncate max-w-[220px]">
            <FolderOpen className="h-3 w-3 shrink-0" />
            {folderPath}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={status === 'uploading'}
          className="gap-2"
        >
          {status === 'uploading'
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Upload className="h-3.5 w-3.5" />}
          {status === 'uploading' ? statusLabel[status] : 'Carica referto PDF'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        {fileName && status !== 'uploading' && (
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{fileName}</span>
        )}
      </div>

      {status === 'error' && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <XCircle className="h-3.5 w-3.5" /> {errorMsg}
        </p>
      )}

      {status === 'done' && (
        <p className="text-xs text-accent flex items-center gap-1">
          <CheckCircle className="h-3.5 w-3.5" /> Referto salvato nell'archivio allegati.
        </p>
      )}

      {/* Allegati già caricati per questo accertamento */}
      {attachments.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-border/40">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Referti caricati</p>
          {attachments.map((att, i) => (
            <a
              key={i}
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">{att.label || att.url}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}