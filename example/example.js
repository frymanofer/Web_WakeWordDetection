// example/example.js
import { KeywordDetector } from 'web-wake-word';
//import path from 'path-browserify';

document.addEventListener('DOMContentLoaded', async () => {
 //const licenseManager = new window.main.LicenseManager();
  // Read the license key from the file
//  const licenseKey = process.env.LICENSE_KEY || "DEFAULT_LICENSE_KEY";
  const licenseKey = "MTc0NDY2NDQwMDAwMA==-m4g05tL50nMcnOp4mu6NghsgkfXk1ZNVTPo26+2/Z0E=";
  console.log('License Key:', licenseKey);
  // Initialize Keyword Detector
  const threshold = 0.99;
  const bufferCount = 3;

  const statusElement = document.getElementById('status');

  const onKeywordDetected = (detected) => {
      if (detected) {
        keywordDetector.stopListening();

        console.log('Keyword detected \nprediction: ' + detected.prediction);
        console.log('cntBuf: ' + detected.cntBuf);
        console.log('Model: ' + detected.model);
        alert("Keyword detected: " + detected.model);
        keywordDetector.startListening();
      }
    };
    const modelsFolderPath = "./models"
    /* Alternative for a single model 
    const modelToUse = "need_help_now.onnx";

    const keywordDetector = new KeywordDetector(
      modelsFolderPath,
      modelToUse,
      threshold,
      bufferCount,
      onKeywordDetected,
      "./dist/"
    );

    */

     /* For multi model / and single model */
     
    const modelParamsArr = [
      { modelToUse: "hey_lookdeep.onnx", threshold: threshold, bufferCount: bufferCount, onKeywordDetected: onKeywordDetected },
//      { modelToUse: "need_help_now.onnx", threshold: threshold, bufferCount: bufferCount, onKeywordDetected: onKeywordDetected },
// Add more models      { modelToUse: "salut_mia_model_28_20012025.onnx", threshold: threshold, bufferCount: bufferCount, onKeywordDetected: onKeywordDetected },
    ];
    statusElement.textContent = 'Loading models: ' + 
    modelParamsArr.map(m => m.modelToUse.replace(/\.onnx$/, '').replace(/_/g, ' ')).join(', ');
    
    const keywordDetector = new KeywordDetector(modelsFolderPath, modelParamsArr, "./dist/", "./dist/");
    
    const isLicensed = await keywordDetector.setLicense(licenseKey);
    if (!isLicensed) {
      alert('Invalid or expired license key.');
      return;
    }
   
  try {
    await keywordDetector.init();
    statusElement.textContent = 'Models loaded. Listening for keywords...' + 
    modelParamsArr.map(m => m.modelToUse.replace(/\.onnx$/, '').replace(/_/g, ' ')).join(', ');
    
    // Start listening for keywords
    keywordDetector.startListening();
  } catch (error) {
    console.error('Initialization error:', error);
    statusElement.textContent = 'Error initializing keyword detector.';
  }
});
