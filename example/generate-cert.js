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

// Skip generation if already exists
if (fileExists(KEY_FILE) && fileExists(CERT_FILE)) {
  console.log('[✔] key.pem and cert.pem already exist — skipping generation.');
  process.exit(0);
}

// Windows-specific: generate minimal openssl.cnf if missing
let configArg = '';
if (os.platform() === 'win32') {
  console.log('** Using WINDOWS config **');
  if (!fileExists(OPENSSL_CONFIG_PATH)) {
    const minimalConfig = `
[ req ]
distinguished_name = req_distinguished_name
[ req_distinguished_name ]
`;
    fs.writeFileSync(OPENSSL_CONFIG_PATH, minimalConfig);
    console.log('[📝] Created minimal OpenSSL config for Windows.');
  }
  configArg = `-config "${OPENSSL_CONFIG_PATH}"`;
}

console.log('[🔐] Generating key.pem...');
execSync(`openssl genrsa -out ${KEY_FILE} 2048`, { stdio: 'inherit' });

console.log('[📋] Creating CSR (certificate signing request)...');
execSync(`openssl req -new -key ${KEY_FILE} -out ${CSR_FILE} ${configArg}`, { stdio: 'inherit' });

console.log('[📄] Signing certificate...');
execSync(`openssl x509 -req -days 365 -in ${CSR_FILE} -signkey ${KEY_FILE} -out ${CERT_FILE}`, { stdio: 'inherit' });

// Optional: clean up CSR
try {
  fs.unlinkSync(CSR_FILE);
  console.log('[🧹] Cleaned up csr.pem');
} catch (e) {
  console.warn('[⚠️] Could not remove csr.pem:', e.message);
}

console.log('[✅] Self-signed certificate created: key.pem + cert.pem');
