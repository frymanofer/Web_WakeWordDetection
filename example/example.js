// example/example.js
//import path from 'path-browserify';

const modelsSuffix = '.onnx';
let daVoicePackagePromise;

function loadDaVoicePackage() {
  daVoicePackagePromise ??= import('web-wake-word-cpu-gpu-opt');
  return daVoicePackagePromise;
}

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
  const licenseKey = "MTc5NjA3NjAwMDAwMA==-FmI0i6C8wjKqQwmvi/PAmUy9ayviOGvWhGLFGHZrg9I=";
  console.log('License Key:', licenseKey);
  // Initialize Keyword Detector
  const threshold = 0.99;
  const bufferCount = 3;

  const statusElement = document.getElementById('status');
  const modeChooser = document.getElementById('modeChooser');
  const wakeWordPanel = document.getElementById('wakeWordPanel');
  const ttsPanel = document.getElementById('ttsPanel');
  const wakeWordBackButton = document.getElementById('wakeWordBackButton');
  const ttsBackButton = document.getElementById('ttsBackButton');
  const modeButtons = Array.from(document.querySelectorAll('[data-mode]'));
  let keywordDetector = null;
  let activeMode = null;
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

  // ---- Text-to-speech (multi-speakers DaVoice TTS2 model) ----
  // The multi-speakers bundle contains multiple voices. Load it once, select Rich as
  // the default voice (matching the React Native example), and switch voices
  // with setVoice() instead of loading one .dm file per voice.
  const TTS_MODEL_URL = './models/tts/model_ex2_rich_kate.dm';
  const DEFAULT_TTS_VOICE = 'Rich';
  const TTS_WASM_BASE_PATH = 'https://127.0.0.1:8080/dist/';

  const ttsLoadButton = document.getElementById('ttsLoadButton');
  const ttsProgressRow = document.getElementById('ttsProgressRow');
  const ttsProgressBar = document.getElementById('ttsProgressBar');
  const ttsProgressLabel = document.getElementById('ttsProgressLabel');
  const ttsModelHeading = document.getElementById('ttsModelHeading');
  const ttsModelGate = document.getElementById('ttsModelGate');
  const ttsUseModelSection = document.getElementById('ttsUseModelSection');
  const ttsCloneVoiceGroup = document.getElementById('ttsCloneVoiceGroup');
  const ttsCloneVoiceRow = document.getElementById('ttsCloneVoiceRow');
  const ttsHdVoiceGroup = document.getElementById('ttsHdVoiceGroup');
  const ttsHdVoiceRow = document.getElementById('ttsHdVoiceRow');
  const ttsLdVoiceGroup = document.getElementById('ttsLdVoiceGroup');
  const ttsLdVoiceRow = document.getElementById('ttsLdVoiceRow');
  const ttsRichVoiceGroup = document.getElementById('ttsRichVoiceGroup');
  const ttsRichVoiceRow = document.getElementById('ttsRichVoiceRow');
  const ttsTextEl = document.getElementById('ttsText');
  const ttsSpeakButton = document.getElementById('ttsSpeakButton');
  const ttsStopButton = document.getElementById('ttsStopButton');
  const ttsStatusEl = document.getElementById('ttsStatus');
  const voiceCloneNameEl = document.getElementById('voiceCloneName');
  const voiceCloneRecordButton = document.getElementById('voiceCloneRecordButton');
  const voiceCloneStopButton = document.getElementById('voiceCloneStopButton');
  const voiceCloneFileEl = document.getElementById('voiceCloneFile');
  const voiceCloneCreateButton = document.getElementById('voiceCloneCreateButton');
  const voiceCloneStatusEl = document.getElementById('voiceCloneStatus');

  let ttsInstance = null;
  let activeTtsVoice = null;
  let voiceCloneRecorder = null;
  let voiceCloneStream = null;
  let voiceCloneChunks = [];
  let voiceCloneAudio = null;
  const temporaryVoiceClones = new Map();
  const temporaryVoiceCloneFiles = new Set();
  const TTS_EMBEDDER_URL = './models/tts/embedder_en.dm';
  const STUDIO_VOICE_ORDER = ['Rich', 'Ariana', 'Hanna'];
  const LIGHTWEIGHT_VOICE_ORDER = ['Matthew', 'Kate', 'Jenny', 'Gloria'];

  function formatBytes(n) {
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function updateVoiceCloneCreateButton() {
    voiceCloneCreateButton.disabled = !ttsInstance ||
      !voiceCloneNameEl.value.trim() || !voiceCloneAudio || !!voiceCloneRecorder;
  }

  function encodeWav(audioBuffer) {
    const channelCount = Math.min(1, audioBuffer.numberOfChannels);
    const samples = audioBuffer.getChannelData(0);
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeString = (offset, value) => {
      for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channelCount, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }
    return new Blob([buffer], { type: 'audio/wav' });
  }

  async function convertRecordingToWav(blob) {
    const audioContext = new AudioContext();
    try {
      const audioBuffer = await audioContext.decodeAudioData(await blob.arrayBuffer());
      return encodeWav(audioBuffer);
    } finally {
      await audioContext.close();
    }
  }

  async function startVoiceCloneRecording() {
    if (!ttsInstance || voiceCloneRecorder) return;
    try {
      voiceCloneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm']
        .find((type) => MediaRecorder.isTypeSupported(type));
      voiceCloneRecorder = new MediaRecorder(voiceCloneStream, mimeType ? { mimeType } : undefined);
      voiceCloneChunks = [];
      voiceCloneRecorder.ondataavailable = (event) => {
        if (event.data.size) voiceCloneChunks.push(event.data);
      };
      voiceCloneRecorder.onstop = async () => {
        const recording = new Blob(voiceCloneChunks, { type: voiceCloneRecorder.mimeType || 'audio/webm' });
        voiceCloneStream?.getTracks().forEach((track) => track.stop());
        voiceCloneStream = null;
        voiceCloneRecorder = null;
        voiceCloneStopButton.disabled = true;
        voiceCloneRecordButton.disabled = false;
        voiceCloneStatusEl.textContent = 'Preparing your recording...';
        try {
          voiceCloneAudio = await convertRecordingToWav(recording);
          voiceCloneStatusEl.textContent = 'Recording ready. Choose a name and create the temporary clone.';
        } catch (error) {
          voiceCloneAudio = null;
          voiceCloneStatusEl.textContent = `Could not read the recording: ${error.message || error}`;
        }
        updateVoiceCloneCreateButton();
      };
      voiceCloneRecorder.start();
      voiceCloneRecordButton.disabled = true;
      voiceCloneStopButton.disabled = false;
      voiceCloneStatusEl.textContent = 'Recording... speak naturally for about 10 seconds.';
      updateVoiceCloneCreateButton();
    } catch (error) {
      voiceCloneStatusEl.textContent = `Microphone access failed: ${error.message || error}`;
    }
  }

  function stopVoiceCloneRecording() {
    if (voiceCloneRecorder && voiceCloneRecorder.state !== 'inactive') voiceCloneRecorder.stop();
  }

  async function createTemporaryVoiceClone() {
    if (!ttsInstance || !voiceCloneAudio) return;
    const name = voiceCloneNameEl.value.trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9 -]{0,29}$/.test(name)) {
      voiceCloneStatusEl.textContent = 'Use a voice name with letters, digits, spaces, or dashes.';
      return;
    }
    if (temporaryVoiceClones.has(name.toLowerCase())) {
      voiceCloneStatusEl.textContent = 'That temporary voice name already exists. Choose another name.';
      return;
    }
    voiceCloneCreateButton.disabled = true;
    voiceCloneStatusEl.textContent = 'Creating temporary voice clone...';
    try {
      const input = new File([voiceCloneAudio], `${name}.wav`, { type: 'audio/wav' });
      // The web package only exposes newly-created voices through its external
      // voices folder. Use OPFS as a short-lived staging area, import the
      // embedding into the active WASM engine. Files remain only for this page
      // session so the package can expose every clone in the selector.
      await ensureTemporaryVoiceCloneDirectory();
      await ttsInstance.setExternalVoicesPath('voices');
      await removeTemporaryVoiceCloneFile(name);
      const temporaryVoiceClone = await ttsInstance.createVoiceClone(
        input,
        `voices/${name}.emd`,
        TTS_EMBEDDER_URL,
      );
      await ttsInstance.setExternalVoicesPath('voices');
      const selected = await ttsInstance.setVoice(temporaryVoiceClone.voice);
      if (!selected) throw new Error('The temporary voice was created but could not be selected.');
      temporaryVoiceClones.set(temporaryVoiceClone.voice.toLowerCase(), temporaryVoiceClone);
      temporaryVoiceCloneFiles.add(temporaryVoiceClone.voice);
      const cloneRadio = addUseModelOption(temporaryVoiceClone.voice, ttsCloneVoiceRow);
      ttsCloneVoiceGroup.style.display = 'block';
      ttsUseModelSection.style.display = 'block';
      await selectTtsVoice(temporaryVoiceClone.voice, cloneRadio);
      ttsSpeakButton.disabled = false;
      voiceCloneStatusEl.textContent = `${temporaryVoiceClone.voice} is ready for this session only.`;
      ttsStatusEl.textContent = `${temporaryVoiceClone.voice} in use.`;
    } catch (error) {
      voiceCloneStatusEl.textContent = `Voice clone failed: ${error.message || error}`;
      updateVoiceCloneCreateButton();
    }
  }

  async function removeTemporaryVoiceCloneFile(name) {
    try {
      const opfsRoot = await navigator.storage.getDirectory();
      const voicesDirectory = await opfsRoot.getDirectoryHandle('voices', { create: false });
      await voicesDirectory.removeEntry(`${name}.emd`);
    } catch (error) {
      // Missing OPFS entries are fine; a cleanup failure is surfaced to the user.
      if (error?.name !== 'NotFoundError') throw error;
    }
  }

  async function ensureTemporaryVoiceCloneDirectory() {
    const opfsRoot = await navigator.storage.getDirectory();
    await opfsRoot.getDirectoryHandle('voices', { create: true });
  }

  async function cleanupTemporaryVoiceClones() {
    for (const voiceName of temporaryVoiceCloneFiles) {
      await removeTemporaryVoiceCloneFile(voiceName).catch(() => undefined);
    }
    temporaryVoiceCloneFiles.clear();
    temporaryVoiceClones.clear();
  }

  async function selectTtsVoice(voiceName, selectedRadio = null) {
    if (!ttsInstance) return;
    const selected = await ttsInstance.setVoice(voiceName);
    if (!selected) {
      ttsStatusEl.textContent = `Voice ${voiceName} is not available.`;
      return;
    }
    activeTtsVoice = voiceName;
    const matchingRadios = Array.from(ttsUseModelSection.querySelectorAll('input[type="radio"]'))
      .filter((radio) => radio.value === voiceName);
    matchingRadios.forEach((radio) => {
      radio.checked = false;
    });
    (selectedRadio || matchingRadios[0]).checked = true;
    ttsStatusEl.textContent = `${voiceName} in use.`;
    ttsSpeakButton.disabled = false;
  }

  function addUseModelOption(voiceName, row) {
    const label = document.createElement('label');
    label.style.cssText = 'display:flex; align-items:center; gap:4px; font-size:14px; cursor:pointer;';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'ttsUseModel';
    radio.value = voiceName;
    radio.addEventListener('change', () => { void selectTtsVoice(voiceName, radio); });
    label.appendChild(radio);
    label.appendChild(document.createTextNode(voiceName));
    row.appendChild(label);
    return radio;
  }

  async function loadTtsModel() {
    if (ttsInstance) return;

    ttsLoadButton.disabled = true;
    ttsProgressRow.style.display = 'block';
    ttsProgressBar.style.width = '0%';
    ttsProgressLabel.textContent = 'Downloading multi-speakers model...';
    ttsStatusEl.textContent = 'Loading multi-speakers model...';
    ttsModelHeading.textContent = 'Loading multi-speakers model...';
    ttsModelGate.textContent = 'Loading the multi-speakers model. The controls will unlock when it is ready.';

    try {
      const { TextToSpeech } = await loadDaVoicePackage();
      const tts = new TextToSpeech();
      await tts.init(TTS_MODEL_URL, {
        wasmBasePath: TTS_WASM_BASE_PATH,
        voice: DEFAULT_TTS_VOICE,
        onProgress: (loaded, total) => {
          const pct = total ? Math.min(100, Math.floor((loaded / total) * 100)) : 0;
          ttsProgressBar.style.width = pct + '%';
          ttsProgressLabel.textContent =
            `Downloading multi-speakers model: ${formatBytes(loaded)} / ${formatBytes(total)} (${pct}%)`;
        }
      });

      ttsInstance = tts;
      const voices = tts.getAllVoices();
      ttsHdVoiceRow.replaceChildren();
      ttsLdVoiceRow.replaceChildren();
      ttsRichVoiceRow.replaceChildren();

      const voiceByName = new Map(voices.map((voice) => [voice.toLowerCase(), voice]));
      const richVoice = voiceByName.get('rich');
      const studioVoices = STUDIO_VOICE_ORDER
        .map((voice) => voiceByName.get(voice.toLowerCase()))
        .filter(Boolean);
      const studioVoiceNames = new Set([
        ...(richVoice ? [richVoice] : []),
        ...studioVoices,
      ].map((voice) => voice.toLowerCase()));
      const lightweightVoices = voices
        .filter((voice) => !studioVoiceNames.has(voice.toLowerCase()))
        .sort((a, b) => {
          const aIndex = LIGHTWEIGHT_VOICE_ORDER.indexOf(a);
          const bIndex = LIGHTWEIGHT_VOICE_ORDER.indexOf(b);
          return (aIndex < 0 ? Number.MAX_SAFE_INTEGER : aIndex) -
            (bIndex < 0 ? Number.MAX_SAFE_INTEGER : bIndex);
        });

      studioVoices.forEach((voice) => addUseModelOption(voice, ttsHdVoiceRow));
      lightweightVoices.forEach((voice) => addUseModelOption(voice, ttsLdVoiceRow));
      if (richVoice) addUseModelOption(richVoice, ttsRichVoiceRow);
      ttsHdVoiceGroup.style.display = studioVoices.length ? 'block' : 'none';
      ttsLdVoiceGroup.style.display = lightweightVoices.length ? 'block' : 'none';
      ttsRichVoiceGroup.style.display = richVoice ? 'block' : 'none';
      ttsUseModelSection.style.display = voices.length ? 'block' : 'none';
      await selectTtsVoice(
        DEFAULT_TTS_VOICE,
        ttsRichVoiceRow.querySelector('input[type="radio"]') || null,
      );
      ttsProgressRow.style.display = 'none';
      ttsLoadButton.style.display = 'none';
      ttsModelHeading.textContent = 'Loaded multi-speakers model';
      ttsModelGate.style.display = 'none';
      ttsTextEl.disabled = false;
      document.querySelectorAll('.tts-style-example').forEach((button) => { button.disabled = false; });
      voiceCloneRecordButton.disabled = false;
      voiceCloneFileEl.disabled = false;
      voiceCloneStatusEl.textContent = 'Record a sample or choose an audio file to create a temporary clone.';
    } catch (error) {
      console.error('TTS init error:', error);
      ttsProgressRow.style.display = 'none';
      ttsStatusEl.textContent = `Failed to load multi-speakers model: ${error.message || error}`;
      showAutoClosingAlert(`Failed to load multi-speakers model: ${error.message || error}`, 6000);
      ttsModelGate.textContent = 'The model could not be loaded. Try loading it again.';
      ttsLoadButton.textContent = 'Retry loading multi-speakers model';
      ttsLoadButton.style.display = 'block';
      ttsLoadButton.disabled = false;
    }
  }

  ttsLoadButton.addEventListener('click', () => { void loadTtsModel(); });

  ttsSpeakButton.addEventListener('click', async () => {
    if (!ttsInstance || !activeTtsVoice) return;
    const text = ttsTextEl.value.trim();
    if (!text) return;

    ttsSpeakButton.disabled = true;
    ttsStopButton.disabled = false;
    ttsStatusEl.textContent = `${activeTtsVoice} speaking...`;
    try {
      await ttsInstance.speak(text);
      ttsStatusEl.textContent = `${activeTtsVoice} in use.`;
    } catch (error) {
      console.error('TTS speak error:', error);
      ttsStatusEl.textContent = `Speak error: ${error.message || error}`;
    } finally {
      ttsSpeakButton.disabled = false;
      ttsStopButton.disabled = true;
    }
  });

  ttsStopButton.addEventListener('click', () => {
    if (ttsInstance) {
      ttsInstance.stop();
    }
  });

  voiceCloneNameEl.addEventListener('input', updateVoiceCloneCreateButton);
  voiceCloneRecordButton.addEventListener('click', () => { void startVoiceCloneRecording(); });
  voiceCloneStopButton.addEventListener('click', stopVoiceCloneRecording);
  voiceCloneFileEl.addEventListener('change', () => {
    const file = voiceCloneFileEl.files?.[0] || null;
    voiceCloneAudio = file;
    voiceCloneStatusEl.textContent = file
      ? `${file.name} selected. Choose a name and create the temporary clone.`
      : 'Record a sample or choose an audio file to create a temporary clone.';
    updateVoiceCloneCreateButton();
  });
  voiceCloneCreateButton.addEventListener('click', () => { void createTemporaryVoiceClone(); });

  document.querySelectorAll('.tts-style-example').forEach((button) => {
    button.addEventListener('click', async () => {
      const example = button.dataset.example || '';
      ttsTextEl.value = example;
      ttsTextEl.focus();
      try {
        await navigator.clipboard.writeText(example);
        ttsStatusEl.textContent = 'Example copied and placed in the text box.';
      } catch (error) {
        // The text is still placed in the textarea if clipboard access is unavailable.
        ttsStatusEl.textContent = 'Example placed in the text box. Select it to copy.';
      }
    });
  });

  window.addEventListener('pagehide', () => {
    voiceCloneStream?.getTracks().forEach((track) => track.stop());
    voiceCloneStream = null;
    voiceCloneChunks = [];
    voiceCloneAudio = null;
    void cleanupTemporaryVoiceClones();
    ttsInstance?.stop();
    ttsInstance?.destroy();
  });

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

  async function initializeWakeWordMode() {
    if (keywordDetector) {
      await keywordDetector.startListening();
      return;
    }

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

    const { KeywordDetector } = await loadDaVoicePackage();
    keywordDetector = new KeywordDetector(
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
    keywordDetector = new KeywordDetector(
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
  }

  async function returnToModeChooser() {
    if (keywordDetector && activeMode === 'wakeword') {
      try {
        await keywordDetector.stopListening();
      } catch (error) {
        console.warn('Could not stop wake word detection:', error);
      }
    }
    if (ttsInstance) ttsInstance.stop();
    activeMode = null;
    modeChooser.style.display = 'block';
    wakeWordPanel.style.display = 'none';
    ttsPanel.style.display = 'none';
  }

  async function selectMode(mode) {
    activeMode = mode;
    modeChooser.style.display = 'none';
    wakeWordPanel.style.display = mode === 'wakeword' ? 'block' : 'none';
    ttsPanel.style.display = mode === 'tts' ? 'block' : 'none';
    if (mode === 'wakeword') {
      statusElement.textContent = 'Loading wake word models...';
      await initializeWakeWordMode();
    } else {
      if (ttsInstance) {
        ttsStatusEl.textContent = `${activeTtsVoice} in use.`;
      } else {
        ttsStatusEl.textContent = 'Preparing the multi-speakers model...';
        await loadTtsModel();
      }
    }
  }

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => { void selectMode(button.dataset.mode); });
  });
  wakeWordBackButton.addEventListener('click', () => { void returnToModeChooser(); });
  ttsBackButton.addEventListener('click', () => { void returnToModeChooser(); });
});
