export class DeliveryResponseDto {
  id: string;
  trackingCode: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  itemDescription: string;
  category: string;
  size: string;
  quotedPriceRwf: number | null;
  finalPriceRwf: number | null;
  paymentMethod: string;
  paymentStatus: string;
  recipientName: string;
  recipientPhone: string;
  createdAt: Date;
  sender: { id: string; fullName: string | null; phone: string };
  courier?: { id: string; user: { fullName: string | null; phone: string } } | null;
  events?: any[];
}
