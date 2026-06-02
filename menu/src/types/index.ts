export interface DaySchedule {
  open: boolean;
  from: string; // "09:30"
  to: string;   // "18:00"
}

export interface WeekSchedule {
  sun: DaySchedule;
  mon: DaySchedule;
  tue: DaySchedule;
  wed: DaySchedule;
  thu: DaySchedule;
  fri: DaySchedule;
  sat: DaySchedule;
}

export interface Tenant {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  whatsapp: string;
  logoUrl?: string;
  themeColor?: string;
  schedule?: WeekSchedule;
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
  archived?: boolean;
}

export interface Sale {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  total: number;
  createdAt: number;
  completedAt: number;
}
