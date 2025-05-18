import { JwtPayload } from '@app/common/interfaces/jwt-payload.interface';

export interface InternalUserContext extends Omit<JwtPayload, 'email'> {}
