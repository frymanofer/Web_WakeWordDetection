// generate-cert.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const KEY_FILE = 'key.pem';
const CERT_FILE = 'cert.pem';
const CSR_FILE = 'csr.pem';
const OPENSSL_CONFIG_PATH = path.join(__dirname, 'openssl.cnf');

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

let configArg = '';
const isWindows = os.platform() === 'win32';

if (fileExists(KEY_FILE) && fileExists(CERT_FILE)) {
  console.log('[✔] key.pem and cert.pem already exist — skipping generation.');
  process.exit(0);
}

// Generate minimal openssl.cnf on Windows
if (isWindows && !fileExists(OPENSSL_CONFIG_PATH)) {
  const config = `
[ req ]
default_bits       = 2048
default_md         = sha256
distinguished_name = req_distinguished_name
prompt             = no

[ req_distinguished_name ]
C  = US
ST = State
L  = City
O  = Organization
OU = Unit
CN = localhost
`;
  fs.writeFileSync(OPENSSL_CONFIG_PATH, config);
  console.log('[📝] Created minimal OpenSSL config for Windows.');
}

// Assign config argument only on Windows
if (isWindows) {
  configArg = `-config "${OPENSSL_CONFIG_PATH}"`;
}

console.log('[🔐] Generating key.pem...');
// genrsa emits a harmless config warning on Windows — safe to ignore
execSync(`openssl genrsa -out ${KEY_FILE} 2048`, { stdio: 'inherit' });

console.log('[📋] Creating CSR (certificate signing request)...');
execSync(`openssl req -new -key ${KEY_FILE} -out ${CSR_FILE} ${configArg}`, { stdio: 'inherit' });

console.log('[📄] Signing certificate...');
execSync(`openssl x509 -req -days 365 -in ${CSR_FILE} -signkey ${KEY_FILE} -out ${CERT_FILE}`, { stdio: 'inherit' });

try {
  fs.unlinkSync(CSR_FILE);
  console.log('[🧹] Cleaned up csr.pem');
} catch (e) {
  console.warn('[⚠️] Could not remove csr.pem:', e.message);
}

console.log('[✅] Self-signed certificate created: key.pem + cert.pem');
