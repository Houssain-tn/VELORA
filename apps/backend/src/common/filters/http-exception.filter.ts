import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Log the error for audit and debugging
    const errorLog = `[${request.method}] ${request.url} - Status: ${status} - Error: ${
      typeof message === 'object' ? JSON.stringify(message) : message
    }\nStack: ${exception instanceof Error ? exception.stack : ''}\n\n`;
    require('fs').appendFileSync('backend-error.log', errorLog);
    
    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Error: ${
        typeof message === 'object' ? JSON.stringify(message) : message
      }`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        typeof message === 'object'
          ? (message as any).message || message
          : message,
      error:
        status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'CRITICAL_SYSTEM_ERROR'
          : undefined,
    });
  }
}
