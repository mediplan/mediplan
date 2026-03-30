import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CB = ({ id, checked, onChange, label }) => (
  <label htmlFor={id} className="flex items-center gap-1.5 cursor-pointer select-none text-sm">
    <input type="checkbox" id={id} checked={!!checked} onChange={e => onChange(e.target.checked)} className="h-3.5 w-3.5 cursor-pointer accent-primary" />
    {label}
  </label>
);

const Field = ({ value, onChange, placeholder, className = 'w-28' }) => (
  <Input
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className={`h-7 text-sm ${className}`}
  />
);

export default function LifestyleForm({ value = {}, onChange }) {
  const set = (key, val) => onChange({ ...value, [key]: val });

  return (
    <div className="space-y-4 text-sm">

      {/* FUMO */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-4">
          <CB id="non_fumatore" checked={value.smoker === 'non_fumatore'} onChange={() => set('smoker', 'non_fumatore')} label="non fumatore" />
          <div className="flex flex-wrap items-center gap-2">
            <CB id="fumatore" checked={value.smoker === 'fumatore'} onChange={() => set('smoker', 'fumatore')} label="fuma N°" />
            <Field value={value.smoker_n} onChange={v => set('smoker_n', v)} placeholder="__" className="w-14" />
            <span className="text-muted-foreground">sig./die dal</span>
            <Field value={value.smoker_dal} onChange={v => set('smoker_dal', v)} placeholder="____" className="w-20" />
            <span className="text-muted-foreground">Nota:</span>
            <Field value={value.smoker_nota} onChange={v => set('smoker_nota', v)} placeholder="" className="w-48" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-4">
          <CB id="ex_fumatore" checked={value.smoker === 'ex_fumatore'} onChange={() => set('smoker', 'ex_fumatore')} label="ex fumatore di N°" />
          <Field value={value.ex_smoker_n} onChange={v => set('ex_smoker_n', v)} placeholder="__" className="w-14" />
          <span className="text-muted-foreground">sig./die dal</span>
          <Field value={value.ex_smoker_dal} onChange={v => set('ex_smoker_dal', v)} placeholder="____" className="w-20" />
          <span className="text-muted-foreground">al</span>
          <Field value={value.ex_smoker_al} onChange={v => set('ex_smoker_al', v)} placeholder="____" className="w-20" />
        </div>
      </div>

      {/* ALCOL */}
      <div className="flex flex-wrap items-center gap-4">
        <CB id="astemio" checked={value.alcohol === 'astemio'} onChange={() => set('alcohol', 'astemio')} label="astemio" />
        <CB id="bev_occ" checked={value.alcohol === 'occasionale'} onChange={() => set('alcohol', 'occasionale')} label="bevitore occasionale di alcolici" />
        <CB id="beve" checked={value.alcohol === 'beve'} onChange={() => set('alcohol', 'beve')} label="beve" />
        <CB id="alc_meno" checked={value.alcohol === 'meno_mezzo'} onChange={() => set('alcohol', 'meno_mezzo')} label="< ½ L/die" />
        <CB id="alc_mezzo" checked={value.alcohol === 'mezzo_uno'} onChange={() => set('alcohol', 'mezzo_uno')} label="½ - 1 L/die" />
        <CB id="alc_oltre" checked={value.alcohol === 'oltre_uno'} onChange={() => set('alcohol', 'oltre_uno')} label="> 1 L/die" />
        <span className="text-muted-foreground">di alcolici</span>
      </div>

      {/* CAFFE + SPORT */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">N° caffè/die</span>
          <Field value={value.caffe_die} onChange={v => set('caffe_die', v)} placeholder="__" className="w-14" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">caffè corretti/die</span>
          <Field value={value.caffe_corretti_die} onChange={v => set('caffe_corretti_die', v)} placeholder="__" className="w-14" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Attività sportiva regolare:</span>
          <CB id="sport_no" checked={value.sport === false || value.sport === 'no'} onChange={() => set('sport', 'no')} label="no" />
          <CB id="sport_si" checked={value.sport === true || value.sport === 'si'} onChange={() => set('sport', 'si')} label="sì" />
          {(value.sport === true || value.sport === 'si') && (
            <Field value={value.sport_details} onChange={v => set('sport_details', v)} placeholder="Tipo/frequenza..." className="w-48" />
          )}
        </div>
      </div>

      {/* DONATORE DI SANGUE */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-muted-foreground">Donatore di sangue:</span>
        <CB id="donor_no" checked={value.blood_donor === false || value.blood_donor === 'no'} onChange={() => set('blood_donor', 'no')} label="no" />
        <CB id="donor_si" checked={value.blood_donor === true || value.blood_donor === 'si'} onChange={() => set('blood_donor', 'si')} label="sì" />
        {(value.blood_donor === true || value.blood_donor === 'si') && (
          <>
            <span className="text-muted-foreground">dal:</span>
            <Field value={value.blood_donor_dal} onChange={v => set('blood_donor_dal', v)} placeholder="____" className="w-24" />
            <span className="text-muted-foreground">ultima donazione:</span>
            <Field value={value.blood_donor_last} onChange={v => set('blood_donor_last', v)} placeholder="____" className="w-28" />
          </>
        )}
      </div>

    </div>
  );
}