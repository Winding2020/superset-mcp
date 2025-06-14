import { AxiosError } from "axios";

// Error handling helper function
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    // Try to get detailed error information
    const response = error.response;
    if (response) {
      // If there's detailed error information
      if (response.data?.message) {
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
      if (response.data?.errors && Array.isArray(response.data.errors)) {
        const errorMessages = response.data.errors.map((err: any) => 
          typeof err === 'string' ? err : JSON.stringify(err)
        ).join(', ');
        return `${response.status} ${response.statusText}: ${errorMessages}`;
      }
      // If there's other format error information, try to serialize the entire object
      if (response.data) {
        try {
          const dataStr = JSON.stringify(response.data, null, 2);
          return `${response.status} ${response.statusText}: ${dataStr}`;
        } catch (jsonError) {
          return `${response.status} ${response.statusText}: ${String(response.data)}`;
        }
      }
      // Only status code information
      return `${response.status} ${response.statusText}`;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
} 