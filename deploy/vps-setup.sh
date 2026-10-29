#!/usr/bin/env bash
# Cài đặt hệ thống NMH lên VPS Ubuntu (22.04/24.04): Node.js 22 + PostgreSQL + Nginx + HTTPS (Let's Encrypt).
# Chạy bằng root trên VPS:
#   curl -fsSL https://raw.githubusercontent.com/thanhnam-cmd/VLXD_NHM/main/deploy/vps-setup.sh -o vps-setup.sh
#   DOMAIN=thanhnganhm.vnc360.com EMAIL=ban@example.com bash vps-setup.sh
# Tùy chọn:
#   DUMP_FILE=/root/vlxd.dump  – khôi phục dữ liệu cũ (bản sao lưu từ Render, định dạng pg_dump -Fc hoặc .sql)
#   Không có DUMP_FILE: tạo CSDL mới từ database/nmh_postgres_full.sql (dữ liệu mẫu).
# Chạy lại script để cập nhật bản mới nhất từ GitHub (không đụng vào dữ liệu).
set -euo pipefail

DOMAIN="${DOMAIN:?Thiếu DOMAIN, ví dụ DOMAIN=thanhnganhm.vnc360.com}"
EMAIL="${EMAIL:-}"
REPO_URL="${REPO_URL:-https://github.com/thanhnam-cmd/VLXD_NHM.git}"
BRANCH="${BRANCH:-main}"
APP_DIR=/opt/nmh
APP_USER=nmh
DB_NAME=vlxd
DB_USER=vlxd_app
PORT=3000

log() { echo -e "\n==> $*"; }

log "Cài gói hệ thống"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

log "Tạo người dùng chạy ứng dụng"
id -u "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin "$APP_USER"

log "Lấy mã nguồn ($BRANCH)"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

log "Cơ sở dữ liệu PostgreSQL"
systemctl enable --now postgresql
NEW_DB=0
if [ ! -f "$APP_DIR/.env" ]; then
  DB_PASS="$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32)"
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "DO \$\$BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='$DB_USER') THEN CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS'; ELSE ALTER ROLE $DB_USER PASSWORD '$DB_PASS'; END IF; END\$\$;"
  if ! sudo -u postgres psql -lqt | cut -d'|' -f1 | grep -qw "$DB_NAME"; then
    sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
    NEW_DB=1
  fi
  cat > "$APP_DIR/.env" <<EOF
NODE_ENV=production
PORT=$PORT
DATABASE_URL=postgres://$DB_USER:$DB_PASS@127.0.0.1:5432/$DB_NAME?sslmode=disable
EOF
  chmod 600 "$APP_DIR/.env"
  chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
fi
DB_URL_LOCAL="$(grep '^DATABASE_URL=' "$APP_DIR/.env" | cut -d= -f2- | sed 's/?sslmode=disable//')"

if [ "$NEW_DB" = 1 ]; then
  if [ -n "${DUMP_FILE:-}" ]; then
    log "Khôi phục dữ liệu từ $DUMP_FILE"
    if head -c 5 "$DUMP_FILE" | grep -q PGDMP; then
      pg_restore --no-owner --no-acl -d "$DB_URL_LOCAL" "$DUMP_FILE"
    else
      psql -v ON_ERROR_STOP=1 "$DB_URL_LOCAL" -f "$DUMP_FILE"
    fi
  else
    log "Tạo CSDL mới từ database/nmh_postgres_full.sql (dữ liệu mẫu)"
    psql -v ON_ERROR_STOP=1 "$DB_URL_LOCAL" -f "$APP_DIR/database/nmh_postgres_full.sql"
  fi
fi

log "Cài thư viện và build"
cd "$APP_DIR"
sudo -u "$APP_USER" npm ci --no-audit --no-fund
sudo -u "$APP_USER" npm run build

log "Dịch vụ systemd"
cat > /etc/systemd/system/nmh.service <<EOF
[Unit]
Description=NMH - Quan ly du an va phan cong thi cong
After=network.target postgresql.service

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
ExecStart=$APP_DIR/node_modules/.bin/tsx server.ts
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable nmh
systemctl restart nmh

log "Nginx cho $DOMAIN"
cat > /etc/nginx/sites-available/nmh <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    client_max_body_size 50m;
    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }
}
EOF
ln -sf /etc/nginx/sites-available/nmh /etc/nginx/sites-enabled/nmh
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

log "Tường lửa: chỉ mở SSH, HTTP, HTTPS"
ufw allow OpenSSH >/dev/null; ufw allow 'Nginx Full' >/dev/null; ufw --force enable >/dev/null

log "HTTPS (Let's Encrypt)"
SERVER_IP="$(curl -fsS https://api.ipify.org || true)"
DNS_IP="$(getent ahostsv4 "$DOMAIN" | awk 'NR==1{print $1}' || true)"
if [ -n "$SERVER_IP" ] && [ "$SERVER_IP" = "$DNS_IP" ]; then
  if [ -n "$EMAIL" ]; then MAIL_ARGS=(-m "$EMAIL"); else MAIL_ARGS=(--register-unsafely-without-email); fi
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --redirect "${MAIL_ARGS[@]}"
else
  echo "!! Tên miền $DOMAIN đang trỏ về '$DNS_IP', còn VPS này là '$SERVER_IP'."
  echo "!! Sửa bản ghi A cho đúng IP VPS rồi chạy lại script để cấp HTTPS."
fi

log "Kiểm tra"
sleep 3
curl -fsS "http://127.0.0.1:$PORT/api/database/status" | head -c 300; echo
echo "Xong. Xem log: journalctl -u nmh -f"
