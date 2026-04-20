import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppointmentFormDialog from './AppointmentFormDialog';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  schedulato: 'bg-primary/80 text-white',
  completato: 'bg-teal-500 text-white',
  annullato: 'bg-muted text-muted-foreground line-through',
};

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export default function AppointmentCalendar() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const calendarRef = React.useRef(null);
  const queryClient = useQueryClient();

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.Appointment.list('-date', 500),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => data.id
      ? base44.entities.Appointment.update(data.id, data)
      : base44.entities.Appointment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setDialogOpen(false);
      setEditingAppt(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Appointment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const today = new Date();
  const baseWeekStart = startOfWeek(today, { weekStartsOn: 1 });

  // Navigazione tastiera (frecce)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setWeekOffset(o => o - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setWeekOffset(o => o + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setWeekOffset(o => o - 4);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setWeekOffset(o => o + 4);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 3 settimane centrate sull'offset corrente
  const weeks = [-1, 0, 1].map(rel => {
    const wStart = addWeeks(baseWeekStart, weekOffset + rel);
    const days = Array.from({ length: 7 }, (_, i) => addDays(wStart, i));
    const isCurrentReal = weekOffset + rel === 0;
    return { wStart, days, isCurrent: isCurrentReal };
  });

  const getAppointmentsForDay = (day) =>
    appointments.filter(a => a.date && isSameDay(parseISO(a.date), day));

  const selectedDayAppts = selectedDay ? getAppointmentsForDay(selectedDay) : [];

  const handleNewAppt = (day) => {
    setEditingAppt(null);
    setSelectedDay(day);
    setDialogOpen(true);
  };

  const handleEdit = (appt) => {
    setEditingAppt(appt);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Eliminare questo appuntamento?')) deleteMutation.mutate(id);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base capitalize">
            Agenda — {format(addWeeks(baseWeekStart, weekOffset), "MMMM yyyy", { locale: it })}
          </CardTitle>
          {weekOffset !== 0 && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setWeekOffset(0)}>
              Oggi
            </Button>
          )}
          <Button size="sm" className="h-7 gap-1 text-xs ml-auto" onClick={() => handleNewAppt(selectedDay || today)}>
            <Plus className="h-3.5 w-3.5" /> Nuovo
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative flex flex-row-reverse">
        {/* Scrollbar area - DESTRA */}
        <div className="flex flex-col items-center justify-between py-4 px-2 bg-muted/30 w-10 shrink-0">
          <Button size="icon" variant="ghost" className="h-6 w-6 p-0" title="Settimane precedenti (↑)" onClick={() => setWeekOffset(o => o - 4)}>
            <ChevronLeft className="h-3.5 w-3.5 rotate-90" />
          </Button>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="w-1 bg-muted-foreground rounded-full" style={{ height: '80px' }}></div>
          </div>
          
          <Button size="icon" variant="ghost" className="h-6 w-6 p-0" title="Settimane successive (↓)" onClick={() => setWeekOffset(o => o + 4)}>
            <ChevronRight className="h-3.5 w-3.5 rotate-90" />
          </Button>
        </div>

        {/* Calendar content */}
        <div className="flex-1 overflow-hidden">
          {/* Weeks - mostri solo current e next */}
          {weeks.filter(w => w.isCurrent || (w.wStart.getTime() === addWeeks(weeks.find(x => x.isCurrent)?.wStart || today, 1).getTime())).map(({ wStart, days, isCurrent }) => (
            <div key={wStart.toISOString()}>
              {/* Weekday headers - solo per la prima settimana */}
              {isCurrent && (
                <div className="grid grid-cols-7 border-b bg-muted/20">
                  {WEEKDAYS.map(wd => (
                    <div key={wd} className="py-2 text-center text-xs font-medium text-muted-foreground">
                      {wd}
                    </div>
                  ))}
                </div>
              )}

              {/* Week label */}
              <div className={cn(
                'px-3 py-2 text-xs font-medium border-b',
                isCurrent ? 'bg-primary/10 text-primary text-sm' : 'bg-muted/40 text-muted-foreground'
              )}>
                {isCurrent ? '📍 Settimana corrente' : 'Settimana successiva'} — {format(wStart, "d MMM", { locale: it })} › {format(addDays(wStart, 6), "d MMM", { locale: it })}
              </div>

              {/* Days row */}
              <div className="grid grid-cols-7">
                {days.map((day, idx) => {
                  const dayAppts = getAppointmentsForDay(day);
                  const isToday = isSameDay(day, today);
                  const isSelected = selectedDay && isSameDay(day, selectedDay);

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={cn(
                        'border-b border-r cursor-pointer transition-colors',
                        isCurrent ? 'p-3 min-h-[120px]' : 'p-2 min-h-[80px]',
                        isSelected && 'bg-primary/5',
                        'hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          'flex items-center justify-center rounded-full font-semibold',
                          isCurrent ? 'text-sm w-7 h-7' : 'text-xs w-6 h-6',
                          isToday && 'bg-primary text-white',
                          !isToday && 'text-foreground',
                        )}>
                          {format(day, 'd')}
                        </span>
                        {isSelected && dayAppts.length === 0 && (
                          <button
                            onClick={e => { e.stopPropagation(); handleNewAppt(day); }}
                            className="text-primary hover:text-primary/70"
                          >
                            <Plus className={isCurrent ? 'h-4 w-4' : 'h-3 w-3'} />
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {dayAppts.slice(0, isCurrent ? 4 : 3).map(a => (
                          <div
                            key={a.id}
                            className={cn(
                              'px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80',
                              isCurrent ? 'text-[11px]' : 'text-[10px]',
                              STATUS_COLORS[a.status] || 'bg-primary/80 text-white'
                            )}
                            title={a.title}
                          >
                            {a.time && <span className="font-mono">{a.time}</span>} {a.title}
                          </div>
                        ))}
                        {dayAppts.length > (isCurrent ? 4 : 3) && (
                          <div className={cn('text-muted-foreground px-1 font-medium', isCurrent ? 'text-[10px]' : 'text-[9px]')}>
                            +{dayAppts.length - (isCurrent ? 4 : 3)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Selected day panel */}
          {selectedDay && (
            <div className="border-t p-4 bg-primary/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold capitalize">
                  {format(selectedDay, "EEEE d MMMM", { locale: it })}
                </h3>
                <div className="flex gap-2">
                  <Button size="sm" className="h-6 gap-1 text-xs" onClick={() => handleNewAppt(selectedDay)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setSelectedDay(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {selectedDayAppts.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nessun appuntamento</p>
              ) : (
                <div className="space-y-1">
                  {selectedDayAppts.map(a => {
                    const company = companies.find(c => String(c.id) === String(a.company_id));
                    return (
                      <div key={a.id} className="flex items-start justify-between p-2 rounded text-xs border bg-card gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{a.title}</p>
                          {a.time && <p className="text-muted-foreground">{a.time}</p>}
                          {a.patient_name && <p className="text-muted-foreground">{a.patient_name}</p>}
                          {a.company_name && <p className="text-muted-foreground">{a.company_name}</p>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => handleEdit(a)}>
                            <Pencil className="h-2.5 w-2.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" onClick={() => handleDelete(a.id)}>
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <AppointmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={editingAppt}
        initialDate={selectedDay ? format(selectedDay, 'yyyy-MM-dd') : ''}
        onSave={(data) => saveMutation.mutate(data)}
      />
    </Card>
  );
}