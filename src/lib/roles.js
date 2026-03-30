/**
 * Definizione ruoli e permessi dell'applicazione MEDIPLAN
 *
 * amministratore → accesso completo + gestione utenti
 * medico         → dati clinici solo per aziende di cui è medico incaricato
 * operatore      → Operatore Sanitario: aziende, lavoratori, accertamenti integrativi
 * segreteria     → Segreteria: aziende, lavoratori (no dati anamnestici), scadenze, fatturazione
 */

export const ROLES = {
  AMMINISTRATORE: 'amministratore',
  MEDICO:         'medico',
  OPERATORE:      'operatore',
  SEGRETERIA:     'segreteria',
};

export const ROLE_LABELS = {
  admin:          'Amministratore',
  amministratore: 'Amministratore',
  medico:         'Medico Incaricato',
  operatore:      'Operatore Sanitario',
  segreteria:     'Segreteria',
};

/**
 * Ritorna true se l'utente può accedere alla sezione indicata.
 */
export function canAccess(user, section) {
  // Retrocompatibilità: il ruolo piattaforma 'admin' equivale ad 'amministratore'
  const role = user?.role === 'admin' ? 'amministratore' : user?.role;
  const permissions = {
    dashboard:          ['amministratore', 'medico', 'operatore', 'segreteria'],
    aziende:            ['amministratore', 'medico', 'operatore', 'segreteria'],
    lavoratori:         ['amministratore', 'medico', 'operatore', 'segreteria'],
    scadenze:           ['amministratore', 'medico', 'operatore', 'segreteria'],
    fatturazione:       ['amministratore', 'segreteria'],
    impostazioni:       ['amministratore', 'medico', 'operatore', 'segreteria'],
    utenti:             ['amministratore'],
    // Dati clinici/anamnestici (visite complete, giudizi, anamnesi)
    dati_clinici:       ['amministratore', 'medico', 'operatore'],
    // Accertamenti integrativi (audiometria, spirometria, ecc.)
    accertamenti:       ['amministratore', 'medico', 'operatore'],
    // Può modificare/aggiungere visite complete
    visite_write:       ['amministratore', 'medico'],
    // Può modificare solo gli accertamenti integrativi
    accertamenti_write: ['amministratore', 'medico', 'operatore'],
    // Può vedere gli allegati PDF degli accertamenti nelle visite
    allegati_accertamenti: ['amministratore', 'medico', 'operatore'],
    // Può gestire utenti
    gestione_utenti:    ['amministratore'],
    // Può vedere tab Medici Incaricati nelle impostazioni
    medici_incaricati:  ['amministratore'],
  };
  return (permissions[section] || []).includes(role);
}

/**
 * Per il ruolo "medico": filtra le aziende in base al doctor_profile_id del medico.
 * Accetta la lista delle aziende e il profilo medico (DoctorProfile).
 * Gli altri ruoli vedono tutte le aziende.
 */
export function filterCompaniesByRole(user, companies, doctorProfile) {
  if (user?.role !== 'medico') return companies;
  if (!doctorProfile) return [];
  return companies.filter(c => c.assigned_doctor_id === doctorProfile.id);
}