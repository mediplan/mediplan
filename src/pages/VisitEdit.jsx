import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Wand2, CheckCircle2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DianaIntegration from '@/components/visits/DianaIntegration';
import FamilyAnamnesisForm from '@/components/visits/FamilyAnamnesisForm';
import PhysiologicalAnamnesisForm from '@/components/visits/PhysiologicalAnamnesisForm';
import LifestyleForm from '@/components/visits/LifestyleForm';
import PdfExamUpload from '@/components/visits/PdfExamUpload';
import { addMonths, format } from 'date-fns';
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

// Accertamenti con flag eseguito + data esecuzione + note
const ACCERTAMENTI = [
  { key: 'visual_acuity', label: 'Acuità visiva', type: 'input', placeholder: 'es. 10/10 OD, 10/10 OS' },
  { key: 'audiometry_result', label: 'Audiometria', type: 'textarea', pdfKey: 'audiometro', pdfColor: 'text-chart-3', pdfBorder: 'border-chart-3/20', pdfBg: 'bg-chart-3/5' },
  { key: 'spirometry_result', label: 'Spirometria', type: 'textarea', pdfKey: 'spirometro', pdfColor: 'text-chart-2', pdfBorder: 'border-chart-2/20', pdfBg: 'bg-chart-2/5' },
  { key: 'ecg_result', label: 'ECG', type: 'textarea', pdfKey: 'ecg', pdfColor: 'text-destructive', pdfBorder: 'border-destructive/20', pdfBg: 'bg-destructive/5' },
  { key: 'blood_tests_result', label: 'Esami ematochimici', type: 'textarea', placeholder: 'Emocromo, glicemia, creatinina, AST, ALT, GGT...' },
  { key: 'urine_test_result', label: 'Esame urine', type: 'textarea' },
  { key: 'drug_test_result', label: 'Drug test', type: 'textarea' },
  { key: 'other_exams', label: 'Altri accertamenti', type: 'textarea' },
];

function ExamRow({ exam, form, onChange }) {
  const doneKey = `${exam.key}_done`;
  const dateKey = `${exam.key}_date`;
  const isDone = !!form[doneKey];

  return (
    <Card className={cn('transition-all', isDone && 'border-accent/40 bg-accent/5')}>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={doneKey}
              checked={isDone}
              onChange={e => onChange(doneKey, e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-teal-500"
            />
            <label htmlFor={doneKey} className={cn('text-sm font-semibold cursor-pointer', isDone && 'text-accent')}>
              {exam.label}
            </label>
            {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />}
          </div>
          {isDone && (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Data esecuzione:</Label>
              <Input
                type="date"
                value={form[dateKey] || ''}
                onChange={e => onChange(dateKey, e.target.value)}
                className="h-7 text-xs w-36"
              />
            </div>
          )}
        </div>
      </CardHeader>
      {isDone && (
        <CardContent className="px-4 pb-3 space-y-2">
          {exam.pdfKey && (
            <PdfExamUpload
              label={exam.label}
              settingsKey={exam.pdfKey}
              color={exam.pdfColor}
              borderColor={exam.pdfBorder}
              bgColor={exam.pdfBg}
              onResult={text => onChange(exam.key, form[exam.key] ? form[exam.key] + '\n' + text : text)}
            />
          )}
          {exam.type === 'input' ? (
            <Input
              value={form[exam.key] || ''}
              onChange={e => onChange(exam.key, e.target.value)}
              placeholder={exam.placeholder || ''}
            />
          ) : (
            <Textarea
              value={form[exam.key] || ''}
              onChange={e => onChange(exam.key, e.target.value)}
              rows={2}
              placeholder={exam.placeholder || ''}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}

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

export default function VisitEdit() {
  const urlParams = new URLSearchParams(window.location.search);
  const visitId = urlParams.get('visitId');
  const patientId = urlParams.get('patientId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({});
  const [loaded, setLoaded] = useState(false);

  const { data: patients = [] } = useQuery({ queryKey: ['patients'], queryFn: () => base44.entities.Patient.list() });
  const { data: visits = [] } = useQuery({ queryKey: ['visits'], queryFn: () => base44.entities.MedicalVisit.list() });
  const { data: jobRoles = [] } = useQuery({ queryKey: ['jobRoles'], queryFn: () => base44.entities.JobRole.list() });

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

  const saveMutation = useMutation({
    mutationFn: (data) => visitId
      ? base44.entities.MedicalVisit.update(visitId, data)
      : base44.entities.MedicalVisit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      navigate(-1);
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

  const fillNormal = (scope) => {
    const keys = Object.keys(normalValues).filter(k => k.startsWith(scope === 'apparati' ? 'systems_' : 'obj_'));
    setForm(prev => ({ ...prev, ...Object.fromEntries(keys.map(k => [k, normalValues[k]])) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      patient_id: String(form.patient_id),
      company_id: String(form.company_id),
      height_cm: form.height_cm ? Number(form.height_cm) : undefined,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      blood_pressure_systolic: form.blood_pressure_systolic ? Number(form.blood_pressure_systolic) : undefined,
      blood_pressure_diastolic: form.blood_pressure_diastolic ? Number(form.blood_pressure_diastolic) : undefined,
      heart_rate: form.heart_rate ? Number(form.heart_rate) : undefined,
    };
    saveMutation.mutate(data);
  };

  const isNew = !visitId;

  // Numero accertamenti eseguiti
  const doneCount = ACCERTAMENTI.filter(a => form[`${a.key}_done`]).length;

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
        <Button onClick={handleSubmit} disabled={saveMutation.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Salvataggio...' : 'Salva visita'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <Tabs defaultValue="lavorativa" className="mt-2">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-2">
            <TabsTrigger value="lavorativa">Anamn. Lavorativa</TabsTrigger>
            <TabsTrigger value="fisiologica">Anamn. Fisiologica</TabsTrigger>
            <TabsTrigger value="patologica">Anamn. Patologica</TabsTrigger>
            <TabsTrigger value="apparati">Per Apparati</TabsTrigger>
            <TabsTrigger value="obiettivo">Esame Obiettivo</TabsTrigger>
            <TabsTrigger value="accertamenti" className="relative">
              Accertamenti
              {doneCount > 0 && (
                <Badge className="ml-1 h-4 px-1 text-[10px] bg-accent text-white">{doneCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="giudizio">Giudizio</TabsTrigger>
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
          <TabsContent value="fisiologica" className="space-y-4 mt-2">
            <Card><CardContent className="pt-4 space-y-4">
              <div>
                <Label className="mb-2 block">Anamnesi familiare</Label>
                <FamilyAnamnesisForm
                  value={form.anamnesis_family_structured}
                  onChange={val => handleChange('anamnesis_family_structured', val)}
                />
              </div>
              <div>
                <Label className="mb-2 block">Anamnesi fisiologica</Label>
                <PhysiologicalAnamnesisForm
                  value={form.anamnesis_physiological_structured}
                  onChange={val => handleChange('anamnesis_physiological_structured', val)}
                />
              </div>
              <div>
                <Label className="mb-2 block font-semibold">Abitudini di vita</Label>
                <LifestyleForm
                  value={form.lifestyle_structured}
                  onChange={val => handleChange('lifestyle_structured', val)}
                />
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* ANAMNESI PATOLOGICA */}
          <TabsContent value="patologica" className="space-y-4 mt-2">
            <Card><CardContent className="pt-4 space-y-4">
              <div>
                <Label>Anamnesi patologica remota</Label>
                <Textarea value={form.anamnesis_pathological || ''} onChange={e => handleChange('anamnesis_pathological', e.target.value)} rows={5} />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="injuries" checked={!!form.anamnesis_injuries} onChange={e => handleChange('anamnesis_injuries', e.target.checked)} className="h-4 w-4" />
                <Label htmlFor="injuries">Infortuni</Label>
                {form.anamnesis_injuries && (
                  <Input placeholder="Dettagli..." value={form.anamnesis_injuries_details || ''} onChange={e => handleChange('anamnesis_injuries_details', e.target.value)} className="flex-1" />
                )}
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="occ_disease" checked={!!form.anamnesis_occupational_disease} onChange={e => handleChange('anamnesis_occupational_disease', e.target.checked)} className="h-4 w-4" />
                <Label htmlFor="occ_disease">Malattie professionali</Label>
                {form.anamnesis_occupational_disease && (
                  <Input placeholder="Data, tipo, % invalidità..." value={form.anamnesis_occupational_disease_details || ''} onChange={e => handleChange('anamnesis_occupational_disease_details', e.target.value)} className="flex-1" />
                )}
              </div>
              <div>
                <Label>Sintomatologia attuale</Label>
                <Textarea value={form.current_symptoms || ''} onChange={e => handleChange('current_symptoms', e.target.value)} rows={2} />
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* PER APPARATI */}
          <TabsContent value="apparati" className="mt-2">
            <Card><CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">Seleziona lo stato per apparato.</p>
                <Button type="button" variant="outline" size="sm" onClick={() => fillNormal('apparati')} className="gap-2 text-primary border-primary/40">
                  <Wand2 className="h-3.5 w-3.5" /> Compila valori normali
                </Button>
              </div>
              <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground mb-1 px-1">
                <span>Apparato</span><span>Stato</span><span>Dettagli</span>
              </div>
              <SystemRow label="Respiratorio" field="systems_respiratory" form={form} onChange={handleChange} />
              <SystemRow label="Cardiovascolare" field="systems_cardiovascular" form={form} onChange={handleChange} />
              <SystemRow label="Gastrointestinale" field="systems_gastrointestinal" form={form} onChange={handleChange} />
              <SystemRow label="Urogenitale" field="systems_urogenital" form={form} onChange={handleChange} />
              <SystemRow label="Osteoarticolare" field="systems_musculoskeletal" form={form} onChange={handleChange} />
              <SystemRow label="Uditivo" field="systems_hearing" form={form} onChange={handleChange} />
              {['vestibular','skin','nervous','psych'].map(app => (
                <div key={app} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start py-2 border-b border-border last:border-0">
                  <Label className="font-medium text-sm pt-2 capitalize">{app === 'vestibular' ? 'Vestibolare' : app === 'skin' ? 'Cute' : app === 'nervous' ? 'Sistema nervoso' : 'Psiche'}</Label>
                  <Select value={form[`systems_${app}`] || ''} onValueChange={v => handleChange(`systems_${app}`, v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{systemsOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <div />
                </div>
              ))}
            </CardContent></Card>
          </TabsContent>

          {/* ESAME OBIETTIVO */}
          <TabsContent value="obiettivo" className="mt-2">
            <Card><CardContent className="pt-4 space-y-4">
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => fillNormal('obiettivo')} className="gap-2 text-primary border-primary/40">
                  <Wand2 className="h-3.5 w-3.5" /> Compila valori normali
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div><Label className="text-xs">Altezza (cm)</Label><Input type="number" value={form.height_cm || ''} onChange={e => handleChange('height_cm', e.target.value)} /></div>
                <div><Label className="text-xs">Peso (kg)</Label><Input type="number" value={form.weight_kg || ''} onChange={e => handleChange('weight_kg', e.target.value)} /></div>
                <div><Label className="text-xs">PA sist.</Label><Input type="number" value={form.blood_pressure_systolic || ''} onChange={e => handleChange('blood_pressure_systolic', e.target.value)} /></div>
                <div><Label className="text-xs">PA diast.</Label><Input type="number" value={form.blood_pressure_diastolic || ''} onChange={e => handleChange('blood_pressure_diastolic', e.target.value)} /></div>
                <div><Label className="text-xs">FC (bpm)</Label><Input type="number" value={form.heart_rate || ''} onChange={e => handleChange('heart_rate', e.target.value)} /></div>
              </div>
              <>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ispezione generale</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <ObjSelect label="Linfonodi" field="obj_lymphnodes" form={form} onChange={handleChange} options={[{value:'normali',label:'Normali'},{value:'patologici',label:'Patologici'}]} />
                    <ObjSelect label="Cavo orale" field="obj_oral" form={form} onChange={handleChange} options={[{value:'normale',label:'Normale'},{value:'patologico',label:'Patologico'}]} />
                    <ObjSelect label="Colorito cute" field="obj_skin_color" form={form} onChange={handleChange} options={[{value:'normale',label:'Normale'},{value:'pallore',label:'Pallore'},{value:'ittero',label:'Ittero'},{value:'cianosi',label:'Cianosi'}]} />
                    <ObjSelect label="Trofismo cute" field="obj_skin_trophism" form={form} onChange={handleChange} options={[{value:'normale',label:'Normale'},{value:'alterato',label:'Alterato'}]} />
                    <ObjSelect label="Annessi cutanei" field="obj_skin_appendages" form={form} onChange={handleChange} options={[{value:'normali',label:'Normali'},{value:'patologici',label:'Patologici'}]} />
                    <ObjSelect label="Capo/collo" field="obj_head_neck" form={form} onChange={handleChange} options={[{value:'normale',label:'Normale'},{value:'patologico',label:'Patologico'}]} />
                    <ObjSelect label="Pupille" field="obj_pupils" form={form} onChange={handleChange} options={[{value:'isocoriche_isocicliche_normoreagenti',label:'Isocoriche, normoreagenti'},{value:'altro',label:'Altro'}]} />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Torace e cardiovascolare</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <ObjSelect label="Torace" field="obj_thorax" form={form} onChange={handleChange} options={[{value:'normoespansibile',label:'Normoespansibile'},{value:'ipoespansibile',label:'Ipoespansibile'},{value:'iperespanso',label:'Iperespanso'}]} />
                    <ObjSelect label="Murmure vescicolare" field="obj_murmur" form={form} onChange={handleChange} options={[{value:'normale',label:'Normale'},{value:'aspro',label:'Aspro'},{value:'ridotto',label:'Ridotto'}]} />
                    <div><Label className="text-xs text-muted-foreground">Rumori aggiunti</Label><Input value={form.obj_added_sounds || ''} onChange={e => handleChange('obj_added_sounds', e.target.value)} className="h-8 text-sm" /></div>
                    <ObjSelect label="Toni cardiaci" field="obj_heart_tones" form={form} onChange={handleChange} options={[{value:'normali',label:'Normali'},{value:'patologici',label:'Patologici'}]} />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Addome</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div><Label className="text-xs text-muted-foreground">Addome</Label><Input value={form.obj_abdomen || ''} onChange={e => handleChange('obj_abdomen', e.target.value)} className="h-8 text-sm" /></div>
                    <ObjSelect label="Fegato" field="obj_liver" form={form} onChange={handleChange} options={[{value:'margine_arco',label:'Margine arco'},{value:'debordante',label:'Debordante'}]} />
                    <ObjSelect label="Manovra di Giordano" field="obj_giordano" form={form} onChange={handleChange} options={[{value:'negativa',label:'Negativa'},{value:'positiva_dx',label:'Positiva dx'},{value:'positiva_sx',label:'Positiva sx'}]} />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Osteoarticolare e nervoso</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <ObjSelect label="Lasègue" field="obj_lasegue" form={form} onChange={handleChange} options={[{value:'negativo',label:'Negativo'},{value:'positivo_dx',label:'Positivo dx'},{value:'positivo_sx',label:'Positivo sx'}]} />
                    <ObjSelect label="Rachide - palpazione" field="obj_spine_palpation" form={form} onChange={handleChange} options={[{value:'non_dolente',label:'Non dolente'},{value:'dolente',label:'Dolente'}]} />
                    <ObjSelect label="Rachide - motilità" field="obj_spine_mobility" form={form} onChange={handleChange} options={[{value:'normale',label:'Normale'},{value:'alterata',label:'Alterata'}]} />
                    <ObjSelect label="Sensibilità" field="obj_nervous_sensitivity" form={form} onChange={handleChange} options={[{value:'normale',label:'Normale'},{value:'alterata',label:'Alterata'}]} />
                    <ObjSelect label="Forza" field="obj_nervous_strength" form={form} onChange={handleChange} options={[{value:'normale',label:'Normale'},{value:'alterata',label:'Alterata'}]} />
                    <ObjSelect label="Coordinazione" field="obj_nervous_coordination" form={form} onChange={handleChange} options={[{value:'normale',label:'Normale'},{value:'alterata',label:'Alterata'}]} />
                    <ObjSelect label="Tremori" field="obj_tremors" form={form} onChange={handleChange} options={[{value:'assenti',label:'Assenti'},{value:'intenzionali',label:'Intenzionali'},{value:'a_riposo',label:'A riposo'}]} />
                    <ObjSelect label="Romberg" field="obj_romberg" form={form} onChange={handleChange} options={[{value:'negativo',label:'Negativo'},{value:'positivo',label:'Positivo'}]} />
                    <ObjSelect label="Riflessi osteotendinei" field="obj_reflexes" form={form} onChange={handleChange} options={[{value:'validi',label:'Validi'},{value:'alterati',label:'Alterati'}]} />
                  </div>
                  <div><Label>Note esame obiettivo</Label><Textarea value={form.obj_notes || ''} onChange={e => handleChange('obj_notes', e.target.value)} rows={2} /></div>
              </>
            </CardContent></Card>
          </TabsContent>

          {/* ACCERTAMENTI */}
          <TabsContent value="accertamenti" className="mt-2 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Spunta gli accertamenti eseguiti. Solo quelli spuntati verranno conteggiati nello scadenziario e in fatturazione.
              </p>
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-accent" />
                {doneCount} / {ACCERTAMENTI.length} eseguiti
              </Badge>
            </div>
            <DianaIntegration
              patient={patients.find(p => String(p.id) === String(form.patient_id))}
              onResult={text => handleChange('drug_test_result', form.drug_test_result ? form.drug_test_result + '\n' + text : text)}
            />
            {ACCERTAMENTI.map(exam => (
              <ExamRow key={exam.key} exam={exam} form={form} onChange={handleChange} />
            ))}
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
          <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Salvataggio...' : 'Salva visita'}
          </Button>
        </div>
      </form>
    </div>
  );
}