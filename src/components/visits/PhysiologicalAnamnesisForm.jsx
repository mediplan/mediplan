import React from 'react';
import { Input } from '@/components/ui/input';

function CheckOption({ id, checked, onChange, label }) {
  return (
    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
      <input
        type="checkbox"
        id={id}
        checked={!!checked}
        onChange={e => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-primary"
      />
      {label}
    </label>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex flex-wrap items-start gap-3 py-2 border-b border-border last:border-0">
      <span className="text-sm font-medium w-36 shrink-0 pt-0.5">{label}:</span>
      <div className="flex flex-wrap items-center gap-3 flex-1">{children}</div>
    </div>
  );
}

export default function PhysiologicalAnamnesisForm({ value, onChange }) {
  const d = value || {};

  const set = (field, val) => onChange({ ...d, [field]: val });

  return (
    <div className="space-y-0">

      {/* Nato/a a termine */}
      <Row label="Nato/a a termine">
        <CheckOption checked={d.nato_termine_si} onChange={v => set('nato_termine_si', v)} label="sì" />
        <CheckOption checked={d.nato_termine_no} onChange={v => set('nato_termine_no', v)} label="no" />
        <Input value={d.nato_termine_note || ''} onChange={e => set('nato_termine_note', e.target.value)} className="h-7 text-sm w-32" placeholder="note..." />
        <span className="text-sm">parto:</span>
        <CheckOption checked={d.parto_eutocico} onChange={v => set('parto_eutocico', v)} label="eutocico" />
        <CheckOption checked={d.parto_distocico} onChange={v => set('parto_distocico', v)} label="distocico" />
      </Row>

      {/* Malformazioni */}
      <Row label="Malformazioni">
        <CheckOption checked={d.malformazioni_no} onChange={v => set('malformazioni_no', v)} label="no" />
        <CheckOption checked={d.malformazioni_si} onChange={v => set('malformazioni_si', v)} label="sì" />
        <Input value={d.malformazioni_note || ''} onChange={e => set('malformazioni_note', e.target.value)} className="h-7 text-sm flex-1 min-w-[140px]" placeholder="specificare..." />
      </Row>

      {/* Scolarità */}
      <Row label="Scolarità">
        <CheckOption checked={d.scolarita_elementare} onChange={v => set('scolarita_elementare', v)} label="elementare" />
        <CheckOption checked={d.scolarita_media} onChange={v => set('scolarita_media', v)} label="media" />
        <CheckOption checked={d.scolarita_superiore} onChange={v => set('scolarita_superiore', v)} label="superiore" />
        <CheckOption checked={d.scolarita_laurea} onChange={v => set('scolarita_laurea', v)} label="laurea" />
        <Input value={d.scolarita_note || ''} onChange={e => set('scolarita_note', e.target.value)} className="h-7 text-sm w-32" placeholder="altro..." />
      </Row>

      {/* Stato civile */}
      <Row label="Stato civile">
        <CheckOption checked={d.stato_civile_celibe} onChange={v => set('stato_civile_celibe', v)} label="celibe/nubile" />
        <CheckOption checked={d.stato_civile_coniugato} onChange={v => set('stato_civile_coniugato', v)} label="coniugato/a" />
        <CheckOption checked={d.stato_civile_divorziato} onChange={v => set('stato_civile_divorziato', v)} label="divorziato/a" />
        <CheckOption checked={d.stato_civile_vedovo} onChange={v => set('stato_civile_vedovo', v)} label="vedovo/a" />
        <Input value={d.stato_civile_note || ''} onChange={e => set('stato_civile_note', e.target.value)} className="h-7 text-sm w-28" placeholder="note..." />
      </Row>

      {/* Servizio di leva */}
      <Row label="Servizio di leva">
        <CheckOption checked={d.leva_svolto} onChange={v => set('leva_svolto', v)} label="svolto" />
        <Input value={d.leva_svolto_note || ''} onChange={e => set('leva_svolto_note', e.target.value)} className="h-7 text-sm w-24" placeholder="arma..." />
        <CheckOption checked={d.leva_non_svolto} onChange={v => set('leva_non_svolto', v)} label="non svolto per" />
        <Input value={d.leva_non_svolto_note || ''} onChange={e => set('leva_non_svolto_note', e.target.value)} className="h-7 text-sm flex-1 min-w-[120px]" placeholder="motivo..." />
      </Row>

      {/* Appetito */}
      <Row label="Appetito">
        <CheckOption checked={d.appetito_buono} onChange={v => set('appetito_buono', v)} label="buono" />
        <CheckOption checked={d.appetito_regolare} onChange={v => set('appetito_regolare', v)} label="regolare" />
        <CheckOption checked={d.appetito_scarso} onChange={v => set('appetito_scarso', v)} label="scarso" />
        <Input value={d.appetito_note || ''} onChange={e => set('appetito_note', e.target.value)} className="h-7 text-sm flex-1 min-w-[120px]" placeholder="note..." />
      </Row>

      {/* Digestione */}
      <Row label="Digestione">
        <CheckOption checked={d.digestione_regolare} onChange={v => set('digestione_regolare', v)} label="regolare" />
        <CheckOption checked={d.digestione_irregolare} onChange={v => set('digestione_irregolare', v)} label="irregolare" />
        <Input value={d.digestione_note || ''} onChange={e => set('digestione_note', e.target.value)} className="h-7 text-sm flex-1 min-w-[120px]" placeholder="note..." />
      </Row>

      {/* Alvo */}
      <Row label="Alvo">
        <CheckOption checked={d.alvo_regolare} onChange={v => set('alvo_regolare', v)} label="regolare" />
        <CheckOption checked={d.alvo_irregolare} onChange={v => set('alvo_irregolare', v)} label="irregolare" />
        <Input value={d.alvo_note || ''} onChange={e => set('alvo_note', e.target.value)} className="h-7 text-sm flex-1 min-w-[120px]" placeholder="note..." />
      </Row>

      {/* Minzione/diuresi */}
      <Row label="Minzione/diuresi">
        <CheckOption checked={d.minzione_regolare} onChange={v => set('minzione_regolare', v)} label="regolare" />
        <CheckOption checked={d.minzione_irregolare} onChange={v => set('minzione_irregolare', v)} label="irregolare" />
        <Input value={d.minzione_note || ''} onChange={e => set('minzione_note', e.target.value)} className="h-7 text-sm flex-1 min-w-[120px]" placeholder="note..." />
      </Row>

      {/* Allergie */}
      <Row label="Allergie">
        <CheckOption checked={d.allergie_no} onChange={v => set('allergie_no', v)} label="no" />
        <CheckOption checked={d.allergie_si} onChange={v => set('allergie_si', v)} label="sì" />
        <CheckOption checked={d.allergie_inalanti} onChange={v => set('allergie_inalanti', v)} label="inalanti" />
        <CheckOption checked={d.allergie_stagionali} onChange={v => set('allergie_stagionali', v)} label="stagionali" />
        <CheckOption checked={d.allergie_perenni} onChange={v => set('allergie_perenni', v)} label="perenni" />
        <div className="flex flex-wrap items-center gap-2 w-full mt-1">
          <CheckOption checked={d.allergie_alimenti} onChange={v => set('allergie_alimenti', v)} label="alimenti" />
          <Input value={d.allergie_alimenti_note || ''} onChange={e => set('allergie_alimenti_note', e.target.value)} className="h-7 text-sm w-32" placeholder="specificare..." />
          <CheckOption checked={d.allergie_farmaci} onChange={v => set('allergie_farmaci', v)} label="farmaci" />
          <Input value={d.allergie_farmaci_note || ''} onChange={e => set('allergie_farmaci_note', e.target.value)} className="h-7 text-sm w-32" placeholder="specificare..." />
          <CheckOption checked={d.allergie_altro} onChange={v => set('allergie_altro', v)} label="altro" />
          <Input value={d.allergie_altro_note || ''} onChange={e => set('allergie_altro_note', e.target.value)} className="h-7 text-sm w-32" placeholder="specificare..." />
        </div>
      </Row>

      {/* Stato vaccinale */}
      <Row label="Stato vaccinale">
        <span className="text-sm">Antitetanica</span>
        <CheckOption checked={d.vaccino_tetano_no} onChange={v => set('vaccino_tetano_no', v)} label="no" />
        <CheckOption checked={d.vaccino_tetano_si} onChange={v => set('vaccino_tetano_si', v)} label="sì" />
        <span className="text-sm">Data</span>
        <Input type="date" value={d.vaccino_tetano_data || ''} onChange={e => set('vaccino_tetano_data', e.target.value)} className="h-7 text-sm w-36" />
        <div className="flex items-center gap-2 w-full mt-1">
          <span className="text-sm shrink-0">Altro</span>
          <Input value={d.vaccino_altro || ''} onChange={e => set('vaccino_altro', e.target.value)} className="h-7 text-sm flex-1" placeholder="altri vaccini..." />
        </div>
      </Row>

      {/* Menarca */}
      <Row label="Menarca">
        <span className="text-sm">età</span>
        <Input type="number" min="0" value={d.menarca_eta || ''} onChange={e => set('menarca_eta', e.target.value)} className="h-7 text-sm w-16" />
        <span className="text-sm">cicli:</span>
        <CheckOption checked={d.menarca_regolari} onChange={v => set('menarca_regolari', v)} label="regolari" />
        <CheckOption checked={d.menarca_irregolari} onChange={v => set('menarca_irregolari', v)} label="irregolari" />
        <Input value={d.menarca_note || ''} onChange={e => set('menarca_note', e.target.value)} className="h-7 text-sm flex-1 min-w-[120px]" placeholder="note..." />
      </Row>

      {/* Gravidanze */}
      <Row label="Gravidanze">
        <span className="text-sm">N°</span>
        <Input type="number" min="0" value={d.gravidanze_n || ''} onChange={e => set('gravidanze_n', e.target.value)} className="h-7 text-sm w-16" />
        <span className="text-sm">a termine</span>
        <Input value={d.gravidanze_a_termine || ''} onChange={e => set('gravidanze_a_termine', e.target.value)} className="h-7 text-sm w-20" />
        <div className="flex flex-wrap items-center gap-2 w-full mt-1">
          <span className="text-sm">parti eutocici:</span>
          <Input type="number" min="0" value={d.gravidanze_eutocici || ''} onChange={e => set('gravidanze_eutocici', e.target.value)} className="h-7 text-sm w-16" />
          <span className="text-sm">distocici:</span>
          <Input type="number" min="0" value={d.gravidanze_distocici || ''} onChange={e => set('gravidanze_distocici', e.target.value)} className="h-7 text-sm w-16" />
          <span className="text-sm">aborti:</span>
          <Input type="number" min="0" value={d.gravidanze_aborti || ''} onChange={e => set('gravidanze_aborti', e.target.value)} className="h-7 text-sm w-16" />
        </div>
      </Row>

      {/* Menopausa */}
      <Row label="Menopausa">
        <span className="text-sm">età:</span>
        <Input type="number" min="0" value={d.menopausa_eta || ''} onChange={e => set('menopausa_eta', e.target.value)} className="h-7 text-sm w-16" />
        <span className="text-sm">anni</span>
        <CheckOption checked={d.menopausa_fisiologica} onChange={v => set('menopausa_fisiologica', v)} label="fisiologica" />
        <CheckOption checked={d.menopausa_chirurgica} onChange={v => set('menopausa_chirurgica', v)} label="chirurgica" />
        <Input value={d.menopausa_note || ''} onChange={e => set('menopausa_note', e.target.value)} className="h-7 text-sm flex-1 min-w-[120px]" placeholder="note..." />
      </Row>

    </div>
  );
}