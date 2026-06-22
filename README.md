# MAISON — Hệ thống quản lý bán hàng thời trang

Mã nguồn dự án, tách biệt **Frontend** và **Backend**. Xem định hướng tổng thể ở [`../CLAUDE.md`](../CLAUDE.md) và kế hoạch ở [`../docs/PLAN.md`](../docs/PLAN.md).

```
code/
├── backend/   # REST API — Node.js + Express + TypeScript + Prisma + PostgreSQL
└── frontend/  # Web — Next.js 14 + TypeScript + TailwindCSS + three.js + GSAP
```

## Yêu cầu môi trường
- Docker + Docker Compose (đủ để chạy toàn bộ)
- (Tùy chọn, nếu chạy local dev) Node.js ≥ 18.17 + npm

## 🚀 Cách 1 — Chạy TẤT CẢ bằng 1 lệnh (khuyến nghị)
Dựng cả PostgreSQL + Keycloak + Backend + Frontend:

```bash
cd code
docker compose up -d --build
```
- Web: **http://localhost:3000**  ·  API: http://localhost:4000/api  ·  Keycloak: http://localhost:8080 (`admin`/`admin`)
- Lần đầu sẽ build image + chạy migration + seed tự động (chờ ~1–2 phút). Xem log: `docker compose logs -f backend`.
- Tắt: `docker compose down` (giữ dữ liệu) — thêm `-v` để xóa luôn database.
- Bật thanh toán PayOS (tùy chọn): tạo `code/.env` từ `code/.env.example` và điền 3 key, rồi `docker compose up -d --build`.

> Mạng OIDC đã được cấu hình sẵn (Keycloak *backchannel dynamic*): trình duyệt dùng `localhost:8080`, container dùng `host.docker.internal:8080` — **không cần sửa /etc/hosts**.

## Cách 2 — Chạy local dev (hot reload)
Chỉ dựng hạ tầng bằng Docker, chạy code bằng npm. File `.env` (backend) & `.env.local` (frontend) đã tạo sẵn.

```bash
cd code
docker compose up -d postgres keycloak   # chỉ hạ tầng
```
- Keycloak console: http://localhost:8080 — `admin` / `admin`.
- Realm `fashion-shop` tự import (roles, client `fashion-frontend`, user mẫu).

**Tài khoản Keycloak seed sẵn**
| Vai trò | Username | Mật khẩu |
|---|---|---|
| Admin | `admin` | `Admin@123` |
| Nhân viên | `nhanvien` | `Staff@123` |
| Khách | `khach` | `Khach@123` |

**Đăng nhập bằng Google** (tùy chọn): cấu hình Google làm Identity Provider của Keycloak:
```bash
cd infra/keycloak
GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy ./add-google-idp.sh
```
Redirect URI khai báo ở Google Console: `http://localhost:8080/realms/fashion-shop/broker/google/endpoint`. Chi tiết: `docs/plan/01_auth_account.md` (mục 12).

> ⚠️ Nếu gặp lỗi "Token thiếu thông tin người dùng": access token thiếu `sub` do client `fashion-frontend` thiếu client scope `basic` (Keycloak 26). Realm JSON đã thêm sẵn; nếu realm import từ trước, vào Admin Console → Clients → `fashion-frontend` → Client scopes → thêm `basic`, rồi **đăng xuất/đăng nhập lại**.

**Thanh toán PayOS** (tùy chọn — mặc định chỉ COD): lấy 3 key tại https://my.payos.vn (Client ID, API Key, Checksum Key), điền vào `backend/.env` (`PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`) rồi khởi động lại backend. Khi đặt hàng chọn "PayOS" sẽ chuyển sang trang QR/chuyển khoản; quay về `/orders/[id]?paid=1` tự đối soát trạng thái. Để nhận webhook tự động cần URL public (ví dụ `ngrok http 4000`) trỏ tới `POST /api/payments/payos/webhook` — đăng ký 1 lần bằng `POST /api/payments/payos/confirm-webhook` (ADMIN) hoặc trên dashboard PayOS.

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env            # sửa DATABASE_URL cho khớp PostgreSQL của bạn
npm run prisma:migrate          # tạo bảng (chạy lần đầu, đặt tên migration: init)
npm run db:seed                 # nạp dữ liệu mẫu
npm run dev                     # API: http://localhost:4000/api
```

Kiểm tra nhanh: mở http://localhost:4000/api/health → `{"success":true,...}`.

> **Xác thực (Phase 1 — đã triển khai):** dùng **Keycloak** (OIDC). FE đăng nhập qua Auth.js (nút Đăng nhập → trang Keycloak), BE verify access token qua JWKS và đồng bộ user về DB khi gọi `/auth/me`. Quản lý tài khoản (ADMIN) tại `/admin/accounts`. Đăng nhập bằng user Keycloak ở mục 0. Chi tiết: `docs/plan/01_auth_account.md`.

**Lệnh khác:** `npm run build` · `npm start` · `npm run typecheck` · `npm run test` · `npm run prisma:studio`.

### API hiện có
| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | `/api/health` | public | Kiểm tra trạng thái |
| POST | `/api/auth/register` | public | Đăng ký khách hàng |
| POST | `/api/auth/login` | public | Đăng nhập |
| POST | `/api/auth/refresh` | public | Cấp lại access token |
| POST | `/api/auth/logout` | public | Đăng xuất (thu hồi token) |
| POST | `/api/auth/register` | public | Đăng ký khách (tạo user Keycloak) |
| GET | `/api/auth/me` | Bearer (Keycloak) | Đồng bộ DB + thông tin người dùng |
| GET | `/api/accounts` | ADMIN | Danh sách tài khoản |
| POST | `/api/accounts` | ADMIN | Tạo tài khoản nhân viên/quản trị |
| PATCH | `/api/accounts/:id` | ADMIN | Đổi vai trò / khóa-mở |
| DELETE | `/api/accounts/:id` | ADMIN | Xóa tài khoản |
| GET | `/api/categories` | public | Danh sách danh mục (kèm số SP) |
| POST/PATCH/DELETE | `/api/categories/:id?` | STAFF/ADMIN | CRUD danh mục |
| GET/POST/PATCH/DELETE | `/api/suppliers/:id?` | STAFF/ADMIN | CRUD nhà cung cấp |
| GET | `/api/products` | public | Danh sách SP (page,pageSize,search,category,sort) |
| GET | `/api/products/:slug` | public | Chi tiết sản phẩm |
| GET | `/api/products/manage/list` | STAFF/ADMIN | Danh sách SP quản trị (mọi trạng thái) |
| GET | `/api/products/manage/:id` | STAFF/ADMIN | Chi tiết SP để sửa |
| POST/PATCH/DELETE | `/api/products/:id?` | STAFF/ADMIN | CRUD SP (kèm biến thể + ảnh) |
| GET | `/api/cart` | CUSTOMER | Xem giỏ hàng |
| POST/PATCH/DELETE | `/api/cart/items/:id?` | CUSTOMER | Thêm/sửa/xóa mục giỏ |
| POST | `/api/orders` | CUSTOMER | Đặt hàng (COD/PayOS) từ giỏ |
| GET | `/api/orders/me` | CUSTOMER | Đơn của tôi |
| GET | `/api/orders/:id` | CUSTOMER | Chi tiết đơn (của tôi) |
| POST | `/api/orders/:id/cancel` | CUSTOMER | Hủy đơn (khi chờ xác nhận) |
| GET | `/api/orders` | STAFF/ADMIN | Danh sách đơn (lọc trạng thái) |
| PATCH | `/api/orders/:id/status` | STAFF/ADMIN | Cập nhật trạng thái đơn |
| POST | `/api/payments/payos/webhook` | public (PayOS) | Webhook xác nhận thanh toán |
| GET | `/api/payments/status` | public | PayOS đã cấu hình chưa |
| POST | `/api/promotions/apply` | CUSTOMER | Áp thử mã khuyến mãi |
| GET/POST/PATCH/DELETE | `/api/promotions/:id?` | ADMIN | CRUD khuyến mãi |
| GET | `/api/reviews?productId=` | public | Danh sách đánh giá SP |
| GET | `/api/reviews/eligibility?productId=` | CUSTOMER | Được đánh giá không |
| POST | `/api/reviews` | CUSTOMER | Gửi đánh giá (đã mua & nhận hàng) |
| GET | `/api/stock-receipts` | STAFF/ADMIN | Lịch sử phiếu nhập kho |
| GET | `/api/stock-receipts/:id` | STAFF/ADMIN | Chi tiết phiếu nhập |
| POST | `/api/stock-receipts` | STAFF/ADMIN | Lập phiếu nhập (cộng tồn kho) |
| GET | `/api/customers` | STAFF/ADMIN | Danh sách khách hàng (tìm kiếm) |
| GET | `/api/customers/:id` | STAFF/ADMIN | Chi tiết KH + lịch sử đơn + tổng chi |
| PATCH | `/api/customers/:id` | STAFF/ADMIN | Đổi hạng VIP / khóa-mở |
| GET | `/api/stats/overview` | STAFF/ADMIN | Số liệu dashboard (doanh thu, đơn, top SP) |
| POST | `/api/contact` | public | Gửi tin nhắn liên hệ |
| GET/PATCH | `/api/contact/:id?` | STAFF/ADMIN | Xem & cập nhật trạng thái liên hệ |

> Xác thực: gửi header `Authorization: Bearer <access_token Keycloak>`. Frontend tự đính token qua Auth.js. Các endpoint tiếp theo bổ sung theo `docs/PLAN.md`.

## 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm run dev                     # Web: http://localhost:3000
```

> Trang chủ vẫn hiển thị khi backend chưa chạy (phần sản phẩm có fallback). Để thấy sản phẩm thật, hãy chạy backend + seed trước.

**Lệnh khác:** `npm run build` · `npm start` · `npm run typecheck` · `npm run lint`.

## 3. Quy trình chạy đầy đủ (lần đầu)
1. Khởi động PostgreSQL.
2. Backend: `install → .env → prisma:migrate → db:seed → dev`.
3. Frontend: `install → .env.local → dev`.
4. Mở http://localhost:3000.

## 4. Cấu trúc & quy ước
- Backend: kiến trúc phân tầng (route → controller → service → Prisma). Xem `.claude/skills/backend-api`.
- Frontend: Next.js App Router, Server Component mặc định. Xem `.claude/skills/frontend-nextjs`.
- Giao diện: design system "Editorial Maison". Xem `.claude/skills/fashion-ui-design`.
