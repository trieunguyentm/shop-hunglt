# ============================================================================
#  MAISON — script chạy nhanh (Windows PowerShell)
#    .\run.ps1            Dựng & chạy toàn bộ hệ thống bằng Docker
#    .\run.ps1 down       Dừng (giữ dữ liệu)
#    .\run.ps1 reset      Dừng + xóa toàn bộ dữ liệu
#    .\run.ps1 logs       Xem log
#  Cổng 3000 bị chiếm?   $env:APP_PORT=3001; .\run.ps1
# ============================================================================
param([string]$Command = "up")
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not $env:APP_PORT) { $env:APP_PORT = "3000" }
$port = $env:APP_PORT

function Fail($msg) { Write-Host "X $msg" -ForegroundColor Red; exit 1 }
function Ok($msg) { Write-Host "v $msg" -ForegroundColor Green }

function Need-Docker {
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Fail "Chưa cài Docker Desktop: https://www.docker.com/products/docker-desktop" }
  docker info *> $null; if ($LASTEXITCODE -ne 0) { Fail "Docker chưa chạy. Hãy mở Docker Desktop rồi thử lại." }
}

function Rand-Hex { -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) }) }

function Set-Kv($file, $key, $value) {
  $lines = Get-Content $file -Encoding UTF8 | ForEach-Object { if ($_ -match "^$key=") { "$key=$value" } else { $_ } }
  [IO.File]::WriteAllLines((Resolve-Path $file), $lines, (New-Object Text.UTF8Encoding $false))
}

function Ensure-Env {
  $secret = ([regex]'"secret":\s*"([^"]+)"').Match((Get-Content infra/keycloak/realm-fashion-shop.json -Raw)).Groups[1].Value
  if (-not (Test-Path backend/.env.prod)) { Copy-Item backend/.env.prod.example backend/.env.prod; Ok "Tạo backend/.env.prod" }
  if (-not (Test-Path frontend/.env.prod)) {
    Copy-Item frontend/.env.prod.example frontend/.env.prod
    Set-Kv frontend/.env.prod "AUTH_SECRET" (Rand-Hex)
    Set-Kv frontend/.env.prod "AUTH_KEYCLOAK_SECRET" $secret
    Ok "Tạo frontend/.env.prod"
  }
}

function Wait-Http($url, $name, $max = 240) {
  Write-Host -NoNewline "  Chờ $name "
  for ($i = 0; $i -lt $max; $i += 3) {
    try { Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 3 | Out-Null; Write-Host " sẵn sàng" -ForegroundColor Green; return } catch { Write-Host -NoNewline "."; Start-Sleep 3 }
  }
  Write-Host ""; Write-Host "! $name chưa phản hồi — xem log: .\run.ps1 logs" -ForegroundColor Yellow
}

switch ($Command) {
  "up" {
    Need-Docker; Ensure-Env
    Write-Host "> Dựng & khởi động hệ thống (lần đầu mất vài phút)..."
    docker compose up -d --build; if ($LASTEXITCODE -ne 0) { Fail "docker compose lỗi" }
    Wait-Http "http://localhost:8080/realms/fashion-shop/.well-known/openid-configuration" "Keycloak"
    Wait-Http "http://localhost:4000/api/health" "Backend"
    Wait-Http "http://localhost:$port" "Frontend"
    Write-Host ""
    Write-Host "MAISON đã chạy!  Website: http://localhost:$port   Quản trị: http://localhost:$port/admin" -ForegroundColor Green
    Write-Host "Tài khoản: admin/Admin@123 · nhanvien/Staff@123 · khach/Khach@123 · Mã giảm giá WELCOME10"
  }
  "down" { Need-Docker; docker compose down; Ok "Đã dừng (dữ liệu vẫn được giữ)" }
  "reset" {
    Need-Docker
    $a = Read-Host "Xóa TOÀN BỘ dữ liệu? (y/N)"
    if ($a -eq "y") { docker compose down -v; Ok "Đã xóa dữ liệu" } else { "Đã hủy." }
  }
  "logs" { Need-Docker; docker compose logs -f --tail=100 }
  default { Fail "Lệnh không hợp lệ: $Command (up | down | reset | logs)" }
}
