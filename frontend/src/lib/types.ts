// Kiểu dữ liệu dùng chung phía FE — phản chiếu response của API backend.

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: { message: string; details?: unknown };
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string | null;
  isPrimary: boolean;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  salePrice: string; // Decimal serialize thành string
  images: ProductImage[];
  category?: { name: string; slug: string };
}

export interface ProductDetail extends ProductListItem {
  description?: string | null;
  material?: string | null;
  stock: number;
  variants: { id: string; size: string; color: string; stock: number }[];
  reviews: { id: string; rating: number; content?: string | null; customer: { fullName: string } }[];
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  status: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  customer: { id: string; fullName: string; phone: string | null } | null;
}

export interface AdminAccount {
  id: string;
  username: string;
  email: string;
  fullName: string;
  enabled: boolean;
  roles: string[];
}

// ===== Promotion & Review =====
export interface Promotion {
  id: string;
  name: string;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: string;
  minOrderTotal: string;
  startDate: string;
  endDate: string;
  quantityLeft: number;
  isActive: boolean;
}

export interface ApplyPromotionResult {
  promotionId: string;
  code: string;
  name: string;
  discount: number;
  finalTotal: number;
}

export interface Review {
  id: string;
  rating: number;
  content?: string | null;
  createdAt: string;
  customer: { fullName: string };
}

// ===== Contact =====
export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  subject: string;
  content: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
}

// ===== Admin: thống kê & khách hàng =====
export interface StatsOverview {
  revenueToday: number;
  revenueMonth: number;
  revenueTotal: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  newCustomers: number;
  ordersByStatus: { status: OrderStatus; count: number }[];
  revenueByDay: { date: string; revenue: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
}

export interface AdminCustomer {
  id: string;
  fullName: string;
  phone?: string | null;
  tier: 'REGULAR' | 'VIP';
  createdAt: string;
  account: { email: string; status: string; username?: string };
  _count?: { orders: number };
}

export interface AdminCustomerDetail extends AdminCustomer {
  totalSpent: number;
  orders: {
    id: string;
    code: string;
    status: OrderStatus;
    total: string;
    orderedAt: string;
    payment?: { status: string; method: string } | null;
  }[];
}

// ===== Stock (nhập kho) =====
export interface StockReceiptItem {
  id: string;
  productId: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
  costPrice: string;
  lineTotal: string;
  product?: { name: string; sku: string };
}

export interface StockReceipt {
  id: string;
  code: string;
  total: string;
  note?: string | null;
  receivedAt: string;
  supplier?: { id?: string; name: string };
  createdBy?: { username: string };
  items?: StockReceiptItem[];
  _count?: { items: number };
}

// ===== Catalog =====
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  _count?: { products: number; children: number };
}

export interface Supplier {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  taxCode?: string | null;
  contactPerson?: string | null;
  _count?: { products: number };
}

export interface ProductVariant {
  id?: string;
  size: string;
  color: string;
  stock: number;
  priceDelta?: number;
}

export type ProductStatus = 'ACTIVE' | 'HIDDEN' | 'OUT_OF_STOCK';

export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  salePrice: string;
  status: ProductStatus;
  stock: number;
  images: ProductImage[];
  category?: { name: string };
  _count?: { variants: number };
}

// ===== Cart & Order =====
export interface CartItem {
  id: string;
  productId: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    salePrice: string;
    status: string;
    images: ProductImage[];
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  count: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PACKING'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export interface OrderItem {
  id: string;
  productName: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface Payment {
  id: string;
  method: 'COD' | 'PAYOS' | 'BANK_TRANSFER' | 'MOMO' | 'VNPAY';
  status: 'UNPAID' | 'PAID' | 'REFUNDED' | 'FAILED';
  amount: string;
  checkoutUrl?: string | null;
  paidAt?: string | null;
}

export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  shippingFee: string;
  subtotal: string;
  discount: string;
  total: string;
  note?: string | null;
  orderedAt: string;
  items: OrderItem[];
  payment?: Payment | null;
  customer?: { fullName: string } | null;
  _count?: { items: number };
}

export interface AdminProductDetail {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description?: string | null;
  salePrice: string;
  costPrice: string;
  stock: number;
  material?: string | null;
  status: ProductStatus;
  categoryId: string;
  supplierId?: string | null;
  images: ProductImage[];
  variants: (ProductVariant & { id: string })[];
}
