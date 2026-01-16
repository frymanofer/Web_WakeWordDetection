// audio-worklet-processor.js

class AudioProcessorWorklet extends AudioWorkletProcessor {
    constructor() {
      super();
    }
  
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      if (input.length > 0) {
        const channelData = input[0];
        this.port.postMessage(channelData);
      }
  
      return true; // Keep the processor alive
    }
  }
  
  registerProcessor('audio-processor', AudioProcessorWorklet);
  