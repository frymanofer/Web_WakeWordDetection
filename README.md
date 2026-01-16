# Web Wake Word Detection / Keywords Detection by Davoice

[![GitHub release](https://img.shields.io/github/release/frymanofer/KeyWordDetectionIOSFramework.svg)](https://github.com/frymanofer/KeyWordDetectionIOSFramework/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


By [DaVoice.io](https://davoice.io) email: ofer@davoice.io

[![Twitter URL](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Ftwitter.com%2FDaVoiceAI)](https://twitter.com/DaVoiceAI)


Welcome to **Davoice Wake Words** – the premier Wake Words / keyword detection solution designed by **DaVoice.io**.

## New

Chaned the main example to support GPU and CPU optimization.

## About this project

This is a **"wake word"** package for React.js, Javascript, Angular, Vue.js, Svelte, Next.js, Nuxt.js, Gatsby, Ember.js, Backbone.js and Mithril.js. A wake word is a keyword that activates your device, like "Hey Siri" or "OK Google". "Wake Word" is also known as "keyword detection", "Phrase Recognition", "Phrase Spotting", “Voice triggered”, “hotword”, “trigger word”

It also provide **Speech to Intent**. **Speech to Intent** refers to the ability to recognize a spoken word or phrase
and directly associate it with a specific action or operation within an application. Unlike a **"wake word"**, which typically serves to activate or wake up the application,
Speech to Intent goes further by enabling complex interactions and functionalities based on the recognized intent behind the speech.

For example, a wake word like "Hey App" might activate the application, while Speech
to Intent could process a phrase like "Play my favorite song" or "Order a coffee" to
execute corresponding tasks within the app.
Speech to Intent is often triggered after a wake word activates the app, making it a key
component of more advanced voice-controlled applications. This layered approach allows for
seamless and intuitive voice-driven user experiences.

## Features

- **High Accuracy:** We have succesfully reached over 99% accurary for all our models. **Here is on of our customer's benchmarks**:

```
** Benmark used recordings with 1326 TP files.
** Second best was on of the industry top players who detected 1160 TP 
** Third  detected TP 831 out of 1326

MODEL         DETECTION RATE
===========================
DaVoice        0.992458
Top Player     0.874811
Third          0.626697
```

- **Platforms:** Web, JS, Angular, React etc'
- **Easy to deploy:** Check out our example to enabled your web app.
- **Low Latency:** Experience near-instantaneous keyword detection.

## Contact

For any questions, requirements, or more support for React-Native, please contact us at ofer@davoice.io.

## Installation and Usage

# Example
cd example

npm install

npm run build

# Test it in a browser:
You can run use https server to test the wake words.

Here is an example:

npm install -g http-server

http-server . -p 8080 --ssl --cert cert.pem --key key.pem

or "npm run start"

## If you do not have cert.pem and/or key.pem: you can create them as follow:

nopenssl genrsa -out key.pem 2048

nopenssl req -new -key key.pem -out csr.pem

nopenssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem

# Integrating to your app:

## Add web-wake-word-cpu-gpu-opt to your app.
npm install web-wake-word-cpu-gpu-opt@latest.
or add to package.json the following where x,y,z is the version you can find in https://www.npmjs.com/package/web-wake-word-cpu-gpu-opt:
```
 "web-wake-word-cpu-gpu-opt": "^x.y.z",
```
For example:
```
 "web-wake-word-cpu-gpu-opt": "^2.0.8"
```

## Copy necessary files to your dist, public or other folder in your application:
**YOU MUST COPY THE FOLLOWNG 3 FILES/FOLDERS to your app**
- Copy the **models/** folder to your dist, public or other folder inside your app.
- Copy **ort-wasm-simd-threaded.wasm** file from node_modules/web-wake-word-cpu-gpu-opt/dist/ort-wasm-simd-threaded.wasm to your dist, public or other folder inside your app.
- Copy **node_modules/web-wake-word-cpu-gpu-opt/dist/audio-worklet-processor.js** to your dist, public or other folder inside your app.

## Add code to use it;

Then you can add the follwing code or copy past parts that you need:

```js
import { KeywordDetector } from 'web-wake-word-cpu-gpu-opt';

// Your code ....

const modelsSuffix = '.onnx';
  // ******** Check for the latest License *********
  const licenseKey = "MTc1MjUyNjgwMDAwMA==-RbOr3R66OPByzZxLe7vgM6JDlrrejrgRzbo41+g8qrM=";
  console.log('License Key:', licenseKey);
  // Initialize Keyword Detector
  const threshold = 0.99;
  const bufferCount = 3;

// Your code ....

  // Setup the callback:
  const onKeywordDetected = async (detected) => {
      if (detected) {
        await keywordDetector.stopListening();

        console.log('Keyword detected \nprediction: ' + detected.prediction);
        console.log('cntBuf: ' + detected.cntBuf);
        console.log('Model: ' + detected.model);
//        alert("Keyword detected: " + detected.model);
        showAutoClosingAlert("Keyword detected: " + detected.model, 5000);

        await keywordDetector.startListening();
      }
    };

    // Provide the url to the models location. To be provided to KeywordDetector constructor
    const modelsFolderPath = "./models"

    // Configure the models to be used and their settings
    const modelParamsArr = [
      { modelToUse: "hey_lookdeep" + modelsSuffix, threshold: threshold, bufferCount: bufferCount, onKeywordDetected: onKeywordDetected },
// More models to detect -  { modelToUse: "need_help_now"  + modelsSuffix, threshold: threshold, bufferCount: bufferCount, onKeywordDetected: onKeywordDetected },
// Add more models      { modelToUse: "salut_mia_model_28_20012025"  + modelsSuffix, threshold: threshold, bufferCount: bufferCount, onKeywordDetected: onKeywordDetected },
    ];

    modelParamsArr.map(m => m.modelToUse.replace(/\.onnx$/, '').replace(/_/g, ' ')).join(', ');

    /* KeywordDetector API:
      KeywordDetector(modelsFolderPath, modelParams, wasmBasePath, 
        audioWorkletPath);

      modelsFolderPath - path to the models directory.
      modelParams - the models to use and their configuration
      wasmBasePath - the location of wasm file
      audioWorkletPath - the location of audioWorklet

      You will need to copy ort-wasm-simd-threaded.wasm to your dist or somewhere in your project and add its location to the KeywordDetector initialization.
      The file is found in the dist folder: "node_modules/web-wake-word-cpu-gpu-opt/dist/ort-wasm-simd-threaded.wasm" in the example below we place it in 
      https://127.0.0.1:8080/dist/
      Also where the audioWorklet is placed which is the last argument. The file is found in "node_modules/web-wake-word-cpu-gpu-opt/dist/audio-worklet-processor.js"
      You will also need to copy it and determine its location
    */
    const keywordDetector = new KeywordDetector(modelsFolderPath,
       modelParamsArr, "https://127.0.0.1:8080/dist/", "./dist/"); // the two last arguments are the wasm location and audioWorkletPath location.

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
```
# Using specific path to wasm file:

If you need to the wasm file path, you can add another variable to KeywordDetector constructor.

Below is an example of adding path to chrome extension path:

```
const keywordDetector = new KeywordDetector(
  modelsPath,
  'model.onnx',
  threshold,
  bufferCount,
  onKeywordDetected,
  'chrome-extension://<EXT_ID>/assets/wasm/'
);
```

### Next steps
Open a browser with the following URL https://192.168.1.218:8080 <br>
See that it is working for you.<br>
Integrate it to your life website/app.<br>

# Wake word generator

## Create your "custom wake word""

In order to generate your custom wake word you will need to:

- **Create wake word mode:**
    Contact us at info@davoice.io with a list of your desired **"custom wake words"**.

    We will send you corresponding models typically your **wake word phrase .onnx** for example:

    A wake word ***"hey sky"** will correspond to **hey_sky.onnx**.

- **Add wake words to javascript project:**
    Simply copy the new onnx files to models directory make sure this directory it copied to the targer such as "dist/model".

- **In JS code add the new onnx files to your configuration**
In example.js change
```
    const modelToUse = "need_help_now.onnx";
```

To

```
    const modelToUse = "hey_sky.onnx"; // or your_model.onnx
```

## Contact us
If you need any help contact us: ofer@davoice.io


### Key words

DaVoice.io javascript "Voice commands" "Wake words" "Voice to Intent" "keyword detection".
"Wake word detection github"
"Wake Word" 
"keyword detection"
"Phrase Recognition"
"Phrase Spotting"
“Voice triggered”
“hotword”
“trigger word”
"react.js wake word",
"Angular wake word",
"js wake word",
"javascript wake word",
"angular wake word",
"Vue.js wake word",
"Wake word detection github",
"Wake word generator",
"Custom wake word",
"voice commands",
"wake word",
"wakeword",
"wake words",
"keyword detection",
"keyword spotting",
"speech to intent",
"voice to intent",
"phrase spotting",
"react native wake word",
"Davoice.io wake word",
"Davoice wake word",
"Davoice react native wake word",
"Davoice react-native wake word",
"wake",
"word",
"Voice Commands Recognition",
"lightweight Voice Commands Recognition",
"customized lightweight Voice Commands Recognition",

## Links

- **Web / Javascript / React.JS / Angula / Vue.js Wake Word npm package:** https://www.npmjs.com/package/web-wake-word-cpu-gpu-opt
- **If you need React-Native wake word: ** https://www.npmjs.com/package/react-native-wakeword

Here are wakeword detection GitHub links per platform:

- **For Python:** https://github.com/frymanofer/Python_WakeWordDetection
- **Web / JS / Angular / React:** https://github.com/frymanofer/Web_WakeWordDetection/tree/main
- **For React Native:** [ReactNative_WakeWordDetection](https://github.com/frymanofer/ReactNative_WakeWordDetection)
- **For Flutter:** [https://github.com/frymanofer/Flutter_WakeWordDetection]
- **For Android:** [KeywordsDetectionAndroidLibrary](https://github.com/frymanofer/KeywordsDetectionAndroidLibrary)
- **For iOS framework:** 
  - With React Native bridge: [KeyWordDetectionIOSFramework](https://github.com/frymanofer/KeyWordDetectionIOSFramework)
  - Sole Framework: [KeyWordDetection](https://github.com/frymanofer/KeyWordDetection)
