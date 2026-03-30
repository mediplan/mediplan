import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MEMBERS = [
  { key: 'padre', label: 'Padre' },
  { key: 'madre', label: 'Madre' },
  { key: 'coniuge', label: 'Coniuge/Partner' },
];

/**
 * family: {
 *   padre: { vivente, deceduto, deceduto_per, malattie },
 *   madre: { ... },
 *   coniuge: { ... },
 *   figli_n: number,
 *   collaterali_n: number,
 *   collaterali_malattie: string,
 * }
 */
export default function FamilyAnamnesisForm({ value, onChange }) {
  const family = value || {};

  const setMember = (key, field, val) => {
    const updated = {
      ...family,
      [key]: { ...(family[key] || {}), [field]: val },
    };
    onChange(updated);
  };

  const setRoot = (field, val) => {
    onChange({ ...family, [field]: val });
  };

  return (
    <div className="space-y-3">
      {/* Padre, Madre, Coniuge */}
      {MEMBERS.map(({ key, label }) => {
        const m = family[key] || {};
        return (
          <div key={key} className="grid grid-cols-1 gap-2">
            <div className="flex flex-wrap items-center gap-3 py-2 border-b border-border last:border-0">
              {/* Nome membro */}
              <span className="text-sm font-medium w-28 shrink-0">{label}:</span>

              {/* Vivente */}
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!m.vivente}
                  onChange={e => setMember(key, 'vivente', e.target.checked)}
                  className="h-3.5 w-3.5 accent-primary"
                />
                vivente
              </label>

              {/* Deceduto */}
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!m.deceduto}
                  onChange={e => setMember(key, 'deceduto', e.target.checked)}
                  className="h-3.5 w-3.5 accent-primary"
                />
                deceduto per
              </label>
              <Input
                value={m.deceduto_per || ''}
                onChange={e => setMember(key, 'deceduto_per', e.target.value)}
                className="h-7 text-sm flex-1 min-w-[120px] max-w-[200px]"
                placeholder="causa..."
              />

              {/* Malattie */}
              <label className="flex items-center gap-1.5 text-sm cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={!!m.malattie_flag}
                  onChange={e => setMember(key, 'malattie_flag', e.target.checked)}
                  className="h-3.5 w-3.5 accent-primary"
                />
                malattie
              </label>
              <Input
                value={m.malattie || ''}
                onChange={e => setMember(key, 'malattie', e.target.value)}
                className="h-7 text-sm flex-1 min-w-[140px]"
                placeholder="specificare..."
              />
            </div>
          </div>
        );
      })}

      {/* Figli e Collaterali */}
      <div className="flex flex-wrap items-center gap-4 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Figli N°</span>
          <Input
            type="number"
            min="0"
            value={family.figli_n ?? ''}
            onChange={e => setRoot('figli_n', e.target.value === '' ? '' : Number(e.target.value))}
            className="h-7 text-sm w-16"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Collaterali N°</span>
          <Input
            type="number"
            min="0"
            value={family.collaterali_n ?? ''}
            onChange={e => setRoot('collaterali_n', e.target.value === '' ? '' : Number(e.target.value))}
            className="h-7 text-sm w-16"
          />
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={!!family.collaterali_malattie_flag}
              onChange={e => setRoot('collaterali_malattie_flag', e.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            malattie
          </label>
          <Input
            value={family.collaterali_malattie || ''}
            onChange={e => setRoot('collaterali_malattie', e.target.value)}
            className="h-7 text-sm flex-1"
            placeholder="specificare..."
          />
        </div>
      </div>
    </div>
  );
}