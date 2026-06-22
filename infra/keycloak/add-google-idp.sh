#!/usr/bin/env bash
# Cấu hình "Đăng nhập với Google" cho realm fashion-shop đang chạy (live, qua Admin API).
# Realm đã import trước đó sẽ KHÔNG tự nhận thay đổi trong realm JSON → dùng script này.
#
# Cách lấy credentials Google:
#   1. https://console.cloud.google.com/ → APIs & Services → Credentials
#   2. Create OAuth client ID → Web application
#   3. Authorized redirect URI:
#        http://localhost:8080/realms/fashion-shop/broker/google/endpoint
#   4. Lấy Client ID + Client Secret.
#
# Chạy:
#   GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy ./add-google-idp.sh
set -euo pipefail

KC_URL="${KC_URL:-http://localhost:8080}"
REALM="${REALM:-fashion-shop}"
KC_ADMIN="${KC_ADMIN:-admin}"
KC_ADMIN_PW="${KC_ADMIN_PW:-admin}"

if [[ -z "${GOOGLE_CLIENT_ID:-}" || -z "${GOOGLE_CLIENT_SECRET:-}" ]]; then
  echo "❌ Thiếu GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET." >&2
  echo "   Ví dụ: GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy $0" >&2
  exit 1
fi

echo "→ Lấy admin token..."
TOKEN=$(curl -s -X POST "$KC_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" -d "client_id=admin-cli" \
  -d "username=$KC_ADMIN" -d "password=$KC_ADMIN_PW" \
  | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

if [[ -z "$TOKEN" ]]; then echo "❌ Không lấy được admin token" >&2; exit 1; fi

PAYLOAD=$(cat <<JSON
{
  "alias": "google",
  "displayName": "Google",
  "providerId": "google",
  "enabled": true,
  "trustEmail": true,
  "storeToken": false,
  "config": {
    "clientId": "$GOOGLE_CLIENT_ID",
    "clientSecret": "$GOOGLE_CLIENT_SECRET",
    "defaultScope": "openid email profile",
    "syncMode": "IMPORT"
  }
}
JSON
)

echo "→ Tạo Identity Provider 'google'..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$KC_URL/admin/realms/$REALM/identity-provider/instances" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "$PAYLOAD")

if [[ "$CODE" == "201" ]]; then
  echo "✅ Đã thêm Google. Mở trang đăng nhập sẽ thấy nút 'Google'."
elif [[ "$CODE" == "409" ]]; then
  echo "ℹ️  Google IdP đã tồn tại → cập nhật credentials..."
  curl -s -X PUT "$KC_URL/admin/realms/$REALM/identity-provider/instances/google" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "$PAYLOAD"
  echo "✅ Đã cập nhật Google IdP."
else
  echo "❌ Thất bại (HTTP $CODE)" >&2; exit 1
fi
