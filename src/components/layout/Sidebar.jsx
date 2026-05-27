import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2,
  Menu, X, Settings, CalendarClock, Receipt, LogOut, BarChart2, LifeBuoy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { canAccess, ROLE_LABELS } from '@/lib/roles';
import { useAuth } from '@/lib/AuthContext';

const ALL_NAV_ITEMS = [
  { path: '/',             label: 'Dashboard',    icon: LayoutDashboard, section: 'dashboard' },
  { path: '/aziende',      label: 'Aziende',       icon: Building2,       section: 'aziende' },
  { path: '/statistiche',  label: 'Statistiche',   icon: BarChart2,       section: 'statistiche' },
  { path: '/scadenze',     label: 'Scadenziario',  icon: CalendarClock,   section: 'scadenze' },
  { path: '/fatturazione', label: 'Fatturazione',  icon: Receipt,         section: 'fatturazione' },
  { path: '/impostazioni', label: 'Impostazioni',  icon: Settings,        section: 'impostazioni' },
];

export default function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();
  const { user, logout, licenseRole } = useAuth();

  const navItems = ALL_NAV_ITEMS.filter(item => canAccess(user, item.section, licenseRole));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={onToggle}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50",
        "flex flex-col transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <img
            src="https://media.base44.com/images/public/69c0209eff24be664ca77e04/0fa59dbbb_Screenshot2026-05-24104256.png"
            alt="MEDIPLAN"
            className="w-full object-contain max-h-16"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => { if (window.innerWidth < 1024) onToggle(); }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-border space-y-2">
          {user && (
            <div className="px-1">
              <p className="text-xs font-medium text-foreground truncate">{user.full_name || user.email}</p>
              <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[licenseRole] || ROLE_LABELS[user.role] || user.role}</p>
            </div>
          )}
          <Link
            to="/assistenza"
            onClick={() => { if (window.innerWidth < 1024) onToggle(); }}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground transition-all w-full",
              location.pathname === '/assistenza' && "text-foreground"
            )}
          >
            <LifeBuoy className="h-3.5 w-3.5" />
            Assistenza
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive text-xs gap-2"
            onClick={() => logout()}
          >
            <LogOut className="h-3.5 w-3.5" />
            Esci
          </Button>
          <p className="text-[10px] text-muted-foreground text-center pt-1">D.Lgs. 81/2008</p>
        </div>
      </aside>
    </>
  );
}