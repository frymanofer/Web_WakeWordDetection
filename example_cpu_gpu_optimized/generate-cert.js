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

// Create working openssl.cnf for Windows
if (isWindows) {
  const config = `
[ req ]
prompt = no
default_bits = 2048
default_md = sha256
distinguished_name = req_distinguished_name

[ req_distinguished_name ]
C = US
ST = California
L = San Francisco
O = Example Company
OU = Dev
CN = localhost
`;
  fs.writeFileSync(OPENSSL_CONFIG_PATH, config);
  console.log('[📝] Created OpenSSL config file for Windows.');

  // Force OpenSSL to use it
  process.env.OPENSSL_CONF = OPENSSL_CONFIG_PATH;
  configArg = `-config "${OPENSSL_CONFIG_PATH}"`;
}

console.log('[🔐] Generating key.pem...');
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
