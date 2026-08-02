import { Controller, Get, Post, Put, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { CouriersService } from './couriers.service';
import { RegisterCourierDto, UpdateCourierDto, ToggleOnlineDto, UpdateLocationDto, NearbyQueryDto } from './dto/register-courier.dto';
import { StartOnboardingDto, SaveOnboardingStepDto, SubmitOnboardingDto } from './dto/onboarding.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../types';

@Controller('couriers')
export class CouriersController {
  constructor(private readonly couriersService: CouriersService) {}

  @Post('register')
  @UseGuards(SupabaseAuthGuard)
  async register(@CurrentUser() user: User, @Body() dto: RegisterCourierDto) {
    return this.couriersService.register(user.id, dto);
  }

  @Post('onboarding/start')
  @UseGuards(SupabaseAuthGuard)
  async startOnboarding(@CurrentUser() user: User, @Body() dto: StartOnboardingDto) {
    return this.couriersService.startOnboarding(user.id, dto);
  }

  @Put('onboarding/step')
  @UseGuards(SupabaseAuthGuard)
  async saveOnboardingStep(@CurrentUser() user: User, @Body() dto: SaveOnboardingStepDto) {
    return this.couriersService.saveOnboardingStep(user.id, dto);
  }

  @Get('onboarding/status')
  @UseGuards(SupabaseAuthGuard)
  async getOnboardingStatus(@CurrentUser() user: User) {
    return this.couriersService.getOnboardingStatus(user.id);
  }

  @Post('onboarding/submit')
  @UseGuards(SupabaseAuthGuard)
  async submitOnboarding(@CurrentUser() user: User, @Body() dto: SubmitOnboardingDto) {
    return this.couriersService.submitOnboarding(user.id, dto);
  }

  @Put('me')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateCourierDto) {
    return this.couriersService.updateProfile(user.id, dto);
  }

  @Put('me/online')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  async toggleOnline(@CurrentUser() user: User, @Body() dto: ToggleOnlineDto) {
    return this.couriersService.toggleOnline(user.id, dto);
  }

  @Put('me/location')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  async updateLocation(@CurrentUser() user: User, @Body() dto: UpdateLocationDto) {
    return this.couriersService.updateLocation(user.id, dto);
  }

  @Get('me/jobs')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  async getJobs(@CurrentUser() user: User) {
    return this.couriersService.getJobs(user.id);
  }

  @Get('dashboard')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  async getDashboard(@CurrentUser() user: User) {
    return this.couriersService.getDashboard(user.id);
  }

  @Get('me/earnings')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  async getEarnings(@CurrentUser() user: User) {
    return this.couriersService.getEarnings(user.id);
  }

  @Get('nearby')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findNearby(@Query() query: NearbyQueryDto) {
    return this.couriersService.findNearby(query.lat, query.lng, query.radiusKm);
  }
}
