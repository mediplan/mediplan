import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FolderOpen, Upload, FileText, Trash2, Download, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const DOC_TYPE_LABELS = {
  dvr: 'DVR',
  duvri: 'DUVRI',
  pos: 'POS',
  altro: 'Altro',
};

const DOC_TYPE_COLORS = {
  dvr: 'bg-blue-100 text-blue-800',
  duvri: 'bg-purple-100 text-purple-800',
  pos: 'bg-amber-100 text-amber-800',
  altro: 'bg-gray-100 text-gray-700',
};

export default function CompanyDocumentsPanel({ company }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ doc_type: 'dvr', title: '', version: '', version_date: '', notes: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: docs = [] } = useQuery({
    queryKey: ['company_documents', company?.id],
    queryFn: () => base44.entities.CompanyDocument.filter({ company_id: company.id }, '-created_date'),
    enabled: !!company?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CompanyDocument.create(data),
    onSuccess: () => { qc.invalidateQueries(['company_documents', company.id]); setOpen(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CompanyDocument.delete(id),
    onSuccess: () => qc.invalidateQueries(['company_documents', company.id]),
  });

  const resetForm = () => {
    setForm({ doc_type: 'dvr', title: '', version: '', version_date: '', notes: '' });
    setFile(null);
  };

  const handleSave = async () => {
    setUploading(true);
    let file_url = '';
    if (file) {
      const res = await base44.integrations.Core.UploadFile({ file });
      file_url = res.file_url;
    }
    await createMutation.mutateAsync({
      ...form,
      file_url,
      company_id: company.id,
      company_name: company.name,
      uploaded_by: (await base44.auth.me()).email,
    });
    setUploading(false);
  };

  const dvrs = docs.filter(d => d.doc_type === 'dvr');
  const others = docs.filter(d => d.doc_type !== 'dvr');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          Archivio Documenti Sicurezza
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Carica documento
        </Button>
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nessun documento caricato</p>
        ) : (
          <div className="space-y-2">
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{doc.title}</span>
                    <Badge className={`text-xs px-1.5 py-0 ${DOC_TYPE_COLORS[doc.doc_type]}`}>
                      {DOC_TYPE_LABELS[doc.doc_type]}
                    </Badge>
                    {doc.version && <span className="text-xs text-muted-foreground">v{doc.version}</span>}
                    {doc.version_date && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(doc.version_date), 'dd/MM/yyyy')}
                      </span>
                    )}
                  </div>
                  {doc.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.notes}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {doc.file_url && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                      <a href={doc.file_url} target="_blank" rel="noreferrer">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                  <Button
                    size="icon" variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(doc.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Carica documento sicurezza</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipologia</Label>
              <Select value={form.doc_type} onValueChange={v => setForm(p => ({ ...p, doc_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dvr">DVR – Documento di Valutazione dei Rischi</SelectItem>
                  <SelectItem value="duvri">DUVRI</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="altro">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Titolo / Descrizione *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Es. DVR 2024" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Versione</Label>
                <Input value={form.version} onChange={e => setForm(p => ({ ...p, version: e.target.value }))} placeholder="Es. 2.0" />
              </div>
              <div>
                <Label>Data versione</Label>
                <Input type="date" value={form.version_date} onChange={e => setForm(p => ({ ...p, version_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>File PDF</Label>
              <Input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} />
            </div>
            <div>
              <Label>Note</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Annulla</Button>
            <Button onClick={handleSave} disabled={!form.title || uploading}>
              {uploading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Caricamento...</> : 'Salva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}