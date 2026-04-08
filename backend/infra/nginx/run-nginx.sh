#!/bin/sh
set -eu

TLS_ENABLED="${NGINX_TLS_ENABLED:-false}"
SERVER_NAME="${NGINX_SERVER_NAME:-_}"
SSL_CERT_PATH="${NGINX_SSL_CERT_PATH:-/etc/nginx/certs/tls.crt}"
SSL_KEY_PATH="${NGINX_SSL_KEY_PATH:-/etc/nginx/certs/tls.key}"

cat >/etc/nginx/nginx.conf <<EOF
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    client_max_body_size 20m;

    upstream fastapi_app {
        server app:8000;
    }

    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
EOF

if [ "$TLS_ENABLED" = "true" ]; then
cat >>/etc/nginx/nginx.conf <<EOF

    server {
        listen 80;
        server_name $SERVER_NAME;
        return 301 https://\$host\$request_uri;
    }

    server {
        listen 443 ssl;
        http2 on;
        server_name $SERVER_NAME;

        ssl_certificate $SSL_CERT_PATH;
        ssl_certificate_key $SSL_KEY_PATH;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;

        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
        add_header Content-Security-Policy "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" always;

        location / {
            proxy_pass http://fastapi_app;
            proxy_http_version 1.1;

            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$remote_addr;
            proxy_set_header Forwarded "";
            proxy_set_header X-Forwarded-Proto https;
            proxy_set_header X-Request-ID \$request_id;

            proxy_connect_timeout 30s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
    }
EOF
else
cat >>/etc/nginx/nginx.conf <<EOF

    server {
        listen 80;
        server_name $SERVER_NAME;

        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
        add_header Content-Security-Policy "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" always;

        location / {
            proxy_pass http://fastapi_app;
            proxy_http_version 1.1;

            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$remote_addr;
            proxy_set_header Forwarded "";
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_set_header X-Request-ID \$request_id;

            proxy_connect_timeout 30s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
    }
EOF
fi

cat >>/etc/nginx/nginx.conf <<EOF
}
EOF

exec nginx -g 'daemon off;'
