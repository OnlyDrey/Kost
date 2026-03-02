import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const responseObj =
        typeof payload === "object" && payload !== null
          ? (payload as { message?: string | string[]; code?: unknown })
          : undefined;
      const message =
        responseObj?.message ??
        (typeof payload === "string" ? payload : exception.message);
      const code =
        typeof responseObj?.code === "string"
          ? responseObj.code
          : status >= HttpStatus.INTERNAL_SERVER_ERROR
            ? "INTERNAL_ERROR"
            : undefined;

      response.status(status).json({
        statusCode: status,
        message,
        ...(code ? { code } : {}),
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
}
