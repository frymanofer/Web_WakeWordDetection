// generate-cert.js
const fs = require('fs');
const { execSync } = require('child_process');

const KEY_FILE = 'key.pem';
const CERT_FILE = 'cert.pem';
const CSR_FILE = 'csr.pem';

function fileExists(path) {
  try {
    return fs.existsSync(path);
  } catch (e) {
    return false;
  }
}

if (fileExists(KEY_FILE) && fileExists(CERT_FILE)) {
  console.log('[✔] key.pem and cert.pem already exist — skipping generation.');
  process.exit(0);
}

console.log('[🔐] Generating key.pem...');
execSync(`openssl genrsa -out ${KEY_FILE} 2048`, { stdio: 'inherit' });

console.log('[📋] Creating CSR (certificate signing request)...');
execSync(`openssl req -new -key ${KEY_FILE} -out ${CSR_FILE}`, { stdio: 'inherit' });

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

