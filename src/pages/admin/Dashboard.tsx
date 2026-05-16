import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Order, OrderStatus } from '../../types';
import { formatCurrency, formatPhoneForWA } from '../../lib/utils';
import toast from 'react-hot-toast';
import { Play, Send, CheckCircle, X, Phone, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusMap: Record<OrderStatus, { label: string; color: string; bg: string; next: OrderStatus | null; actionLabel: string; actionIcon: React.ElementType | null; actionStyle: string }> = {
  recebido: { label: 'Recebido', color: 'text-blue-700', bg: 'bg-blue-100', next: 'preparando', actionLabel: 'PREPARAR', actionIcon: Play, actionStyle: 'bg-orange-500 text-white hover:bg-orange-600 border border-orange-500 shadow-sm shadow-orange-100' },
  preparando: { label: 'Em Preparo', color: 'text-yellow-700', bg: 'bg-yellow-100', next: 'saiu', actionLabel: 'DESPACHAR', actionIcon: Send, actionStyle: 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50' },
  saiu: { label: 'Saiu para Entrega', color: 'text-purple-700', bg: 'bg-purple-100', next: 'finalizado', actionLabel: 'CONCLUIR', actionIcon: CheckCircle, actionStyle: 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50' },
  finalizado: { label: 'Finalizado', color: 'text-green-700', bg: 'bg-green-100', next: null, actionLabel: '', actionIcon: null, actionStyle: '' },
};

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, phone: string) => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose, onUpdateStatus }) => {
  const s = statusMap[order.status];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customerAddress)}`;
  const waUrl = `https://wa.me/55${formatPhoneForWA(order.customerPhone)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{order.customerName}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400 font-mono">#{order.id.slice(0, 6).toUpperCase()}</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${s.bg} ${s.color}`}>
                {s.label.toUpperCase()}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4 shrink-0" />
            <span>Pedido feito às <strong className="text-slate-700">{format(new Date(order.createdAt), "HH:mm", { locale: ptBR })}</strong></span>
          </div>

          {/* Address */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Endereço</p>
            <p className="text-sm text-slate-700 font-medium">{order.customerAddress}</p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              <MapPin className="h-3.5 w-3.5" /> Ver no mapa
            </a>
          </div>

          {/* Items */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Itens do pedido</p>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-slate-700">
                    <span className="font-bold">{item.quantity}x</span> {item.name}
                  </span>
                  <span className="font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-500">Total</span>
                <span className="text-slate-900 text-base">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-100 p-4 space-y-2">
          {s.next && s.actionIcon && (
            <button
              onClick={() => { onUpdateStatus(order.id, s.next!, order.customerPhone); onClose(); }}
              className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${s.actionStyle}`}
            >
              {React.createElement(s.actionIcon, { className: 'h-4 w-4' })}
              {s.actionLabel}
            </button>
          )}
          <div className="flex gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white transition-colors"
            >
              <Phone className="h-4 w-4" /> Contato
            </a>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <MapPin className="h-4 w-4" /> Endereço
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { tenant } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => setHasPermission(p === 'granted'));
    } else {
      setHasPermission(Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    if (!tenant?.id) return;
    const q = query(collection(db, `tenants/${tenant.id}/orders`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !loading) {
          const order = change.doc.data() as Order;
          if (order.status === 'recebido') {
            playNotificationSound();
            if (hasPermission) new Notification('Novo Pedido!', { body: `${order.customerName} - ${formatCurrency(order.total)}` });
          }
        }
      });
      setOrders(newOrders);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tenant?.id, loading, hasPermission]);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) { /* audio blocked by browser */ }
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatus, customerPhone: string) => {
    if (!tenant) return;
    try {
      await updateDoc(doc(db, `tenants/${tenant.id}/orders`, orderId), { status: newStatus });
      toast.success('Status atualizado');
      const messages: Partial<Record<OrderStatus, string>> = {
        preparando: 'Seu pedido já está em preparo 🍔🔥',
        saiu: 'Seu pedido saiu para entrega 🚀',
        finalizado: 'Pedido finalizado! Obrigado pela preferência 🙏',
      };
      const msg = messages[newStatus];
      if (msg) window.open(`https://wa.me/55${formatPhoneForWA(customerPhone)}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch {
      toast.error('Erro ao atualizar pedido');
    }
  };

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="h-4 bg-slate-200 rounded w-1/4"></div></div>;

  return (
    <div className="flex flex-col h-full space-y-6">
      <h2 className="text-xl font-bold tracking-tight text-slate-900">Gerenciador de Pedidos</h2>

      {!tenant?.whatsapp && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
          <p className="text-sm font-medium text-orange-800">
            Configure seu WhatsApp nas configurações para ativar notificações aos clientes.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 flex-1 overflow-hidden pb-4">
        {(Object.keys(statusMap) as OrderStatus[]).map((statusKey) => {
          const filteredOrders = orders.filter(o => o.status === statusKey);
          const s = statusMap[statusKey];

          return (
            <div key={statusKey} className="flex flex-col rounded-2xl bg-white border border-slate-200 shadow-sm p-4 overflow-hidden">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${s.bg.replace('100', '500')}`}></span>
                {statusKey === 'recebido' ? 'Pedidos em Andamento' : s.label}
                <span className="ml-auto bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-[10px] font-bold">
                  {filteredOrders.length}
                </span>
              </h3>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                {filteredOrders.map(order => (
                  <div
                    key={order.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-orange-200 hover:shadow-md transition-all flex flex-col cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    {/* Card header */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{order.id.slice(0, 4)}</span>
                        <h4 className="font-bold text-slate-900 text-sm">{order.customerName}</h4>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${s.bg} ${s.color}`}>
                        {s.label.toUpperCase()}
                      </span>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-1.5 mb-2">
                      <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-500 line-clamp-2">{order.customerAddress}</p>
                    </div>

                    {/* Items summary */}
                    <div className="text-xs text-slate-500 line-clamp-1 mb-1">
                      {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                    <div className="font-bold text-sm text-slate-900">{formatCurrency(order.total)}</div>

                    {/* Action buttons */}
                    {s.next && s.actionIcon && (
                      <div
                        className="mt-3 pt-3 border-t border-slate-100 space-y-2"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${s.actionStyle}`}
                          onClick={() => updateStatus(order.id, s.next!, order.customerPhone)}
                        >
                          {React.createElement(s.actionIcon, { className: 'w-3.5 h-3.5' })}
                          {s.actionLabel}
                        </button>
                        <button
                          className="w-full py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          onClick={() => window.open(`https://wa.me/55${formatPhoneForWA(order.customerPhone)}`, '_blank')}
                        >
                          <Phone className="w-3.5 h-3.5" /> Contato WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {filteredOrders.length === 0 && (
                  <div className="text-center text-xs font-medium text-slate-400 py-6 border-2 border-dashed border-slate-100 rounded-xl">
                    {statusKey === 'recebido' ? 'Nenhum pedido em andamento.' : 'Nenhum pedido ainda.'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateStatus}
        />
      )}
    </div>
  );
};
