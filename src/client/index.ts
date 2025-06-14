import { SupersetClient } from "./superset-client.js";
import { SupersetConfig } from "../types/index.js";

// Global Superset client instance
let supersetClient: SupersetClient | null = null;

// Initialize Superset client
export function initializeSupersetClient(): SupersetClient {
  if (!supersetClient) {
    const config: SupersetConfig = {
      baseUrl: process.env.SUPERSET_BASE_URL || 'http://localhost:8088',
      username: process.env.SUPERSET_USERNAME,
      password: process.env.SUPERSET_PASSWORD,
      accessToken: process.env.SUPERSET_ACCESS_TOKEN,
      authProvider: process.env.SUPERSET_AUTH_PROVIDER,
    };
    
    supersetClient = new SupersetClient(config);
  }
  
  return supersetClient;
}

export { SupersetClient }; 