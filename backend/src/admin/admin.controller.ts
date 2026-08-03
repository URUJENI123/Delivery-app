import { Controller, Get, Put, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { VerifyCourierDto, SuspendCourierDto } from './dto/verify-courier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../types';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('couriers')
  async listCouriers(
    @Query('tier') tier?: string,
    @Query('approved') approved?: string,
    @Query('zone') zone?: string,
  ) {
    return this.adminService.listCouriers({ tier, approved, zone });
  }

  @Put('couriers/:id/verify')
  async verifyCourier(@Param('id') id: string, @Body() dto: VerifyCourierDto) {
    return this.adminService.verifyCourier(id, dto);
  }

  @Put('couriers/:id/suspend')
  async suspendCourier(@Param('id') id: string, @Body() dto: SuspendCourierDto) {
    return this.adminService.suspendCourier(id, dto);
  }

  @Get('users')
  async listUsers(
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers({ role, search });
  }

  @Get('deliveries')
  async listDeliveries(
    @Query('status') status?: string,
    @Query('zone') zone?: string,
  ) {
    return this.adminService.listDeliveries({ status, zone });
  }

  @Get('disputes')
  async listDisputes() {
    return this.adminService.listDisputes();
  }

  @Put('disputes/:id')
  async updateDispute(
    @Param('id') id: string,
    @Body() dto: { status?: string; resolution?: string },
  ) {
    return this.adminService.updateDispute(id, dto);
  }

  @Get('live-map')
  async getLiveMap() {
    return this.adminService.getLiveMap();
  }
}
