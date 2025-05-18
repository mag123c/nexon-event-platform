import { HttpException, HttpStatus } from '@nestjs/common';

export interface ExternalServiceErrorDetails {
  serviceName: string;
  originalStatus?: number;
  originalError?: any;
  context?: {
    [key: string]: any;
  };
}

export class ExternalServiceCommsException extends HttpException {
  public readonly details: ExternalServiceErrorDetails;

  constructor(
    message: string,
    serviceDetails: {
      service: string;
      status?: number;
      cause?: Error | any;
      description?: string;
    },
    httpStatus: HttpStatus = HttpStatus.SERVICE_UNAVAILABLE,
  ) {
    const responseMessage =
      serviceDetails.description ||
      `외부 서비스(${serviceDetails.service}) 통신 중 오류가 발생했습니다.`;
    super(responseMessage, httpStatus);

    this.details = {
      serviceName: serviceDetails.service,
      originalStatus: serviceDetails.status,
      originalError: serviceDetails.cause,
      context: {
        description: serviceDetails.description,
        status: serviceDetails.status,
        cause: serviceDetails.cause,
      },
    };

    this.message = message;
  }

  public getServiceName(): string {
    return this.details.serviceName;
  }

  public getOriginalStatus(): number | undefined {
    return this.details.originalStatus;
  }

  public getOriginalError(): any {
    return this.details.originalError;
  }
}
