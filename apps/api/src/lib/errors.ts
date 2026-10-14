export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

export const notFound = (code = 'errors.notFound') => new AppError(404, code);
