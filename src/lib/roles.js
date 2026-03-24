/**
 * Definizione ruoli e permessi dell'applicazione MEDIPLAN
 *
 * admin     → Medico/Amministratore: accesso completo
 * operatore → Operatore Sanitario: aziende, lavoratori, accertamenti integrativi
 * segreteria→ Segreteria: aziende, lavoratori (no dati anamnestici), scadenze, fatturazione
 */

export const ROLES = {
  ADMIN: 'admin',
  OPERATORE: 'operatore',
  SEGRETERIA: 'segreteria',
};

export const ROLE_LABELS = {
  admin: 'Medico / Amministratore',
  operatore: 'Operatore Sanitario',
  segreteria: 'Segreteria',
};

/**
 * Ritorna true se l'utente può accedere alla sezione indicata.
 * Usato da componenti e pagine per nascondere/bloccare contenuti.
 */
export function canAccess(user, section) {
  const role = user?.role;
  const permissions = {
    dashboard:    ['admin', 'operatore', 'segreteria'],
    aziende:      ['admin', 'operatore', 'segreteria'],
    lavoratori:   ['admin', 'operatore', 'segreteria'],
    scadenze:     ['admin', 'operatore', 'segreteria'],
    fatturazione: ['admin', 'segreteria'],
    impostazioni: ['admin'],
    utenti:       ['admin'],
    // Dati clinici/anamnestici (visite complete, giudizi, anamnesi)
    dati_clinici: ['admin', 'operatore'],
    // Accertamenti integrativi (audiometria, spirometria, ecc.)
    accertamenti: ['admin', 'operatore'],
    // Può modificare/aggiungere visite complete
    visite_write: ['admin'],
    // Può modificare solo gli accertamenti integrativi
    accertamenti_write: ['admin', 'operatore'],
  };
  return (permissions[section] || []).includes(role);
}