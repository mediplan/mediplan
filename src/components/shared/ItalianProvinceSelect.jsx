import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

const PROVINCE = [
  { nome: "Agrigento", sigla: "AG" }, { nome: "Alessandria", sigla: "AL" }, { nome: "Ancona", sigla: "AN" },
  { nome: "Arezzo", sigla: "AR" }, { nome: "Ascoli Piceno", sigla: "AP" }, { nome: "Asti", sigla: "AT" },
  { nome: "Avellino", sigla: "AV" }, { nome: "Bari", sigla: "BA" }, { nome: "Barletta-Andria-Trani", sigla: "BT" },
  { nome: "Belluno", sigla: "BL" }, { nome: "Benevento", sigla: "BN" }, { nome: "Bergamo", sigla: "BG" },
  { nome: "Biella", sigla: "BI" }, { nome: "Bologna", sigla: "BO" }, { nome: "Bolzano", sigla: "BZ" },
  { nome: "Brescia", sigla: "BS" }, { nome: "Brindisi", sigla: "BR" }, { nome: "Cagliari", sigla: "CA" },
  { nome: "Caltanissetta", sigla: "CL" }, { nome: "Campobasso", sigla: "CB" }, { nome: "Caserta", sigla: "CE" },
  { nome: "Catania", sigla: "CT" }, { nome: "Catanzaro", sigla: "CZ" }, { nome: "Chieti", sigla: "CH" },
  { nome: "Como", sigla: "CO" }, { nome: "Cosenza", sigla: "CS" }, { nome: "Cremona", sigla: "CR" },
  { nome: "Crotone", sigla: "KR" }, { nome: "Cuneo", sigla: "CN" }, { nome: "Enna", sigla: "EN" },
  { nome: "Fermo", sigla: "FM" }, { nome: "Ferrara", sigla: "FE" }, { nome: "Firenze", sigla: "FI" },
  { nome: "Foggia", sigla: "FG" }, { nome: "Forlì-Cesena", sigla: "FC" }, { nome: "Frosinone", sigla: "FR" },
  { nome: "Genova", sigla: "GE" }, { nome: "Gorizia", sigla: "GO" }, { nome: "Grosseto", sigla: "GR" },
  { nome: "Imperia", sigla: "IM" }, { nome: "Isernia", sigla: "IS" }, { nome: "L'Aquila", sigla: "AQ" },
  { nome: "La Spezia", sigla: "SP" }, { nome: "Latina", sigla: "LT" }, { nome: "Lecce", sigla: "LE" },
  { nome: "Lecco", sigla: "LC" }, { nome: "Livorno", sigla: "LI" }, { nome: "Lodi", sigla: "LO" },
  { nome: "Lucca", sigla: "LU" }, { nome: "Macerata", sigla: "MC" }, { nome: "Mantova", sigla: "MN" },
  { nome: "Massa-Carrara", sigla: "MS" }, { nome: "Matera", sigla: "MT" }, { nome: "Messina", sigla: "ME" },
  { nome: "Milano", sigla: "MI" }, { nome: "Modena", sigla: "MO" }, { nome: "Monza e della Brianza", sigla: "MB" },
  { nome: "Napoli", sigla: "NA" }, { nome: "Novara", sigla: "NO" }, { nome: "Nuoro", sigla: "NU" },
  { nome: "Oristano", sigla: "OR" }, { nome: "Padova", sigla: "PD" }, { nome: "Palermo", sigla: "PA" },
  { nome: "Parma", sigla: "PR" }, { nome: "Pavia", sigla: "PV" }, { nome: "Perugia", sigla: "PG" },
  { nome: "Pesaro e Urbino", sigla: "PU" }, { nome: "Pescara", sigla: "PE" }, { nome: "Piacenza", sigla: "PC" },
  { nome: "Pisa", sigla: "PI" }, { nome: "Pistoia", sigla: "PT" }, { nome: "Pordenone", sigla: "PN" },
  { nome: "Potenza", sigla: "PZ" }, { nome: "Prato", sigla: "PO" }, { nome: "Ragusa", sigla: "RG" },
  { nome: "Ravenna", sigla: "RA" }, { nome: "Reggio Calabria", sigla: "RC" }, { nome: "Reggio Emilia", sigla: "RE" },
  { nome: "Rieti", sigla: "RI" }, { nome: "Rimini", sigla: "RN" }, { nome: "Roma", sigla: "RM" },
  { nome: "Rovigo", sigla: "RO" }, { nome: "Salerno", sigla: "SA" }, { nome: "Sassari", sigla: "SS" },
  { nome: "Savona", sigla: "SV" }, { nome: "Siena", sigla: "SI" }, { nome: "Siracusa", sigla: "SR" },
  { nome: "Sondrio", sigla: "SO" }, { nome: "Sud Sardegna", sigla: "SU" }, { nome: "Taranto", sigla: "TA" },
  { nome: "Teramo", sigla: "TE" }, { nome: "Terni", sigla: "TR" }, { nome: "Torino", sigla: "TO" },
  { nome: "Trapani", sigla: "TP" }, { nome: "Trento", sigla: "TN" }, { nome: "Treviso", sigla: "TV" },
  { nome: "Trieste", sigla: "TS" }, { nome: "Udine", sigla: "UD" }, { nome: "Valle d'Aosta", sigla: "AO" },
  { nome: "Varese", sigla: "VA" }, { nome: "Venezia", sigla: "VE" }, { nome: "Verbano-Cusio-Ossola", sigla: "VB" },
  { nome: "Vercelli", sigla: "VC" }, { nome: "Verona", sigla: "VR" }, { nome: "Vibo Valentia", sigla: "VV" },
  { nome: "Vicenza", sigla: "VI" }, { nome: "Viterbo", sigla: "VT" }
];

export default function ItalianProvinceSelect({ value, onChange, placeholder = "XX" }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.length === 0 ? PROVINCE : PROVINCE.filter(p =>
    p.sigla.toLowerCase().startsWith(query.toLowerCase()) ||
    p.nome.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (p) => {
    setQuery(p.sigla);
    onChange(p.sigla);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <Input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        maxLength={2}
        className="uppercase"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-64 mt-1 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(p => (
            <button
              key={p.sigla}
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex justify-between"
              onMouseDown={() => handleSelect(p)}
            >
              <span className="font-medium">{p.sigla}</span>
              <span className="text-muted-foreground">{p.nome}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}