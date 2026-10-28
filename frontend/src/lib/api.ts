import type {
  AdminAccount,
  AdminCustomer,
  AdminCustomerDetail,
  AdminProductDetail,
  AdminProductListItem,
  ApiResponse,
  ApplyPromotionResult,
  AuthUser,
  Cart,
  Category,
  ContactMessage,
  Order,
  ProductDetail,
  ProductListItem,
  Promotion,
  Review,
  StatsOverview,
  StockReceipt,
  Supplier,
} from './types';

// Server-side (trong container Docker) gọi backend qua URL nội bộ; trình duyệt dùng URL public.
const API_URL =
  (typeof window === 'undefined' ? process.env.API_INTERNAL_URL : undefined) ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api';

interface RequestOptions extends RequestInit {
  token?: string;
}

/**
 * Lỗi API có mang mã HTTP để nơi gọi phân biệt được 401/403 (hết phiên, không đủ quyền)
 * với các lỗi nghiệp vụ khác — nhờ đó điều hướng về /login thay vì hiển thị lỗi thô.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  /** Hết phiên / token không hợp lệ → cần đăng nhập lại. */
  get isUnauthorized() {
    return this.status === 401;
  }

  /** Đã đăng nhập nhưng không đủ quyền. */
  get isForbidden() {
    return this.status === 403;
  }

  /** Không kết nối được backend (status 0). */
  get isNetworkError() {
    return this.status === 0;
  }
}

/**
 * Fetch wrapper dùng chung cho mọi lời gọi API.
 * - Tự gắn JSON header & Bearer token.
 * - Ném ApiError (kèm status) khi response không thành công.
 */
export async function apiFetch<T>(
  path: string,
  { token, headers, ...options }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      // Cho phép tận dụng cache mặc định của Next; ghi đè bằng options.cache khi cần
      cache: options.cache ?? 'no-store',
    });
  } catch {
    // fetch chỉ ném khi lỗi mạng/DNS/backend không chạy
    throw new ApiError('Không kết nối được máy chủ. Vui lòng thử lại.', 0);
  }

  // Backend có thể trả rỗng (204) hoặc HTML (lỗi proxy 502) → không được để JSON.parse ném lỗi khó hiểu
  const raw = await res.text();
  let json: ApiResponse<T> | null = null;
  if (raw) {
    try {
      json = JSON.parse(raw) as ApiResponse<T>;
    } catch {
      json = null;
    }
  }

  if (!res.ok || !json?.success) {
    const fallback =
      res.status === 401
        ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
        : res.status === 403
          ? 'Bạn không có quyền thực hiện thao tác này.'
          : `Lỗi API (${res.status})`;
    throw new ApiError(json?.error?.message ?? fallback, res.status);
  }
  return json;
}

// ===== Endpoint helpers =====

type Query = Record<string, string | number | undefined | null>;

/** Dựng query string, bỏ qua giá trị rỗng: qs({ page: 2, search: '' }) → "?page=2" */
function qs(params?: Query): string {
  const sp = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

/** Tham số danh sách có phân trang dùng chung ở khu quản trị. */
export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

// --- Stats ---
export async function getStatsOverview(token: string) {
  return apiFetch<StatsOverview>('/stats/overview', { token });
}

// --- Contact ---
export async function sendContact(input: {
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  content: string;
}) {
  return apiFetch<{ id: string; message: string }>('/contact', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
export async function getContactMessages(token: string, params?: ListParams & { status?: string }) {
  return apiFetch<ContactMessage[]>(`/contact${qs({ ...params })}`, { token });
}
export async function updateContactStatus(token: string, id: string, status: string) {
  return apiFetch<ContactMessage>(`/contact/${id}`, {
    token,
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// --- Customers (admin) ---
export async function getCustomers(token: string, params?: ListParams) {
  return apiFetch<AdminCustomer[]>(`/customers${qs({ ...params })}`, { token });
}
export async function getCustomer(token: string, id: string) {
  return apiFetch<AdminCustomerDetail>(`/customers/${id}`, { token });
}
export async function updateCustomer(token: string, id: string, input: { tier?: string; status?: string }) {
  return apiFetch<AdminCustomerDetail>(`/customers/${id}`, {
    token,
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

// --- Stock receipts ---
export async function getStockReceipts(token: string, params?: ListParams & { supplierId?: string }) {
  return apiFetch<StockReceipt[]>(`/stock-receipts${qs({ ...params })}`, { token });
}
export async function getStockReceipt(token: string, id: string) {
  return apiFetch<StockReceipt>(`/stock-receipts/${id}`, { token });
}
export async function createStockReceipt(token: string, input: unknown) {
  return apiFetch<StockReceipt>('/stock-receipts', {
    token,
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// --- Cart ---
export async function getCart(token: string) {
  return apiFetch<Cart>('/cart', { token });
}
export async function addCartItem(
  token: string,
  input: { productId: string; size?: string | null; color?: string | null; quantity: number },
) {
  return apiFetch<Cart>('/cart/items', { token, method: 'POST', body: JSON.stringify(input) });
}
export async function updateCartItem(token: string, id: string, quantity: number) {
  return apiFetch<Cart>(`/cart/items/${id}`, { token, method: 'PATCH', body: JSON.stringify({ quantity }) });
}
export async function removeCartItem(token: string, id: string) {
  return apiFetch<Cart>(`/cart/items/${id}`, { token, method: 'DELETE' });
}

// --- Orders (customer) ---
export async function createOrder(token: string, input: unknown) {
  return apiFetch<{ order: Order; checkoutUrl: string | null }>('/orders', {
    token,
    method: 'POST',
    body: JSON.stringify(input),
  });
}
export async function getMyOrders(token: string) {
  return apiFetch<Order[]>('/orders/me', { token });
}
export async function getMyOrder(token: string, id: string) {
  return apiFetch<Order>(`/orders/${id}`, { token });
}
export async function reconcileOrder(token: string, id: string) {
  return apiFetch<Order>(`/orders/${id}/reconcile`, { token });
}
export async function cancelOrder(token: string, id: string) {
  return apiFetch<Order>(`/orders/${id}/cancel`, { token, method: 'POST' });
}

// --- Orders (admin) ---
export async function getAdminOrders(token: string, params?: ListParams & { status?: string }) {
  return apiFetch<Order[]>(`/orders${qs({ ...params })}`, { token });
}
export async function getAdminOrder(token: string, id: string) {
  return apiFetch<Order>(`/orders/manage/${id}`, { token });
}
export async function updateOrderStatus(token: string, id: string, status: string) {
  return apiFetch<Order>(`/orders/${id}/status`, { token, method: 'PATCH', body: JSON.stringify({ status }) });
}

// --- Payment ---
export async function getPaymentStatus() {
  return apiFetch<{ payos: boolean }>('/payments/status');
}

// --- Promotion ---
export async function applyPromotion(token: string, code: string, subtotal: number) {
  return apiFetch<ApplyPromotionResult>('/promotions/apply', {
    token,
    method: 'POST',
    body: JSON.stringify({ code, subtotal }),
  });
}
export async function getPromotions(token: string) {
  return apiFetch<Promotion[]>('/promotions', { token });
}
export async function createPromotion(token: string, input: unknown) {
  return apiFetch<Promotion>('/promotions', { token, method: 'POST', body: JSON.stringify(input) });
}
export async function updatePromotionApi(token: string, id: string, input: unknown) {
  return apiFetch<Promotion>(`/promotions/${id}`, { token, method: 'PATCH', body: JSON.stringify(input) });
}
export async function deletePromotionApi(token: string, id: string) {
  return apiFetch<{ id: string }>(`/promotions/${id}`, { token, method: 'DELETE' });
}

// --- Review ---
export async function getReviews(productId: string, params?: { page?: number; pageSize?: number }) {
  return apiFetch<Review[]>(`/reviews${qs({ productId, ...params })}`);
}
export async function checkReviewEligibility(token: string, productId: string) {
  return apiFetch<{ canReview: boolean; reason: string | null }>(`/reviews/eligibility${qs({ productId })}`, { token });
}
export async function postReview(token: string, input: { productId: string; rating: number; content?: string }) {
  return apiFetch<Review>('/reviews', { token, method: 'POST', body: JSON.stringify(input) });
}

// --- Categories ---
export async function getCategories() {
  return apiFetch<Category[]>('/categories');
}
export async function createCategory(token: string, input: Partial<Category>) {
  return apiFetch<Category>('/categories', { token, method: 'POST', body: JSON.stringify(input) });
}
export async function updateCategoryApi(token: string, id: string, input: Partial<Category>) {
  return apiFetch<Category>(`/categories/${id}`, { token, method: 'PATCH', body: JSON.stringify(input) });
}
export async function deleteCategoryApi(token: string, id: string) {
  return apiFetch<{ id: string }>(`/categories/${id}`, { token, method: 'DELETE' });
}

// --- Suppliers ---
export async function getSuppliers(token: string, search?: string) {
  return apiFetch<Supplier[]>(`/suppliers${qs({ search })}`, { token });
}
export async function createSupplier(token: string, input: Partial<Supplier>) {
  return apiFetch<Supplier>('/suppliers', { token, method: 'POST', body: JSON.stringify(input) });
}
export async function updateSupplierApi(token: string, id: string, input: Partial<Supplier>) {
  return apiFetch<Supplier>(`/suppliers/${id}`, { token, method: 'PATCH', body: JSON.stringify(input) });
}
export async function deleteSupplierApi(token: string, id: string) {
  return apiFetch<{ id: string }>(`/suppliers/${id}`, { token, method: 'DELETE' });
}

// --- Products (admin) ---
export async function getAdminProducts(token: string, params?: ListParams & { status?: string }) {
  return apiFetch<AdminProductListItem[]>(`/products/manage/list${qs({ ...params })}`, { token });
}
export async function getAdminProduct(token: string, id: string) {
  return apiFetch<AdminProductDetail>(`/products/manage/${id}`, { token });
}
export async function createProductApi(token: string, input: unknown) {
  return apiFetch<AdminProductDetail>('/products', { token, method: 'POST', body: JSON.stringify(input) });
}
export async function updateProductApi(token: string, id: string, input: unknown) {
  return apiFetch<AdminProductDetail>(`/products/${id}`, { token, method: 'PATCH', body: JSON.stringify(input) });
}
export async function deleteProductApi(token: string, id: string) {
  return apiFetch<{ id: string }>(`/products/${id}`, { token, method: 'DELETE' });
}

// --- Auth ---
export async function getMe(token: string) {
  return apiFetch<AuthUser>('/auth/me', { token });
}

export async function registerCustomer(input: {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}) {
  return apiFetch<AuthUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// --- Account (ADMIN) ---
export async function getAccounts(token: string, params?: ListParams) {
  return apiFetch<AdminAccount[]>(`/accounts${qs({ ...params })}`, { token });
}
export async function createAccount(
  token: string,
  input: { username: string; email: string; password: string; fullName: string; roles: string[] },
) {
  return apiFetch<{ id: string }>('/accounts', { token, method: 'POST', body: JSON.stringify(input) });
}
export async function updateAccount(token: string, id: string, input: { roles?: string[]; enabled?: boolean }) {
  return apiFetch<{ id: string }>(`/accounts/${id}`, { token, method: 'PATCH', body: JSON.stringify(input) });
}
export async function deleteAccount(token: string, id: string) {
  return apiFetch<{ id: string }>(`/accounts/${id}`, { token, method: 'DELETE' });
}

// --- Products (public) ---
export async function getProducts(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  sort?: string;
}) {
  return apiFetch<ProductListItem[]>(`/products${qs({ ...params })}`);
}

export async function getProductBySlug(slug: string) {
  return apiFetch<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
}
