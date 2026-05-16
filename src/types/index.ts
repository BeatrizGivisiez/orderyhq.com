export interface Tenant {
  id: string; // The tenant ID (often the owner's UID)
  ownerId: string;
  name: string;
  slug: string;
  whatsapp: string;
  logoUrl?: string;
  themeColor?: string;
  isOpen?: boolean;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  promotionalPrice?: number;
  imageUrl?: string;
  active: boolean;
}

export type OrderStatus = 'recebido' | 'preparando' | 'saiu' | 'finalizado';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: number;
}
