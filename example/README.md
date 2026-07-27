# Web Wake Word Detection — Example App

A minimal, framework-free reference implementation showing how to add
on-device wake-word (keyword-spotting) detection to a web app using the
[`web-wake-word-cpu-gpu-opt`](https://www.npmjs.com/package/web-wake-word-cpu-gpu-opt)
package.

Everything runs **entirely client-side**: microphone audio is captured with
an `AudioWorklet`, streamed into a `Web Worker`, and passed through a small
pipeline of ONNX models (mel-spectrogram → embedding → keyword classifier)
executed via a WebAssembly ONNX runtime. No audio ever
leaves the browser and no server-side inference is required.

This README covers two things:

1. How to run **this** example as-is.
2. What, concretely, you need to copy/configure to add the same
   capability to **your own** web app — vanilla JS, React, Vue, Angular,
   Next.js, Svelte/SvelteKit, or any other bundler-based stack.

---

## 1. Running this example

### Prerequisites

- Node.js and npm
- A valid license key (see [Licensing](#licensing) below)
- A secure context for the browser to grant microphone access — either
  `https://` or `http://localhost`. This example uses a self-signed
  certificate for local development.

### Steps

```bash
npm install
npm run gen-cert   # creates cert.pem / key.pem for local HTTPS (one-time)
npm run build      # webpack build -> dist/
npm start          # serves the app over HTTPS on https://127.0.0.1:8080
```

Open `https://127.0.0.1:8080` (accept the self-signed certificate warning),
grant microphone access, and say one of the configured wake words
(`hey_lookdeep`, or `need_help_now` if you uncomment it in `example.js`).

`npm run build` (via `build.js`) reads `licensekey.txt` and injects it into
the bundle as `process.env.LICENSE_KEY` at build time — though the current
`example.js` also hardcodes a demo key inline for simplicity. Replace it
with your own key before shipping anything based on this example.

### Project layout

| File | Purpose |
|---|---|
| `example.js` | App entry point — constructs `KeywordDetector`, wires up the UI. |
| `index.html` | Minimal page shell loading `dist/example.bundle.js`. |
| `webpack.config.js` | Bundles `example.js` and copies all runtime assets the library needs into `dist/`. |
| `build.js` / `build.sh` | Build scripts; `build.js` also injects the license key from `licensekey.txt`. |
| `generate-cert.js` | Generates a local self-signed TLS cert (mic access requires a secure context). |
| `models/` | The ONNX model files (see below). |
| `dist/` | Build output — this is the directory actually served. |

---

## 2. How the library is wired up

```js
import { KeywordDetector } from 'web-wake-word-cpu-gpu-opt';

const keywordDetector = new KeywordDetector(
  modelsFolderPath,   // e.g. "./models"
  modelParamsArr,     // array of { modelToUse, threshold, bufferCount, onKeywordDetected }
  wasmBasePath,       // ABSOLUTE URL to the folder with the ORT wasm runtime files
  audioWorkletPath    // path to the folder with keywordDetector.worker.js + audio-worklet-processor.js
);

const isLicensed = await keywordDetector.setLicense(licenseKey);
await keywordDetector.init();
await keywordDetector.startListening();
```

A single-model constructor overload also exists
(`new KeywordDetector(modelsFolderPath, modelToUse, threshold, bufferCount, onKeywordDetected, wasmBasePath, audioWorkletPath)`)
— see `example.js` for both forms (the single-model one is commented out).

Other instance methods available: `stopListening()`, `getHealth()` (returns
a diagnostics snapshot — useful when debugging mic/model issues), and
optionally `enableSpeechToText(opts)` / `stopSpeechToText()` /
`disableSpeechToText()` if you want to run the browser's native
`SpeechRecognition` API after a wake word fires (wired up but hidden by
default in this example — see the commented-out `bindSpeechToText()` call
near the bottom of `example.js` and the corresponding hidden UI in
`index.html`).

### ⚠️ Two path parameters that are easy to get wrong

- **`wasmBasePath` must be an absolute URL**, not a relative path (e.g.
  `https://your-app.com/wasm/`, or dynamically
  `` `${window.location.origin}/wasm/` ``). The ONNX WASM runtime is
  fetched from *inside the Web Worker*, where a relative path resolves
  against the worker script's own location, not your page's URL — this is
  why the example hardcodes `https://127.0.0.1:8080/dist/` for local dev.
  Replace this with your real deployed origin.
- **`audioWorkletPath` doubles as the base path for two different files**:
  `keywordDetector.worker.js` (the Web Worker script) and
  `audio-worklet-processor.js` (the `AudioWorklet` module). Both **must
  live in the same directory** — the library appends each filename to
  this one path internally.

### Model filenames are load-bearing

The pipeline always needs two shared models plus one-or-more
keyword-specific models, all as `.onnx` files (or a packed `.dm` bundle —
see the library's own docs if you received models that way):

| File | Role |
|---|---|
| `melspectrogram.onnx` | Converts raw audio into a mel-spectrogram. Required, filename fixed. |
| `embedding_model.onnx` | Converts the spectrogram into an embedding. Required, filename fixed. |
| `<your_keyword>.onnx` | Your custom wake-word classifier(s), one per entry in `modelParamsArr`. |

Do not rename `melspectrogram.onnx` / `embedding_model.onnx` — the runtime
expects these exact filenames and renaming them will silently break
inference.

---

## 3. Required runtime assets — the checklist

Whatever framework you use, the same set of files must end up being served
as **static files** (not bundled/transformed by your JS bundler) from a
public path your app can reference by URL at runtime:

| File | Source | Goes to |
|---|---|---|
| `melspectrogram.onnx`, `embedding_model.onnx`, your keyword model(s) | your `models/` folder | e.g. `/models/` |
| `keywordDetector.worker.js` | `node_modules/web-wake-word-cpu-gpu-opt/dist/keywordDetector.worker.js` | same folder as `audio-worklet-processor.js` |
| `audio-worklet-processor.js` | `node_modules/web-wake-word-cpu-gpu-opt/dist/audio-worklet-processor.js` | same folder as `keywordDetector.worker.js` |
| `ort-wasm-simd-threaded.jsep.wasm` | `node_modules/web-wake-word-cpu-gpu-opt/dist/` | your wasm folder |
| `ort-wasm-simd-threaded.jsep.mjs` | `node_modules/web-wake-word-cpu-gpu-opt/dist/` | same wasm folder |

**From `package.json`**, you only need one runtime dependency:

```json
"dependencies": {
  "web-wake-word-cpu-gpu-opt": "^2.0.12"
}
```

Everything else in this example's `package.json`
(`webpack`, `webpack-cli`, `webpack-dev-server`, `babel-loader`,
`@babel/core`, `@babel/preset-env`, `copy-webpack-plugin`, `cross-env`,
`http-server`, `rimraf`, `path-browserify`) exists only to support *this
specific example's* build/dev-server setup. If your app already has its
own bundler (Vite, CRA, Angular CLI, Next.js, etc.), you don't need most of
these — see the framework-specific notes below.

**From `webpack.config.js`**, the only parts that matter to *any* consumer
are conceptual, not copy-pasteable verbatim:

- A `CopyWebpackPlugin` (or bundler-equivalent) pattern list that copies
  the 5 files above into your build output, unmodified.
- A rule marking `.wasm` files as `webassembly/async` — only needed if
  your bundler tries to process `.wasm` itself; since these wasm files are
  copied as static assets and fetched by URL, most setups won't even hit
  this.
- The `babel-loader` rule that transpiles `example.js` — specific to this
  example's own code, not something you need for the library itself
  (`web-wake-word-cpu-gpu-opt`'s `dist/index.js` is already built/UMD).

---

## 4. Framework-specific integration notes

The unifying principle across every framework below: **this library loads
its runtime assets by URL at runtime** (`fetch()`, `new Worker(url)`,
`audioContext.audioWorklet.addModule(url)`) — **not** via ES module
imports. That means no bundler needs to understand or transform the
worker/wasm/model files; they only need to be copied byte-for-byte to a
public static path. Every framework below has some notion of a "public /
static assets" folder that's copied to the output root untouched — that's
where these 5 files go.

Also note: `AudioWorklet`, `Worker`, and `getUserMedia` are **browser-only
APIs**. Any framework that renders on the server (Next.js, Nuxt,
SvelteKit, Angular Universal) must guard `KeywordDetector` construction so
it only ever runs client-side.

### Plain webpack apps

Copy the `CopyWebpackPlugin` block from this example's `webpack.config.js`
verbatim, pointing `from:` at your own `models/` folder and at
`node_modules/web-wake-word-cpu-gpu-opt/dist/...` for the other four
files, with `to:` set to wherever your app serves static files from.

### Vite (React, Vue, Svelte, SolidJS, vanilla-Vite, ...)

Vite copies everything in `public/` to the root of the build output
untouched — no plugin needed. Place the 5 files into:

```
public/models/melspectrogram.onnx
public/models/embedding_model.onnx
public/models/<your_keyword>.onnx
public/wake-word/keywordDetector.worker.js
public/wake-word/audio-worklet-processor.js
public/wake-word/ort-wasm-simd-threaded.jsep.wasm
public/wake-word/ort-wasm-simd-threaded.jsep.mjs
```

Then in a component (client-only — e.g. inside `onMounted`/`useEffect`,
never at module top level during SSR):

```js
import { KeywordDetector } from 'web-wake-word-cpu-gpu-opt';

const detector = new KeywordDetector(
  '/models',
  modelParamsArr,
  `${window.location.origin}/wake-word/`,
  '/wake-word/'
);
```

### Create React App (CRA) / plain React

Same idea as Vite: CRA's `public/` folder is copied to the build root
as-is. CRA doesn't expose its webpack config without ejecting (or using
CRACO), so `public/` is the path of least resistance. Instantiate
`KeywordDetector` inside `useEffect`, guarded so it only runs once on
mount, and clean up with `stopListening()` on unmount.

### Vue (Vue CLI or Vite)

Vue CLI apps: put the files under `public/` (same semantics as CRA). If
you'd rather have webpack copy them from `node_modules` automatically,
Vue CLI's `vue.config.js` exposes `chainWebpack`/`configureWebpack` where
you can add the same `CopyWebpackPlugin` pattern shown above. Instantiate
in `onMounted()` (Composition API) or `mounted()` (Options API).

### Angular

Angular CLI doesn't have an implicit "copy node_modules to output" step;
you add explicit entries to the `assets` array in `angular.json`:

```json
"assets": [
  { "glob": "**/*", "input": "src/assets/models", "output": "models" },
  {
    "glob": "**/*",
    "input": "node_modules/web-wake-word-cpu-gpu-opt/dist",
    "output": "wake-word",
    "ignore": ["**/*.js.LICENSE.txt"]
  }
]
```

Because Angular apps are frequently server-rendered (Angular Universal),
guard construction with `isPlatformBrowser(this.platformId)` in the
component/service that owns the `KeywordDetector` instance, and construct
it inside `ngAfterViewInit` (not the constructor).

### Next.js

Static assets go in `/public` and Next serves them from the site root
automatically — no config needed for the 5 files themselves. The
important part is avoiding SSR: `KeywordDetector` must never be
constructed during server rendering.

- **App Router**: mark the component `"use client"`, and construct the
  detector inside a `useEffect`.
- **Pages Router**: load the component with
  `next/dynamic` and `{ ssr: false }`, or otherwise gate construction
  behind `typeof window !== 'undefined'` inside `useEffect`.

```js
'use client';
import { useEffect, useRef } from 'react';
import { KeywordDetector } from 'web-wake-word-cpu-gpu-opt';

export default function WakeWord() {
  const detectorRef = useRef(null);
  useEffect(() => {
    detectorRef.current = new KeywordDetector(
      '/models',
      modelParamsArr,
      `${window.location.origin}/wake-word/`,
      '/wake-word/'
    );
    (async () => {
      await detectorRef.current.setLicense(licenseKey);
      await detectorRef.current.init();
      await detectorRef.current.startListening();
    })();
    return () => { detectorRef.current?.stopListening(); };
  }, []);
  return null;
}
```

### Svelte / SvelteKit

Static files go in `static/` (SvelteKit) or `public/` (plain Svelte +
Vite) and are served from the root. SvelteKit also SSRs by default, so
guard construction with the `browser` flag:

```js
import { browser } from '$app/environment';
if (browser) {
  // construct KeywordDetector here, e.g. inside onMount()
}
```

### Anything else (Nuxt, SolidStart, Remix, plain static HTML, ...)

The pattern is always the same three questions:

1. Where does this framework serve "copy as-is, don't touch" static
   files from? Put the 5 files there.
2. Does this framework render on the server? If yes, guard construction
   behind a client-only lifecycle hook / environment check.
3. Pass the resulting public URLs as `modelsFolderPath`, `wasmBasePath`
   (absolute!), and `audioWorkletPath` to the `KeywordDetector`
   constructor.

---

## Licensing

`setLicense(licenseKey)` must resolve to `true` before `init()` will
succeed. License keys are issued by [DaVoice](https://davoice.io) — the
key baked into this example (`example.js`) is a demo key for local
testing only. Get your own key before deploying, and don't commit
production keys to source control (see `licensekey.txt`, which is read at
build time by `build.js`).

---

## Troubleshooting

- **No mic prompt / `getUserMedia` errors** — you're not in a secure
  context. Use `https://` or `http://localhost`; that's what
  `generate-cert.js` + `npm start` are for locally.
- **"Invalid or expired license key"** — check `setLicense()`'s return
  value; get a fresh key from DaVoice.
- **Worker fails to load / 404 for `keywordDetector.worker.js`** —
  `audioWorkletPath` isn't pointing at the folder where you copied it, or
  `audio-worklet-processor.js` isn't sitting right next to it.
- **WASM 404s or CORS errors** — `wasmBasePath` isn't an absolute URL, or
  doesn't match the origin serving `ort-wasm-simd-threaded.jsep.wasm` /
  `.mjs`.
- **Detections never fire / always fire** — check `threshold` and
  `bufferCount` per model in `modelParamsArr`; call `getHealth()` to
  inspect live audio/prediction stats while debugging.
- **After upgrading the npm package version** — delete your old copied
  build assets entirely and re-copy the fresh set from the new
  `node_modules/web-wake-word-cpu-gpu-opt/dist/`; don't hand-merge old and
  new files together.
