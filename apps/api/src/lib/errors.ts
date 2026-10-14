export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

export const unauthorized = (code = 'errors.unauthorized') => new AppError(401, code);
export const forbidden = (code = 'errors.forbidden') => new AppError(403, code);
export const notFound = (code = 'errors.notFound') => new AppError(404, code);
