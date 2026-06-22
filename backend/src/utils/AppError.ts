/**
 * Lỗi nghiệp vụ có chủ đích — được error middleware nhận diện để trả status phù hợp.
 * Phân biệt với lỗi hệ thống không lường trước (sẽ trả 500).
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message = 'Yêu cầu không hợp lệ', details?: unknown) {
    return new AppError(400, message, details);
  }
  static unauthorized(message = 'Chưa xác thực') {
    return new AppError(401, message);
  }
  static forbidden(message = 'Không có quyền truy cập') {
    return new AppError(403, message);
  }
  static notFound(message = 'Không tìm thấy tài nguyên') {
    return new AppError(404, message);
  }
  static conflict(message = 'Dữ liệu bị xung đột') {
    return new AppError(409, message);
  }
}
