// example/example.js
import { KeywordDetector } from 'web-wake-word-cpu-gpu-opt';
//import path from 'path-browserify';

const modelsSuffix = '.onnx';

/*
  *** IMPORTANT ***
  YOU MUST COPY THE FOLLOWNG 3 FILES/FOLDERS to your app dist, public or any suitable folder.
  Copy the models/ folder to your dist, public or other folder inside your app.
  Copy ort-wasm-simd-threaded.jsep.jsep.wasm file from node_modules/web-wake-word-cpu-gpu-opt/dist/ort-wasm-simd-threaded.jsep.jsep.wasm to your dist, public or other folder inside your app.
  Copy node_modules/web-wake-word-cpu-gpu-opt/dist/audio-worklet-processor.js to your dist, public or other folder inside your app.
*/

document.addEventListener('DOMContentLoaded', async () => {
 //const licenseManager = new window.main.LicenseManager();
  // Read the license key from the file
//  const licenseKey = process.env.LICENSE_KEY || "DEFAULT_LICENSE_KEY";
  const licenseKey = "MTc4ODIxMDAwMDAwMA==-cTpBN8sQsfgY2ZYWRIPOWlsFBEAKpoben68MpeQppwo=";
  console.log('License Key:', licenseKey);
  // Initialize Keyword Detector
  const threshold = 0.99;
  const bufferCount = 3;

  const statusElement = document.getElementById('status');
  function showAutoClosingAlert(message, duration = 5000) {
    const alertBox = document.createElement('div');
    alertBox.innerText = message;
    alertBox.style.position = 'fixed';
    alertBox.style.top = '20px';
    alertBox.style.left = '50%';
    alertBox.style.transform = 'translateX(-50%)';
    alertBox.style.backgroundColor = '#f44336'; // red
    alertBox.style.color = 'white';
    alertBox.style.padding = '16px 24px';
    alertBox.style.borderRadius = '6px';
    alertBox.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
    alertBox.style.zIndex = '10000';
    alertBox.style.fontSize = '16px';
    alertBox.style.fontFamily = 'sans-serif';
  
    document.body.appendChild(alertBox);
  
    setTimeout(() => {
      alertBox.remove();
    }, duration);
  }
  
  // ---- Speech-to-text (Web Speech API) UI elements ----
  const sttPanel = document.getElementById('sttPanel');
  const sttHeading = document.getElementById('sttHeading');
  const sttTranscriptEl = document.getElementById('sttTranscript');
  const sttStopButton = document.getElementById('sttStopButton');
  const sttLanguageSelect = document.getElementById('sttLanguage');
  const sttLanguageCustom = document.getElementById('sttLanguageCustom');
  const sttLanguageHint = document.getElementById('sttLanguageHint');
  const sttUnsupportedNote = document.getElementById('sttUnsupportedNote');
  const OTHER_LANGUAGE_VALUE = '__other__';

  // Tracks whether the browser supports the Web Speech API. Set once
  // keywordDetector.enableSpeechToText() has been called (see bindSpeechToText
  // below). When false, onKeywordDetected falls back to the original
  // behavior (manual stop/start listening cycle, no STT).
  let sttSupported = false;

  // Accumulates final transcripts across the whole STT session - the browser
  // ends a SpeechRecognition session after every utterance/pause on its own,
  // and the library auto-restarts transparently until Stop is pressed, so a
  // single session can produce several onResult calls.
  let sttSessionTranscript = '';

  function showSttPanel() {
    sttHeading.textContent = 'Listening for command… (press Stop when done)';
    sttSessionTranscript = '';
    sttTranscriptEl.textContent = '';
    sttPanel.style.display = 'block';
  }

  function hideSttPanel() {
    sttPanel.style.display = 'none';
  }

  // (Re)binds speech-to-text to the given language. Safe to call again (e.g.
  // when the user changes the language dropdown) - it just rebinds the
  // wrapper's internal SpeechToText instance.
  function bindSpeechToText(lang) {
    sttSupported = keywordDetector.enableSpeechToText({
      lang,
      onStart: () => {
        showSttPanel();
      },
      onInterimResult: (transcript) => {
        sttTranscriptEl.textContent = (sttSessionTranscript + ' ' + transcript).trim();
      },
      onResult: (transcript) => {
        sttSessionTranscript = (sttSessionTranscript + ' ' + transcript).trim();
        sttTranscriptEl.textContent = sttSessionTranscript;
        console.log('STT transcript so far:', sttSessionTranscript);
      },
      onError: (error) => {
        // Non-fatal errors (e.g. "no-speech" during a pause) get auto-retried
        // by the library and don't end the session - just log them. Fatal
        // ones are immediately followed by onEnd, which hides the panel.
        console.warn('STT error:', error);
      },
      onEnd: () => {
        hideSttPanel();
        statusElement.textContent = 'Listening for keywords...';
      },
    });

    sttLanguageSelect.disabled = !sttSupported;
    sttLanguageCustom.disabled = !sttSupported;
    sttUnsupportedNote.style.display = sttSupported ? 'none' : 'inline';
    return sttSupported;
  }

  sttStopButton.addEventListener('click', () => {
    // Stops only the current session - speech-to-text stays enabled for the
    // next wake-word detection, and onEnd (above) resumes wake-word listening.
    keywordDetector.stopSpeechToText();
  });

  // There is no browser API to enumerate which languages SpeechRecognition
  // actually supports (unlike speechSynthesis.getVoices() for TTS) - the
  // dropdown above is just a curated set of common ones. "Other..." reveals
  // a free-text BCP-47 input so any language can be tried; if the engine
  // doesn't support it, onError (in bindSpeechToText) surfaces that.
  sttLanguageSelect.addEventListener('change', () => {
    if (sttLanguageSelect.value === OTHER_LANGUAGE_VALUE) {
      sttLanguageCustom.style.display = 'inline-block';
      sttLanguageHint.style.display = 'block';
      sttLanguageCustom.focus();
      return;
    }
    sttLanguageCustom.style.display = 'none';
    sttLanguageHint.style.display = 'none';
    keywordDetector.stopSpeechToText();
    bindSpeechToText(sttLanguageSelect.value);
  });

  function applyCustomLanguage() {
    const lang = sttLanguageCustom.value.trim();
    if (!lang) return;
    keywordDetector.stopSpeechToText();
    bindSpeechToText(lang);
  }

  sttLanguageCustom.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyCustomLanguage();
    }
  });
  sttLanguageCustom.addEventListener('blur', applyCustomLanguage);

  // Usage
  const onKeywordDetected = async (detected) => {
      if (detected) {
        // When STT is supported, the library itself pauses wake-word
        // listening, runs speech-to-text (see bindSpeechToText above), and
        // resumes listening automatically once transcription ends - so skip
        // the manual stop/start cycle below in that case.
        if (!sttSupported) {
          await keywordDetector.stopListening();
        }

        console.log('Keyword detected \nprediction: ' + detected.prediction);
        console.log('cntBuf: ' + detected.cntBuf);
        console.log('Model: ' + detected.model);
//        alert("Keyword detected: " + detected.model);
        showAutoClosingAlert("Keyword detected: " + detected.model, 5000);

        if (!sttSupported) {
          await keywordDetector.startListening();
        }
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
      { modelToUse: "hey_lookdeep" + modelsSuffix, threshold: threshold, bufferCount: bufferCount, onKeywordDetected: onKeywordDetected },
//      { modelToUse: "need_help_now"  + modelsSuffix, threshold: threshold, bufferCount: bufferCount, onKeywordDetected: onKeywordDetected },
// Add more models      { modelToUse: "salut_mia_model_28_20012025"  + modelsSuffix, threshold: threshold, bufferCount: bufferCount, onKeywordDetected: onKeywordDetected },
    ];
    statusElement.textContent = 'Loading models: ' + 
    modelParamsArr.map(m => m.modelToUse.replace(/\.onnx$/, '').replace(/_/g, ' ')).join(', ');

    /* 
      *** IMPORTANT ***
      Calling KeywordDetector constructor API in your app!
      
      The constructor API is as follow:     
      KeywordDetector(modelsFolderPath, modelParams, wasmBasePath, 
        audioWorkletPath);

      modelsFolderPath - path to the models directory.
      modelParams - the models to use and their configuration
      wasmBasePath - the location of wasm file
      audioWorkletPath - the location of audioWorklet

      As mentioned above! - You will need to copy ort-wasm-simd-threaded.jsep.jsep.wasm to your dist or somewhere in your project and add its location to the KeywordDetector initialization.
      The file is found in the dist folder: "node_modules/web-wake-word-cpu-gpu-opt/dist/ort-wasm-simd-threaded.jsep.jsep.wasm" in the example below we place it in 
      https://127.0.0.1:8080/dist/
      Also where the audioWorklet is placed which is the last argument. The file is found in "node_modules/web-wake-word-cpu-gpu-opt/dist/audio-worklet-processor.js"
      You will also need to copy it and determine its location
    */
    const keywordDetector = new KeywordDetector(
      /* Provide a link to the model location in your app */ 
      modelsFolderPath,
      modelParamsArr, 
      /* Provide a link to the wasm file location in your app */
      "https://127.0.0.1:8080/dist/",
      /* Provide a link to the audio-worklet-processor.js file location in your app */
      "./dist/");

    // STT hidden for now - wake word detection only. sttSupported stays false,
    // so onKeywordDetected's existing !sttSupported fallback (manual
    // stopListening/startListening cycle) runs, same as before STT existed.
    // To re-enable: uncomment the line below and the STT UI in index.html.
    // bindSpeechToText(sttLanguageSelect.value);

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
