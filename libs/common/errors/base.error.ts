import { isProduction } from 'libs/common/utils/env';

export abstract class BaseError extends Error {
  constructor(
    public readonly status: number,
    public readonly message: string,
    public readonly extra?: Record<string, any>,
    public readonly logLevel: 'warn' | 'error' = 'error',
  ) {
    super(message);
    Error.captureStackTrace(this, new.target);
  }

  toJSON() {
    const base = {
      result: 'failed',
      message: this.message,
      ...(this.extra && { extra: this.extra }),
    };

    if (!isProduction()) {
      return {
        ...base,
        stack: this.stack,
      };
    }

    return base;
  }
}
