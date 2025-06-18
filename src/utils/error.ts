import { AxiosError } from "axios";

// Helper function to format objects for display
function formatObjectForDisplay(obj: any): string {
  if (obj === null || obj === undefined) {
    return String(obj);
  }
  
  if (typeof obj === 'string') {
    return obj;
  }
  
  if (typeof obj === 'object') {
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => formatObjectForDisplay(item)).join(', ');
    }
    
    // Handle objects with common error properties
    if (obj.message) {
      return obj.message;
    }
    
    // Handle validation error objects
    if (typeof obj === 'object' && Object.keys(obj).length > 0) {
      const entries = Object.entries(obj);
      if (entries.length === 1 && Array.isArray(entries[0][1])) {
        // Single field validation error
        const [field, messages] = entries[0];
        return `${field}: ${(messages as any[]).join(', ')}`;
      } else {
        // Multiple fields or complex structure
        return entries.map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}: ${value.join(', ')}`;
          } else {
            return `${key}: ${formatObjectForDisplay(value)}`;
          }
        }).join('; ');
      }
    }
    
    // Fallback to JSON
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }
  
  return String(obj);
}

// Error handling helper function
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    // Try to get detailed error information
    const response = error.response;
    if (response) {
      // Handle different response content types
      const contentType = response.headers['content-type'] || '';
      
      // If response is HTML (common for authentication errors)
      if (contentType.includes('text/html')) {
        // Extract meaningful error from HTML if possible
        const htmlContent = String(response.data);
        // Try to extract title or error message from HTML
        const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
        const errorTitle = titleMatch ? titleMatch[1].trim() : '';
        
        if (errorTitle && !errorTitle.toLowerCase().includes('superset')) {
          return `${response.status} ${response.statusText}: ${errorTitle}`;
        }
        
        // If no meaningful title, return status with indication it's HTML
        return `${response.status} ${response.statusText}: Server returned HTML response (likely authentication or server error)`;
      }
      
      // Handle JSON responses
      if (response.data && typeof response.data === 'object') {
        // If there's detailed error information
        if (response.data.message) {
          // If message is an object, try to serialize it
          if (typeof response.data.message === 'object') {
            try {
              const messageStr = JSON.stringify(response.data.message, null, 2);
              return `${response.status} ${response.statusText}: ${messageStr}`;
            } catch {
              return `${response.status} ${response.statusText}: ${String(response.data.message)}`;
            }
          }
          return `${response.status} ${response.statusText}: ${response.data.message}`;
        }
        
        // If there's an error array
        if (response.data.errors && Array.isArray(response.data.errors)) {
          const errorMessages = response.data.errors.map((err: any) => {
            if (typeof err === 'string') {
              return err;
            } else if (err.message) {
              return err.message;
            } else {
              return JSON.stringify(err);
            }
          }).join(', ');
          return `${response.status} ${response.statusText}: ${errorMessages}`;
        }
        
        // If there's other format error information, try to serialize the entire object
        try {
          const dataStr = JSON.stringify(response.data, null, 2);
          return `${response.status} ${response.statusText}: ${dataStr}`;
        } catch (jsonError) {
          return `${response.status} ${response.statusText}: ${String(response.data)}`;
        }
      }
      
      // Handle string responses
      if (typeof response.data === 'string') {
        // Truncate very long responses but keep meaningful content
        const truncatedData = response.data.length > 500 
          ? response.data.substring(0, 500) + '...[truncated]'
          : response.data;
        return `${response.status} ${response.statusText}: ${truncatedData}`;
      }
      
      // Only status code information
      return `${response.status} ${response.statusText}`;
    }
    
    // Handle network errors or other axios errors
    if (error.code) {
      return `Network error (${error.code}): ${error.message}`;
    }
    
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error);
}

// Enhanced SQL error handling function
export function formatSqlError(error: unknown, sql?: string, database_id?: number): string {
  const baseError = getErrorMessage(error);
  
  // Build detailed error information
  let errorDetails = `SQL Execution Error\n`;
  
  if (sql) {
    errorDetails += `SQL Query:\n${sql}\n\n`;
  }
  
  if (database_id) {
    errorDetails += `Database ID: ${database_id}\n\n`;
  }
  
  // Parse the error to extract structured information
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as any;
    const response = axiosError.response;
    
    if (response) {
      errorDetails += `HTTP Status: ${response.status} ${response.statusText}\n`;
      
      if (response.data && typeof response.data === 'object') {
        // Handle Superset-specific error structure
        if (response.data.message) {
          errorDetails += `Error Message: ${response.data.message}\n`;
        }
        
        if (response.data.error_type) {
          errorDetails += `Error Type: ${response.data.error_type}\n`;
        }
        
        if (response.data.level) {
          errorDetails += `Error Level: ${response.data.level}\n`;
        }
        
        // Handle issue codes
        if (response.data.extra?.issue_codes && Array.isArray(response.data.extra.issue_codes)) {
          errorDetails += `\nIssue Codes:\n`;
          response.data.extra.issue_codes.forEach((issue: any, index: number) => {
            errorDetails += `  ${index + 1}. Code ${issue.code}: ${issue.message}\n`;
          });
        }
        
        // Handle SQL-specific errors
        if (response.data.errors && Array.isArray(response.data.errors)) {
          errorDetails += `\nDetailed Errors:\n`;
          response.data.errors.forEach((err: any, index: number) => {
            if (typeof err === 'string') {
              errorDetails += `  ${index + 1}. ${err}\n`;
            } else if (err.message) {
              errorDetails += `  ${index + 1}. ${err.message}\n`;
              if (err.error_type) {
                errorDetails += `     Type: ${err.error_type}\n`;
              }
              if (err.level) {
                errorDetails += `     Level: ${err.level}\n`;
              }
            } else {
              errorDetails += `  ${index + 1}. ${JSON.stringify(err)}\n`;
            }
          });
        }
        
        // Handle database-specific errors
        if (response.data.description) {
          errorDetails += `\nDescription: ${response.data.description}\n`;
        }
      } else {
        errorDetails += `Response Data: ${String(response.data)}\n`;
      }
    }
  } else {
    errorDetails += `Basic Error: ${baseError}\n`;
  }
  
  return errorDetails;
}

// Enhanced dataset error handling function
export function formatDatasetError(error: unknown, operation: string, datasetId?: number): string {
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as any;
    const response = axiosError.response;
    
    if (response) {
      let errorDetails = `Dataset ${operation} Error\n\n`;
      
      if (datasetId) {
        errorDetails += `Dataset ID: ${datasetId}\n`;
      }
      
      errorDetails += `Status: ${response.status} ${response.statusText}\n\n`;
      
      if (response.data && typeof response.data === 'object') {
        // Handle validation errors
        if (response.status === 400 && response.data) {
          errorDetails += `Validation Errors:\n`;
          Object.entries(response.data).forEach(([field, messages]) => {
            errorDetails += `• ${field}: ${formatObjectForDisplay(messages)}\n`;
          });
          return errorDetails;
        }
        
        // Handle other structured errors
        if (response.data.message) {
          errorDetails += `Message: ${formatObjectForDisplay(response.data.message)}\n`;
        }
        
        if (response.data.errors && Array.isArray(response.data.errors)) {
          errorDetails += `Details:\n`;
          response.data.errors.forEach((err: any, index: number) => {
            errorDetails += `  ${index + 1}. ${typeof err === 'string' ? err : err.message || JSON.stringify(err)}\n`;
          });
        }
        
        return errorDetails;
      }
    }
  }
  
  return getErrorMessage(error);
}

// Enhanced authentication error handling function
export function formatAuthError(error: unknown): string {
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as any;
    const response = axiosError.response;
    
    if (response) {
      let errorDetails = `Authentication Error\n\n`;
      errorDetails += `Status: ${response.status} ${response.statusText}\n\n`;
      
      if (response.status === 401) {
        errorDetails += `Reason: Invalid username or password\n`;
        errorDetails += `Solution: Please check your credentials in the MCP configuration\n`;
      } else if (response.status === 403) {
        errorDetails += `Reason: Access forbidden\n`;
        errorDetails += `Solution: Your account may not have sufficient permissions\n`;
      } else if (response.status === 500) {
        errorDetails += `Reason: Server error during authentication\n`;
        errorDetails += `Solution: Please check if Superset is running correctly\n`;
      }
      
      if (response.data && typeof response.data === 'object' && response.data.message) {
        errorDetails += `\nServer Message: ${response.data.message}\n`;
      }
      
      return errorDetails;
    }
  }
  
  return getErrorMessage(error);
}

// Enhanced database connection error handling function
export function formatDatabaseError(error: unknown, operation: string): string {
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as any;
    const response = axiosError.response;
    
    if (response) {
      let errorDetails = `Database ${operation} Error\n\n`;
      errorDetails += `Status: ${response.status} ${response.statusText}\n\n`;
      
      if (response.status === 404) {
        errorDetails += `Reason: Database not found\n`;
        errorDetails += `Solution: Please check if the database ID is correct\n`;
      } else if (response.status === 500) {
        errorDetails += `Reason: Database connection or server error\n`;
        errorDetails += `Solution: Please check database connectivity and server status\n`;
      }
      
      if (response.data && typeof response.data === 'object') {
        if (response.data.message) {
          errorDetails += `\nMessage: ${response.data.message}\n`;
        }
        
        if (response.data.errors && Array.isArray(response.data.errors)) {
          errorDetails += `\nDetails:\n`;
          response.data.errors.forEach((err: any, index: number) => {
            errorDetails += `  ${index + 1}. ${typeof err === 'string' ? err : err.message || JSON.stringify(err)}\n`;
          });
        }
      }
      
      return errorDetails;
    }
  }
  
  return getErrorMessage(error);
} 