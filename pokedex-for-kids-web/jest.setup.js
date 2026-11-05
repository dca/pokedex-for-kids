// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Web Speech API for testing
global.speechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
  onvoiceschanged: null,
  speaking: false,
  pending: false,
  paused: false,
}

global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
  text,
  lang: 'en-US',
  volume: 1,
  rate: 1,
  pitch: 1,
  onstart: null,
  onend: null,
  onerror: null,
}))
