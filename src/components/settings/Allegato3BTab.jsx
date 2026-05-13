import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '@/lib/useTenant';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Plus, Eye, Pencil, Trash2, FileSpreadsheet, Download, Wand2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Allegato3BDialog from '@/components/allegato3b/Allegato3BDialog';
import Allegato3BPreview from '@/components/allegato3b/Allegato3BPreview';
import { generateAllegato3BExcel } from '@/lib/generateAllegato3BExcel';
import { computeAllegato3BFromVisits } from '@/lib/computeAllegato3B';

const STATUS_LABELS = {
  bozza: { label: 'Bozza', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  completato: { label: 'Completato', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  inviato: { label: 'Inviato', className: 'bg-green-50 text-green-700 border-green-200' },
};

export default function Allegato3BTab() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear() - 1;
  const [search, setSearch] = useState('');
  const [filterAnno, setFilterAnno] = useState(String(currentYear));
  const [editRecord, setEditRecord] = useState(null);
  const [previewRecord, setPreviewRecord] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const { data: records = [], isLoading: loadingRecords } = useQuery({
    queryKey: ['allegato3b', tenantId],
    queryFn: () => tenantId
      ? base44.entities.Allegato3B.filter({ tenant_id: tenantId }, '-anno_riferimento')
      : base44.entities.Allegato3B.list('-anno_riferimento'),
  });

  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['companies', tenantId],
    queryFn: () => tenantId
      ? base44.entities.Company.filter({ tenant_id: tenantId, status: 'active' }, 'name')
      : base44.entities.Company.filter({ status: 'active' }, 'name'),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctorProfiles', tenantId],
    queryFn: () => tenantId
      ? base44.entities.DoctorProfile.filter({ tenant_id: tenantId, active: true }, 'full_name')
      : base44.entities.DoctorProfile.filter({ active: true }, 'full_name'),
  });

  const { data: allVisits = [] } = useQuery({
    queryKey: ['medicalVisits', tenantId],
    queryFn: () => tenantId
      ? base44.entities.MedicalVisit.filter({ tenant_id: tenantId }, '-visit_date')
      : base44.entities.MedicalVisit.list('-visit_date'),
  });

  const { data: allPatients = [] } = useQuery({
    queryKey: ['patients', tenantId],
    queryFn: () => tenantId
      ? base44.entities.Patient.filter({ tenant_id: tenantId }, 'last_name')
      : base44.entities.Patient.list('last_name'),
  });

  const { data: allJobRoles = [] } = useQuery({
    queryKey: ['jobRoles', tenantId],
    queryFn: () => tenantId
      ? base44.entities.JobRole.filter({ tenant_id: tenantId }, 'name')
      : base44.entities.JobRole.list('name'),
  });

  const [autoFilling, setAutoFilling] = useState(null);

  const createMutation = useMutation({
    mutationFn: data => base44.entities.Allegato3B.create(tenantId ? { ...data, tenant_id: tenantId } : data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allegato3b'] }); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Allegato3B.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allegato3b'] }); setDialogOpen(false); setEditRecord(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.Allegato3B.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allegato3b'] }); setDeleteId(null); },
  });

  const handleSave = (form) => {
    if (editRecord) updateMutation.mutate({ id: editRecord.id, data: form });
    else createMutation.mutate(form);
  };

  const anni = useMemo(() => {
    const set = new Set(records.map(r => String(r.anno_riferimento)));
    const year = new Date().getFullYear();
    for (let y = year; y >= year - 5; y--) set.add(String(y));
    return Array.from(set).sort((a, b) => b - a);
  }, [records]);

  // Mappa company_id -> record allegato per l'anno selezionato
  const recordsByCompany = useMemo(() => {
    const map = {};
    records.forEach(r => {
      if (!filterAnno || filterAnno === 'all' || String(r.anno_riferimento) === filterAnno) {
        map[r.company_id] = r;
      }
    });
    return map;
  }, [records, filterAnno]);

  // Lista aziende filtrate per ricerca
  const filteredCompanies = useMemo(() => {
    if (!search) return companies;
    return companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [companies, search]);

  const handleGenerateExcel = (company) => {
    const existing = recordsByCompany[company.id];
    const rec = existing || {
      anno_riferimento: Number(filterAnno) || currentYear,
      company_id: company.id,
      company_name: company.name,
      ragione_sociale: company.name,
      partita_iva: company.vat_number || '',
      codice_fiscale_azienda: company.fiscal_code || '',
      indirizzo_sede_legale: [company.address, company.city].filter(Boolean).join(' '),
      codice_ateco: company.ateco_code || '',
      rischi: {},
    };
    generateAllegato3BExcel(rec);
  };

  const handleAutoFill = (company) => {
    const anno = Number(filterAnno) || currentYear;
    const computed = computeAllegato3BFromVisits({
      companyId: company.id,
      anno,
      visits: allVisits,
      patients: allPatients,
      jobRoles: allJobRoles,
    });

    const existing = recordsByCompany[company.id];
    const base = existing || {
      company_id: company.id,
      company_name: company.name,
      ragione_sociale: company.name,
      partita_iva: company.vat_number || '',
      codice_fiscale_azienda: company.fiscal_code || '',
      indirizzo_sede_legale: [company.address, company.city].filter(Boolean).join(' '),
      codice_ateco: company.ateco_code || '',
      anno_riferimento: anno,
    };

    setEditRecord({ ...base, ...computed });
    setDialogOpen(true);
  };

  const handleNewForCompany = (company) => {
    setEditRecord({
      company_id: company.id,
      company_name: company.name,
      ragione_sociale: company.name,
      partita_iva: company.vat_number || '',
      codice_fiscale_azienda: company.fiscal_code || '',
      indirizzo_sede_legale: [company.address, company.city].filter(Boolean).join(' '),
      codice_ateco: company.ateco_code || '',
      anno_riferimento: Number(filterAnno) || currentYear,
    });
    setDialogOpen(true);
  };

  const isLoading = loadingRecords || loadingCompanies;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-5 items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cerca azienda..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
          </div>
          <Select value={filterAnno} onValueChange={setFilterAnno}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Anno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli anni</SelectItem>
              {anni.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nuovo Allegato 3B
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Caricamento...</div>
      ) : filteredCompanies.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nessuna azienda attiva trovata</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCompanies.map(company => {
            const rec = recordsByCompany[company.id];
            return (
              <div key={company.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                {/* Info azienda */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{company.name}</span>
                    {company.ateco_code && (
                      <span className="text-xs text-muted-foreground font-mono">ATECO: {company.ateco_code}</span>
                    )}
                    {rec ? (
                      <Badge variant="outline" className={`text-xs ${STATUS_LABELS[rec.status]?.className}`}>
                        {STATUS_LABELS[rec.status]?.label}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">
                        Nessun record
                      </Badge>
                    )}
                  </div>
                  {company.city && (
                    <p className="text-xs text-muted-foreground mt-0.5">{company.city}</p>
                  )}
                </div>

                {/* Azioni */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Auto-popola */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-purple-700 border-purple-300 hover:bg-purple-50"
                    onClick={() => handleAutoFill(company)}
                    title="Calcola automaticamente i dati dalle visite dell'anno"
                    disabled={autoFilling === company.id}
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    Auto-popola
                  </Button>
                  {/* Genera Excel */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50"
                    onClick={() => handleGenerateExcel(company)}
                    title="Genera Excel Allegato 3B"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Genera Excel
                  </Button>

                  {rec ? (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Anteprima" onClick={() => setPreviewRecord(rec)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifica" onClick={() => { setEditRecord(rec); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Elimina" onClick={() => setDeleteId(rec.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => handleNewForCompany(company)}>
                      <Plus className="h-3.5 w-3.5" /> Crea record
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Allegato3BDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={editRecord}
        companies={companies}
        doctors={doctors}
        onSave={handleSave}
      />

      {previewRecord && (
        <Allegato3BPreview
          record={previewRecord}
          open={!!previewRecord}
          onOpenChange={(v) => { if (!v) setPreviewRecord(null); }}
          onEdit={() => { setEditRecord(previewRecord); setPreviewRecord(null); setDialogOpen(true); }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Allegato 3B</AlertDialogTitle>
            <AlertDialogDescription>Sei sicuro? L'operazione non è reversibile.</AlertDialogDescription>
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