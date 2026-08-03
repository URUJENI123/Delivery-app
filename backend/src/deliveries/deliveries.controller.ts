import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto, InterestDto, CompleteDeliveryDto, TakeJobDto, ConfirmAgreementDto, ArrivedAtPickupDto, CreateRatingDto, PayDto } from './dto/create-delivery.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../types';

@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SENDER)
  async create(@CurrentUser() user: User, @Body() dto: CreateDeliveryDto) {
    return this.deliveriesService.create(user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@CurrentUser() user: User) {
    return this.deliveriesService.findAll(user.id, user.role);
  }

  @Get('available')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  async getAvailable(@CurrentUser() user: User) {
    return this.deliveriesService.getNearbyAvailable(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.deliveriesService.findOne(id, user.id);
  }

  @Post(':id/interest')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  async expressInterest(
    @Param('id') id: string,
    @Body() dto: InterestDto,
    @CurrentUser() user: User,
  ) {
    return this.deliveriesService.expressInterest(id, user.id, dto);
  }

  // NEW FLOW ENDPOINTS

  @Post(':id/take-job')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  async takeJob(
    @Param('id') id: string,
    @Body() dto: TakeJobDto,
    @CurrentUser() user: User,
  ) {
    return this.deliveriesService.takeJob(id, user.id, dto.proposedPriceRwf);
  }

  @Post(':id/confirm-agreement')
  @UseGuards(JwtAuthGuard)
  async confirmAgreement(
    @Param('id') id: string,
    @Body() dto: ConfirmAgreementDto,
    @CurrentUser() user: User,
  ) {
    return this.deliveriesService.confirmAgreement(id, user.id, dto.agreedPriceRwf, dto.agreedDeliveryTime);
  }

  @Post(':id/pay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SENDER)
  async pay(
    @Param('id') id: string,
    @Body() dto: PayDto,
    @CurrentUser() user: User,
  ) {
    return this.deliveriesService.submitPayment(id, user.id, dto.agreedDeliveryTime);
  }

  @Post(':id/arrived')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  async arrived(@Param('id') id: string, @CurrentUser() user: User) {
    return this.deliveriesService.courierArrived(id, user.id);
  }

  @Post(':id/start-delivery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  async startDelivery(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.deliveriesService.startDelivery(id, user.id);
  }

  @Post(':id/picked-up')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  async pickedUp(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.deliveriesService.pickedUp(id, user.id);
  }

  @Post(':id/in-transit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  async inTransit(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.deliveriesService.inTransit(id, user.id);
  }

  @Post(':id/arrived-pickup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  async arrivedAtPickup(
    @Param('id') id: string,
    @Body() dto: ArrivedAtPickupDto,
    @CurrentUser() user: User,
  ) {
    return this.deliveriesService.arrivedAtPickup(id, user.id, dto.otp);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  async completeDelivery(
    @Param('id') id: string,
    @Body() dto: CompleteDeliveryDto,
    @CurrentUser() user: User,
  ) {
    return this.deliveriesService.completeDelivery(id, user.id, dto.otp);
  }

  @Post(':id/rate')
  @UseGuards(JwtAuthGuard)
  async createRating(
    @Param('id') id: string,
    @Body() dto: CreateRatingDto,
    @CurrentUser() user: User,
  ) {
    return this.deliveriesService.createRating(id, user.id, dto.stars, dto.comment);
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SENDER)
  async cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.deliveriesService.cancel(id, user.id);
  }
}
