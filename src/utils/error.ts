import { AxiosError } from "axios";

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
          const errorMessages = response.data.errors.map((err: any) => 
            typeof err === 'string' ? err : JSON.stringify(err)
          ).join(', ');
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