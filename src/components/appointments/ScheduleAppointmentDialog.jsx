import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export default function ScheduleAppointmentDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  companyId,
  companyName,
  appointmentType = 'visita_medica',
}) {
  const generateDefaultTitle = () => {
    if (appointmentType === 'sopralluogo') {
      return companyName ? `Sopralluogo — ${companyName}` : 'Sopralluogo';
    } else {
      return companyName ? `Visita medica — ${companyName}` : 'Visita medica';
    }
  };

  const [formData, setFormData] = useState({
    title: generateDefaultTitle(),
    date: '',
    time: '',
    motivo: 'visite_mediche',
    notes: '',
  });

  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      title: generateDefaultTitle(),
    }));
  }, [appointmentType, companyName]);

  const queryClient = useQueryClient();

  const createAppointmentMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Appointment.create({
        title: data.title,
        date: data.date,
        time: data.time,
        company_id: companyId || null,
        company_name: companyName || '',
        appointment_type: appointmentType,
        notes: data.notes,
        status: 'schedulato',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setFormData({
        title: generateDefaultTitle(),
        date: '',
        time: '',
        motivo: 'visite_mediche',
        notes: '',
      });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      return;
    }
    createAppointmentMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {appointmentType === 'sopralluogo'
              ? 'Programma Sopralluogo'
              : 'Programma Visita'}
          </DialogTitle>
          <DialogDescription>
            {companyName && `Azienda: ${companyName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titolo</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder={
                appointmentType === 'sopralluogo'
                  ? 'es. Sopralluogo tecnico'
                  : 'es. Visita periodica'
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Ora</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="motivo">Motivo</Label>
            <Select
              value={formData.motivo}
              onValueChange={(value) =>
                setFormData({ ...formData, motivo: value })
              }
            >
              <SelectTrigger id="motivo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visite_mediche">Svolgere visite mediche</SelectItem>
                <SelectItem value="sopralluogo">Sopralluogo in azienda</SelectItem>
                <SelectItem value="riunione_periodica">Riunione periodica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Note aggiuntive..."
              className="h-20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createAppointmentMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={createAppointmentMutation.isPending}
            >
              {createAppointmentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Programma
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}