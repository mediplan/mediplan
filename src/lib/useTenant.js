/**
 * Hook per accedere al tenantId dell'utente corrente.
 * Restituisce { tenantId, licenseRole, isAdmin }
 *
 * - tenantId: ID del tenant (null per il platform admin)
 * - licenseRole: ruolo dell'utente nel tenant (LicenseUser.role)
 * - isAdmin: true se l'utente è platform admin (nessun tenant)
 */
import { useAuth } from '@/lib/AuthContext';

export function useTenant() {
  const { tenantId, licenseRole, user } = useAuth();

  // Il platform admin (ruolo base44 = 'admin') non ha tenant
  const isPlatformAdmin = user?.role === 'admin';

  return {
    tenantId,
    licenseRole,
    isPlatformAdmin,
  };
}