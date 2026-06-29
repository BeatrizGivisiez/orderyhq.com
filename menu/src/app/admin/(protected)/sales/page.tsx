'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Sale } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, ShoppingBag, Receipt, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Period = 'day' | 'week' | 'month' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  day: 'Hoje',
  week: 'Semana',
  month: 'Mês',
  year: 'Ano',
};

const PAGE_SIZES = [10, 20, 25];

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (!tenant?.id) return;
    const q = query(collection(db, `tenants/${tenant.id}/sales`), orderBy('completedAt', 'desc'));
    const unsub = onSnapshot(
      q,
      snap => {
        setSales(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));
        setLoading(false);
      },
      err => {
        console.error('Sales query error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [tenant?.id]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [period, search, pageSize]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (loading) return (
    <div className="animate-pulse flex space-x-4">
      <div className="h-4 bg-elevated rounded w-1/4"></div>
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-content">Vendas</h1>

      {/* Period filter + search */}
      <div className="flex items-center gap-2 flex-wrap">
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
              period === p ? 'bg-accent text-accent-ink' : 'bg-surface text-muted hover:text-content border border-line'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 border border-line rounded-lg px-3 py-1.5 bg-surface">
          <Search className="h-4 w-4 text-faint shrink-0" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-content placeholder:text-faint outline-none w-32 sm:w-48"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-line rounded-xl p-3 sm:p-5">
          <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
            <p className="text-[10px] sm:text-xs font-bold text-faint uppercase tracking-wider truncate">Faturamento</p>
          </div>
          <p className="text-lg sm:text-3xl font-bold text-content">{formatCurrency(stats.revenue)}</p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-3 sm:p-5">
          <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
            <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
            <p className="text-[10px] sm:text-xs font-bold text-faint uppercase tracking-wider truncate">Pedidos</p>
          </div>
          <p className="text-lg sm:text-3xl font-bold text-content">{stats.count}</p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-3 sm:p-5">
          <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
            <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
            <p className="text-[10px] sm:text-xs font-bold text-faint uppercase tracking-wider truncate">Ticket Médio</p>
          </div>
          <p className="text-lg sm:text-3xl font-bold text-content">{formatCurrency(stats.average)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales table — comes first on mobile via order */}
        <div className="lg:col-span-2 order-first bg-surface border border-line rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between gap-4">
            <h2 className="text-sm font-bold text-content">Histórico de Vendas</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-faint">Por página:</span>
              {PAGE_SIZES.map(s => (
                <button
                  key={s}
                  onClick={() => setPageSize(s)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                    pageSize === s ? 'bg-accent text-accent-ink' : 'bg-elevated text-muted hover:text-content'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center text-faint text-sm">Nenhum pedido no período.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="text-left px-5 py-2.5 text-xs font-bold text-faint uppercase tracking-wider">#</th>
                      <th className="text-left px-4 py-2.5 text-xs font-bold text-faint uppercase tracking-wider">Cliente</th>
                      <th className="text-left px-4 py-2.5 text-xs font-bold text-faint uppercase tracking-wider hidden sm:table-cell">Itens</th>
                      <th className="text-left px-4 py-2.5 text-xs font-bold text-faint uppercase tracking-wider hidden md:table-cell">Data</th>
                      <th className="text-right px-5 py-2.5 text-xs font-bold text-faint uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {paginated.map(sale => (
                      <tr key={sale.id} className="hover:bg-elevated transition-colors">
                        <td className="px-5 py-3 font-mono text-[11px] text-faint whitespace-nowrap">
                          #{sale.orderId.slice(0, 6).toUpperCase()}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-content">{sale.customerName}</p>
                          {sale.customerAddress && (
                            <p className="text-[11px] text-faint truncate max-w-[140px]">{sale.customerAddress}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <p className="text-xs text-muted truncate max-w-[160px]">
                            {sale.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                          </p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-faint whitespace-nowrap">
                          {format(new Date(sale.createdAt), "dd MMM yyyy · HH:mm", { locale: ptBR })}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-accent whitespace-nowrap">
                          {formatCurrency(sale.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-5 py-3 border-t border-line flex items-center justify-between gap-4">
                <p className="text-xs text-faint">
                  {filtered.length === 0 ? '0 registros' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} de ${filtered.length}`}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg bg-elevated text-muted hover:text-content disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 text-xs font-bold text-content">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg bg-elevated text-muted hover:text-content disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Top products — below table on mobile */}
        <div className="order-last lg:order-none bg-surface border border-line rounded-2xl p-5 space-y-3">
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
      </div>
    </div>
  );
};

export default Sales;
