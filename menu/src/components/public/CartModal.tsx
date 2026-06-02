import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useCart } from "../../contexts/CartContext";
import { Tenant } from "../../types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { formatCurrency } from "../../lib/utils";
import { DEFAULT_TENANT_COLOR } from "../../lib/theme";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  tenant,
}) => {
  const { items, updateQuantity, total, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);

    try {
      const orderData = {
        customerName,
        customerPhone,
        customerAddress,
        items,
        total,
        status: "recebido",
        createdAt: Date.now(),
      };

      const docRef = await addDoc(
        collection(db, `tenants/${tenant.id}/orders`),
        orderData,
      );

      const orderId = docRef.id.slice(0, 6).toUpperCase();

      let orderText = `*Novo Pedido #${orderId}*\n\n`;
      orderText += `*CLIENTE:* ${customerName}\n`;
      orderText += `*ENDERECO:* ${customerAddress}\n`;
      orderText += `*PEDIDO*\n`;
      items.forEach((item) => {
        orderText += `${item.quantity}x ${item.name} - ${formatCurrency(item.price)}\n`;
      });
      orderText += `*TOTAL* ${formatCurrency(total)}`;

      if (tenant.whatsapp) {
        const waUrl = `https://wa.me/55${tenant.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(orderText)}`;
        window.open(waUrl, "_blank");
      }

      toast.success("Pedido enviado com sucesso!");
      clearCart();
      onClose();
    } catch (error) {
      toast.error("Erro ao enviar pedido. Tente novamente.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white h-full shadow-xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-[#F8FAFC]">
          <h2 className="text-xl font-bold flex items-center text-slate-900">
            <ShoppingBag
              className="mr-3 h-5 w-5"
              style={{ color: tenant.themeColor || DEFAULT_TENANT_COLOR }}
            />
            Sua Sacola
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <ShoppingBag className="h-12 w-12 mb-4 text-slate-200" />
              <p className="font-medium text-sm">Sua sacola está vazia</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
                >
                  <div className="flex-1 pr-4">
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">
                      {item.name}
                    </h4>
                    <p
                      className="text-sm font-bold mt-1"
                      style={{ color: tenant.themeColor || DEFAULT_TENANT_COLOR }}
                    >
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 shadow-sm">
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                      className="p-1 text-slate-400 transition-colors hover:opacity-70"
                      style={{
                        color:
                          item.quantity <= 1
                            ? undefined
                            : tenant.themeColor || DEFAULT_TENANT_COLOR,
                      }}
                    >
                      <Minus className="h-4 w-4 stroke-[3]" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      className="p-1 transition-colors hover:opacity-70"
                      style={{ color: tenant.themeColor || DEFAULT_TENANT_COLOR }}
                    >
                      <Plus className="h-4 w-4 stroke-[3]" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Checkout Form */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 bg-[#F8FAFC] p-6 shrink-0">
            {tenant.isOpen === false ? (
              <div className="text-center p-4 bg-red-50 text-red-700 rounded-xl font-bold">
                Desculpe, o restaurante está fechado.
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Dados para entrega
                </div>
                <Input
                  placeholder="Seu Nome"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 hover:bg-slate-50 focus:bg-white focus:ring-slate-300"
                />
                <Input
                  placeholder="WhatsApp (ex: 11999999999)"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 hover:bg-slate-50 focus:bg-white focus:ring-slate-300"
                />
                <Input
                  placeholder="Endereço Completo"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  required
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 hover:bg-slate-50 focus:bg-white focus:ring-slate-300"
                />

                <div className="border-t border-slate-200 pt-4 mt-4 flex justify-between items-center mb-6">
                  <span className="font-bold text-slate-500 text-sm uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-slate-900">
                    {formatCurrency(total)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 text-white rounded-xl text-base font-bold flex justify-center shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ backgroundColor: tenant.themeColor || DEFAULT_TENANT_COLOR }}
                >
                  {loading ? "Processando..." : "Finalizar Pedido"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
