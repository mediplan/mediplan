import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

let cachedComuni = null;

async function loadComuni() {
  if (cachedComuni) return cachedComuni;
  const res = await fetch('https://cdn.jsdelivr.net/npm/comuni-province-regioni-italia@1.1.0/assets/json/comuni.json');
  const data = await res.json();
  // Mappa { sigla -> [nomi comuni] }
  const byProvincia = {};
  const allNames = [];
  for (const c of data) {
    const sigla = c.sigla;
    if (!byProvincia[sigla]) byProvincia[sigla] = [];
    byProvincia[sigla].push(c.nome);
    allNames.push(c.nome);
  }
  cachedComuni = { byProvincia, allNames };
  return cachedComuni;
}

export default function ItalianMunicipalityInput({ value, onChange, provinceSigla, placeholder = "Comune" }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [comuni, setComuni] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    loadComuni().then(setComuni);
  }, []);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getList = () => {
    if (!comuni) return [];
    if (provinceSigla && comuni.byProvincia[provinceSigla]) return comuni.byProvincia[provinceSigla];
    return comuni.allNames;
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    if (val.length >= 2 && comuni) {
      const lower = val.toLowerCase();
      const list = getList();
      const results = list.filter(c => c.toLowerCase().startsWith(lower)).slice(0, 10);
      setSuggestions(results);
      setOpen(results.length > 0);
    } else {
      setOpen(false);
    }
  };

  const handleFocus = () => {
    // Se c'è già una provincia selezionata e il campo è vuoto, mostra subito tutti i comuni della provincia
    if (comuni && provinceSigla && !query) {
      const list = getList().slice(0, 10);
      setSuggestions(list);
      setOpen(list.length > 0);
    } else if (query.length >= 2 && suggestions.length > 0) {
      setOpen(true);
    }
  };

  const handleSelect = (nome) => {
    setQuery(nome);
    onChange(nome);
    setOpen(false);
  };

  const isDisabled = !provinceSigla;

  return (
    <div ref={ref} className="relative">
      <Input
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder={isDisabled ? "Prima seleziona la provincia" : placeholder}
        disabled={isDisabled}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map(nome => (
            <button
              key={nome}
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
              onMouseDown={() => handleSelect(nome)}
            >
              {nome}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}