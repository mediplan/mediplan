import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Input con dropdown che suggerisce voci dal catalogo MedicalExamCatalog.
 * Props:
 *  - value: string
 *  - onChange: (value: string) => void
 *  - placeholder: string
 *  - className: string
 */
export default function ExamCatalogCombobox({ value, onChange, placeholder = 'Nome esame...', className }) {
  const [open, setOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const containerRef = useRef(null);

  const { data: catalog = [] } = useQuery({
    queryKey: ['medicalExamCatalog'],
    queryFn: () => base44.entities.MedicalExamCatalog.list('name'),
    staleTime: 60_000,
  });

  const activeItems = catalog.filter(e => e.active !== false);

  const filtered = value?.trim()
    ? activeItems.filter(e => e.name.toLowerCase().includes(value.toLowerCase()))
    : activeItems;

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const CATEGORY_LABELS = {
    prestazione_medica: 'Accertamenti Integrativi',
    accertamento_strumentale: 'Accertamenti Strumentali',
    esame_laboratorio: 'Esami di Laboratorio',
  };

  // Raggruppa per categoria
  const grouped = filtered.reduce((acc, item) => {
    const cat = item.category || 'altro';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categoryOrder = ['prestazione_medica', 'accertamento_strumentale', 'esame_laboratorio'];

  const handleSelect = (name) => {
    onChange(name);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => { setInputFocused(true); setOpen(true); }}
        onBlur={() => setInputFocused(false)}
        placeholder={placeholder}
        className={className}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {categoryOrder.map(cat => {
            const items = grouped[cat];
            if (!items?.length) return null;
            return (
              <div key={cat}>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 sticky top-0">
                  {CATEGORY_LABELS[cat] || cat}
                </div>
                {items.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSelect(item.name)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors',
                      value === item.name && 'bg-primary/10 text-primary font-medium'
                    )}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}