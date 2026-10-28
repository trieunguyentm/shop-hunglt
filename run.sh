#!/usr/bin/env bash
# ============================================================================
#  MAISON — script chạy nhanh (macOS / Linux)
#
#   ./run.sh            Dựng & chạy TOÀN BỘ hệ thống bằng Docker (khuyến nghị)
#   ./run.sh dev        Chế độ phát triển: Docker cho Postgres+Keycloak, npm cho BE/FE (hot reload)
#   ./run.sh down       Dừng hệ thống (giữ dữ liệu)
#   ./run.sh reset [-y] Dừng + XÓA toàn bộ dữ liệu (database, Keycloak) → lần sau dựng lại từ đầu
#   ./run.sh logs [svc] Xem log (svc: backend | frontend | keycloak | postgres)
#   ./run.sh status     Trạng thái các container
#   ./run.sh test       Typecheck + unit test backend & frontend
#   ./run.sh package    Đóng gói mã nguồn thành file .zip (bỏ node_modules, build, .env)
#   ./run.sh env        Chỉ tạo các file cấu hình .env từ file mẫu (nếu chưa có)
#
#  Cổng 3000 bị chiếm?  APP_PORT=3001 ./run.sh
#  Triển khai server có domain: tạo code/.env từ .env.example (APP_URL, cổng, Google key...)
# ============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Cấu hình triển khai (tùy chọn): code/.env — docker compose cũng tự đọc file này
if [ -f .env ]; then set -a; . ./.env; set +a; fi
APP_PORT="${APP_PORT:-3000}" API_PORT="${API_PORT:-4000}" KC_PORT="${KC_PORT:-8080}" DB_PORT="${DB_PORT:-5432}"
APP_URL="${APP_URL:-http://localhost:${APP_PORT}}"
APP_URL="${APP_URL%/}"
export APP_PORT API_PORT KC_PORT DB_PORT

c_ok=$'\033[32m'; c_warn=$'\033[33m'; c_err=$'\033[31m'; c_dim=$'\033[2m'; c_b=$'\033[1m'; c_0=$'\033[0m'
info() { echo "${c_b}▸${c_0} $*"; }
ok()   { echo "${c_ok}✔${c_0} $*"; }
warn() { echo "${c_warn}!${c_0} $*"; }
die()  { echo "${c_err}✖ $*${c_0}" >&2; exit 1; }

need_docker() {
  command -v docker >/dev/null 2>&1 || die "Chưa cài Docker. Tải tại https://www.docker.com/products/docker-desktop"
  docker info >/dev/null 2>&1 || die "Docker chưa chạy. Hãy mở Docker Desktop rồi thử lại."
  docker compose version >/dev/null 2>&1 || die "Cần Docker Compose v2 (lệnh 'docker compose')."
}

need_node() {
  command -v node >/dev/null 2>&1 || die "Chế độ dev cần Node.js ≥ 18.17 (https://nodejs.org)."
  local major; major="$(node -p 'process.versions.node.split(".")[0]')"
  [ "$major" -ge 18 ] || die "Node.js hiện tại $(node -v) — cần ≥ 18.17."
}

port_busy() { (command -v lsof >/dev/null && lsof -iTCP:"$1" -sTCP:LISTEN -n -P >/dev/null 2>&1) || return 1; }

check_ports() {
  local busy=()
  for p in "$@"; do port_busy "$p" && busy+=("$p"); done
  if [ ${#busy[@]} -gt 0 ]; then
    warn "Cổng đang bị chiếm: ${busy[*]}"
    [[ " ${busy[*]} " == *" $APP_PORT "* ]] && warn "→ Thử: APP_PORT=3001 ./run.sh"
    die "Hãy giải phóng cổng (hoặc dừng ứng dụng đang dùng) rồi chạy lại."
  fi
}

rand_hex() { openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'; }

# Secret client "fashion-frontend" khai báo sẵn trong realm import → dùng luôn cho Auth.js
kc_secret() { sed -n 's/.*"secret": *"\([^"]*\)".*/\1/p' infra/keycloak/realm-fashion-shop.json | head -1; }

# Thay giá trị KEY=... trong file (tương thích sed của macOS & Linux)
set_kv() { local f="$1" k="$2" v="$3"; local tmp; tmp="$(mktemp)"; awk -v k="$k" -v v="$v" 'BEGIN{FS=OFS="="} $1==k{$0=k"="v} {print}' "$f" >"$tmp" && mv "$tmp" "$f"; }

# Tạo file môi trường từ file mẫu nếu chưa có (không bao giờ ghi đè file đã có)
ensure_env() {
  local secret; secret="$(kc_secret)"
  if [ ! -f backend/.env.prod ]; then cp backend/.env.prod.example backend/.env.prod; ok "Tạo backend/.env.prod"; fi
  if [ ! -f frontend/.env.prod ]; then
    cp frontend/.env.prod.example frontend/.env.prod
    set_kv frontend/.env.prod AUTH_SECRET "$(rand_hex)"
    set_kv frontend/.env.prod AUTH_KEYCLOAK_SECRET "$secret"
    ok "Tạo frontend/.env.prod (sinh AUTH_SECRET ngẫu nhiên)"
  fi
  if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; ok "Tạo backend/.env"; fi
  if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.example frontend/.env.local
    set_kv frontend/.env.local AUTH_SECRET "$(rand_hex)"
    set_kv frontend/.env.local AUTH_KEYCLOAK_SECRET "$secret"
    ok "Tạo frontend/.env.local"
  fi
}

# Domain riêng (khác localhost) → sinh realm.local.json có thêm redirect URI cho APP_URL.
# Keycloak chỉ đọc file này ở lần import đầu (DB Keycloak trống), nên dùng kèm ./run.sh reset khi đổi domain.
prepare_realm() {
  case "$APP_URL" in http://localhost:3000 | http://localhost:3001) unset KC_REALM_FILE; return ;; esac
  sed -e "s|\"http://localhost:3001/\*\"\$|\"http://localhost:3001/*\", \"${APP_URL}/*\"|" \
      -e "s|\"http://localhost:3000\", \"http://localhost:3001\"\]|\"http://localhost:3000\", \"http://localhost:3001\", \"${APP_URL}\"]|" \
      -e "s|##http://localhost:3001/\*\"|##http://localhost:3001/*##${APP_URL}/*\"|" \
      infra/keycloak/realm-fashion-shop.json >infra/keycloak/realm.local.json
  grep -q "${APP_URL}" infra/keycloak/realm.local.json || die "Không sinh được realm cho ${APP_URL}"
  export KC_REALM_FILE=./infra/keycloak/realm.local.json
  ok "Realm có redirect cho ${APP_URL}"
}

# Có GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET trong .env → tự cấu hình đăng nhập Google (idempotent)
setup_google() {
  [ -n "${GOOGLE_CLIENT_ID:-}" ] && [ -n "${GOOGLE_CLIENT_SECRET:-}" ] || return 0
  info "Cấu hình đăng nhập Google..."
  KC_URL="http://localhost:${KC_PORT}" KC_ADMIN_PW="${KC_ADMIN_PASSWORD:-admin}" bash infra/keycloak/add-google-idp.sh >/dev/null \
    && ok "Đã bật đăng nhập Google" || warn "Cấu hình Google thất bại — chạy tay: infra/keycloak/add-google-idp.sh"
}

wait_http() { # wait_http <url> <tên> <giây>
  local url="$1" name="$2" max="${3:-180}" i=0
  printf "  Chờ %s " "$name"
  until curl -fs -o /dev/null "$url"; do
    i=$((i + 3)); [ $i -ge "$max" ] && { echo; warn "$name chưa phản hồi sau ${max}s — xem log: ./run.sh logs"; return 1; }
    printf "."; sleep 3
  done
  echo " ${c_ok}sẵn sàng${c_0}"
}

print_summary() {
  cat <<EOF

${c_b}🎉 MAISON đã chạy!${c_0}
  Website      ${c_b}${APP_URL}${c_0}
  Quản trị     ${APP_URL}/admin
  API          ${API_PUBLIC_URL:-http://localhost:${API_PORT}/api}/health
  Keycloak     ${AUTH_PUBLIC_URL:-http://localhost:${KC_PORT}}   ${c_dim}(admin / ${KC_ADMIN_PASSWORD:-admin})${c_0}

${c_b}Tài khoản dùng thử${c_0}
  Quản trị viên  admin     / Admin@123
  Nhân viên      nhanvien  / Staff@123
  Khách hàng     khach     / Khach@123
  Mã giảm giá    WELCOME10 ${c_dim}(giảm 10% đơn từ 300K)${c_0}

${c_dim}Dừng: ./run.sh down   ·   Log: ./run.sh logs   ·   Xóa dữ liệu: ./run.sh reset${c_0}
EOF
}

cmd_up() {
  need_docker
  # Bỏ qua kiểm tra cổng của chính các container MAISON đang chạy (khi cập nhật/khởi động lại)
  docker ps --format '{{.Names}}' | grep -q '^fashion-' || check_ports "$APP_PORT" "$API_PORT" "$KC_PORT" "$DB_PORT"
  ensure_env
  prepare_realm
  info "Dựng & khởi động Postgres · Keycloak · Backend · Frontend (lần đầu mất vài phút)..."
  docker compose up -d --build
  wait_http "http://localhost:${KC_PORT}/realms/fashion-shop/.well-known/openid-configuration" "Keycloak" 240
  setup_google
  wait_http "http://localhost:${API_PORT}/api/health" "Backend" 180
  wait_http "http://localhost:${APP_PORT}" "Frontend" 120
  print_summary
}

cmd_dev() {
  need_docker; need_node
  check_ports "$APP_PORT" "$API_PORT"
  ensure_env
  prepare_realm
  info "Khởi động Postgres + Keycloak (Docker)..."
  docker compose up -d postgres keycloak
  [ -d backend/node_modules ] || (info "Cài thư viện backend..." && cd backend && npm install --no-audit --no-fund)
  [ -d frontend/node_modules ] || (info "Cài thư viện frontend..." && cd frontend && npm install --no-audit --no-fund)
  wait_http "http://localhost:${KC_PORT}/realms/fashion-shop/.well-known/openid-configuration" "Keycloak" 240
  setup_google
  info "Áp migration + seed dữ liệu mẫu..."
  (cd backend && npx prisma migrate deploy && npm run db:seed)

  info "Chạy backend (:4000) + frontend (:${APP_PORT}) — Ctrl+C để dừng"
  trap 'kill 0 2>/dev/null' EXIT INT TERM
  (cd backend && CORS_ORIGIN="http://localhost:${APP_PORT}" FRONTEND_URL="http://localhost:${APP_PORT}" npm run dev 2>&1 | sed "s/^/${c_dim}[api]${c_0} /") &
  (cd frontend && NEXTAUTH_URL="http://localhost:${APP_PORT}" AUTH_URL="http://localhost:${APP_PORT}" npx next dev -p "$APP_PORT" 2>&1 | sed "s/^/${c_dim}[web]${c_0} /") &
  wait_http "http://localhost:${APP_PORT}" "Frontend" 180 && print_summary
  wait
}

cmd_test() {
  need_node
  info "Backend: typecheck + unit test"
  (cd backend && npm run typecheck && npm test)
  info "Frontend: typecheck + lint"
  (cd frontend && npm run typecheck && npm run lint)
  ok "Tất cả kiểm tra đều đạt"
}

cmd_package() {
  local out_dir="$ROOT/../dist" name="maison-$(date +%Y%m%d)"
  mkdir -p "$out_dir"
  local zip="$out_dir/$name.zip"
  rm -f "$zip"
  info "Đóng gói mã nguồn → $zip"
  if git -C "$ROOT" rev-parse >/dev/null 2>&1; then
    # Lấy đúng các file được git theo dõi (+ file mới chưa commit), tự loại .env/node_modules/build
    (cd "$ROOT" && { git ls-files; git ls-files --others --exclude-standard; } | sort -u | zip -q "$zip" -@)
  else
    (cd "$ROOT" && zip -qr "$zip" . -x '*/node_modules/*' '*/.next/*' '*/dist/*' '*.env' '*.env.local' '*.env.prod' '*/.DS_Store' '.git/*')
  fi
  ok "Xong: $(du -h "$zip" | cut -f1)  $zip"
  echo "  Giải nén rồi chạy:  ./run.sh   (Windows: run.bat)"
}

case "${1:-up}" in
  up | start) cmd_up ;;
  dev) cmd_dev ;;
  down | stop) need_docker; docker compose down; ok "Đã dừng (dữ liệu vẫn được giữ)" ;;
  reset)
    need_docker
    a="${2:-}"
    [[ "$a" == "-y" || "$a" == "--yes" ]] || read -r -p "Xóa TOÀN BỘ dữ liệu (đơn hàng, tài khoản Keycloak...)? [y/N] " a
    [[ "$a" =~ ^([yY]|-y|--yes)$ ]] || { echo "Đã hủy."; exit 0; }
    docker compose down -v; ok "Đã xóa dữ liệu. Chạy ./run.sh để dựng lại từ đầu." ;;
  logs) need_docker; docker compose logs -f --tail=100 ${2:-} ;;
  status | ps) need_docker; docker compose ps ;;
  test) cmd_test ;;
  package) cmd_package ;;
  env) ensure_env; ok "File cấu hình đã sẵn sàng" ;;
  -h | --help | help) sed -n '3,16p' "$0" | sed -e 's/^#[ ]\{0,2\}//' -e '/^=*$/d' ;;
  *) die "Lệnh không hợp lệ: $1 (xem ./run.sh help)" ;;
esac
