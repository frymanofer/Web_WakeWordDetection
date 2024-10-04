// example/example.js
import { LicenseManager, KeywordDetector } from 'keyword-detection-web';

document.addEventListener('DOMContentLoaded', async () => {
  // Optional: Validate license
  const licenseManager = new LicenseManager();
 //const licenseManager = new window.main.LicenseManager();
  const licenseKey = 'MTcyODkzOTYwMDAwMA==-Gy0+y3OCG32COKypi/mpT1AYrTlYAz/IvNt1WZ+gVsI=';
  const isLicensed = await licenseManager.isLicenseValid(licenseKey);

  if (!isLicensed) {
    alert('Invalid or expired license key.');
    return;
  }

  // Initialize Keyword Detector
  const threshold = 0.9999;
  const bufferCount = 2;

  const statusElement = document.getElementById('status');

  const onKeywordDetected = (detected) => {
      if (detected) {
        keywordDetector.stopListening();
        console.log('Keyword detected!');
        alert("Keyword detected!");
        keywordDetector.startListening();
      }
    };
    const modelsFolderPath = "./models"
    const modelToUse = "need_help_now.onnx";
    statusElement.textContent = 'Loading models...' + modelToUse.replace(/\.onnx$/, '').replace(/_/g, ' ');

    const keywordDetector = new KeywordDetector(
      modelsFolderPath,
      modelToUse,
      threshold,
      bufferCount,
      onKeywordDetected
    );
  
  try {
    await keywordDetector.init();
    statusElement.textContent = 'Models loaded. Listening for keywords...' + modelToUse.replace(/\.onnx$/, '').replace(/_/g, ' ');

    // Start listening for keywords
    keywordDetector.startListening();
  } catch (error) {
    console.error('Initialization error:', error);
    statusElement.textContent = 'Error initializing keyword detector.';
  }
});
