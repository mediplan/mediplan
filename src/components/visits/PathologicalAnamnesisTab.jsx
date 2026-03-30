import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';

const systemsOptions = [
  { value: 'non_sintomi', label: 'Non sintomi' },
  { value: 'sintomi_oltre_1a', label: 'Sintomi da > 1 anno' },
  { value: 'sintomi_meno_1a', label: 'Sintomi da < 1 anno' },
];

function Cb({ id, checked, onChange, label }) {
  return (
    <label htmlFor={id} className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
      <input type="checkbox" id={id} checked={!!checked} onChange={e => onChange(e.target.checked)} className="h-3.5 w-3.5 cursor-pointer accent-primary" />
      {label}
    </label>
  );
}

function ApparatoSection({ label, field, form, onChange, children }) {
  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-4">
        <span className="font-semibold text-sm underline underline-offset-2 min-w-[160px]">{label}:</span>
        {systemsOptions.map(o => (
          <label key={o.value} className="flex items-center gap-1 text-sm cursor-pointer">
            <input
              type="radio"
              name={field}
              value={o.value}
              checked={(form[field] || 'non_sintomi') === o.value}
              onChange={() => onChange(field, o.value)}
              className="h-3.5 w-3.5 cursor-pointer accent-primary"
            />
            {o.label}
          </label>
        ))}
      </div>
      {children && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 pl-1">
          {children}
        </div>
      )}
      <Input
        placeholder="Note libere..."
        value={form[`${field}_details`] || ''}
        onChange={e => onChange(`${field}_details`, e.target.value)}
        className="h-7 text-sm"
      />
    </div>
  );
}

export default function PathologicalAnamnesisTab({ form, onChange, onFillNormal }) {
  const chk = (field) => ({
    checked: !!form[field],
    onChange: (v) => onChange(field, v),
  });

  return (
    <div className="space-y-4">
      {/* Sezione patologica remota */}
      <Card><CardContent className="pt-4 space-y-4">
        <div>
          <Label>Anamnesi patologica remota</Label>
          <Textarea value={form.anamnesis_pathological || ''} onChange={e => onChange('anamnesis_pathological', e.target.value)} rows={4} />
        </div>

        {/* Infortuni */}
        <div className="space-y-1">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-sm underline underline-offset-2">Infortuni:</span>
            <Cb id="inj_no" checked={!form.anamnesis_injuries} onChange={() => onChange('anamnesis_injuries', false)} label="no" />
            <Cb id="inj_si" checked={!!form.anamnesis_injuries} onChange={() => onChange('anamnesis_injuries', true)} label="sì" />
          </div>
          {form.anamnesis_injuries && (
            <Input placeholder="Dettagli infortuni..." value={form.anamnesis_injuries_details || ''} onChange={e => onChange('anamnesis_injuries_details', e.target.value)} className="h-7 text-sm" />
          )}
        </div>

        {/* Malattie professionali */}
        <div className="space-y-1">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-sm underline underline-offset-2">Malattie professionali:</span>
            <span className="text-xs text-muted-foreground">(data, tipo, % invalidità)</span>
            <Cb id="occ_no" checked={!form.anamnesis_occupational_disease} onChange={() => onChange('anamnesis_occupational_disease', false)} label="no" />
            <Cb id="occ_si" checked={!!form.anamnesis_occupational_disease} onChange={() => onChange('anamnesis_occupational_disease', true)} label="sì" />
          </div>
          {form.anamnesis_occupational_disease && (
            <Input placeholder="Data, tipo, % invalidità..." value={form.anamnesis_occupational_disease_details || ''} onChange={e => onChange('anamnesis_occupational_disease_details', e.target.value)} className="h-7 text-sm" />
          )}
        </div>

        {/* Invalidità riconosciute */}
        <div className="space-y-1">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-sm underline underline-offset-2">Invalidità riconosciute:</span>
            <span className="text-xs text-muted-foreground">(I. civile, INPS, Ass. Private, data, % invalidità)</span>
            <Cb id="inv_no" checked={!form.anamnesis_disability} onChange={() => onChange('anamnesis_disability', false)} label="no" />
            <Cb id="inv_si" checked={!!form.anamnesis_disability} onChange={() => onChange('anamnesis_disability', true)} label="sì" />
          </div>
          {form.anamnesis_disability && (
            <Input placeholder="Tipo, data, % invalidità..." value={form.anamnesis_disability_details || ''} onChange={e => onChange('anamnesis_disability_details', e.target.value)} className="h-7 text-sm" />
          )}
        </div>
      </CardContent></Card>

      {/* Sezione Per Apparati */}
      <Card><CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-foreground">Anamnesi per apparati</p>
          <Button type="button" variant="outline" size="sm" onClick={onFillNormal} className="gap-2 text-primary border-primary/40">
            <Wand2 className="h-3.5 w-3.5" /> Compila "non sintomi"
          </Button>
        </div>

        {/* Respiratorio */}
        <ApparatoSection label="Apparato respiratorio" field="systems_respiratory" form={form} onChange={onChange}>
          {['tosse','espettorato','dispnea','starnuti','dolore toracico','emoftoe'].map(s => (
            <Cb key={s} id={`resp_${s}`} checked={!!(form.systems_respiratory_symptoms || {})[s]} onChange={v => onChange('systems_respiratory_symptoms', { ...(form.systems_respiratory_symptoms || {}), [s]: v })} label={s} />
          ))}
        </ApparatoSection>

        {/* Cardiovascolare */}
        <ApparatoSection label="Apparato cardiovascolare" field="systems_cardiovascular" form={form} onChange={onChange}>
          {['aritmie','dispnea','toracoalgie','edemi declivi','varici venose','Raynaud'].map(s => (
            <Cb key={s} id={`cardio_${s}`} checked={!!(form.systems_cardiovascular_symptoms || {})[s]} onChange={v => onChange('systems_cardiovascular_symptoms', { ...(form.systems_cardiovascular_symptoms || {}), [s]: v })} label={s} />
          ))}
        </ApparatoSection>

        {/* Gastrointestinale */}
        <ApparatoSection label="Apparato gastrointestinale" field="systems_gastrointestinal" form={form} onChange={onChange}>
          {['dispepsia','nausea','vomito','diarrea','stipsi','coliche'].map(s => (
            <Cb key={s} id={`gi_${s}`} checked={!!(form.systems_gastrointestinal_symptoms || {})[s]} onChange={v => onChange('systems_gastrointestinal_symptoms', { ...(form.systems_gastrointestinal_symptoms || {}), [s]: v })} label={s} />
          ))}
        </ApparatoSection>

        {/* Urogenitale */}
        <ApparatoSection label="Apparato urogenitale" field="systems_urogenital" form={form} onChange={onChange}>
          {['ematuria','coliche','nicturia'].map(s => (
            <Cb key={s} id={`uro_${s}`} checked={!!(form.systems_urogenital_symptoms || {})[s]} onChange={v => onChange('systems_urogenital_symptoms', { ...(form.systems_urogenital_symptoms || {}), [s]: v })} label={s} />
          ))}
        </ApparatoSection>

        {/* Osteoarticolare */}
        <div className="border border-border rounded-lg p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-sm underline underline-offset-2 min-w-[160px]">Apparato osteoarticolare:</span>
            {systemsOptions.map(o => (
              <label key={o.value} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="systems_musculoskeletal" value={o.value} checked={(form.systems_musculoskeletal || 'non_sintomi') === o.value} onChange={() => onChange('systems_musculoskeletal', o.value)} className="h-3.5 w-3.5 cursor-pointer accent-primary" />
                {o.label}
              </label>
            ))}
          </div>
          <div className="space-y-1 pl-1 text-sm">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span className="font-medium text-xs text-muted-foreground mr-1">Rachialgie:</span>
              {['cervicali','dorsali','lombosacrali'].map(s => (
                <Cb key={s} id={`rach_${s}`} checked={!!(form.systems_musculoskeletal_rachialgie || {})[s]} onChange={v => onChange('systems_musculoskeletal_rachialgie', { ...(form.systems_musculoskeletal_rachialgie || {}), [s]: v })} label={s} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span className="font-medium text-xs text-muted-foreground mr-1">Algie:</span>
              {[['spalla dx','spalla_dx'],['spalla sin','spalla_sin'],['gomito dx','gomito_dx'],['gomito sin','gomito_sin'],['polso dx','polso_dx'],['polso sin','polso_sin'],['dita mano dx','dita_dx'],['dita mano sin','dita_sin']].map(([label, key]) => (
                <Cb key={key} id={`alg1_${key}`} checked={!!(form.systems_musculoskeletal_algie || {})[key]} onChange={v => onChange('systems_musculoskeletal_algie', { ...(form.systems_musculoskeletal_algie || {}), [key]: v })} label={label} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span className="font-medium text-xs text-muted-foreground mr-1">Algie:</span>
              {[['anca dx','anca_dx'],['anca sin','anca_sin'],['ginocchio dx','ginocchio_dx'],['ginocchio sin','ginocchio_sin'],['caviglia dx','caviglia_dx'],['caviglia sin','caviglia_sin'],['piede dx','piede_dx'],['piede sin','piede_sin']].map(([label, key]) => (
                <Cb key={key} id={`alg2_${key}`} checked={!!(form.systems_musculoskeletal_algie || {})[key]} onChange={v => onChange('systems_musculoskeletal_algie', { ...(form.systems_musculoskeletal_algie || {}), [key]: v })} label={label} />
              ))}
            </div>
          </div>
          <Input placeholder="Note libere..." value={form.systems_musculoskeletal_details || ''} onChange={e => onChange('systems_musculoskeletal_details', e.target.value)} className="h-7 text-sm" />
        </div>

        {/* Uditivo */}
        <div className="border border-border rounded-lg p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-sm underline underline-offset-2 min-w-[160px]">Apparato uditivo:</span>
            {systemsOptions.map(o => (
              <label key={o.value} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="systems_hearing" value={o.value} checked={(form.systems_hearing || 'non_sintomi') === o.value} onChange={() => onChange('systems_hearing', o.value)} className="h-3.5 w-3.5 cursor-pointer accent-primary" />
                {o.label}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pl-1">
            {[['otodinia dx','otodinia_dx'],['otodinia sin','otodinia_sin'],['acufeni dx','acufeni_dx'],['acufeni sin','acufeni_sin'],['ipoacusia dx','ipoacusia_dx'],['ipoacusia sin','ipoacusia_sin']].map(([label, key]) => (
              <Cb key={key} id={`hea_${key}`} checked={!!(form.systems_hearing_symptoms || {})[key]} onChange={v => onChange('systems_hearing_symptoms', { ...(form.systems_hearing_symptoms || {}), [key]: v })} label={label} />
            ))}
          </div>
          <Input placeholder="Note libere..." value={form.systems_hearing_details || ''} onChange={e => onChange('systems_hearing_details', e.target.value)} className="h-7 text-sm" />
        </div>

        {/* Vestibolare */}
        <ApparatoSection label="Apparato vestibolare" field="systems_vestibular" form={form} onChange={onChange}>
          {['capogiri','vertigine','nausea','vomito'].map(s => (
            <Cb key={s} id={`vest_${s}`} checked={!!(form.systems_vestibular_symptoms || {})[s]} onChange={v => onChange('systems_vestibular_symptoms', { ...(form.systems_vestibular_symptoms || {}), [s]: v })} label={s} />
          ))}
        </ApparatoSection>

        {/* Cute */}
        <ApparatoSection label="Cute" field="systems_skin" form={form} onChange={onChange}>
          {['prurito','eritema'].map(s => (
            <Cb key={s} id={`skin_${s}`} checked={!!(form.systems_skin_symptoms || {})[s]} onChange={v => onChange('systems_skin_symptoms', { ...(form.systems_skin_symptoms || {}), [s]: v })} label={s} />
          ))}
        </ApparatoSection>

        {/* Sistema nervoso */}
        <ApparatoSection label="Sistema nervoso" field="systems_nervous" form={form} onChange={onChange}>
          {['parestesie','ipoestesia','ipostenia','ridotta attenzione/concentrazione','amnesia','cefalea','insonnia','lipotimie'].map(s => (
            <Cb key={s} id={`nerv_${s}`} checked={!!(form.systems_nervous_symptoms || {})[s]} onChange={v => onChange('systems_nervous_symptoms', { ...(form.systems_nervous_symptoms || {}), [s]: v })} label={s} />
          ))}
        </ApparatoSection>

        {/* Psiche */}
        <ApparatoSection label="Psiche" field="systems_psych" form={form} onChange={onChange}>
          {['ansia','depressione','irritabilità','nervosismo'].map(s => (
            <Cb key={s} id={`psy_${s}`} checked={!!(form.systems_psych_symptoms || {})[s]} onChange={v => onChange('systems_psych_symptoms', { ...(form.systems_psych_symptoms || {}), [s]: v })} label={s} />
          ))}
        </ApparatoSection>

        {/* Sintomatologia attuale */}
        <div>
          <Label className="text-sm">Sintomatologia attuale</Label>
          <Textarea value={form.current_symptoms || ''} onChange={e => onChange('current_symptoms', e.target.value)} rows={2} />
        </div>
      </CardContent></Card>
    </div>
  );
}