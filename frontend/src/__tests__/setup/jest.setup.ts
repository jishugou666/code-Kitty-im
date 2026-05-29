// Mock Vite environment variables for Jest
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_BASE_URL: 'http://localhost:3001',
        MODE: 'test',
        DEV: false,
        PROD: true,
      }
    }
  },
  writable: true,
});
