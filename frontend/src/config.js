/**
 * Global Configuration for AgriShield
 */

// Replace with your laptop's local IP address (e.g., '192.168.1.5')
// Use '10.0.2.2' for Android Emulator if the backend is on the same machine
export const BACKEND_URL = 'http://192.168.29.171:8000'; 

export const CONFIG = {
    API_BASE_URL: BACKEND_URL,
    TIMEOUT: 30000, // 30 seconds for AI analysis
};
