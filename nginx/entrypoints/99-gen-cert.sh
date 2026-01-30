#!/bin/sh
set -e

CERT_DIR="/etc/nginx/ssl"

if [ -z "${HOST:-}" ]; then
    echo "Error: HOST environment variable must be set (IP address mode is required)."
    exit 1
fi

is_ipv4() {
    echo "$1" | grep -Eq '^[0-9]{1,3}(\.[0-9]{1,3}){3}$'
}

is_private_ipv4() {
    # 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    echo "$1" | grep -Eq '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)'
}

detect_private_ip() {
    # Backward-compatible helper kept for callers; HOST is the source of truth now.
    if is_ipv4 "$HOST" && is_private_ipv4 "$HOST"; then
        echo "$HOST"
        return 0
    fi

    if is_ipv4 "$HOST"; then
        echo "$HOST"
        return 0
    fi

    return 1
}

# 証明書が既に存在する場合はスキップ
if [ -f "$CERT_DIR/server.crt" ] && [ -f "$CERT_DIR/server.key" ]; then
    echo "Certificates already exist, skipping generation."
    exit 0
fi

echo "Generating self-signed certificates for HOST=$HOST"

HOST_IP=""
if HOST_IP="$(detect_private_ip)"; then
    echo "Using IP for certificate SAN: $HOST_IP"
else
    echo "Error: HOST must be an IPv4 address (e.g., 192.168.x.y)."
    exit 1
fi

# 証明書ディレクトリを作成
mkdir -p "$CERT_DIR"

# CN は基本 IP を優先しつつ、ドメイン(=IPではないWEBAPP_HOST)があるならそれを優先
CN_VALUE="$HOST_IP"
if [ -n "${WEBAPP_HOST:-}" ] && [ "${WEBAPP_HOST:-}" != "_" ] && ! is_ipv4 "$WEBAPP_HOST"; then
    CN_VALUE="$WEBAPP_HOST"
fi

# SAN (Subject Alternative Name) 設定ファイルを作成
cat > /tmp/openssl.cnf << EOF
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = JP
ST = Tokyo
L = Tokyo
O = Development
OU = Development
CN = $CN_VALUE

[v3_req]
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
EOF

dns_i=1
ip_i=1

# Always usable local names
echo "DNS.$dns_i = localhost" >> /tmp/openssl.cnf
dns_i=$((dns_i + 1))
echo "DNS.$dns_i = host.docker.internal" >> /tmp/openssl.cnf
dns_i=$((dns_i + 1))

echo "IP.$ip_i = 127.0.0.1" >> /tmp/openssl.cnf
ip_i=$((ip_i + 1))

add_san_host() {
    host_value="$1"
    if [ -z "$host_value" ] || [ "$host_value" = "_" ]; then
        return 0
    fi

    if is_ipv4 "$host_value"; then
        echo "IP.$ip_i = $host_value" >> /tmp/openssl.cnf
        ip_i=$((ip_i + 1))
        return 0
    fi

    echo "DNS.$dns_i = $host_value" >> /tmp/openssl.cnf
    dns_i=$((dns_i + 1))
}

# Always include HOST IP for IPアドレスモード
add_san_host "$HOST_IP"

# Optionally include domains (ドメインモード)
add_san_host "${WEBAPP_HOST:-}"
add_san_host "${STORAGE_HOST:-}"
add_san_host "${KIBANA_HOST:-}"

# 秘密鍵と自己署名証明書を生成
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERT_DIR/server.key" \
    -out "$CERT_DIR/server.crt" \
    -config /tmp/openssl.cnf

# 権限を設定
chmod 644 "$CERT_DIR/server.crt"
chmod 600 "$CERT_DIR/server.key"

echo "Self-signed certificates generated successfully!"
echo "  Certificate: $CERT_DIR/server.crt"
echo "  Private Key: $CERT_DIR/server.key"
