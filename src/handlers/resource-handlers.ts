export const resourceDefinitions = [
  {
    uri: "superset://datasets",
    name: "Superset Datasets Overview",
    description: "Overview information of all datasets in Superset",
    mimeType: "text/plain",
  },
  {
    uri: "superset://databases", 
    name: "Superset Database List",
    description: "All database connections configured in Superset",
    mimeType: "text/plain",
  },
];

import { ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { initializeSupersetClient } from "../client/index.js";
import { getErrorMessage } from "../utils/error.js";

export async function handleResourceRead(request: any) {
  const client = initializeSupersetClient();
  
  try {
    switch (request.params.uri) {
      case "superset://datasets": {
        const result = await client.datasets.getDatasets({ page: 0, page_size: 50 });
        const content = `Superset Datasets Overview\n` +
          `========================\n\n` +
          `Total: ${result.count}\n\n` +
          result.result.map((dataset: any) => 
            `• ${dataset.table_name} (ID: ${dataset.id})\n` +
            `  Database ID: ${dataset.database_id}\n` +
            `  Schema: ${dataset.schema || 'N/A'}\n` +
            `  Description: ${dataset.description || 'N/A'}\n`
          ).join('\n');
        
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: "text/plain",
              text: content,
            },
          ],
        };
      }
      
      case "superset://databases": {
        const databases = await client.sql.getDatabases();
        const content = `Superset Database Connections\n` +
          `===================\n\n` +
          `Total: ${databases.length}\n\n` +
          databases.map((db: any) => 
            `• ${db.database_name} (ID: ${db.id})\n` +
            `  Driver: ${db.sqlalchemy_uri?.split('://')[0] || 'N/A'}\n` +
            `  Allows async: ${db.allow_run_async ? 'Yes' : 'No'}\n`
          ).join('\n');
        
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: "text/plain", 
              text: content,
            },
          ],
        };
      }
      
      default:
        throw new Error(`Unknown resource: ${request.params.uri}`);
    }
  } catch (error) {
    throw new Error(`Failed to read resource: ${getErrorMessage(error)}`);
  }
} 