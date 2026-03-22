import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wand2 } from 'lucide-react';

const systemsOptions = [
  { value: 'non_sintomi', label: 'Non sintomi' },
  { value: 'sintomi_oltre_1a', label: 'Sintomi da > 1 anno' },
  { value: 'sintomi_meno_1a', label: 'Sintomi da < 1 anno' },
];

const judgments = [
  { value: 'idoneo', label: 'Idoneo' },
  { value: 'idoneo_con_prescrizioni', label: 'Idoneo con prescrizioni' },
  { value: 'idoneo_con_limitazioni', label: 'Idoneo con limitazioni' },
  { value: 'temporaneamente_non_idoneo', label: 'Temporaneamente non idoneo' },
  { value: 'non_idoneo', label: 'Non idoneo' },
];

const defaultForm = {
  patient_id: '', patient_name: '', company_id: '', company_name: '',
  visit_date: '', visit_type: 'preventiva',
  anamnesis_work: '', anamnesis_work_concurrent: false, anamnesis_work_concurrent_details: '',
  anamnesis_family: '', anamnesis_physiological: '',
  lifestyle_smoker: '', lifestyle_smoker_qty: '',
  lifestyle_alcohol: '', lifestyle_sport: false, lifestyle_sport_details: '',
  anamnesis_pathological: '',
  anamnesis_injuries: false, anamnesis_injuries_details: '',
  anamnesis_occupational_disease: false, anamnesis_occupational_disease_details: '',
  systems_respiratory: '', systems_respiratory_details: '',
  systems_cardiovascular: '', systems_cardiovascular_details: '',
  systems_gastrointestinal: '', systems_gastrointestinal_details: '',
  systems_urogenital: '', systems_urogenital_details: '',
  systems_musculoskeletal: '', systems_musculoskeletal_details: '',
  systems_hearing: '', systems_hearing_details: '',
  systems_vestibular: '',
  systems_skin: '',
  systems_nervous: '',
  systems_psych: '',
  height_cm: '', weight_kg: '',
  blood_pressure_systolic: '', blood_pressure_diastolic: '', heart_rate: '',
  obj_lymphnodes: '', obj_oral: '',
  obj_skin_color: '', obj_skin_trophism: '', obj_skin_appendages: '',
  obj_head_neck: '', obj_pupils: '',
  obj_thorax: '', obj_murmur: '', obj_added_sounds: '',
  obj_heart_tones: '', obj_abdomen: '',
  obj_liver: '', obj_giordano: '',
  obj_lasegue: '', obj_spine_palpation: '', obj_spine_mobility: '',
  obj_nervous_sensitivity: '', obj_nervous_strength: '',
  obj_nervous_coordination: '', obj_tremors: '',
  obj_romberg: '', obj_reflexes: '', obj_notes: '',
  visual_acuity: '', audiometry_result: '', spirometry_result: '',
  blood_tests_result: '', urine_test_result: '', ecg_result: '', other_exams: '',
  diagnosis: '', judgment: '', judgment_details: '', next_visit_date: '', notes: ''
};

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
      <Select value={form[field]} onValueChange={v => onChange(field, v)}>
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
      <Select value={form[field]} onValueChange={v => onChange(field, v)}>
        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function PreventiveVisitFormDialog({ open, onOpenChange, visit, onSave }) {
  const [form, setForm] = useState(defaultForm);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const isEdit = !!visit;

  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: () => base44.entities.Company.list() });
  const { data: patients = [] } = useQuery({ queryKey: ['patients'], queryFn: () => base44.entities.Patient.list() });

  const filteredPatients = selectedCompanyId
    ? patients.filter(p => String(p.company_id) === selectedCompanyId)
    : patients;

  useEffect(() => {
    if (visit) {
      setForm({ ...defaultForm, ...visit });
      setSelectedCompanyId(String(visit.company_id || ''));
    } else {
      setForm(defaultForm);
      setSelectedCompanyId('');
    }
  }, [visit, open]);

  const fillNormal = (scope) => {
    if (scope === 'apparati') {
      const apparatiKeys = Object.keys(normalValues).filter(k => k.startsWith('systems_'));
      setForm(prev => ({ ...prev, ...Object.fromEntries(apparatiKeys.map(k => [k, normalValues[k]])) }));
    } else if (scope === 'obiettivo') {
      const obKeys = Object.keys(normalValues).filter(k => k.startsWith('obj_'));
      setForm(prev => ({ ...prev, ...Object.fromEntries(obKeys.map(k => [k, normalValues[k]])) }));
    }
  };

  const handleChange = (field, value) => {
    const updates = { [field]: value };
    if (field === 'patient_id') {
      const p = patients.find(pt => String(pt.id) === String(value));
      if (p) {
        updates.patient_name = `${p.last_name} ${p.first_name}`;
        updates.company_id = p.company_id;
        updates.company_name = p.company_name;
        setSelectedCompanyId(String(p.company_id));
      }
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      visit_type: 'preventiva',
      patient_id: String(form.patient_id),
      company_id: String(form.company_id || selectedCompanyId),
      height_cm: form.height_cm ? Number(form.height_cm) : undefined,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      blood_pressure_systolic: form.blood_pressure_systolic ? Number(form.blood_pressure_systolic) : undefined,
      blood_pressure_diastolic: form.blood_pressure_diastolic ? Number(form.blood_pressure_diastolic) : undefined,
      heart_rate: form.heart_rate ? Number(form.heart_rate) : undefined,
    };
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifica Visita Preventiva' : 'Nuova Visita Preventiva'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dati base */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Azienda</Label>
              <Select value={selectedCompanyId} onValueChange={v => setSelectedCompanyId(v)}>
                <SelectTrigger><SelectValue placeholder="Filtra per azienda" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lavoratore *</Label>
              <Select value={String(form.patient_id)} onValueChange={v => handleChange('patient_id', v)}>
                <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  {filteredPatients.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.last_name} {p.first_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data visita *</Label>
              <Input type="date" value={form.visit_date} onChange={e => handleChange('visit_date', e.target.value)} required />
            </div>
          </div>

          <Tabs defaultValue="lavorativa" className="mt-4">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="lavorativa">Anamn. Lavorativa</TabsTrigger>
              <TabsTrigger value="fisiologica">Anamn. Fisiologica</TabsTrigger>
              <TabsTrigger value="patologica">Anamn. Patologica</TabsTrigger>
              <TabsTrigger value="apparati">Per Apparati</TabsTrigger>
              <TabsTrigger value="obiettivo">Esame Obiettivo</TabsTrigger>
              <TabsTrigger value="accertamenti">Accertamenti</TabsTrigger>
              <TabsTrigger value="giudizio">Giudizio</TabsTrigger>
            </TabsList>

            {/* ANAMNESI LAVORATIVA */}
            <TabsContent value="lavorativa" className="space-y-4 mt-4">
              <div>
                <Label>Anamnesi lavorativa</Label>
                <Textarea value={form.anamnesis_work} onChange={e => handleChange('anamnesis_work', e.target.value)} rows={6} placeholder="Mansioni svolte, esposizioni pregresse..." />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="concurrent" checked={!!form.anamnesis_work_concurrent} onChange={e => handleChange('anamnesis_work_concurrent', e.target.checked)} className="h-4 w-4" />
                <Label htmlFor="concurrent">Contemporanea esposizione presso altri datori di lavoro</Label>
              </div>
              {form.anamnesis_work_concurrent && (
                <div>
                  <Label>Dettagli</Label>
                  <Textarea value={form.anamnesis_work_concurrent_details} onChange={e => handleChange('anamnesis_work_concurrent_details', e.target.value)} rows={2} />
                </div>
              )}
            </TabsContent>

            {/* ANAMNESI FISIOLOGICA */}
            <TabsContent value="fisiologica" className="space-y-4 mt-4">
              <div>
                <Label>Anamnesi familiare</Label>
                <Textarea value={form.anamnesis_family} onChange={e => handleChange('anamnesis_family', e.target.value)} rows={3} placeholder="Padre, Madre, Coniuge, Figli..." />
              </div>
              <div>
                <Label>Anamnesi fisiologica</Label>
                <Textarea value={form.anamnesis_physiological} onChange={e => handleChange('anamnesis_physiological', e.target.value)} rows={3} placeholder="Nascita, scolarità, stato civile..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Abitudine al fumo</Label>
                  <Select value={form.lifestyle_smoker} onValueChange={v => handleChange('lifestyle_smoker', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="non_fumatore">Non fumatore</SelectItem>
                      <SelectItem value="fumatore">Fumatore</SelectItem>
                      <SelectItem value="ex_fumatore">Ex fumatore</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.lifestyle_smoker !== 'non_fumatore' && (
                    <Input className="mt-2" placeholder="N° sigarette/die, dal..." value={form.lifestyle_smoker_qty} onChange={e => handleChange('lifestyle_smoker_qty', e.target.value)} />
                  )}
                </div>
                <div>
                  <Label>Consumo alcolici</Label>
                  <Select value={form.lifestyle_alcohol} onValueChange={v => handleChange('lifestyle_alcohol', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="astemio">Astemio</SelectItem>
                      <SelectItem value="occasionale">Bevitore occasionale</SelectItem>
                      <SelectItem value="meno_mezzo_litro">{'< ½ L/die'}</SelectItem>
                      <SelectItem value="mezzo_un_litro">½ - 1 L/die</SelectItem>
                      <SelectItem value="oltre_un_litro">{'> 1 L/die'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="sport" checked={!!form.lifestyle_sport} onChange={e => handleChange('lifestyle_sport', e.target.checked)} className="h-4 w-4" />
                <Label htmlFor="sport">Attività sportiva regolare</Label>
                {form.lifestyle_sport && (
                  <Input placeholder="Tipo/frequenza..." value={form.lifestyle_sport_details} onChange={e => handleChange('lifestyle_sport_details', e.target.value)} className="flex-1" />
                )}
              </div>
            </TabsContent>

            {/* ANAMNESI PATOLOGICA */}
            <TabsContent value="patologica" className="space-y-4 mt-4">
              <div>
                <Label>Anamnesi patologica remota</Label>
                <Textarea value={form.anamnesis_pathological} onChange={e => handleChange('anamnesis_pathological', e.target.value)} rows={5} placeholder="Malattie pregresse, interventi, ricoveri..." />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="injuries" checked={!!form.anamnesis_injuries} onChange={e => handleChange('anamnesis_injuries', e.target.checked)} className="h-4 w-4" />
                <Label htmlFor="injuries">Infortuni</Label>
                {form.anamnesis_injuries && (
                  <Input placeholder="Dettagli..." value={form.anamnesis_injuries_details} onChange={e => handleChange('anamnesis_injuries_details', e.target.value)} className="flex-1" />
                )}
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="occ_disease" checked={!!form.anamnesis_occupational_disease} onChange={e => handleChange('anamnesis_occupational_disease', e.target.checked)} className="h-4 w-4" />
                <Label htmlFor="occ_disease">Malattie professionali</Label>
                {form.anamnesis_occupational_disease && (
                  <Input placeholder="Data, tipo, % invalidità..." value={form.anamnesis_occupational_disease_details} onChange={e => handleChange('anamnesis_occupational_disease_details', e.target.value)} className="flex-1" />
                )}
              </div>
            </TabsContent>

            {/* PER APPARATI */}
            <TabsContent value="apparati" className="mt-4">
              <p className="text-xs text-muted-foreground mb-3">Seleziona lo stato per apparato. Di default: nessun sintomo.</p>
              <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground mb-1 px-1">
                <span>Apparato</span><span>Stato</span><span>Dettagli / sintomi</span>
              </div>
              <SystemRow label="Respiratorio" field="systems_respiratory" form={form} onChange={handleChange} />
              <SystemRow label="Cardiovascolare" field="systems_cardiovascular" form={form} onChange={handleChange} />
              <SystemRow label="Gastrointestinale" field="systems_gastrointestinal" form={form} onChange={handleChange} />
              <SystemRow label="Urogenitale" field="systems_urogenital" form={form} onChange={handleChange} />
              <SystemRow label="Osteoarticolare" field="systems_musculoskeletal" form={form} onChange={handleChange} />
              <SystemRow label="Uditivo" field="systems_hearing" form={form} onChange={handleChange} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start py-2 border-b border-border">
                <Label className="font-medium text-sm pt-2">Vestibolare</Label>
                <Select value={form.systems_vestibular} onValueChange={v => handleChange('systems_vestibular', v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{systemsOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
                <div />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start py-2 border-b border-border">
                <Label className="font-medium text-sm pt-2">Cute</Label>
                <Select value={form.systems_skin} onValueChange={v => handleChange('systems_skin', v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{systemsOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
                <div />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start py-2 border-b border-border">
                <Label className="font-medium text-sm pt-2">Sistema nervoso</Label>
                <Select value={form.systems_nervous} onValueChange={v => handleChange('systems_nervous', v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{systemsOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
                <div />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start py-2">
                <Label className="font-medium text-sm pt-2">Psiche</Label>
                <Select value={form.systems_psych} onValueChange={v => handleChange('systems_psych', v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{systemsOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
                <div />
              </div>
            </TabsContent>

            {/* ESAME OBIETTIVO */}
            <TabsContent value="obiettivo" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div><Label className="text-xs">Altezza (cm)</Label><Input type="number" value={form.height_cm} onChange={e => handleChange('height_cm', e.target.value)} /></div>
                <div><Label className="text-xs">Peso (kg)</Label><Input type="number" value={form.weight_kg} onChange={e => handleChange('weight_kg', e.target.value)} /></div>
                <div><Label className="text-xs">PA sist.</Label><Input type="number" value={form.blood_pressure_systolic} onChange={e => handleChange('blood_pressure_systolic', e.target.value)} /></div>
                <div><Label className="text-xs">PA diast.</Label><Input type="number" value={form.blood_pressure_diastolic} onChange={e => handleChange('blood_pressure_diastolic', e.target.value)} /></div>
                <div><Label className="text-xs">FC (bpm)</Label><Input type="number" value={form.heart_rate} onChange={e => handleChange('heart_rate', e.target.value)} /></div>
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Ispezione generale</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <ObjSelect label="Linfonodi" field="obj_lymphnodes" form={form} onChange={handleChange} options={[{value:'normali',label:'Normali'},{value:'patologici',label:'Patologici'}]} />
                <ObjSelect label="Cavo orale" field="obj_oral" form={form} onChange={handleChange} options={[{value:'normale',label:'Normale'},{value:'patologico',label:'Patologico'}]} />
                <ObjSelect label="Annessi cutanei" field="obj_skin_appendages" form={form} onChange={handleChange} options={[{value:'normali',label:'Normali'},{value:'patologici',label:'Patologici'}]} />
                <ObjSelect label="Colorito cute" field="obj_skin_color" form={form} onChange={handleChange} options={[{value:'normale',label:'Normale'},{value:'pallore',label:'Pallore'},{value:'ittero',label:'Ittero'},{value:'cianosi',label:'Cianosi'}]} />
                <ObjSelect label="Trofismo cute" field="obj_skin_trophism" form={form} onChange={handleChange} options={[{value:'normale',label:'Normale'},{value:'alterato',label:'Alterato'}]} />
                <ObjSelect label="Capo/collo" field="obj_head_neck" form={form} onChange={handleChange} options={[{value:'normale',label:'Normale'},{value:'patologico',label:'Patologico'}]} />
                <ObjSelect label="Pupille" field="obj_pupils" form={form} onChange={handleChange} options={[{value:'isocoriche_isocicliche_normoreagenti',label:'Isocoriche, normoreagenti'},{value:'altro',label:'Altro'}]} />
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Torace e cardiovascolare</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <ObjSelect label="Torace - ispezione" field="obj_thorax" form={form} onChange={handleChange} options={[{value:'normoespansibile',label:'Normoespansibile'},{value:'ipoespansibile',label:'Ipoespansibile'},{value:'iperespanso',label:'Iperespanso'}]} />
                <ObjSelect label="Murmure vescicolare" field="obj_murmur" form={form} onChange={handleChange} options={[{value:'normale',label:'Normale'},{value:'aspro',label:'Aspro'},{value:'ridotto',label:'Ridotto'}]} />
                <div>
                  <Label className="text-xs text-muted-foreground">Rumori aggiunti</Label>
                  <Input value={form.obj_added_sounds} onChange={e => handleChange('obj_added_sounds', e.target.value)} className="h-8 text-sm" placeholder="assenti" />
                </div>
                <ObjSelect label="Toni cardiaci" field="obj_heart_tones" form={form} onChange={handleChange} options={[{value:'normali',label:'Normali'},{value:'patologici',label:'Patologici'}]} />
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Addome</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Addome</Label>
                  <Input value={form.obj_abdomen} onChange={e => handleChange('obj_abdomen', e.target.value)} className="h-8 text-sm" />
                </div>
                <ObjSelect label="Fegato" field="obj_liver" form={form} onChange={handleChange} options={[{value:'margine_arco',label:'Margine arco'},{value:'debordante',label:'Debordante'}]} />
                <ObjSelect label="Manovra di Giordano" field="obj_giordano" form={form} onChange={handleChange} options={[{value:'negativa',label:'Negativa'},{value:'positiva_dx',label:'Positiva dx'},{value:'positiva_sx',label:'Positiva sx'}]} />
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Sistema osteoarticolare e nervoso</p>
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
              <div>
                <Label>Note esame obiettivo</Label>
                <Textarea value={form.obj_notes} onChange={e => handleChange('obj_notes', e.target.value)} rows={2} placeholder="Altro/Note..." />
              </div>
            </TabsContent>

            {/* ACCERTAMENTI */}
            <TabsContent value="accertamenti" className="space-y-3 mt-4">
              <div><Label>Acuità visiva</Label><Input value={form.visual_acuity} onChange={e => handleChange('visual_acuity', e.target.value)} placeholder="es. 10/10 OD, 10/10 OS" /></div>
              <div><Label>Audiometria</Label><Textarea value={form.audiometry_result} onChange={e => handleChange('audiometry_result', e.target.value)} rows={2} /></div>
              <div><Label>Spirometria basale</Label><Textarea value={form.spirometry_result} onChange={e => handleChange('spirometry_result', e.target.value)} rows={2} /></div>
              <div><Label>ECG basale</Label><Textarea value={form.ecg_result} onChange={e => handleChange('ecg_result', e.target.value)} rows={2} /></div>
              <div><Label>Esami ematochimici (emocromo, glicemia, creatinina, AST, ALT, GGT, urine)</Label><Textarea value={form.blood_tests_result} onChange={e => handleChange('blood_tests_result', e.target.value)} rows={2} /></div>
              <div><Label>Altri accertamenti</Label><Textarea value={form.other_exams} onChange={e => handleChange('other_exams', e.target.value)} rows={2} /></div>
            </TabsContent>

            {/* GIUDIZIO */}
            <TabsContent value="giudizio" className="space-y-4 mt-4">
              <div>
                <Label>Diagnosi</Label>
                <Textarea value={form.diagnosis} onChange={e => handleChange('diagnosis', e.target.value)} rows={3} />
              </div>
              <div>
                <Label>Giudizio di idoneità *</Label>
                <Select value={form.judgment || ''} onValueChange={v => handleChange('judgment', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleziona giudizio" /></SelectTrigger>
                  <SelectContent>
                    {judgments.map(j => <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dettaglio prescrizioni/limitazioni</Label>
                <Textarea value={form.judgment_details} onChange={e => handleChange('judgment_details', e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Data prossima visita</Label><Input type="date" value={form.next_visit_date} onChange={e => handleChange('next_visit_date', e.target.value)} /></div>
                <div><Label>Note</Label><Textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} rows={2} /></div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">{isEdit ? 'Salva' : 'Registra Visita Preventiva'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}