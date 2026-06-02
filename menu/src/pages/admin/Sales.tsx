import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Sale } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { TrendingUp, ShoppingBag, Receipt, Search } from 'lucide-react';
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Period = 'day' | 'week' | 'month' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  day: 'Hoje',
  week: 'Semana',
  month: 'Mês',
  year: 'Ano',
};

function getPeriodStart(period: Period): number {
  const now = new Date();
  switch (period) {
    case 'day':   return startOfDay(now).getTime();
    case 'week':  return startOfWeek(now, { weekStartsOn: 1 }).getTime();
    case 'month': return startOfMonth(now).getTime();
    case 'year':  return startOfYear(now).getTime();
  }
}

export const Sales: React.FC = () => {
  const { tenant } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!tenant?.id) return;
    const q = query(collection(db, `tenants/${tenant.id}/sales`), orderBy('completedAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setSales(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));
      setLoading(false);
    });
    return () => unsub();
  }, [tenant?.id]);

  const filtered = useMemo(() => {
    const start = getPeriodStart(period);
    return sales.filter(s =>
      s.completedAt >= start &&
      (search === '' ||
        s.customerName.toLowerCase().includes(search.toLowerCase()) ||
        s.items.some(i => i.name.toLowerCase().includes(search.toLowerCase())))
    );
  }, [sales, period, search]);

  const stats = useMemo(() => ({
    revenue: filtered.reduce((acc, s) => acc + s.total, 0),
    count: filtered.length,
    average: filtered.length ? filtered.reduce((acc, s) => acc + s.total, 0) / filtered.length : 0,
  }), [filtered]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    filtered.forEach(sale => {
      sale.items.forEach(item => {
        const prev = map.get(item.name) ?? { name: item.name, qty: 0, revenue: 0 };
        map.set(item.name, {
          name: item.name,
          qty: prev.qty + item.quantity,
          revenue: prev.revenue + item.price * item.quantity,
        });
      });
    });
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [filtered]);

  if (loading) return (
    <div className="animate-pulse flex space-x-4">
      <div className="h-4 bg-elevated rounded w-1/4"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-content">Vendas</h1>

      {/* Period filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
              period === p ? 'bg-accent text-accent-ink' : 'bg-elevated text-muted hover:text-content'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 border border-line-2 rounded-lg px-3 py-1.5 bg-surface">
          <Search className="h-4 w-4 text-faint shrink-0" />
          <input
            type="text"
            placeholder="Pesquisar cliente ou produto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-content placeholder:text-faint outline-none w-48"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-line rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            <p className="text-xs font-bold text-faint uppercase tracking-wider">Faturamento</p>
          </div>
          <p className="text-3xl font-bold text-content">{formatCurrency(stats.revenue)}</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="h-4 w-4 text-accent" />
            <p className="text-xs font-bold text-faint uppercase tracking-wider">Pedidos</p>
          </div>
          <p className="text-3xl font-bold text-content">{stats.count}</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="h-4 w-4 text-accent" />
            <p className="text-xs font-bold text-faint uppercase tracking-wider">Ticket Médio</p>
          </div>
          <p className="text-3xl font-bold text-content">{formatCurrency(stats.average)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top products */}
        <div className="bg-surface border border-line rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-content">Mais Vendidos</h2>
          {topProducts.length === 0 ? (
            <p className="text-xs text-faint">Sem dados no período.</p>
          ) : topProducts.map((p, i) => (
            <div key={p.name} className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-elevated flex items-center justify-center text-[10px] font-bold text-faint shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-content truncate">{p.name}</p>
                <p className="text-xs text-faint">{p.qty}× · {formatCurrency(p.revenue)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Orders list */}
        <div className="lg:col-span-2 bg-surface border border-line rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <h2 className="text-sm font-bold text-content">Pedidos Concluídos</h2>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center text-faint text-sm">Nenhum pedido no período.</div>
          ) : (
            <ul className="divide-y divide-line max-h-[460px] overflow-y-auto scrollbar-hide">
              {filtered.map(sale => (
                <li key={sale.id} className="px-5 py-3 hover:bg-elevated transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-content">{sale.customerName}</span>
                        <span className="text-[10px] font-mono text-faint">#{sale.orderId.slice(0, 6).toUpperCase()}</span>
                      </div>
                      <p className="text-xs text-muted truncate mt-0.5">
                        {sale.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                      </p>
                      <p className="text-[11px] text-faint mt-0.5">
                        {format(new Date(sale.completedAt), "dd MMM yyyy · HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-accent shrink-0">{formatCurrency(sale.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
