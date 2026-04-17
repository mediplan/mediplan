import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Download, Mail, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Dialog di anteprima documento con opzioni: Stampa, Salva PDF, Invia Email
 * Props:
 *   open: boolean
 *   onOpenChange: (bool) => void
 *   title: string
 *   html: string
 *   filename: string
 *   defaultEmails: Array<{ label: string, email: string }> — tasti email predefiniti
 */
export default function DocumentPreviewDialog({ open, onOpenChange, title, html, filename = 'documento', defaultEmails = [] }) {
  const iframeRef = useRef(null);
  const [emailMode, setEmailMode] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const fullHtml = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"/>
    <style>* { box-sizing: border-box; } body { font-family: Arial, sans-serif; font-size: 11px; color: #111827; margin: 0; padding: 24px; background:#fff; }
    @media print { body { padding: 0; } @page { margin: 15mm; size: A4; } }</style>
  </head><body>${html || ''}</body></html>`;

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(fullHtml);
    win.document.close();
    win.onload = () => setTimeout(() => win.print(), 200);
  };

  const handleSavePdf = () => {
    const win = window.open('', '_blank');
    win.document.write(fullHtml);
    win.document.close();
    win.onload = () => setTimeout(() => win.print(), 200);
  };

  const openEmailMode = (prefill = '') => {
    setEmailTo(prefill);
    setSent(false);
    setEmailMode(true);
  };

  const handleSendEmail = async () => {
    if (!emailTo) return;
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: emailTo,
        subject: `${title || filename}`,
        body: `In allegato (come anteprima inline) il documento: ${title || filename}.\n\n` +
          `Si prega di aprire la mail con un client che supporti HTML.\n\n` +
          `— MEDIPLAN Medicina del Lavoro`,
      });
      setSent(true);
      setEmailMode(false);
      setEmailTo('');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setEmailMode(false);
    setEmailTo('');
    setSent(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-5 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <DialogTitle className="text-base">{title || 'Anteprima documento'}</DialogTitle>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {!emailMode ? (
                <>
                  {/* Tasti email predefiniti */}
                  {defaultEmails.map((item, i) => (
                    <Button key={i} size="sm" variant="outline" onClick={() => openEmailMode(item.email)} className="gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {item.label}
                    </Button>
                  ))}
                  {/* Se nessuna email predefinita, bottone generico */}
                  {defaultEmails.length === 0 && (
                    <Button size="sm" variant="outline" onClick={() => openEmailMode('')} className="gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      Invia email
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={handleSavePdf} className="gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    Salva PDF
                  </Button>
                  <Button size="sm" onClick={handlePrint} className="gap-1.5">
                    <Printer className="h-3.5 w-3.5" />
                    Stampa
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs whitespace-nowrap">Destinatario:</Label>
                    <Input
                      type="email"
                      value={emailTo}
                      onChange={e => setEmailTo(e.target.value)}
                      placeholder="email@esempio.it"
                      className="h-8 w-52 text-xs"
                    />
                  </div>
                  <Button size="sm" onClick={handleSendEmail} disabled={sending || !emailTo} className="gap-1.5">
                    {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                    {sending ? 'Invio...' : 'Invia'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEmailMode(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          {sent && (
            <p className="text-xs text-accent mt-1">Email inviata con successo.</p>
          )}
        </DialogHeader>

        {/* Preview iframe */}
        <div className="flex-1 overflow-hidden bg-muted/30 p-4">
          <div className="h-full rounded-lg overflow-hidden shadow-lg border border-border bg-white">
            <iframe
              ref={iframeRef}
              srcDoc={fullHtml}
              className="w-full h-full border-0"
              title="Anteprima documento"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}