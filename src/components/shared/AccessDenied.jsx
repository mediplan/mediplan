import React from 'react';
import { ShieldOff } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <ShieldOff className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-lg font-semibold text-foreground">Accesso non autorizzato</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        Non hai i permessi necessari per visualizzare questa sezione.<br />
        Contatta l'amministratore per richiedere l'accesso.
      </p>
    </div>
  );
}