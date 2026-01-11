#!/bin/sh
set -e

CERT_DIR="/etc/nginx/ssl"

if [ -z "$WEBAPP_HOST" ] || [ -z "$STORAGE_HOST" ]; then
    echo "Error: WEBAPP_HOST and STORAGE_HOST environment variables must be set."
    exit 1
fi

# 証明書が既に存在する場合はスキップ
if [ -f "$CERT_DIR/server.crt" ] && [ -f "$CERT_DIR/server.key" ]; then
    echo "Certificates already exist, skipping generation."
    exit 0
fi

echo "Generating self-signed certificates for: $WEBAPP_HOST, $STORAGE_HOST"

# 証明書ディレクトリを作成
mkdir -p "$CERT_DIR"

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
CN = $WEBAPP_HOST

[v3_req]
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = $WEBAPP_HOST
DNS.2 = $STORAGE_HOST
DNS.3 = localhost
IP.1 = 127.0.0.1
EOF

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
