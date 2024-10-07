# Web Wake Word Detection / Keywords Detection by Davoice

[![GitHub release](https://img.shields.io/github/release/frymanofer/KeyWordDetectionIOSFramework.svg)](https://github.com/frymanofer/KeyWordDetectionIOSFramework/releases)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

By [DaVoice.io](https://davoice.io) email: ofer@davoice.io

[![Twitter URL](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Ftwitter.com%2FDaVoiceAI)](https://twitter.com/DaVoiceAI)


Welcome to **Davoice Wake Words** – the premier Wake Words / keyword detection solution designed by **DaVoice.io**.

## Features

- **High Accuracy:** Our advanced machine learning models deliver top-notch accuracy.
- **Platforms:** Web, JS, Angular, React etc'
- **Easy to deploy:** Check out our example to enabled your web app.
- **Low Latency:** Experience near-instantaneous keyword detection.

## Contact

For any questions, requirements, or more support for React-Native, please contact us at ofer@davoice.io.

## Installation and Usage

# Example
cd example

npm install

npx webpack --config webpack.config.js

# Test it in a browser:
You can run use https server to test the wake words.

Here is an example:

npm install -g http-server

http-server . -p 8080 --ssl --cert cert.pem --key key.pem

## If you do not have cert.pem and/or key.pem: you can create them as follow:

nopenssl genrsa -out key.pem 2048

nopenssl req -new -key key.pem -out csr.pem

nopenssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem

### Next steps
Open a browser with the following URL https://192.168.1.218:8080 <br>
See that it is working for you.<br>
Integrate it to your life website/app.<br>

## Contact us
If you need any help contact us: ofer@davoice.io

## Links

Here are wakeword detection GitHub links per platform:

- **For React Native:** [ReactNative_WakeWordDetection](https://github.com/frymanofer/ReactNative_WakeWordDetection)
- **For Android:** [KeywordsDetectionAndroidLibrary](https://github.com/frymanofer/KeywordsDetectionAndroidLibrary)
- **For iOS framework:** 
  - With React Native bridge: [KeyWordDetectionIOSFramework](https://github.com/frymanofer/KeyWordDetectionIOSFramework)
  - Sole Framework: [KeyWordDetection](https://github.com/frymanofer/KeyWordDetection)
