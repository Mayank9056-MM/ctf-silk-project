import { ErrorCode } from "./ErrorCode";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: unknown,
  ) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, ApiError);
  }

  static badRequest(
    code: ErrorCode,
    message: string,
    details?: unknown,
  ): ApiError {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(
    code: ErrorCode,
    message: string,
  ): ApiError {
    return new ApiError(401, code, message);
  }

  static forbidden(
    code: ErrorCode,
    message: string,
  ): ApiError {
    return new ApiError(403, code, message);
  }

  static notFound(
    code: ErrorCode,
    message: string,
  ): ApiError {
    return new ApiError(404, code, message);
  }

  static conflict(
    code: ErrorCode,
    message: string,
  ): ApiError {
    return new ApiError(409, code, message);
  }

  static unprocessable(
    code: ErrorCode,
    message: string,
    details?: unknown,
  ): ApiError {
    return new ApiError(422, code, message, details);
  }

  static tooManyRequests(
    code: ErrorCode,
    message: string,
  ): ApiError {
    return new ApiError(429, code, message);
  }

  static internal(
    message = "Internal server error",
  ): ApiError {
    return new ApiError(
      500,
      ErrorCode.INTERNAL_SERVER_ERROR,
      message,
    );
  }
}