import { SupersetClient } from "./superset-client.js";
import { SupersetConfig } from "../types/index.js";

// 全局Superset客户端实例
let supersetClient: SupersetClient | null = null;

// 初始化Superset客户端
export function initializeSupersetClient(): SupersetClient {
  if (!supersetClient) {
    const config: SupersetConfig = {
      baseUrl: process.env.SUPERSET_BASE_URL || 'http://localhost:8088',
      username: process.env.SUPERSET_USERNAME,
      password: process.env.SUPERSET_PASSWORD,
      accessToken: process.env.SUPERSET_ACCESS_TOKEN,
    };
    
    supersetClient = new SupersetClient(config);
  }
  
  return supersetClient;
}

export { SupersetClient }; 