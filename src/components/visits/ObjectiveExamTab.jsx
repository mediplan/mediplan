import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';

function Cb({ id, checked, onChange, label }) {
  return (
    <label htmlFor={id} className="flex items-center gap-1 text-sm cursor-pointer select-none">
      <input type="checkbox" id={id} checked={!!checked} onChange={e => onChange(e.target.checked)} className="h-3.5 w-3.5 cursor-pointer accent-primary" />
      {label}
    </label>
  );
}

function RadioRow({ label, field, options, form, onChange, noteField }) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-1 border-b border-border/50 last:border-0">
      <span className="font-semibold text-sm underline underline-offset-2 min-w-[160px]">{label}:</span>
      {options.map(o => (
        <label key={o.value} className="flex items-center gap-1 text-sm cursor-pointer">
          <input type="radio" name={field} value={o.value}
            checked={(form[field] || '') === o.value}
            onChange={() => onChange(field, o.value)}
            className="h-3.5 w-3.5 cursor-pointer accent-primary"
          />
          {o.label}
        </label>
      ))}
      {noteField !== false && (
        <Input
          placeholder="note..."
          value={form[noteField || `${field}_notes`] || ''}
          onChange={e => onChange(noteField || `${field}_notes`, e.target.value)}
          className="h-7 text-xs flex-1 min-w-[120px]"
        />
      )}
    </div>
  );
}

export default function ObjectiveExamTab({ form, onChange, onFillNormal }) {
  const chk = (field) => ({
    checked: !!form[field],
    onChange: (v) => onChange(field, v),
  });
  const obj = (field) => form[field] || {};
  const setObj = (field, key, val) => onChange(field, { ...obj(field), [key]: val });

  return (
    <div className="space-y-4">
      <Card><CardContent className="pt-4 space-y-4">
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onFillNormal} className="gap-2 text-primary border-primary/40">
            <Wand2 className="h-3.5 w-3.5" /> Compila valori normali
          </Button>
        </div>

        {/* Parametri vitali */}
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <Label className="text-xs">Altezza (cm)</Label>
            <Input type="number" value={form.height_cm || ''} onChange={e => onChange('height_cm', e.target.value)} className="w-24" />
          </div>
          <div>
            <Label className="text-xs">Peso (kg)</Label>
            <Input type="number" value={form.weight_kg || ''} onChange={e => onChange('weight_kg', e.target.value)} className="w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">Biotipo:</Label>
            {['normolineo','brevilineo','longilineo'].map(b => (
              <label key={b} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="obj_biotipo" value={b} checked={form.obj_biotipo === b} onChange={() => onChange('obj_biotipo', b)} className="h-3.5 w-3.5 accent-primary" />
                {b}
              </label>
            ))}
          </div>
        </div>

        {/* ---- SEZIONE: Ispezione generale ---- */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Ispezione generale</p>

        <RadioRow label="Linfonodi" field="obj_lymphnodes" form={form} onChange={onChange}
          options={[{value:'normali',label:'normali'},{value:'patologici',label:'patologici'}]}
          noteField="obj_lymphnodes_notes"
        />

        <RadioRow label="Cavo orale" field="obj_oral" form={form} onChange={onChange}
          options={[{value:'normale',label:'normale'},{value:'patologico',label:'patologico'}]}
          noteField="obj_oral_notes"
        />

        {/* Cute */}
        <div className="py-1 border-b border-border/50 space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-sm underline underline-offset-2 min-w-[160px]">Cute:</span>
            {['normale','pallore','ittero','cianosi'].map(v => (
              <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="obj_skin_color" value={v} checked={(form.obj_skin_color||'') === v} onChange={() => onChange('obj_skin_color', v)} className="h-3.5 w-3.5 accent-primary" />
                {v === 'normale' ? 'colorito normale' : v}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 pl-1">
            <span className="text-sm">trofismo</span>
            {['normale','alterato'].map(v => (
              <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="obj_skin_trophism" value={v} checked={(form.obj_skin_trophism||'') === v} onChange={() => onChange('obj_skin_trophism', v)} className="h-3.5 w-3.5 accent-primary" />
                {v}
              </label>
            ))}
            <Input placeholder="alterazioni..." value={form.obj_skin_trophism_notes||''} onChange={e => onChange('obj_skin_trophism_notes', e.target.value)} className="h-7 text-xs w-40" />
          </div>
          <div className="flex flex-wrap items-center gap-3 pl-1">
            <Cb id="skin_nevi" {...chk('obj_skin_nevi')} label="nevi" />
            <Input placeholder="descrizione..." value={form.obj_skin_nevi_notes||''} onChange={e => onChange('obj_skin_nevi_notes', e.target.value)} className="h-7 text-xs w-40" />
            <Cb id="skin_altro" {...chk('obj_skin_altro')} label="altro" />
            <Input placeholder="descrizione..." value={form.obj_skin_altro_notes||''} onChange={e => onChange('obj_skin_altro_notes', e.target.value)} className="h-7 text-xs w-40" />
          </div>
        </div>

        <RadioRow label="Annessi cutanei" field="obj_skin_appendages" form={form} onChange={onChange}
          options={[{value:'normali',label:'normali'},{value:'patologici',label:'patologici'}]}
          noteField="obj_skin_appendages_notes"
        />

        <RadioRow label="Capo/collo" field="obj_head_neck" form={form} onChange={onChange}
          options={[{value:'normale',label:'normale'},{value:'patologico',label:'patologico'}]}
          noteField="obj_head_neck_notes"
        />

        {/* Pupille */}
        <div className="flex flex-wrap items-center gap-3 py-1 border-b border-border/50">
          <span className="font-semibold text-sm underline underline-offset-2 min-w-[160px]">Pupille:</span>
          {['isocoriche','isocicliche','normoreagenti','altro'].map(v => (
            <Cb key={v} id={`pup_${v}`} checked={!!(obj('obj_pupils_structured')[v])} onChange={val => setObj('obj_pupils_structured', v, val)} label={v} />
          ))}
          <Input placeholder="note..." value={form.obj_pupils_notes||''} onChange={e => onChange('obj_pupils_notes', e.target.value)} className="h-7 text-xs flex-1 min-w-[100px]" />
        </div>

        {/* ---- SEZIONE: Torace ---- */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Torace</p>

        <div className="py-1 border-b border-border/50 space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-sm underline underline-offset-2 min-w-[160px]">ispezione:</span>
            {['normoespansibile','ipoespansibile','iperespanso'].map(v => (
              <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="obj_thorax" value={v} checked={(form.obj_thorax||'') === v} onChange={() => onChange('obj_thorax', v)} className="h-3.5 w-3.5 accent-primary" />
                {v}
              </label>
            ))}
            <Input placeholder="note..." value={form.obj_thorax_notes||''} onChange={e => onChange('obj_thorax_notes', e.target.value)} className="h-7 text-xs flex-1 min-w-[100px]" />
          </div>
          <div className="flex flex-wrap items-center gap-3 pl-1">
            {['simmetrico','asimmetrico'].map(v => (
              <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="obj_thorax_symmetry" value={v} checked={(form.obj_thorax_symmetry||'') === v} onChange={() => onChange('obj_thorax_symmetry', v)} className="h-3.5 w-3.5 accent-primary" />
                {v}
              </label>
            ))}
            <Input placeholder="note..." value={form.obj_thorax_symmetry_notes||''} onChange={e => onChange('obj_thorax_symmetry_notes', e.target.value)} className="h-7 text-xs flex-1 min-w-[100px]" />
          </div>
        </div>

        <RadioRow label="fremito vocale tattile" field="obj_fremito" form={form} onChange={onChange}
          options={[{value:'normale',label:'normale'},{value:'ridotto',label:'ridotto'},{value:'aumentato',label:'aumentato'}]}
          noteField="obj_fremito_notes"
        />
        <RadioRow label="fonesi plessica" field="obj_fonesi" form={form} onChange={onChange}
          options={[{value:'normale',label:'normale'},{value:'iperfonesi',label:'iperfonesi'},{value:'ipofonesi',label:'ipofonesi'}]}
          noteField="obj_fonesi_notes"
        />
        <RadioRow label="murmure vescicolare" field="obj_murmur" form={form} onChange={onChange}
          options={[{value:'normale',label:'normale'},{value:'aspro',label:'aspro'},{value:'ridotto',label:'ridotto'}]}
          noteField="obj_murmur_notes"
        />

        {/* Rumori aggiunti */}
        <div className="py-1 border-b border-border/50 space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-sm underline underline-offset-2 min-w-[160px]">rumori aggiunti:</span>
            {['ronchi','rantoli','sibili','fischi','gemiti','espirio prolungato'].map(s => (
              <Cb key={s} id={`rum_${s}`} checked={!!(obj('obj_added_sounds_structured')[s])} onChange={val => setObj('obj_added_sounds_structured', s, val)} label={s} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 pl-1">
            {['crepitii','sfregamenti'].map(s => (
              <Cb key={s} id={`rum2_${s}`} checked={!!(obj('obj_added_sounds_structured')[s])} onChange={val => setObj('obj_added_sounds_structured', s, val)} label={s} />
            ))}
            <Input placeholder="note..." value={form.obj_added_sounds_notes||''} onChange={e => onChange('obj_added_sounds_notes', e.target.value)} className="h-7 text-xs flex-1 min-w-[100px]" />
          </div>
        </div>

        {/* ---- SEZIONE: Apparato cardiovascolare ---- */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Apparato cardiovascolare</p>

        <div className="flex flex-wrap gap-4 items-center py-1 border-b border-border/50">
          <span className="font-semibold text-sm">PA:</span>
          <Input type="number" value={form.blood_pressure_systolic||''} onChange={e => onChange('blood_pressure_systolic', e.target.value)} className="h-7 w-16 text-sm" />
          <span className="text-sm">/</span>
          <Input type="number" value={form.blood_pressure_diastolic||''} onChange={e => onChange('blood_pressure_diastolic', e.target.value)} className="h-7 w-16 text-sm" />
          <span className="text-sm">mmHg</span>
          {['clinostatismo','ortostatismo'].map(v => (
            <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="radio" name="obj_pa_position" value={v} checked={(form.obj_pa_position||'') === v} onChange={() => onChange('obj_pa_position', v)} className="h-3.5 w-3.5 accent-primary" />
              {v}
            </label>
          ))}
          <span className="text-sm font-semibold">FC:</span>
          <Input type="number" value={form.heart_rate||''} onChange={e => onChange('heart_rate', e.target.value)} className="h-7 w-16 text-sm" />
          <span className="text-sm">battiti/min</span>
        </div>

        <RadioRow label="toni cardiaci" field="obj_heart_tones" form={form} onChange={onChange}
          options={[{value:'normali',label:'normali'},{value:'patologici',label:'patologici'}]}
          noteField="obj_heart_tones_notes"
        />

        {/* Pause */}
        <div className="py-1 border-b border-border/50 space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-sm underline underline-offset-2 min-w-[160px]">pause:</span>
            {['libere','presenza di soffi'].map(v => (
              <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="obj_cardiac_pauses" value={v} checked={(form.obj_cardiac_pauses||'') === v} onChange={() => onChange('obj_cardiac_pauses', v)} className="h-3.5 w-3.5 accent-primary" />
                {v}
              </label>
            ))}
            <Input placeholder="note..." value={form.obj_cardiac_pauses_notes||''} onChange={e => onChange('obj_cardiac_pauses_notes', e.target.value)} className="h-7 text-xs flex-1 min-w-[100px]" />
          </div>
        </div>

        {/* Vasi */}
        <div className="py-1 border-b border-border/50">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-sm underline underline-offset-2 min-w-[160px]">vasi:</span>
            {[['varici_dx','varici a dx'],['varici_sin','varici a sin'],['turgore_giugulari','turgore giugulari']].map(([key, label]) => (
              <Cb key={key} id={`vas_${key}`} checked={!!(obj('obj_vessels')[key])} onChange={val => setObj('obj_vessels', key, val)} label={label} />
            ))}
            <Cb id="vas_altro" checked={!!(obj('obj_vessels')['altro'])} onChange={val => setObj('obj_vessels', 'altro', val)} label="altro" />
            <Input placeholder="note vasi..." value={form.obj_vessels_notes||''} onChange={e => onChange('obj_vessels_notes', e.target.value)} className="h-7 text-xs flex-1 min-w-[100px]" />
          </div>
        </div>

        <div className="py-1 border-b border-border/50">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-sm underline underline-offset-2 min-w-[160px]">altro cardiovascolare:</span>
            <Input placeholder="note..." value={form.obj_cardiovascular_other||''} onChange={e => onChange('obj_cardiovascular_other', e.target.value)} className="h-7 text-xs flex-1" />
          </div>
        </div>

        {/* ---- SEZIONE: Addome ---- */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Addome</p>

        {/* Addome ispezione */}
        <div className="py-1 border-b border-border/50">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-sm underline underline-offset-2 min-w-[160px]">Addome:</span>
            {['piano','globoso','trattabile','non dolente','dolente'].map(v => (
              <Cb key={v} id={`abd_${v}`} checked={!!(obj('obj_abdomen_structured')[v])} onChange={val => setObj('obj_abdomen_structured', v, val)} label={v} />
            ))}
            <Input placeholder="note..." value={form.obj_abdomen_notes||''} onChange={e => onChange('obj_abdomen_notes', e.target.value)} className="h-7 text-xs flex-1 min-w-[100px]" />
          </div>
        </div>

        {/* Fegato */}
        <div className="py-1 border-b border-border/50 space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-sm underline underline-offset-2 min-w-[160px]">fegato:</span>
            {[['margine_arco','margine inferiore all\'arco'],['debordante','debordante']].map(([v,l]) => (
              <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="obj_liver" value={v} checked={(form.obj_liver||'') === v} onChange={() => onChange('obj_liver', v)} className="h-3.5 w-3.5 accent-primary" />
                {l}
              </label>
            ))}
            <Input type="number" placeholder="cm" value={form.obj_liver_cm||''} onChange={e => onChange('obj_liver_cm', e.target.value)} className="h-7 text-xs w-16" />
          </div>
          <div className="flex flex-wrap items-center gap-3 pl-1">
            {['arrotondato','tagliente'].map(v => (
              <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="obj_liver_edge" value={v} checked={(form.obj_liver_edge||'') === v} onChange={() => onChange('obj_liver_edge', v)} className="h-3.5 w-3.5 accent-primary" />
                {v}
              </label>
            ))}
            <span className="text-sm">di consistenza</span>
            {['parenchimatosa','dura'].map(v => (
              <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="obj_liver_consistency" value={v} checked={(form.obj_liver_consistency||'') === v} onChange={() => onChange('obj_liver_consistency', v)} className="h-3.5 w-3.5 accent-primary" />
                {v}
              </label>
            ))}
            {['non dolente','dolente'].map(v => (
              <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="obj_liver_pain" value={v} checked={(form.obj_liver_pain||'') === v} onChange={() => onChange('obj_liver_pain', v)} className="h-3.5 w-3.5 accent-primary" />
                {v}
              </label>
            ))}
          </div>
        </div>

        {/* Milza */}
        <RadioRow label="milza" field="obj_spleen" form={form} onChange={onChange}
          options={[{value:'non_palpabile',label:'non palpabile'},{value:'palpabile',label:'palpabile'}]}
          noteField="obj_spleen_notes"
        />

        <RadioRow label="manovra di Giordano" field="obj_giordano" form={form} onChange={onChange}
          options={[{value:'negativa',label:'negativa'},{value:'positiva_dx',label:'positiva dx'},{value:'positiva_sx',label:'positiva sx'}]}
          noteField="obj_giordano_notes"
        />

        {/* ---- SEZIONE: Sistema osteoarticolare ---- */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Sistema osteoarticolare</p>

        {/* Segni ortopedici */}
        {[
          { label: 'Lasègue', field: 'obj_lasegue' },
          { label: 'Wasserman', field: 'obj_wasserman' },
          { label: 'Tinel', field: 'obj_tinel' },
          { label: 'Phalen', field: 'obj_phalen' },
          { label: 'Finkelstein', field: 'obj_finkelstein' },
        ].map(({ label, field }) => (
          <div key={field} className="flex flex-wrap items-center gap-3 py-1 border-b border-border/50">
            <span className="font-semibold text-sm underline underline-offset-2 min-w-[160px]">{label}:</span>
            {['negativo','positivo_dx','positivo_sx'].map(v => (
              <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name={field} value={v} checked={(form[field]||'') === v} onChange={() => onChange(field, v)} className="h-3.5 w-3.5 accent-primary" />
                {v === 'negativo' ? 'negativo' : v === 'positivo_dx' ? '+dx' : '+sin'}
              </label>
            ))}
            <Input placeholder="note..." value={form[`${field}_notes`]||''} onChange={e => onChange(`${field}_notes`, e.target.value)} className="h-7 text-xs flex-1 min-w-[100px]" />
          </div>
        ))}

        {/* Rachide */}
        <div className="py-1 border-b border-border/50 space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-sm underline underline-offset-2 min-w-[160px]">rachide — palpazione:</span>
            {['non_dolente','dolente'].map(v => (
              <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="obj_spine_palpation" value={v} checked={(form.obj_spine_palpation||'') === v} onChange={() => onChange('obj_spine_palpation', v)} className="h-3.5 w-3.5 accent-primary" />
                {v === 'non_dolente' ? 'non dolente' : 'dolente'}
              </label>
            ))}
            <Cb id="spi_apofisi" checked={!!form.obj_spine_apofisi} onChange={v => onChange('obj_spine_apofisi', v)} label="apofisi spinose" />
            <Input placeholder="note..." value={form.obj_spine_palpation_notes||''} onChange={e => onChange('obj_spine_palpation_notes', e.target.value)} className="h-7 text-xs flex-1 min-w-[100px]" />
          </div>
          <div className="flex flex-wrap items-center gap-3 pl-1">
            <Cb id="spi_masse" checked={!!form.obj_spine_masse} onChange={v => onChange('obj_spine_masse', v)} label="masse muscolari paravertebrali" />
            <Input placeholder="note..." value={form.obj_spine_masse_notes||''} onChange={e => onChange('obj_spine_masse_notes', e.target.value)} className="h-7 text-xs flex-1 min-w-[100px]" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 py-1 border-b border-border/50">
          <span className="font-semibold text-sm underline underline-offset-2 min-w-[160px]">rachide — motilità:</span>
          {['normale','alterata'].map(v => (
            <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="radio" name="obj_spine_mobility" value={v} checked={(form.obj_spine_mobility||'') === v} onChange={() => onChange('obj_spine_mobility', v)} className="h-3.5 w-3.5 accent-primary" />
              {v}
            </label>
          ))}
          <Input placeholder="note..." value={form.obj_spine_mobility_notes||''} onChange={e => onChange('obj_spine_mobility_notes', e.target.value)} className="h-7 text-xs flex-1 min-w-[100px]" />
        </div>

        <div className="flex flex-wrap items-center gap-3 py-1 border-b border-border/50">
          <span className="font-semibold text-sm underline underline-offset-2 min-w-[160px]">osservazione ritmo lombo-pelvico:</span>
          {['normale','alterato'].map(v => (
            <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="radio" name="obj_lombopelvico" value={v} checked={(form.obj_lombopelvico||'') === v} onChange={() => onChange('obj_lombopelvico', v)} className="h-3.5 w-3.5 accent-primary" />
              {v}
            </label>
          ))}
          <Input placeholder="note..." value={form.obj_lombopelvico_notes||''} onChange={e => onChange('obj_lombopelvico_notes', e.target.value)} className="h-7 text-xs flex-1 min-w-[100px]" />
        </div>

        <div className="py-1 border-b border-border/50">
          <Label className="text-sm font-semibold underline underline-offset-2">arti superiori:</Label>
          <Textarea value={form.obj_upper_limbs||''} onChange={e => onChange('obj_upper_limbs', e.target.value)} rows={2} className="mt-1" />
        </div>

        <div className="py-1 border-b border-border/50">
          <Label className="text-sm font-semibold underline underline-offset-2">arti inferiori:</Label>
          <Textarea value={form.obj_lower_limbs||''} onChange={e => onChange('obj_lower_limbs', e.target.value)} rows={2} className="mt-1" />
        </div>

        {/* ---- SEZIONE: Sistema nervoso ---- */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Sistema nervoso</p>

        {[
          { label: 'sensibilità', field: 'obj_nervous_sensitivity' },
          { label: 'forza', field: 'obj_nervous_strength' },
          { label: 'coordinazione', field: 'obj_nervous_coordination' },
        ].map(({ label, field }) => (
          <RadioRow key={field} label={label} field={field} form={form} onChange={onChange}
            options={[{value:'normale',label:'normale'},{value:'alterata',label:'alterata'}]}
            noteField={`${field}_notes`}
          />
        ))}

        <div className="flex flex-wrap items-center gap-3 py-1 border-b border-border/50">
          <span className="font-semibold text-sm underline underline-offset-2 min-w-[160px]">tremori:</span>
          {['assenti','intenzionali','a_riposo'].map(v => (
            <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="radio" name="obj_tremors" value={v} checked={(form.obj_tremors||'') === v} onChange={() => onChange('obj_tremors', v)} className="h-3.5 w-3.5 accent-primary" />
              {v === 'a_riposo' ? 'a riposo' : v}
            </label>
          ))}
          <Input placeholder="note..." value={form.obj_tremors_notes||''} onChange={e => onChange('obj_tremors_notes', e.target.value)} className="h-7 text-xs flex-1 min-w-[100px]" />
        </div>

        <RadioRow label="Romberg" field="obj_romberg" form={form} onChange={onChange}
          options={[{value:'negativo',label:'negativo'},{value:'positivo',label:'positivo'}]}
          noteField="obj_romberg_notes"
        />

        <RadioRow label="riflessi osteotendinei" field="obj_reflexes" form={form} onChange={onChange}
          options={[{value:'validi',label:'validi'},{value:'alterati',label:'alterati'}]}
          noteField="obj_reflexes_notes"
        />

        {/* Altro/Note */}
        <div>
          <Label className="text-sm font-semibold">Altro / Note</Label>
          <Textarea value={form.obj_notes||''} onChange={e => onChange('obj_notes', e.target.value)} rows={2} className="mt-1" />
        </div>
      </CardContent></Card>
    </div>
  );
}