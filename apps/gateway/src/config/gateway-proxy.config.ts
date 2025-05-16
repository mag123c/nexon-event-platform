import { registerAs } from '@nestjs/config';

export default registerAs('gateway', () => ({
  internalApiKey:
    process.env.GATEWAY_INTERNAL_API_KEY || 'default-internal-api-key',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:5173',
  eventServiceUrl: process.env.EVENT_SERVICE_URL || 'http://localhost:6173',
}));
