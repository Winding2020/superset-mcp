import { BaseSuperset } from "./base-client.js";
import { SqlExecuteRequest, SqlExecuteResponse } from "../types/index.js";
import { getErrorMessage, formatSqlError } from "../utils/error.js";

/**
 * SQL execution and database management client
 */
export class SqlClient extends BaseSuperset {

  // Get database list
  async getDatabases(): Promise<any[]> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get('/api/v1/database/');
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to get database list: ${getErrorMessage(error)}`);
    }
  }

  // Execute SQL query
  async executeSql(request: SqlExecuteRequest): Promise<SqlExecuteResponse> {
    try {
      // Build request data using correct API parameter names
      const requestData = {
        database_id: request.database_id,
        sql: request.sql,
        schema: request.schema,
        queryLimit: request.limit || 1000, // Use queryLimit instead of limit
        runAsync: false, // Use runAsync instead of async, force synchronous execution
        expand_data: request.expand_data !== false, // Default to true
        select_as_cta: false, // Disable CTA
        ctas_method: 'TABLE',
        json: true, // Add json parameter
      };

      const response = await this.makeProtectedRequest({
        method: 'POST',
        url: '/api/v1/sqllab/execute/',
        data: requestData
      });

      return response.data;
    } catch (error) {
      console.error('Execute SQL detailed error:', error);
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as any;
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', JSON.stringify(axiosError.response?.data, null, 2));
      }
      
      // Use enhanced SQL error formatting
      const detailedError = formatSqlError(error, request.sql, request.database_id);
      throw new Error(detailedError);
    }
  }
} 