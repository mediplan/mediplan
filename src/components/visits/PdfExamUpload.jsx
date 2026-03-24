import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, XCircle, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Componente generico per caricare il PDF di un esame strumentale
 * e allegarlo alla visita.
 *
 * Props:
 *   label        - Nome strumento (es. "Spirometro")
 *   color        - Classe colore Tailwind per l'accento (es. "text-chart-2")
 *   borderColor  - Classe bordo (es. "border-chart-2/20")
 *   bgColor      - Classe background (es. "bg-chart-2/5")
 *   onResult     - callback(text) testo da aggiungere al campo accertamenti
 *   onFileUrl    - callback(url) URL del PDF caricato (opzionale)
 */
export default function PdfExamUpload({ label, color = 'text-primary', borderColor = 'border-primary/20', bgColor = 'bg-primary/5', onResult, onFileUrl }) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setDone(false);
    setFileName(file.name);
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploading(false);
    setDone(true);
    if (onFileUrl) onFileUrl(file_url);
    if (onResult) onResult(`${label}: referto PDF allegato (${file.name})`);
    e.target.value = '';
  };

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-4 space-y-3`}>
      <div className="flex items-center gap-2">
        <FileText className={`h-4 w-4 ${color}`} />
        <span className={`text-sm font-semibold ${color}`}>{label}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`gap-2 border-opacity-40 hover:bg-opacity-10`}
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? 'Caricamento...' : `Carica referto PDF`}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        {fileName && !uploading && (
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{fileName}</span>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <XCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      {done && (
        <p className="text-xs text-accent flex items-center gap-1">
          <CheckCircle className="h-3.5 w-3.5" /> Referto caricato e annotato nella visita.
        </p>
      )}
    </div>
  );
}