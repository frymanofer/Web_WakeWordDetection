# Web Wake Word Detection — Wake Word & Keyword Spotting for JavaScript

[![GitHub release](https://img.shields.io/github/release/frymanofer/KeyWordDetectionIOSFramework.svg)](https://github.com/frymanofer/KeyWordDetectionIOSFramework/releases)
[![npm](https://img.shields.io/npm/v/web-wake-word-cpu-gpu-opt.svg)](https://www.npmjs.com/package/web-wake-word-cpu-gpu-opt)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Twitter URL](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Ftwitter.com%2FDaVoiceAI)](https://twitter.com/DaVoiceAI)

By [DaVoice.io](https://davoice.io) — email: ofer@davoice.io

**Davoice Web Wake Word** is a JavaScript wake word detection / keyword
spotting library that runs **entirely in the browser** — no audio is ever
sent to a server. It works with **any web stack**: plain JavaScript,
React, Next.js, Vue.js, Nuxt.js, Angular, Svelte/SvelteKit, Gatsby,
Ember.js, Backbone.js, and Mithril.js.

A **wake word** (also called **keyword detection**, **phrase spotting**,
**phrase recognition**, **hotword detection**, or **trigger word
detection**) is the short phrase that activates an app or device —
think "Hey Siri" or "OK Google", but for your own product with your own
custom word or phrase.

---

## Table of contents

- [What is a wake word?](#what-is-a-wake-word)
- [Why DaVoice Web Wake Word](#why-davoice-web-wake-word)
- [Supported web frameworks](#supported-web-frameworks)
- [Quick start](#quick-start)
- [Integrating into your own app](#integrating-into-your-own-app)
- [Speech to Intent](#speech-to-intent)
- [Creating a custom wake word](#creating-a-custom-wake-word)
- [Benchmarks](#benchmarks)
- [FAQ](#faq)
- [Wake word detection on other platforms](#wake-word-detection-on-other-platforms)
- [Links](#links)

---

## What is a wake word?

A **wake word** (or **wakeword**) is a short spoken phrase a device or app
continuously listens for, in order to trigger an action — without sending
raw audio anywhere or requiring the user to press a button. It's the same
category of technology behind "Hey Siri", "OK Google", and "Alexa", except
here it runs **on-device, inside a web page**, using your own custom word
or phrase instead of a generic assistant name.

Wake word detection is different from full **speech-to-text**: a
wake-word model only recognizes one thing — whether its specific
phrase was just said — which is what makes it lightweight enough to run
continuously in a browser tab. Once triggered, you can optionally hand
off to full speech recognition for more complex commands (see
[Speech to Intent](#speech-to-intent) below).

## Why DaVoice Web Wake Word

- **Runs 100% client-side** — audio never leaves the browser; nothing to
  host, no server-side inference, no privacy/compliance exposure.
- **Framework-agnostic** — works with React, Next.js, Vue, Nuxt, Angular,
  Svelte/SvelteKit, or plain JS/webpack/Vite. See the
  [example app's README](example/README.md) for a framework-by-framework
  integration guide.
- **CPU/GPU-optimized** — an ONNX runtime compiled to WebAssembly, tuned
  for both CPU and GPU execution paths.
- **High accuracy** — see [Benchmarks](#benchmarks) below.
- **Low latency** — near-instantaneous keyword detection, suitable for
  always-listening UX.
- **Custom wake words** — send us your phrase and we generate the model
  ([details](#creating-a-custom-wake-word)).
- **Optional Speech to Intent** — layer full voice-command recognition on
  top of the wake word trigger.

## Supported web frameworks

The underlying npm package, `web-wake-word-cpu-gpu-opt`, ships plain
browser assets (a Web Worker, an AudioWorklet module, and a WASM ONNX
runtime), so it drops into any JavaScript framework. The
[example app's README](example/README.md#4-framework-specific-integration-notes)
has copy-pasteable, framework-specific setup steps for:

| Framework | Notes |
|---|---|
| React / Create React App | client-only hook (`useEffect`), assets in `public/` |
| Next.js | `"use client"` (App Router) or `dynamic(..., { ssr: false })` (Pages Router) |
| Vue.js (Vue CLI / Vite) | assets in `public/`, instantiate in `onMounted()` |
| Angular | `angular.json` asset globs, guarded with `isPlatformBrowser` |
| Svelte / SvelteKit | assets in `static/`, guarded with the `browser` flag |
| Nuxt.js, Gatsby, Ember.js, Backbone.js, Mithril.js, plain JS | same static-asset + client-only-execution pattern |

## Quick start

Try the included example app locally:

```bash
cd example
npm install
npm run gen-cert     # local HTTPS cert (mic access requires a secure context)
npm run build
npm start             # https://127.0.0.1:8080
```

Open the printed HTTPS URL, allow microphone access, and say the demo
wake word. Full details, architecture notes, and troubleshooting are in
[`example/README.md`](example/README.md).

## Integrating into your own app

Install the package:

```bash
npm install web-wake-word-cpu-gpu-opt@latest
```

Copy the required runtime assets (models + worker + worklet + WASM
runtime) into your app's public/static folder, then use it like this:

```js
import { KeywordDetector } from 'web-wake-word-cpu-gpu-opt';

const modelParamsArr = [
  {
    modelToUse: 'hey_lookdeep.onnx',
    threshold: 0.99,
    bufferCount: 3,
    onKeywordDetected: async (detected) => {
      console.log('Keyword detected:', detected.model, detected.prediction);
    },
  },
];

const keywordDetector = new KeywordDetector(
  './models',                        // modelsFolderPath
  modelParamsArr,                    // model configuration
  `${window.location.origin}/dist/`, // wasmBasePath — must be an absolute URL
  './dist/'                          // audioWorkletPath
);

const isLicensed = await keywordDetector.setLicense(licenseKey);
if (!isLicensed) throw new Error('Invalid or expired license key.');

await keywordDetector.init();
await keywordDetector.startListening();
```

**This is the short version.** For the full picture — exactly which
files to copy from `node_modules`, why `wasmBasePath` must be an absolute
URL, per-framework setup for React/Next.js/Vue/Angular/Svelte, and a
troubleshooting section — see
**[`example/README.md`](example/README.md)**, which is kept as the
canonical integration guide for this package.

License keys are issued by [DaVoice.io](https://davoice.io) — contact
ofer@davoice.io to get one.

## Speech to Intent

**Speech to Intent** goes a step further than a wake word: instead of
just activating the app, it recognizes a full spoken phrase and maps it
directly to an action. A wake word like "Hey App" might activate
listening, while Speech to Intent then interprets "play my favorite
song" or "order a coffee" and triggers the corresponding feature. This
layered wake-word → intent pattern is how most production voice-driven
UX is built. Contact us at ofer@davoice.io to discuss enabling it for
your app.

## Creating a custom wake word

1. **Request a model** — email ofer@davoice.io (or info@davoice.io) with
   the wake word phrase(s) you want, e.g. `"hey sky"`. We send back the
   corresponding model, e.g. `hey_sky.onnx`.
2. **Add it to your project** — copy the new `.onnx` file into your
   `models/` folder (make sure that folder is copied to your build
   output, same as the other model files).
3. **Reference it in code** — add it to `modelParamsArr`:
   ```js
   { modelToUse: "hey_sky.onnx", threshold: 0.99, bufferCount: 3, onKeywordDetected }
   ```

## Benchmarks

We've reached over 99% accuracy across our wake word models. From one
customer's independent benchmark, run against **1,326 true-positive
recordings**:

```
MODEL         DETECTION RATE
===========================
DaVoice        0.992458
Top Player     0.874811
Third          0.626697
```

"Top Player" was one of the industry's leading providers (1,160/1,326
detected); "Third" detected 831/1,326.

## FAQ

**What is a wake word / keyword detection?**
A short phrase (e.g. "Hey App") that a lightweight on-device model
continuously listens for, to trigger an action — the same category as
"Hey Siri" or "OK Google", but customizable and embeddable in your own
web app.

**Does this send audio to a server?**
No. Detection runs fully client-side in the browser via WebAssembly; no
audio or recordings leave the device.

**Which web frameworks does this support?**
Any of them — React, Next.js, Vue.js, Nuxt.js, Angular, Svelte/SvelteKit,
Gatsby, Ember.js, Backbone.js, Mithril.js, or plain JavaScript. See
[Supported web frameworks](#supported-web-frameworks).

**How is this different from speech-to-text?**
Wake word detection recognizes one specific phrase and is lightweight
enough to run continuously; speech-to-text transcribes arbitrary speech
and is heavier. Combine both — see [Speech to Intent](#speech-to-intent).

**Can I use my own custom wake word?**
Yes — see [Creating a custom wake word](#creating-a-custom-wake-word).

**Is a license required?**
Yes, a license key from [DaVoice.io](https://davoice.io) is required at
runtime (`setLicense()`). Contact ofer@davoice.io.

**Do you support mobile apps too?**
Yes — see [Wake word detection on other platforms](#wake-word-detection-on-other-platforms)
for iOS, Android, React Native, Flutter, and Python.

## Wake word detection on other platforms

DaVoice also ships wake word / keyword detection for:

- **Python:** [Python_WakeWordDetection](https://github.com/frymanofer/Python_WakeWordDetection)
- **React Native:** [ReactNative_WakeWordDetection](https://github.com/frymanofer/ReactNative_WakeWordDetection) · [npm package](https://www.npmjs.com/package/react-native-wakeword)
- **Flutter:** [Flutter_WakeWordDetection](https://github.com/frymanofer/Flutter_WakeWordDetection)
- **Android:** [KeywordsDetectionAndroidLibrary](https://github.com/frymanofer/KeywordsDetectionAndroidLibrary)
- **iOS:** [KeyWordDetectionIOSFramework](https://github.com/frymanofer/KeyWordDetectionIOSFramework) (React Native bridge) · [KeyWordDetection](https://github.com/frymanofer/KeyWordDetection) (standalone framework)

For React-Native specific requirements or support, contact
ofer@davoice.io.

## Links

- **Website:** [https://davoice.io](https://davoice.io)
- **Web / JavaScript npm package:** [web-wake-word-cpu-gpu-opt](https://www.npmjs.com/package/web-wake-word-cpu-gpu-opt)
- **This repo:** [Web_WakeWordDetection](https://github.com/frymanofer/Web_WakeWordDetection)
- **Twitter / X:** [@DaVoiceAI](https://twitter.com/DaVoiceAI)
- **Contact:** ofer@davoice.io

---

### Keywords

DaVoice.io JavaScript wake word, voice commands, wake words, voice to
intent, keyword detection, keyword spotting, phrase recognition, phrase
spotting, voice triggered, hotword, trigger word, wake word detection
GitHub, wake word generator, custom wake word — for React.js, Next.js,
Angular, Vue.js, Nuxt.js, Svelte, Gatsby, Ember.js, Backbone.js,
Mithril.js, and plain JavaScript. Also: React Native wake word, Davoice
react-native wake word, lightweight voice commands recognition,
customized lightweight voice commands recognition.
