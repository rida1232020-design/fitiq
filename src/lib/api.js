// Dynamic API base URL helper for local, sandbox, and mobile/Capacitor environments
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Detect Capacitor webview (mobile app environment)
  const isNative = window.location.origin.includes('capacitor://') || window.location.origin.includes('http://localhost') && !window.location.port;
  if (isNative) {
    // 10.0.2.2 is the special IP that redirects to localhost on Android emulator
    return 'http://10.0.2.2:5000';
  }
  
  // Standard web browser development (uses proxy configuration in package.json)
  return '';
};

export const API_URL = getApiUrl();
