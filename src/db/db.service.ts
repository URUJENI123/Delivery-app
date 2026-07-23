import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

const SNAKE_TO_CAMEL: Record<string, string> = {
  full_name: 'fullName',
  profile_photo_url: 'profilePhotoUrl',
  email_verified: 'emailVerified',
  phone_verified: 'phoneVerified',
  is_active: 'isActive',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  national_id_number: 'nationalIdNumber',
  motorcycle_plate: 'motorcyclePlate',
  association_code: 'associationCode',
  jacket_serial_number: 'jacketSerialNumber',
  operating_zone: 'operatingZone',
  selfie_url: 'selfieUrl',
  id_photo_url: 'idPhotoUrl',
  vehicle_photo_front_url: 'vehiclePhotoFrontUrl',
  vehicle_photo_rear_url: 'vehiclePhotoRearUrl',
  license_photo_url: 'licensePhotoUrl',
  jacket_photo_url: 'jacketPhotoUrl',
  is_approved_by_admin: 'isApprovedByAdmin',
  admin_notes: 'adminNotes',
  is_online: 'isOnline',
  current_lat: 'currentLat',
  current_lng: 'currentLng',
  last_location_at: 'lastLocationAt',
  total_deliveries: 'totalDeliveries',
  completion_rate: 'completionRate',
  avg_rating: 'avgRating',
  reliability_score: 'reliabilityScore',
  total_earnings: 'totalEarnings',
  emergency_contact_name: 'emergencyContactName',
  emergency_contact_phone: 'emergencyContactPhone',
  momo_number: 'momoNumber',
  momo_provider: 'momoProvider',
  verification_tier: 'verificationTier',
  current_step: 'currentStep',
  total_steps: 'totalSteps',
  is_complete: 'isComplete',
  is_submitted: 'isSubmitted',
  courier_profile: 'courierProfile',
  onboarding_session: 'onboardingSession',
  sender_profile: 'senderProfile',
  user_id: 'userId',
  supabase_id: 'supabaseId',
  tracking_code: 'trackingCode',
  sender_id: 'senderId',
  courier_id: 'courierId',
  pickup_address: 'pickupAddress',
  pickup_lat: 'pickupLat',
  pickup_lng: 'pickupLng',
  pickup_notes: 'pickupNotes',
  dropoff_address: 'dropoffAddress',
  dropoff_lat: 'dropoffLat',
  dropoff_lng: 'dropoffLng',
  dropoff_notes: 'dropoffNotes',
  distance_km: 'distanceKm',
  item_description: 'itemDescription',
  estimated_value_rwf: 'estimatedValueRwf',
  is_fragile: 'isFragile',
  requires_recipient_otp: 'requiresRecipientOtp',
  pickup_contact_name: 'pickupContactName',
  pickup_contact_phone: 'pickupContactPhone',
  recipient_name: 'recipientName',
  recipient_phone: 'recipientPhone',
  scheduled_pickup_at: 'scheduledPickupAt',
  prefer_asap: 'preferAsap',
  quoted_price_rwf: 'quotedPriceRwf',
  final_price_rwf: 'finalPriceRwf',
  payment_method: 'paymentMethod',
  payment_status: 'paymentStatus',
  pickup_otp_hash: 'pickupOtpHash',
  dropoff_otp_hash: 'dropoffOtpHash',
  recipient_tracking_token: 'recipientTrackingToken',
  broadcast_expires_at: 'broadcastExpiresAt',
  assignment_expires_at: 'assignmentExpiresAt',
  pickup_photo_url: 'pickupPhotoUrl',
  dropoff_photo_url: 'dropoffPhotoUrl',
  recipient_signature_url: 'recipientSignatureUrl',
  picked_up_at: 'pickedUpAt',
  delivered_at: 'deliveredAt',
  cancelled_at: 'cancelledAt',
  proposed_price_rwf: 'proposedPriceRwf',
  eta_minutes: 'etaMinutes',
  is_selected: 'isSelected',
  expressed_at: 'expressedAt',
  event_type: 'eventType',
  occurred_at: 'occurredAt',
  is_template: 'isTemplate',
  read_at: 'readAt',
  sent_at: 'sentAt',
  giver_id: 'giverId',
  receiver_id: 'receiverId',
  raised_by_id: 'raisedById',
  evidence_urls: 'evidenceUrls',
  resolved_at: 'resolvedAt',
  business_name: 'businessName',
  business_type: 'businessType',
  default_pickup_address: 'defaultPickupAddress',
  preferred_contact_method: 'preferredContactMethod',
  pickup_email: 'pickupEmail',
  dropoff_email: 'dropoffEmail',
  agreed_price_rwf: 'agreedPriceRwf',
  agreed_delivery_time: 'agreedDeliveryTime',
  payment_held_at: 'paymentHeldAt',
  payment_released_at: 'paymentReleasedAt',
  otp_verified_at: 'otpVerifiedAt',
  delivery_started_at: 'deliveryStartedAt',
  courier_arrived_at: 'courierArrivedAt',
  dropoff_otp_sent_at: 'dropoffOtpSentAt',
  wallet_id: 'walletId',
  reference_type: 'referenceType',
  reference_id: 'referenceId',
  service_fee_rwf: 'serviceFeeRwf',
};

const CAMEL_TO_SNAKE: Record<string, string> = {};
for (const [snake, camel] of Object.entries(SNAKE_TO_CAMEL)) {
  CAMEL_TO_SNAKE[camel] = snake;
}

function keysToSnake(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(keysToSnake);
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snake = (CAMEL_TO_SNAKE as any)[key] || key;
    result[snake] = value !== null && typeof value === 'object' && !(value instanceof Date) ? keysToSnake(value) : value;
  }
  return result;
}

export function mapRow(row: any): any {
  if (!row || typeof row !== 'object') return row;
  if (Array.isArray(row)) return row.map(mapRow);
  const mapped: any = {};
  for (const [key, value] of Object.entries(row)) {
    const camel = (SNAKE_TO_CAMEL as any)[key] || key;
    mapped[camel] = value !== null && typeof value === 'object' && !(value instanceof Date) ? mapRow(value) : value;
  }
  return mapped;
}

@Injectable()
export class DbService {
  private readonly logger = new Logger(DbService.name);
  private supabase: any;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      this.logger.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — DB operations will fail');
    }
    // Use a dummy URL when not configured so createClient doesn't throw at startup.
    // All queries will fail gracefully at runtime instead of crashing the server.
    const safeUrl = (url && !url.includes('placeholder')) ? url : 'https://placeholder.supabase.co';
    const safeKey = (key && !key.includes('placeholder')) ? key : 'placeholder-key';
    this.supabase = createClient(safeUrl, safeKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  async findOne(table: string, column: string, value: any) {
    const snakeColumn = (CAMEL_TO_SNAKE as any)[column] || column;
    const { data, error } = await this.supabase
      .from(table)
      .select('*')
      .eq(snakeColumn, value)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');
    return data ? mapRow(data) : null;
  }

  async findMany(table: string, query?: { column?: string; value?: any; orderBy?: string; orderDir?: 'asc' | 'desc'; limit?: number }) {
    let q: any = this.supabase.from(table).select('*');
    if (query?.column && query?.value !== undefined) {
      const snakeColumn = (CAMEL_TO_SNAKE as any)[query.column] || query.column;
      q = q.eq(snakeColumn, query.value);
    }
    if (query?.orderBy) {
      const snakeOrderBy = (CAMEL_TO_SNAKE as any)[query.orderBy] || query.orderBy;
      q = q.order(snakeOrderBy, { ascending: query.orderDir !== 'desc' });
    }
    if (query?.limit) q = q.limit(query.limit);
    const { data, error } = await q;
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');
    return data ? mapRow(data) : [];
  }

  async create(table: string, data: any) {
    const snakeData = keysToSnake(data);
    const { data: result, error } = await this.supabase
      .from(table)
      .insert(snakeData)
      .select()
      .single();
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');
    return result ? mapRow(result) : null;
  }

  async update(table: string, column: string, value: any, data: any) {
    const snakeColumn = (CAMEL_TO_SNAKE as any)[column] || column;
    const snakeData = keysToSnake(data);
    const { data: result, error } = await this.supabase
      .from(table)
      .update(snakeData)
      .eq(snakeColumn, value)
      .select()
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');
    return result ? mapRow(result) : null;
  }

  async delete(table: string, column: string, value: any) {
    const snakeColumn = (CAMEL_TO_SNAKE as any)[column] || column;
    const { error } = await this.supabase
      .from(table)
      .delete()
      .eq(snakeColumn, value);
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');
  }

  async findOneWithJoin(table: string, column: string, value: any, joins: string[]) {
    const snakeColumn = (CAMEL_TO_SNAKE as any)[column] || column;
    const selectStr = joins.length ? `*, ${joins.join(', ')}` : '*';
    const { data, error } = await this.supabase
      .from(table)
      .select(selectStr)
      .eq(snakeColumn, value)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');
    return data ? mapRow(data) : null;
  }

  getClient() {
    return this.supabase;
  }
}
