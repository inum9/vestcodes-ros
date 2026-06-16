import { Controller, Post, Body, Get, UseGuards, Request, Param, Query, ParseIntPipe, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Staff login — returns JWT access token */
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  /** Return current authenticated user info */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req) {
    return req.user;
  }

  /**
   * Validate a customer table token.
   * Called by the frontend when the customer lands on the table ordering page.
   * If the token is invalid (forged/wrong table), returns 401.
   */
  @Get('table/:tableId/verify')
  async verifyTable(
    @Param('tableId', ParseIntPipe) tableId: number,
    @Query('t') token: string,
  ) {
    if (!token) throw new UnauthorizedException('Missing table token');
    const table = await this.authService.verifyTableToken(tableId, token);
    return {
      valid: true,
      tableId: table.id,
      tableNumber: table.number,
      restaurantId: table.restaurantId,
      restaurantName: table.restaurant.name,
      currency: table.restaurant.currency,
    };
  }
}
