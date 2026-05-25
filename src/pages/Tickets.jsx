import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, MessageSquare, ChevronRight, CheckCircle2, Clock, Wrench, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useAuth } from '@/lib/AuthContext';
import { useTenant } from '@/lib/useTenant';

const STATUS_CONFIG = {
  aperto:        { label: 'Aperto',        color: 'bg-blue-100 text-blue-700',   icon: Clock },
  in_lavorazione:{ label: 'In lavorazione',color: 'bg-yellow-100 text-yellow-700', icon: Wrench },
  risolto:       { label: 'Risolto',       color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  chiuso:        { label: 'Chiuso',        color: 'bg-gray-100 text-gray-600',   icon: XCircle },
};

const PRIORITY_CONFIG = {
  bassa:  { label: 'Bassa',  color: 'bg-gray-100 text-gray-600' },
  media:  { label: 'Media',  color: 'bg-orange-100 text-orange-700' },
  alta:   { label: 'Alta',   color: 'bg-red-100 text-red-700' },
};

const CATEGORY_LABELS = {
  bug: 'Bug',
  richiesta_funzionalita: 'Richiesta funzionalità',
  domanda: 'Domanda',
  altro: 'Altro',
};

function NewTicketDialog({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ subject: '', description: '', priority: 'media', category: 'altro' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await base44.functions.invoke('createTicket', form);
    setLoading(false);
    onCreated(res.data.ticket);
    setForm({ subject: '', description: '', priority: 'media', category: 'altro' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuovo Ticket di Assistenza</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Oggetto *</label>
            <Input
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Descrivi brevemente il problema..."
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Descrizione *</label>
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descrivi in dettaglio il problema o la richiesta..."
              className="h-28"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Categoria</label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="richiesta_funzionalita">Richiesta funzionalità</SelectItem>
                  <SelectItem value="domanda">Domanda</SelectItem>
                  <SelectItem value="altro">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Priorità</label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bassa">Bassa</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annulla</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Invio...' : 'Apri Ticket'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TicketDetailDialog({ ticket, open, onClose, onUpdate, isAdmin }) {
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Ticket.update(ticket.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
  });

  const handleStatusChange = (status) => {
    const extra = status === 'risolto' ? { resolved_at: new Date().toISOString() } : {};
    updateMutation.mutate({ status, ...extra });
    onUpdate();
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    const newComment = {
      author: user.full_name || user.email,
      author_email: user.email,
      text: comment,
      date: new Date().toISOString(),
    };
    const comments = [...(ticket.comments || []), newComment];
    updateMutation.mutate({ comments });
    setComment('');
    onUpdate();
  };

  if (!ticket) return null;
  const statusConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.aperto;
  const Icon = statusConf.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{ticket.ticket_code}</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusConf.color}`}>{statusConf.label}</span>
            {ticket.priority && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORITY_CONFIG[ticket.priority]?.color}`}>
                {PRIORITY_CONFIG[ticket.priority]?.label}
              </span>
            )}
          </div>
          <DialogTitle className="mt-2">{ticket.subject}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Aperto da <strong>{ticket.created_by_name || ticket.created_by_email}</strong> il{' '}
              {ticket.created_date ? format(new Date(ticket.created_date), 'dd MMM yyyy HH:mm', { locale: it }) : '—'}
            </p>
          </div>

          {/* Cambio stato (solo admin) */}
          {isAdmin && (
            <div className="flex gap-2 flex-wrap">
              <p className="text-sm font-medium w-full">Cambia stato:</p>
              {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={ticket.status === key ? 'default' : 'outline'}
                  onClick={() => handleStatusChange(key)}
                  className="text-xs"
                >
                  {conf.label}
                </Button>
              ))}
            </div>
          )}

          {/* Commenti */}
          <div>
            <p className="text-sm font-semibold mb-2">Commenti ({(ticket.comments || []).length})</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(ticket.comments || []).map((c, i) => (
                <div key={i} className="bg-muted rounded-lg p-3 text-sm">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span className="font-medium">{c.author}</span>
                    <span>{c.date ? format(new Date(c.date), 'dd/MM/yyyy HH:mm') : ''}</span>
                  </div>
                  <p>{c.text}</p>
                </div>
              ))}
              {(ticket.comments || []).length === 0 && (
                <p className="text-sm text-muted-foreground">Nessun commento</p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Aggiungi un commento..."
                className="h-20"
              />
              <Button onClick={handleAddComment} size="sm" className="self-end">Invia</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Tickets() {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const isAdmin = user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('tutti');
  const [showNew, setShowNew] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.Ticket.list('-created_date', 200),
  });

  const filtered = tickets.filter(t => {
    const matchSearch = !search ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.ticket_code?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'tutti' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    aperto: tickets.filter(t => t.status === 'aperto').length,
    in_lavorazione: tickets.filter(t => t.status === 'in_lavorazione').length,
    risolto: tickets.filter(t => t.status === 'risolto').length,
    chiuso: tickets.filter(t => t.status === 'chiuso').length,
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assistenza</h1>
          <p className="text-muted-foreground text-sm">Gestisci i ticket di supporto</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nuovo Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, conf]) => {
          const Icon = conf.icon;
          return (
            <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus(key)}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{conf.label}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats[key]}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filtri */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cerca per oggetto o codice..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tutti gli stati" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutti gli stati</SelectItem>
            <SelectItem value="aperto">Aperto</SelectItem>
            <SelectItem value="in_lavorazione">In lavorazione</SelectItem>
            <SelectItem value="risolto">Risolto</SelectItem>
            <SelectItem value="chiuso">Chiuso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista ticket */}
      <div className="space-y-2">
        {isLoading && <p className="text-muted-foreground text-sm">Caricamento...</p>}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Nessun ticket trovato</p>
          </div>
        )}
        {filtered.map(ticket => {
          const statusConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.aperto;
          const Icon = statusConf.icon;
          return (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{ticket.ticket_code}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConf.color}`}>{statusConf.label}</span>
                      {ticket.priority && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_CONFIG[ticket.priority]?.color}`}>
                          {PRIORITY_CONFIG[ticket.priority]?.label}
                        </span>
                      )}
                      {ticket.billed && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Fatturato</span>
                      )}
                    </div>
                    <p className="font-medium text-sm truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ticket.created_by_name || ticket.created_by_email} ·{' '}
                      {ticket.created_date ? format(new Date(ticket.created_date), 'dd/MM/yyyy', { locale: it }) : '—'}
                      {(ticket.comments || []).length > 0 && ` · ${ticket.comments.length} commenti`}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <NewTicketDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ['tickets'] })}
      />

      {selectedTicket && (
        <TicketDetailDialog
          ticket={tickets.find(t => t.id === selectedTicket.id) || selectedTicket}
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['tickets'] })}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}