import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import { Tenant, Product, Category } from "../../types";
import { useCart } from "../../contexts/CartContext";
import { formatCurrency } from "../../lib/utils";
import { ShoppingBag, Plus, Phone, X } from "lucide-react";
import { CartModal } from "../../components/public/CartModal";
import { DEFAULT_TENANT_COLOR } from "../../lib/theme";
import { WeekSchedule } from "../../types";

const DAY_KEYS: (keyof WeekSchedule)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABELS: Record<keyof WeekSchedule, string> = {
  sun: 'Domingo', mon: 'Segunda-feira', tue: 'Terça-feira',
  wed: 'Quarta-feira', thu: 'Quinta-feira', fri: 'Sexta-feira', sat: 'Sábado',
};

function getScheduleStatus(schedule: WeekSchedule): { open: boolean; hint: string } {
  const now = new Date();
  const todayKey = DAY_KEYS[now.getDay()];
  const today = schedule[todayKey];
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  if (today.open && currentTime >= today.from && currentTime <= today.to) {
    return { open: true, hint: `Aberto · Fecha às ${today.to}` };
  }

  // Find next open slot
  for (let i = 1; i <= 7; i++) {
    const key = DAY_KEYS[(now.getDay() + i) % 7];
    const day = schedule[key];
    if (day.open) {
      const label = i === 1 ? 'amanhã' : DAY_LABELS[key];
      return { open: false, hint: `Abre ${label} às ${day.from}` };
    }
  }

  return { open: false, hint: 'Fechado' };
}

export const RestaurantMenu: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { items, addItem, total } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const tenantQ = query(collection(db, "tenants"), where("slug", "==", slug));
    const unsubscribeTenant = onSnapshot(
      tenantQ,
      (snapshot) => {
        if (snapshot.empty) {
          setError(true);
          setLoading(false);
          return;
        }
        setTenant({
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        } as Tenant);
      },
      (err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      },
    );
    return () => unsubscribeTenant();
  }, [slug]);

  useEffect(() => {
    if (!tenant?.id) return;

    const unsubProducts = onSnapshot(
      query(collection(db, `tenants/${tenant.id}/products`)),
      (snap) => {
        setProducts(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product),
        );
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      },
    );

    const unsubCategories = onSnapshot(
      query(collection(db, `tenants/${tenant.id}/categories`)),
      (snap) =>
        setCategories(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category),
        ),
    );

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, [tenant?.id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#F8FAFC] p-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Restaurante não encontrado
        </h1>
        <p className="text-slate-500">Verifique se a URL está correta.</p>
      </div>
    );
  }

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const formatPhone = (phone: string) => {
    const d = phone.replace(/\D/g, '');
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return phone;
  };
  const themeColor = tenant.themeColor || DEFAULT_TENANT_COLOR;

  const scheduleStatus = tenant.schedule ? getScheduleStatus(tenant.schedule) : null;
  const isClosed = scheduleStatus !== null && !scheduleStatus.open;

  const hasPromo = products.some(
    (p: Product) => p.promotionalPrice && p.promotionalPrice > 0,
  );

  const sortWithPromoFirst = (list: Product[]) =>
    [...list].sort((a, b) => {
      const aPromo = a.promotionalPrice && a.promotionalPrice > 0 ? 1 : 0;
      const bPromo = b.promotionalPrice && b.promotionalPrice > 0 ? 1 : 0;
      return bPromo - aPromo;
    });

  const filteredProducts: Product[] = (() => {
    if (selectedCategoryId === "__promo__") {
      return products.filter(
        (p: Product) => p.promotionalPrice && p.promotionalPrice > 0,
      );
    }
    if (selectedCategoryId) {
      return sortWithPromoFirst(
        products.filter((p: Product) => p.categoryId === selectedCategoryId),
      );
    }
    return sortWithPromoFirst(products);
  })();

  const showFilterBar = hasPromo || categories.length > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex items-center justify-center">
      <div className="w-full max-w-lg bg-white min-h-screen shadow-xl relative flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="pt-8 pb-12 px-6 text-white relative z-10 shrink-0"
          style={{ backgroundColor: themeColor }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tenant.logoUrl && (
                <div className="w-18 h-18 rounded-full bg-white overflow-hidden shadow-sm shrink-0">
                  <img
                    src={tenant.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="font-bold text-xl">{tenant.name}</h1>
                {tenant.whatsapp && (
                  <p className="flex items-center gap-1 text-sm text-white/80 mt-0.5">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {formatPhone(tenant.whatsapp)}
                  </p>
                )}
              </div>
            </div>
            {!isClosed && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative w-10 h-10 bg-white/20 hover:bg-white/30 transition-colors rounded-xl flex items-center justify-center shrink-0"
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold shadow-sm"
                    style={{ color: themeColor }}
                  >
                    {itemCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </header>

        {/* Category tabs */}
        {showFilterBar && (
          <div className="-mt-5 px-4 relative z-30 shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className="px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors shrink-0"
                style={
                  selectedCategoryId === null
                    ? { backgroundColor: themeColor, color: "#fff" }
                    : { backgroundColor: "#f1f5f9", color: "#64748b" }
                }
              >
                Todos
              </button>
              {hasPromo && (
                <button
                  onClick={() => setSelectedCategoryId("__promo__")}
                  className="px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors shrink-0"
                  style={
                    selectedCategoryId === "__promo__"
                      ? { backgroundColor: "#ef4444", color: "#fff" }
                      : { backgroundColor: "#fee2e2", color: "#ef4444" }
                  }
                >
                  Promoção
                </button>
              )}
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors shrink-0"
                  style={
                    selectedCategoryId === cat.id
                      ? { backgroundColor: themeColor, color: "#fff" }
                      : { backgroundColor: "#f1f5f9", color: "#64748b" }
                  }
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Menu List */}
        <main
          className={`${showFilterBar ? "mt-3" : "-mt-6"} flex-1 px-4 relative z-20 overflow-y-auto pb-24`}
        >
          {isClosed && !bannerDismissed && (
            <div className="mb-4 rounded-2xl overflow-hidden shadow-sm border border-red-200">
              <div className="bg-red-600 text-white flex items-center justify-between px-4 py-3">
                <span className="text-sm font-bold tracking-wide">Fechado no momento</span>
                <button
                  onClick={() => setBannerDismissed(true)}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="Fechar aviso"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {scheduleStatus?.hint && (
                <div className="bg-red-50 text-red-600 text-center py-2 text-xs font-medium">
                  {scheduleStatus.hint}
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 space-y-4">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-medium text-sm">
                {selectedCategoryId
                  ? "Nenhum produto nesta categoria."
                  : "Nenhum produto cadastrado."}
              </div>
            ) : (
              filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className={`flex items-center gap-4 ${index !== filteredProducts.length - 1 ? "border-b border-slate-100 pb-4" : ""}`}
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 text-slate-300 overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <ShoppingBag className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {product.name}
                      </h3>
                      {product.promotionalPrice ? (
                        <span className="shrink-0 text-[9px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full mt-0.5">
                          -
                          {Math.round(
                            (1 - product.promotionalPrice / product.price) *
                              100,
                          )}
                          %
                        </span>
                      ) : null}
                    </div>
                    {product.description && (
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <p
                        className="text-xs font-bold"
                        style={{ color: themeColor }}
                      >
                        {formatCurrency(
                          product.promotionalPrice || product.price,
                        )}
                      </p>
                      {product.promotionalPrice ? (
                        <p className="text-[10px] text-slate-400 line-through">
                          {formatCurrency(product.price)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {!isClosed && (
                    <button
                      onClick={() => addItem(product)}
                      className="ml-auto flex h-8 w-8 items-center justify-center shrink-0 rounded-lg transition-opacity hover:opacity-80 active:scale-95 text-white"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </main>

        {/* Checkout bar */}
        {itemCount > 0 && !isClosed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex justify-between px-5 transition-all shadow-md active:scale-[0.98]"
            >
              <div className="flex items-center gap-2">
                <span>Ver Carrinho</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">
                  {itemCount}
                </span>
              </div>
              <span>{formatCurrency(total)}</span>
            </button>
          </div>
        )}

        <CartModal
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          tenant={tenant}
        />
      </div>
    </div>
  );
};
