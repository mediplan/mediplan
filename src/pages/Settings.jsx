import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTenant } from '@/lib/useTenant';
import { canAccess } from '@/lib/roles';
import AccessDenied from '@/components/shared/AccessDenied';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import JobRoleFormDialog from '@/components/jobroles/JobRoleFormDialog';
import { Plus, Pencil, Trash2, FileText, Briefcase, Search, ShieldAlert, MoreHorizontal, Plug, Save, Info, FolderOpen, Activity, Ear, Heart, FlaskConical, UserCheck, Users, Tag, ClipboardList, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import UtentiTab from '@/components/settings/UtentiTab';
import PriceListsTab from '@/components/settings/PriceListsTab';
import AccertamentiTab from '@/components/settings/AccertamentiTab';
import RischiTab from '@/components/settings/RischiTab';
import Allegato3BTab from '@/components/settings/Allegato3BTab';

// ─── Integrazioni Strumenti ───────────────────────────────────────────────────

const STRUMENTI_SETTINGS_KEY = 'mediplan_strumenti_settings';

const STRUMENTI = [
  {
    key: 'diana',
    label: 'Droga Test (Diana)',
    icon: FlaskConical,
    color: 'text-primary',
    border: 'border-primary/20',
    bg: 'bg-primary/5',
    description: 'Strumento per il test tossicologico delle droghe d\'abuso.',
  },
  {
    key: 'spirometro',
    label: 'Spirometro',
    icon: Activity,
    color: 'text-chart-2',
    border: 'border-chart-2/20',
    bg: 'bg-chart-2/5',
    description: 'Misura la capacità polmonare e la funzionalità respiratoria.',
  },
  {
    key: 'audiometro',
    label: 'Audiometro',
    icon: Ear,
    color: 'text-chart-3',
    border: 'border-chart-3/20',
    bg: 'bg-chart-3/5',
    description: 'Valutazione della soglia uditiva.',
  },
  {
    key: 'ecg',
    label: 'ECG',
    icon: Heart,
    color: 'text-destructive',
    border: 'border-destructive/20',
    bg: 'bg-destructive/5',
    description: 'Elettrocardiogramma per la valutazione cardiaca.',
  },
];

function IntegrazioniTab() {
  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STRUMENTI_SETTINGS_KEY)) || {};
    } catch { return {}; }
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem(STRUMENTI_SETTINGS_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="rounded-lg border border-muted bg-muted/30 p-4 flex gap-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          Per ogni strumento è possibile indicare la cartella di output dove il software dello strumento salva automaticamente i PDF dei referti.
          Questo è un promemoria per l'operatore: durante la visita sarà possibile caricare manualmente il PDF dalla cartella indicata.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {STRUMENTI.map(({ key, label, icon: Icon, color, border, bg, description }) => (
          <div key={key} className={`rounded-lg border ${border} ${bg} p-4 space-y-3`}>
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className={`text-sm font-semibold ${color}`}>{label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5">
                <FolderOpen className="h-3.5 w-3.5" /> Cartella PDF di output
              </Label>
              <Input
                placeholder={`es. C:\\Referti\\${label.replace(/[^a-zA-Z]/g, '')}\\`}
                value={settings[key] || ''}
                onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Percorso della cartella dove il software dello strumento salva i PDF.</p>
            </div>
          </div>
        ))}

        <div className="pt-2">
          <Button type="submit" className="gap-2">
            <Save className="h-4 w-4" />
            {saved ? 'Salvato!' : 'Salva impostazioni'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Modulistica ─────────────────────────────────────────────────────────────

const categoryLabels = {
  standard: { label: 'Standard', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  stampa_multipla: { label: 'Stampa Multipla', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  comunicazione: { label: 'Comunicazione', className: 'bg-teal-50 text-teal-700 border-teal-200' },
};

const emptyModulo = { name: '', category: 'standard', description: '', active: true, notes: '' };

function ModuloDialog({ open, onOpenChange, modulo, onSave }) {
  const [form, setForm] = useState(emptyModulo);

  React.useEffect(() => {
    setForm(modulo ? { ...emptyModulo, ...modulo } : emptyModulo);
  }, [modulo, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{modulo ? 'Modifica Modello' : 'Nuovo Modello'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-3">
          <div>
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="stampa_multipla">Stampa Multipla</SelectItem>
                <SelectItem value="comunicazione">Comunicazione</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descrizione</Label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
          </div>
          <div>
            <Label>Note</Label>
            <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={!!form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="h-4 w-4 accent-primary" />
            <Label htmlFor="active" className="font-normal cursor-pointer">Modello attivo</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">{modulo ? 'Salva' : 'Crea'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ModulisticaTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const { data: moduli = [] } = useQuery({
    queryKey: ['modulistica'],
    queryFn: () => base44.entities.Modulistica.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.Modulistica.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['modulistica'] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Modulistica.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['modulistica'] }); setDialogOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.Modulistica.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modulistica'] }),
  });

  const handleSave = (form) => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const filtered = moduli.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || m.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <Input placeholder="Cerca modello..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le categorie</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="stampa_multipla">Stampa Multipla</SelectItem>
            <SelectItem value="comunicazione">Comunicazione</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="ml-auto gap-2">
          <Plus className="h-4 w-4" /> Nuovo modello
        </Button>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline">{moduli.length} modelli totali</Badge>
      </div>
      <div className="space-y-1.5">
        {filtered.map(m => (
          <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-muted/40 transition-colors">
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${!m.active ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{m.name}</span>
            </div>
            <Badge variant="outline" className={`text-xs ${categoryLabels[m.category]?.className}`}>
              {categoryLabels[m.category]?.label}
            </Badge>
            {!m.active && <Badge variant="outline" className="text-xs text-muted-foreground">Inattivo</Badge>}
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(m); setDialogOpen(true); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(m.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nessun modello trovato</p>}
      </div>
      <ModuloDialog open={dialogOpen} onOpenChange={setDialogOpen} modulo={editing} onSave={handleSave} />
    </div>
  );
}

// ─── Mansionario ─────────────────────────────────────────────────────────────

const riskLevelColors = {
  basso: 'bg-accent/10 text-accent border-accent/20',
  medio: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  alto: 'bg-destructive/10 text-destructive border-destructive/20',
};

function MansionarioTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { tenantId } = useTenant();

  const { data: jobRoles = [], isLoading } = useQuery({
    queryKey: ['jobRoles', tenantId],
    queryFn: () => tenantId
      ? base44.entities.JobRole.filter({ tenant_id: tenantId }, '-created_date')
      : base44.entities.JobRole.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.JobRole.create(tenantId ? { ...data, tenant_id: tenantId } : data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobRoles'] }); setFormOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.JobRole.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobRoles'] }); setFormOpen(false); setEditRole(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.JobRole.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobRoles'] }); setDeleteId(null); },
  });

  const handleSave = (data) => {
    if (editRole) updateMutation.mutate({ id: editRole.id, data });
    else createMutation.mutate(data);
  };

  const filtered = jobRoles
    .filter(r => r.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'it'));

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cerca mansione..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => { setEditRole(null); setFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nuova Mansione
        </Button>
      </div>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={Briefcase} title="Nessuna mansione" description="Definisci le mansioni con i rischi specifici" actionLabel="Nuova Mansione" onAction={() => setFormOpen(true)} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(role => (
            <Card key={role.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{role.name}</h3>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditRole(role); setFormOpen(true); }}>
                      <Pencil className="h-4 w-4 mr-2" /> Modifica
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(role.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Elimina
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {role.description && <p className="text-sm text-muted-foreground mb-3">{role.description}</p>}
              {role.risks?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> Rischi
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.risks.map((risk, i) => (
                      <Badge key={i} variant="outline" className={cn('text-[10px]', riskLevelColors[risk.risk_level] || '')}>
                        {risk.risk_name} ({risk.risk_level})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {role.required_exams?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Accertamenti</p>
                  <p className="text-xs text-muted-foreground">{role.required_exams.map(e => e.exam_name).join(', ')}</p>
                </div>
              )}
              {role.ppe_required && <div className="mt-2"><p className="text-xs text-muted-foreground">DPI: {role.ppe_required}</p></div>}
            </Card>
          ))}
        </div>
      )}

      <JobRoleFormDialog open={formOpen} onOpenChange={setFormOpen} jobRole={editRole} onSave={handleSave} />
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>Sei sicuro di voler eliminare questa mansione?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Medici Incaricati ────────────────────────────────────────────────────────

const emptyDoctor = { full_name: '', specialization: '', birth_place: '', birth_date: '', fiscal_code: '', user_email: '', phone: '', notes: '', signature_url: '', active: true };

function DoctorDialog({ open, onOpenChange, doctor, onSave }) {
  const [form, setForm] = useState(emptyDoctor);
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    setForm(doctor ? { ...emptyDoctor, ...doctor } : emptyDoctor);
    setUploading(false);
  }, [doctor, open]);

  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, signature_url: file_url }));
    setUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{doctor ? 'Modifica Medico' : 'Nuovo Medico Incaricato'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-3">
          <div>
            <Label>Nome completo *</Label>
            <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} required />
          </div>
          <div>
            <Label>Specializzazione</Label>
            <Input value={form.specialization} onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))} placeholder="es. Medicina del Lavoro" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Luogo di nascita</Label>
              <Input value={form.birth_place} onChange={e => setForm(p => ({ ...p, birth_place: e.target.value }))} placeholder="es. Roma" />
            </div>
            <div>
              <Label>Data di nascita</Label>
              <Input type="date" value={form.birth_date} onChange={e => setForm(p => ({ ...p, birth_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Codice Fiscale</Label>
            <Input value={form.fiscal_code} onChange={e => setForm(p => ({ ...p, fiscal_code: e.target.value }))} placeholder="es. RSSMRA80A01H501U" />
          </div>
          <div>
            <Label>Email utente associato</Label>
            <Input type="email" value={form.user_email} onChange={e => setForm(p => ({ ...p, user_email: e.target.value }))} placeholder="Se ha accesso al sistema" />
          </div>
          <div>
            <Label>Telefono</Label>
            <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div>
            <Label>Note</Label>
            <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
          </div>

          {/* Firma */}
          <div>
            <Label>Firma</Label>
            <div className="mt-1.5 space-y-2">
              {/* Anteprima firma */}
              <div className="w-full border border-border rounded-lg bg-muted/20 flex items-center justify-center" style={{ minHeight: 80 }}>
                {form.signature_url ? (
                  <img
                    src={form.signature_url}
                    alt="Anteprima firma"
                    className="max-h-24 max-w-full object-contain p-2"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground italic">Nessuna firma caricata</span>
                )}
              </div>
              {/* Pulsanti upload / rimuovi */}
              <div className="flex gap-2">
                <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer px-3 py-2 rounded-md border border-dashed border-border text-sm text-muted-foreground hover:bg-muted/40 transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSignatureUpload}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <span className="flex items-center gap-2"><div className="h-3.5 w-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" /> Caricamento...</span>
                  ) : (
                    <span>{form.signature_url ? 'Sostituisci firma' : 'Carica immagine firma (JPG, PNG…)'}</span>
                  )}
                </label>
                {form.signature_url && (
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, signature_url: '' }))}
                    className="px-3 py-2 rounded-md border border-destructive/40 text-destructive text-sm hover:bg-destructive/10 transition-colors"
                  >
                    Rimuovi
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="doc-active" checked={!!form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="h-4 w-4 accent-primary" />
            <Label htmlFor="doc-active" className="font-normal cursor-pointer">Medico attivo</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit" disabled={uploading}>{doctor ? 'Salva' : 'Crea'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MediciTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { tenantId: doctorTenantId } = useTenant();

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctorProfiles', doctorTenantId],
    queryFn: () => doctorTenantId
      ? base44.entities.DoctorProfile.filter({ tenant_id: doctorTenantId }, 'full_name')
      : base44.entities.DoctorProfile.list('full_name'),
  });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.DoctorProfile.create(doctorTenantId ? { ...data, tenant_id: doctorTenantId } : data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['doctorProfiles'] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DoctorProfile.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['doctorProfiles'] }); setDialogOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.DoctorProfile.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctorProfiles'] }),
  });

  const handleSave = (form) => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">Elenco dei medici incaricati assegnabili alle aziende.</p>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nuovo Medico
        </Button>
      </div>
      <div className="space-y-1.5">
        {doctors.map(d => (
          <div key={d.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-muted/40 transition-colors">
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${!d.active ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{d.full_name}</span>
              {d.specialization && <span className="text-xs text-muted-foreground ml-2">— {d.specialization}</span>}
              {d.user_email && <span className="text-xs text-muted-foreground ml-2">({d.user_email})</span>}
            </div>
            {!d.active && <Badge variant="outline" className="text-xs text-muted-foreground">Inattivo</Badge>}
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(d); setDialogOpen(true); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(d.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {doctors.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nessun medico incaricato definito</p>}
      </div>
      <DoctorDialog open={dialogOpen} onOpenChange={setDialogOpen} doctor={editing} onSave={handleSave} />
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function Settings() {
  const { user, licenseRole } = useAuth();
  if (!canAccess(user, 'impostazioni', licenseRole)) return <AccessDenied />;

  const isAdmin = canAccess(user, 'medici_incaricati', licenseRole);
  const canSeePriceLists = canAccess(user, 'listini', licenseRole);
  const canSeeAllegato3B = canAccess(user, 'allegato3b', licenseRole);

  return (
    <div>
      <PageHeader title="Impostazioni" description="Configurazioni e dati di riferimento" />
      <Tabs defaultValue="mansionario">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="mansionario" className="gap-2">
            <Briefcase className="h-4 w-4" /> Mansionario
          </TabsTrigger>
          <TabsTrigger value="accertamenti" className="gap-2">
            <ClipboardList className="h-4 w-4" /> Accertamenti
          </TabsTrigger>
          <TabsTrigger value="rischi" className="gap-2">
            <AlertTriangle className="h-4 w-4" /> Elenco Rischi
          </TabsTrigger>
          <TabsTrigger value="integrazioni" className="gap-2">
            <Plug className="h-4 w-4" /> Integrazioni Strumenti
          </TabsTrigger>
          {canSeePriceLists && (
            <TabsTrigger value="listini" className="gap-2">
              <Tag className="h-4 w-4" /> Listini Prezzi
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="medici" className="gap-2">
              <UserCheck className="h-4 w-4" /> Medici Incaricati
            </TabsTrigger>
          )}
          {canSeeAllegato3B && (
            <TabsTrigger value="allegato3b" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Allegato 3B
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="utenti" className="gap-2">
              <Users className="h-4 w-4" /> Utenti
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="mansionario">
          <MansionarioTab />
        </TabsContent>
        <TabsContent value="accertamenti">
          <AccertamentiTab />
        </TabsContent>
        <TabsContent value="rischi">
          <RischiTab />
        </TabsContent>
        <TabsContent value="integrazioni">
          <IntegrazioniTab />
        </TabsContent>
        {canSeePriceLists && (
          <TabsContent value="listini">
            <PriceListsTab />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="medici">
            <MediciTab />
          </TabsContent>
        )}
        {canSeeAllegato3B && (
          <TabsContent value="allegato3b">
            <Allegato3BTab />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="utenti">
            <UtentiTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}