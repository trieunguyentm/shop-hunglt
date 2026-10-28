# MAISON — Hệ thống quản lý bán hàng thời trang

Website bán hàng thời trang + khu quản trị (admin/nhân viên). Mã nguồn tách **Frontend** và **Backend**; xác thực bằng **Keycloak (OIDC)**.
Định hướng tổng thể: [`../CLAUDE.md`](../CLAUDE.md) · Kế hoạch: [`../docs/PLAN.md`](../docs/PLAN.md).

```
code/
├── run.sh · run.ps1 · run.bat   # script chạy nhanh (macOS/Linux · Windows)
├── docker-compose.yml           # Postgres + Keycloak + Backend + Frontend
├── backend/                     # REST API — Express + TypeScript + Prisma + PostgreSQL
├── frontend/                    # Web — Next.js 14 + TailwindCSS + GSAP + three.js
└── infra/                       # Realm Keycloak (import sẵn) + theme đăng nhập + init DB
```

## 🚀 Chạy nhanh — 1 lệnh

**Yêu cầu:** Docker Desktop (đang chạy) + Internet ở lần build đầu (tải image, thư viện, font).

| Hệ điều hành | Lệnh (trong thư mục `code/`) |
|---|---|
| macOS / Linux | `./run.sh` |
| Windows | bấm đúp `run.bat` (hoặc `.\run.ps1` trong PowerShell) |

Script sẽ: kiểm tra Docker & cổng → **tự tạo file cấu hình** `.env*` từ file mẫu (sinh `AUTH_SECRET` ngẫu nhiên, lấy secret client Keycloak từ realm) → build & khởi động 4 dịch vụ → chờ sẵn sàng → in địa chỉ truy cập. Lần đầu mất ~3–5 phút; migration + dữ liệu mẫu chạy tự động.

| Dịch vụ | Địa chỉ |
|---|---|
| Website | http://localhost:3000 |
| Khu quản trị | http://localhost:3000/admin |
| API | http://localhost:4000/api/health |
| Keycloak console | http://localhost:8080 (`admin` / `admin`) |

**Tài khoản dùng thử** (import sẵn trong realm `fashion-shop`):

| Vai trò | Username | Mật khẩu | Quyền |
|---|---|---|---|
| Quản trị viên | `admin` | `Admin@123` | Toàn quyền (thêm: khuyến mãi, tài khoản) |
| Nhân viên | `nhanvien` | `Staff@123` | Đơn hàng, sản phẩm, kho, khách hàng, liên hệ |
| Khách hàng | `khach` | `Khach@123` | Mua hàng, đơn của tôi, đánh giá |

Mã giảm giá mẫu: **`WELCOME10`** (giảm 10% đơn từ 300.000đ).

### Các lệnh khác

```bash
./run.sh down       # dừng (giữ dữ liệu)
./run.sh reset      # dừng + XÓA dữ liệu (DB, Keycloak) — lần sau dựng lại từ đầu
./run.sh logs       # xem log (thêm tên service: backend | frontend | keycloak | postgres)
./run.sh status     # trạng thái container
./run.sh dev        # chế độ phát triển: Docker cho Postgres+Keycloak, npm (hot reload) cho BE/FE — cần Node ≥ 18.17
./run.sh test       # typecheck + unit test backend, typecheck + lint frontend
./run.sh package    # đóng gói mã nguồn thành ../dist/maison-YYYYMMDD.zip (bỏ node_modules, build, .env)
./run.sh env        # chỉ tạo file cấu hình từ file mẫu
```

**Cổng 3000 bị ứng dụng khác chiếm?** Chạy `APP_PORT=3001 ./run.sh` (Windows: `$env:APP_PORT=3001; .\run.ps1`). Realm đã khai báo sẵn redirect cho cả 3000 và 3001.

### Khắc phục sự cố
- **Đăng nhập báo lỗi redirect_uri** → đang dùng cổng khác 3000/3001; thêm redirect URI trong Keycloak console (Clients → `fashion-frontend`).
- **"Token thiếu thông tin người dùng"** → client `fashion-frontend` thiếu client scope `basic` (Keycloak 26). Realm JSON đã có sẵn; nếu realm import từ bản cũ: Admin Console → Clients → `fashion-frontend` → Client scopes → thêm `basic`, rồi đăng nhập lại.
- **Muốn dữ liệu sạch như mới** → `./run.sh reset` rồi `./run.sh`.

### Tùy chọn
- **Thanh toán PayOS** (mặc định chỉ COD): lấy 3 key tại https://my.payos.vn, điền `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` vào `backend/.env.prod` (Docker) hoặc `backend/.env` (dev) rồi khởi động lại backend. Quay về `/orders/[id]?paid=1` sẽ tự đối soát. Webhook cần URL public (vd `ngrok http 4000`) trỏ tới `POST /api/payments/payos/webhook`.
- **Đăng nhập Google**: `cd infra/keycloak && GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy ./add-google-idp.sh` (redirect URI ở Google Console: `http://localhost:8080/realms/fashion-shop/broker/google/endpoint`).

## Quy tắc nghiệp vụ chính
- **Tồn kho:** theo biến thể Size × Màu; tồn sản phẩm = Σ biến thể. Giỏ hàng chặn thêm/tăng vượt tồn; đặt hàng trừ kho trong transaction; hủy/trả hàng hoàn kho; phiếu nhập cộng kho.
- **Trạng thái đơn:** `Chờ xác nhận → Đã xác nhận → Đang đóng gói → Đang giao → Đã giao`; hủy được trước khi giao; `Đã giao → Trả hàng`. Không cho bước lùi (tránh lệch kho). Đơn COD tự chuyển "Đã thanh toán" khi giao thành công.
- **Phí vận chuyển:** 30.000đ, do server quyết định (`backend/src/modules/order/order.rules.ts`).
- **Xóa sản phẩm** đã có đơn hàng/phiếu nhập → chuyển sang *Ẩn* để giữ lịch sử chứng từ.
- **Phân quyền:** khuyến mãi & tài khoản chỉ ADMIN; ADMIN không thể tự khóa/xóa/đổi quyền chính mình.

## Phát triển thủ công (không dùng script)

### 1. Backend

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
| GET | `/api/orders/manage/:id` | STAFF/ADMIN | Chi tiết đơn (quản trị) |
| PATCH | `/api/orders/:id/status` | STAFF/ADMIN | Chuyển trạng thái đơn (theo luồng hợp lệ) |
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

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm run dev                     # Web: http://localhost:3000
```

> Trang chủ vẫn hiển thị khi backend chưa chạy (phần sản phẩm có fallback). Để thấy sản phẩm thật, hãy chạy backend + seed trước.

**Lệnh khác:** `npm run build` · `npm start` · `npm run typecheck` · `npm run lint`.

### 3. Quy trình chạy đầy đủ (lần đầu)
1. Khởi động PostgreSQL.
2. Backend: `install → .env → prisma:migrate → db:seed → dev`.
3. Frontend: `install → .env.local → dev`.
4. Mở http://localhost:3000.

## Cấu trúc & quy ước
- Backend: kiến trúc phân tầng (route → controller → service → Prisma). Xem `.claude/skills/backend-api`.
- Frontend: Next.js App Router, Server Component mặc định. Xem `.claude/skills/frontend-nextjs`.
- Giao diện: design system **"MAISON Fresh"** (Montserrat, ink + coral + lime) — component dùng chung ở `frontend/src/components/ui`. Xem `.claude/skills/fashion-ui-design`.
