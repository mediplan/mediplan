import React from 'react';
import { FileText, Download, ExternalLink, Paperclip } from 'lucide-react';

/**
 * Mostra l'archivio allegati di una visita.
 * Gli allegati sono salvati come array di oggetti { url, label, exam_key } in visit.attachments.
 * Supporta anche il vecchio formato array di stringhe (url semplici).
 */
export default function VisitAttachments({ attachments = [], compact = false }) {
  if (!attachments || attachments.length === 0) return null;

  // Normalizza: supporta sia array di stringhe che array di oggetti
  const files = attachments.map(a => {
    if (typeof a === 'string') {
      return { url: a, label: 'Allegato', exam_key: '' };
    }
    return a;
  });

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap mt-1">
        <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
        {files.map((f, i) => (
          <a
            key={i}
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary underline hover:no-underline truncate max-w-[120px]"
            title={f.label}
          >
            {f.label || `Allegato ${i + 1}`}
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {files.map((f, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border bg-muted/40 hover:bg-muted/70 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs font-medium truncate">{f.label || `Allegato ${i + 1}`}</span>
          </div>
          <a
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-primary hover:text-primary/80"
            title="Apri / Scarica"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ))}
    </div>
  );
}