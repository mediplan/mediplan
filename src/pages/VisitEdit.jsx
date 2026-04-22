import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useTenant } from '@/lib/useTenant';
import { canAccess } from '@/lib/roles';
import { ArrowLeft, Save, CheckCircle2, Calendar, Printer, CheckCheck, PauseCircle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import VisitPrintView from '@/components/visits/VisitPrintView';
import { openPrintWindow } from '@/lib/printVisit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FamilyAnamnesisForm from '@/components/visits/FamilyAnamnesisForm';
import PhysiologicalAnamnesisForm from '@/components/visits/PhysiologicalAnamnesisForm';
import LifestyleForm from '@/components/visits/LifestyleForm';
import PathologicalAnamnesisTab from '@/components/visits/PathologicalAnamnesisTab';
import ObjectiveExamTab from '@/components/visits/ObjectiveExamTab';
import AccertamentiTab, { ACCERTAMENTI } from '@/components/visits/AccertamentiTab';
import { addMonths, format } from 'date-fns';
import { Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

const visitTypes = [
  { value: 'preventiva', label: 'Preventiva' },
  { value: 'periodica', label: 'Periodica' },
  { value: 'su_richiesta', label: 'Su richiesta' },
  { value: 'cambio_mansione', label: 'Cambio mansione' },
  { value: 'rientro_malattia', label: 'Rientro malattia' },
  { value: 'cessazione', label: 'Cessazione' },
];

const judgments = [
  { value: 'idoneo', label: 'Idoneo' },
  { value: 'idoneo_con_prescrizioni', label: 'Idoneo con prescrizioni' },
  { value: 'idoneo_con_limitazioni', label: 'Idoneo con limitazioni' },
  { value: 'temporaneamente_non_idoneo', label: 'Temporaneamente non idoneo' },
  { value: 'non_idoneo', label: 'Non idoneo' },
];

const systemsOptions = [
  { value: 'non_sintomi', label: 'Non sintomi' },
  { value: 'sintomi_oltre_1a', label: 'Sintomi da > 1 anno' },
  { value: 'sintomi_meno_1a', label: 'Sintomi da < 1 anno' },
];

const normalValues = {
  systems_respiratory: 'non_sintomi', systems_cardiovascular: 'non_sintomi',
  systems_gastrointestinal: 'non_sintomi', systems_urogenital: 'non_sintomi',
  systems_musculoskeletal: 'non_sintomi', systems_hearing: 'non_sintomi',
  systems_vestibular: 'non_sintomi', systems_skin: 'non_sintomi',
  systems_nervous: 'non_sintomi', systems_psych: 'non_sintomi',
  obj_lymphnodes: 'normali', obj_oral: 'normale',
  obj_skin_color: 'normale', obj_skin_trophism: 'normale', obj_skin_appendages: 'normali',
  obj_head_neck: 'normale', obj_pupils: 'isocoriche_isocicliche_normoreagenti',
  obj_thorax: 'normoespansibile', obj_murmur: 'normale', obj_added_sounds: 'assenti',
  obj_heart_tones: 'normali', obj_abdomen: 'piano, trattabile, non dolente',
  obj_liver: 'margine_arco', obj_giordano: 'negativa',
  obj_lasegue: 'negativo', obj_spine_palpation: 'non_dolente', obj_spine_mobility: 'normale',
  obj_nervous_sensitivity: 'normale', obj_nervous_strength: 'normale',
  obj_nervous_coordination: 'normale', obj_tremors: 'assenti',
  obj_romberg: 'negativo', obj_reflexes: 'validi',
};





function SystemRow({ label, field, form, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start py-2 border-b border-border last:border-0">
      <Label className="font-medium text-sm pt-2">{label}</Label>
      <Select value={form[field] || ''} onValueChange={v => onChange(field, v)}>
        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          {systemsOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input
        placeholder="Dettagli..."
        value={form[`${field}_details`] || ''}
        onChange={e => onChange(`${field}_details`, e.target.value)}
        className="h-8 text-sm"
      />
    </div>
  );
}

function ObjSelect({ label, field, options, form, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={form[field] || ''} onValueChange={v => onChange(field, v)}>
        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function FisiologicaSection({ title, children }) {
  return (
    <Card>
      <div className="px-5 py-3 border-b border-border">
        <span className="font-semibold text-sm">{title}</span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </Card>
  );
}

export default function VisitEdit() {
  const urlParams = new URLSearchParams(window.location.search);
  const visitId = urlParams.get('visitId');
  const patientId = urlParams.get('patientId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const canConclude = canAccess(user, 'visite_write');

  const [form, setForm] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [showConcludiDialog, setShowConcludiDialog] = useState(false);
  const [currentVisitId, setCurrentVisitId] = useState(visitId);

  const tenantFilter = tenantId ? { tenant_id: tenantId } : null;

  const { data: patients = [] } = useQuery({
    queryKey: ['patients', tenantId],
    queryFn: () => tenantFilter ? base44.entities.Patient.filter(tenantFilter) : base44.entities.Patient.list(),
  });
  const { data: visits = [] } = useQuery({
    queryKey: ['visits', tenantId],
    queryFn: () => tenantFilter ? base44.entities.MedicalVisit.filter(tenantFilter) : base44.entities.MedicalVisit.list(),
  });
  const { data: jobRoles = [] } = useQuery({
    queryKey: ['jobRoles', tenantId],
    queryFn: () => tenantFilter ? base44.entities.JobRole.filter(tenantFilter) : base44.entities.JobRole.list(),
  });

  const patient = patients.find(p => String(p.id) === String(patientId || form.patient_id));
  const visit = visits.find(v => String(v.id) === visitId);

  // Campi anamnestici da ereditare dalla visita preventiva
  const ANAMNESIS_FIELDS = [
    'anamnesis_work', 'anamnesis_work_concurrent', 'anamnesis_work_concurrent_details',
    'anamnesis_family_structured', 'anamnesis_physiological_structured', 'lifestyle_structured',
    'anamnesis_pathological', 'anamnesis_injuries', 'anamnesis_injuries_details',
    'anamnesis_occupational_disease', 'anamnesis_occupational_disease_details',
  ];

  useEffect(() => {
    if (loaded) return;
    if (visitId) {
      if (visit) {
        setForm({ ...visit });
        setLoaded(true);
      }
    } else if (patientId) {
      const p = patients.find(pt => String(pt.id) === patientId);
      if (p) {
        // Cerca l'ultima visita preventiva del paziente
        const lastPreventiva = visits
          .filter(v => String(v.patient_id) === String(patientId) && v.visit_type === 'preventiva')
          .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date))[0];

        const inheritedData = lastPreventiva
          ? Object.fromEntries(ANAMNESIS_FIELDS.map(f => [f, lastPreventiva[f]]).filter(([, v]) => v !== undefined))
          : {};

        setForm({
          patient_id: p.id,
          patient_name: `${p.last_name} ${p.first_name}`,
          company_id: p.company_id,
          company_name: p.company_name,
          visit_date: format(new Date(), 'yyyy-MM-dd'),
          visit_type: '',
          ...inheritedData,
        });
        setLoaded(true);
      }
    }
  }, [visit, patients, visits, visitId, patientId, loaded]);

  // Naviga via quando chiudi la visita conclusa
  useEffect(() => {
    if (form.visit_status === 'conclusa' && !showConcludiDialog) {
      setTimeout(() => {
        if (form.company_id) {
          navigate(`/aziende/${form.company_id}`);
        } else {
          navigate(-1);
        }
      }, 500);
    }
  }, [form.visit_status, showConcludiDialog, form.company_id, navigate]);

  const saveMutation = useMutation({
    mutationFn: (data) => currentVisitId
      ? base44.entities.MedicalVisit.update(currentVisitId, data)
      : base44.entities.MedicalVisit.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      const companyId = form.company_id || result?.company_id;
      if (companyId) {
        navigate(`/aziende/${companyId}`);
      } else {
        navigate(-1);
      }
    },
  });

  const handleChange = (field, value) => {
    setForm(prev => {
      const updates = { [field]: value };

      // Auto-calcola next_visit_date se viene selezionato il giudizio
      if (field === 'judgment' && value && value.startsWith('idoneo')) {
        const p = patients.find(pt => String(pt.id) === String(prev.patient_id));
        if (p && p.job_role_id) {
          const role = jobRoles.find(r => String(r.id) === String(p.job_role_id));
          const months = role?.surveillance_frequency_months || 12;
          const baseDate = prev.visit_date ? new Date(prev.visit_date) : new Date();
          updates.next_visit_date = format(addMonths(baseDate, months), 'yyyy-MM-dd');
        } else {
          // default 12 mesi
          const baseDate = prev.visit_date ? new Date(prev.visit_date) : new Date();
          updates.next_visit_date = format(addMonths(baseDate, 12), 'yyyy-MM-dd');
        }
      }

      return { ...prev, ...updates };
    });
  };

  // Aggiunge un allegato all'archivio della visita
  const handleAttachment = (url, label) => {
    setForm(prev => {
      const existing = Array.isArray(prev.attachments) ? prev.attachments : [];
      // Evita duplicati per URL
      if (existing.some(a => (typeof a === 'object' ? a.url : a) === url)) return prev;
      return { ...prev, attachments: [...existing, { url, label }] };
    });
  };

  const fillNormal = (scope) => {
    const keys = Object.keys(normalValues).filter(k => k.startsWith(scope === 'apparati' ? 'systems_' : 'obj_'));
    setForm(prev => ({ ...prev, ...Object.fromEntries(keys.map(k => [k, normalValues[k]])) }));
  };

  const buildData = (extraFields = {}) => {
    const now = new Date().toISOString();
    const modifiedBy = user?.full_name || user?.email || 'Utente';
    const data = {
      ...form,
      ...extraFields,
      ...(tenantId && !form.tenant_id ? { tenant_id: tenantId } : {}),
      last_modified_by: modifiedBy,
      last_modified_date: now,
      patient_id: String(form.patient_id),
      company_id: String(form.company_id),
      height_cm: form.height_cm ? Number(form.height_cm) : undefined,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      blood_pressure_systolic: form.blood_pressure_systolic ? Number(form.blood_pressure_systolic) : undefined,
      blood_pressure_diastolic: form.blood_pressure_diastolic ? Number(form.blood_pressure_diastolic) : undefined,
      heart_rate: form.heart_rate ? Number(form.heart_rate) : undefined,
    };
    
    // Normalizza gli allegati: mantieni oggetti { url, label } oppure converti stringhe
    data.attachments = (data.attachments || [])
      .map(a => typeof a === 'object' && a.url ? { url: a.url, label: a.label || 'Allegato' } : (typeof a === 'string' ? { url: a, label: 'Allegato' } : null))
      .filter(a => a && typeof a.url === 'string' && a.url.trim() !== '');
    
    return data;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(buildData());
  };

  const handleSaveStandby = () => {
    saveMutation.mutate(buildData({ visit_status: 'sospesa' }));
  };

  const handleConcludiConfirm = () => {
    setShowConcludiDialog(false);
    saveMutation.mutate(buildData({ visit_status: 'conclusa' }));
  };

  const isNew = !currentVisitId;

  const isOperatore = user?.role === 'operatore' || user?.role === 'operatore_sanitario';
  const TAB_ORDER = isOperatore
    ? ['accertamenti']
    : ['lavorativa', 'fisiologica', 'patologica', 'obiettivo', 'accertamenti', 'giudizio'];
  const [activeTab, setActiveTab] = useState(isOperatore ? 'accertamenti' : 'lavorativa');
  const currentTabIndex = TAB_ORDER.indexOf(activeTab);
  const isLastTab = currentTabIndex === TAB_ORDER.length - 1;

  const goToNextTab = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!isLastTab) {
      setActiveTab(TAB_ORDER[currentTabIndex + 1]);
    }
  };

  const handlePrint = async () => {
    const patientData = patients.find(p => String(p.id) === String(form.patient_id));
    let companyData = null;
    if (form.company_id) {
      const companies = await base44.entities.Company.list();
      companyData = companies.find(c => String(c.id) === String(form.company_id));
    }
    openPrintWindow(form, patientData, companyData);
  };

  // Numero accertamenti eseguiti
  const doneCount = ACCERTAMENTI.filter(a => form[`${a.key}_done`]).length
    + (Array.isArray(form.custom_exams) ? form.custom_exams.filter(e => e.done).length : 0);

  if (!loaded && (visitId || patientId)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Indietro
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">
            {isNew ? 'Nuova Visita Medica' : 'Modifica Visita'}
          </h1>
          {form.patient_name && (
            <p className="text-sm text-muted-foreground">{form.patient_name} · {form.company_name}</p>
          )}
        </div>
        {form.visit_status === 'conclusa' && (
          <Badge className="bg-accent/10 text-accent border border-accent/30 gap-1">
            <CheckCheck className="h-3 w-3" /> Visita conclusa
          </Badge>
        )}
        {form.visit_status === 'sospesa' && (
          <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300 gap-1">
            <PauseCircle className="h-3 w-3" /> In sospeso
          </Badge>
        )}
        {form.last_modified_by && form.last_modified_date && (
          <span className="text-xs text-muted-foreground">
            Modificato da <span className="font-medium">{form.last_modified_by}</span> il {new Date(form.last_modified_date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {!isNew && (
          <Button type="button" variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" /> Stampa / PDF
          </Button>
        )}


      </div>

      <div className="space-y-4">
        {/* Dati base */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Data visita *</Label>
                <Input type="date" value={form.visit_date || ''} onChange={e => handleChange('visit_date', e.target.value)} required />
              </div>
              <div>
                <Label>Tipo visita *</Label>
                <Select value={form.visit_type || ''} onValueChange={v => handleChange('visit_type', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                  <SelectContent>
                    {visitTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lavoratore</Label>
                <p className="text-sm font-medium py-2 px-3 bg-muted rounded-md">{form.patient_name || '—'}</p>
              </div>
              <div>
                <Label>Azienda</Label>
                <p className="text-sm font-medium py-2 px-3 bg-muted rounded-md">{form.company_name || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-2">
            {!isOperatore && <TabsTrigger value="lavorativa">Anamn. Lavorativa</TabsTrigger>}
            {!isOperatore && <TabsTrigger value="fisiologica">Anamn. Fisiologica</TabsTrigger>}
            {!isOperatore && <TabsTrigger value="patologica">Anamn. Patologica</TabsTrigger>}
            {!isOperatore && <TabsTrigger value="obiettivo">Esame Obiettivo</TabsTrigger>}
            <TabsTrigger value="accertamenti" className="relative">
              Accertamenti
              {doneCount > 0 && (
                <Badge className="ml-1 h-4 px-1 text-[10px] bg-accent text-white">{doneCount}</Badge>
              )}
            </TabsTrigger>
            {!isOperatore && <TabsTrigger value="giudizio">Giudizio</TabsTrigger>}
          </TabsList>

          {/* ANAMNESI LAVORATIVA */}
          <TabsContent value="lavorativa" className="space-y-4 mt-2">
            <Card><CardContent className="pt-4 space-y-4">
              <div>
                <Label>Anamnesi lavorativa</Label>
                <Textarea value={form.anamnesis_work || ''} onChange={e => handleChange('anamnesis_work', e.target.value)} rows={6} placeholder="Mansioni svolte, esposizioni pregresse..." />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="concurrent" checked={!!form.anamnesis_work_concurrent} onChange={e => handleChange('anamnesis_work_concurrent', e.target.checked)} className="h-4 w-4" />
                <Label htmlFor="concurrent">Contemporanea esposizione presso altri datori di lavoro</Label>
              </div>
              {form.anamnesis_work_concurrent && (
                <div>
                  <Label>Dettagli</Label>
                  <Textarea value={form.anamnesis_work_concurrent_details || ''} onChange={e => handleChange('anamnesis_work_concurrent_details', e.target.value)} rows={2} />
                </div>
              )}
            </CardContent></Card>
          </TabsContent>

          {/* ANAMNESI FISIOLOGICA */}
          <TabsContent value="fisiologica" className="space-y-3 mt-2">
            <FisiologicaSection title="Anamnesi familiare">
              <FamilyAnamnesisForm
                value={form.anamnesis_family_structured}
                onChange={val => handleChange('anamnesis_family_structured', val)}
              />
            </FisiologicaSection>
            <FisiologicaSection title="Anamnesi fisiologica">
              <PhysiologicalAnamnesisForm
                value={form.anamnesis_physiological_structured}
                onChange={val => handleChange('anamnesis_physiological_structured', val)}
              />
            </FisiologicaSection>
            <FisiologicaSection title="Abitudini di vita">
              <LifestyleForm
                value={form.lifestyle_structured}
                onChange={val => handleChange('lifestyle_structured', val)}
              />
            </FisiologicaSection>
          </TabsContent>

          {/* ANAMNESI PATOLOGICA + PER APPARATI */}
          <TabsContent value="patologica" className="mt-2">
            <PathologicalAnamnesisTab
              form={form}
              onChange={handleChange}
              onFillNormal={() => fillNormal('apparati')}
            />
          </TabsContent>

          {/* ESAME OBIETTIVO */}
          <TabsContent value="obiettivo" className="mt-2">
            <ObjectiveExamTab
              form={form}
              onChange={handleChange}
              onFillNormal={() => fillNormal('obiettivo')}
            />
          </TabsContent>

          {/* ACCERTAMENTI */}
          <TabsContent value="accertamenti" className="mt-2">
            <AccertamentiTab
              form={form}
              onChange={handleChange}
              onAttachment={handleAttachment}
              patient={patients.find(p => String(p.id) === String(form.patient_id))}
              jobRoles={jobRoles}
              user={user}
            />
          </TabsContent>

          {/* GIUDIZIO */}
          <TabsContent value="giudizio" className="mt-2">
            <Card><CardContent className="pt-4 space-y-4">
              <div>
                <Label>Diagnosi</Label>
                <Textarea value={form.diagnosis || ''} onChange={e => handleChange('diagnosis', e.target.value)} rows={3} />
              </div>
              <div>
                <Label>Giudizio di idoneità</Label>
                <Select value={form.judgment || ''} onValueChange={v => handleChange('judgment', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleziona giudizio" /></SelectTrigger>
                  <SelectContent>
                    {judgments.map(j => <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dettaglio prescrizioni/limitazioni</Label>
                <Textarea value={form.judgment_details || ''} onChange={e => handleChange('judgment_details', e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <Label className="flex items-center gap-2">
                    Data prossima visita
                    {form.judgment && form.judgment.startsWith('idoneo') && (
                      <span className="text-xs text-accent font-normal flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> calcolata automaticamente
                      </span>
                    )}
                  </Label>
                  <Input type="date" value={form.next_visit_date || ''} onChange={e => handleChange('next_visit_date', e.target.value)} />
                </div>
                <div>
                  <Label>Note</Label>
                  <Textarea value={form.notes || ''} onChange={e => handleChange('notes', e.target.value)} rows={2} />
                </div>
              </div>
            </CardContent></Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-2 pb-6">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Annulla</Button>
          {isOperatore ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={saveMutation.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? 'Salvataggio...' : 'Salva accertamenti'}
            </Button>
          ) : !isLastTab ? (
            <Button type="button" onClick={goToNextTab} className="gap-2">
              Scheda successiva →
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveStandby}
                disabled={saveMutation.isPending}
                className="gap-2 border-yellow-400 text-yellow-700 hover:bg-yellow-50"
              >
                <PauseCircle className="h-4 w-4" />
                {saveMutation.isPending ? 'Salvataggio...' : 'Salva e Stand-by'}
              </Button>
              <Button
                type="button"
                onClick={() => setShowConcludiDialog(true)}
                disabled={saveMutation.isPending}
                className="gap-2 bg-accent hover:bg-accent/90"
              >
                <CheckCheck className="h-4 w-4" />
                {saveMutation.isPending ? 'Salvataggio...' : 'Salva e Concludi'}
              </Button>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={showConcludiDialog} onOpenChange={setShowConcludiDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concludi Visita</AlertDialogTitle>
            <AlertDialogDescription>
              Cliccando su OK si confermano le informazioni e gli allegati e verrà conclusa la Visita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleConcludiConfirm} className="bg-accent hover:bg-accent/90">
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}