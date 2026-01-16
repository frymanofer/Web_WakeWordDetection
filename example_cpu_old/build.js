// build.js
const fs = require('fs');
const { execSync } = require('child_process');

const license = fs.readFileSync('licensekey.txt', 'utf8').trim();
const env = Object.create(process.env);
env.LICENSE_KEY = license;

execSync('npx webpack --config webpack.config.js', {
  stdio: 'inherit',
  env: env, // ✅ propagate LICENSE_KEY
});
