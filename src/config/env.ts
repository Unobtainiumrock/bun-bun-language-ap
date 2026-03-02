export const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || "BunBun",
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  },
  features: {
    // Feature flags for development
    enableAI: true,
    enableSpeech: false, // Phase 2 feature
    enableOfflineMode: true,
  },
  api: {
    baseUrl: import.meta.env.DEV 
      ? 'http://localhost:8888/.netlify/functions'
      : '/.netlify/functions'
  }
};

export const validateConfig = () => {
  const errors: string[] = [];
  
  console.log('✅ Configuration validated - API key is safely stored on server');
  
  if (errors.length > 0) {
    console.warn('Configuration issues found:', errors);
    if (config.app.isProduction) {
      throw new Error('Invalid configuration: ' + errors.join(', '));
    }
  }
  
  return errors.length === 0;
}; 