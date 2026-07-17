import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';

// Bắt mọi exception (lỗi) xảy ra trong toàn bộ hệ thống
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  // Khởi tạo logger để ghi nhận chi tiết lỗi
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Ghi log chi tiết lỗi hệ thống kèm URL, Method, Body, Stack trace (NFR Logging)
    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Body: ${JSON.stringify(request.body)}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

    // 1. Xử lý lỗi Rate Limiting (429)
    if (exception instanceof ThrottlerException) {
      let retryAfter = 60;
      const headers = response.getHeaders();
      // Tìm động giá trị header retry-after của các throttler
      for (const key of Object.keys(headers)) {
        if (key.toLowerCase().startsWith('retry-after')) {
          retryAfter = Number(headers[key]) || 60;
          break;
        }
      }

      return response.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: 429,
        message: `Too many requests. Please try again in ${retryAfter} seconds.`,
        retryAfter: retryAfter,
      });
    }

    // 2. Xử lý lỗi Validation (400)
    if (status === HttpStatus.BAD_REQUEST && exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse() as any;
      if (exceptionResponse && exceptionResponse.fields) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: 400,
          message: 'Validation failed',
          fields: exceptionResponse.fields,
        });
      }
    }

    // 3. Xử lý lỗi System/Database (500) - Ẩn thông tin nhạy cảm
    if (status >= 500) {
      return response.status(status).json({
        statusCode: status,
        message: 'An unexpected error occurred. Please try again later.',
      });
    }

    // 4. Xử lý các lỗi HTTP thông thường khác (401, 403, 404,...)
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;
    let message = 'An error occurred';
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      message = (exceptionResponse as any).message || (exceptionResponse as any).error || message;
    }

    return response.status(status).json({
      statusCode: status,
      message: typeof message === 'string' ? message : (Array.isArray(message) ? message[0] : JSON.stringify(message)),
    });
  }
}
