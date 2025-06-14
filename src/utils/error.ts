import { AxiosError } from "axios";

// 错误处理帮助函数
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    // 尝试获取详细的错误信息
    const response = error.response;
    if (response) {
      // 如果有详细的错误信息
      if (response.data?.message) {
        // 如果message是对象，尝试序列化
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
      // 如果有错误数组
      if (response.data?.errors && Array.isArray(response.data.errors)) {
        const errorMessages = response.data.errors.map((err: any) => 
          typeof err === 'string' ? err : JSON.stringify(err)
        ).join(', ');
        return `${response.status} ${response.statusText}: ${errorMessages}`;
      }
      // 如果有其他格式的错误信息，尝试序列化整个对象
      if (response.data) {
        try {
          const dataStr = JSON.stringify(response.data, null, 2);
          return `${response.status} ${response.statusText}: ${dataStr}`;
        } catch (jsonError) {
          return `${response.status} ${response.statusText}: ${String(response.data)}`;
        }
      }
      // 只有状态码信息
      return `${response.status} ${response.statusText}`;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
} 