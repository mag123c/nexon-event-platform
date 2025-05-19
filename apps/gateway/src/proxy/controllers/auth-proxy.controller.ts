import { LoginRequestDto } from '@app/auth/presentation/dtos/request/login-user.request.dto';
import { RegisterUserRequestDto } from '@app/auth/presentation/dtos/request/register-user.request.dto';
import { JwtResponseDto } from '@app/auth/presentation/dtos/response/jwt.response.dto';
import { UserResponseDto } from '@app/auth/presentation/dtos/response/user.response.dto';
import gatewayConfig from '@app/gateway/config/gateway-proxy.config';
import {
  ProxyRequestOptions,
  ProxyRequestService,
} from '@app/gateway/proxy/services/proxy-request.service';
import {
  Controller,
  Req,
  Res,
  Inject,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';

@ApiTags('Gateway - Auth Service Proxy')
@Controller('auth')
export class AuthProxyController {
  constructor(
    private readonly proxyRequestService: ProxyRequestService,
    @Inject(gatewayConfig.KEY)
    private readonly config: ConfigType<typeof gatewayConfig>,
  ) {}

  // 공통 핸들러 로직
  private async handleAuthProxy(
    req: Request,
    res: Response,
    serviceUrl: string,
    options: ProxyRequestOptions,
  ) {
    const serviceResponse = await this.proxyRequestService.forwardRequest(
      req,
      serviceUrl,
      options,
    );
    res.status(serviceResponse.status).json(serviceResponse.data);
  }

  @ApiOperation({
    summary: '회원가입',
    description: '회원가입 및 로그인은 모든 사용자에게 공개됩니다.',
  })
  @ApiBody({ type: RegisterUserRequestDto })
  @ApiCreatedResponse({
    description: '회원가입 성공',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict (ex. 이미 존재하는 회원)',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error (ex. 비밀번호 암호화 실패, DB 오류)',
  })
  @Post('register')
  async register(@Req() req: Request, @Res() res: Response) {
    await this.handleAuthProxy(req, res, this.config.authServiceUrl, {
      stripPrefix: '/api/v1',
      injectUserInfo: false,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '로그인',
    description: '로그인은 모든 사용자에게 공개됩니다.',
  })
  @ApiBody({ type: LoginRequestDto })
  @ApiOkResponse({
    type: JwtResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (비밀번호 불일치 시).',
  })
  @ApiResponse({ status: 404, description: 'Not Found (사용자가 없을 때)' })
  async login(@Req() req: Request, @Res() res: Response) {
    await this.handleAuthProxy(req, res, this.config.authServiceUrl, {
      stripPrefix: '/api/v1',
      injectUserInfo: false,
    });
  }
}
