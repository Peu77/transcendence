#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CA_KEY="$SCRIPT_DIR/ca.key"
CA_CRT="$SCRIPT_DIR/ca.crt"
SERVER_KEY="$SCRIPT_DIR/server.key"
SERVER_CRT="$SCRIPT_DIR/server.crt"
POSTGRES_KEY="$SCRIPT_DIR/postgres-server.key"

# Skip generation if certs exist and aren't expired
if [ -f "$CA_CRT" ] && [ -f "$SERVER_CRT" ] && [ -f "$SERVER_KEY" ]; then
  if openssl x509 -checkend 86400 -noout -in "$SERVER_CRT" 2>/dev/null; then
    echo "Certs exist and are valid. Skipping generation."
    exit 0
  fi
  echo "Certs exist but are expired or expiring soon. Regenerating..."
fi

echo "Generating self-signed CA and server certificate..."

# Generate CA key and certificate
openssl genrsa -out "$CA_KEY" 2048
openssl req -new -x509 -key "$CA_KEY" -out "$CA_CRT" -days 365 \
  -subj "/C=DE/ST=Berlin/L=Berlin/O=Transcendence/CN=TranscendenceCA"

# Generate server key and CSR
openssl genrsa -out "$SERVER_KEY" 2048
openssl req -new -key "$SERVER_KEY" \
  -subj "/C=DE/ST=Berlin/L=Berlin/O=Transcendence/CN=localhost" \
  -out "$SCRIPT_DIR/server.csr"

# Create SAN extension config
cat > "$SCRIPT_DIR/san.cnf" <<EOF
[v3_req]
subjectAltName = @alt_names
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth

[alt_names]
DNS.1 = localhost
DNS.2 = backend
DNS.3 = frontend
DNS.4 = postgres
DNS.5 = prometheus
DNS.6 = grafana
DNS.7 = nginx
IP.1 = 127.0.0.1
EOF

# Sign server cert with CA
openssl x509 -req -in "$SCRIPT_DIR/server.csr" \
  -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial \
  -out "$SERVER_CRT" -days 365 \
  -extfile "$SCRIPT_DIR/san.cnf" -extensions v3_req

# Create postgres-specific copy with restricted permissions
cp "$SERVER_KEY" "$POSTGRES_KEY"
chmod 600 "$POSTGRES_KEY"

# Clean up temp files
rm -f "$SCRIPT_DIR/server.csr" "$SCRIPT_DIR/san.cnf" "$SCRIPT_DIR/ca.srl"

echo "Certificates generated successfully in $SCRIPT_DIR/"
