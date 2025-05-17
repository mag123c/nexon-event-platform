import { ApiInternalHeaders } from '@app/common/decorators/api-internal-headers.decorator';
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@ApiInternalHeaders()
@Controller('users')
export class UserController {
  constructor() {}
}
