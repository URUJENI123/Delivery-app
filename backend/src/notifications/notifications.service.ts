import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private async sendSms(phone: string, message: string) {
    this.logger.log(`[SMS] To: ${phone}, Message: ${message}`);
    return { success: true };
  }

  private async sendWhatsApp(phone: string, message: string) {
    this.logger.log(`[WhatsApp] To: ${phone}, Message: ${message}`);
    return { success: true };
  }

  private async sendEmail(email: string, subject: string, body: string) {
    this.logger.log(`[Email] To: ${email}, Subj: ${subject}, Body: ${body}`);
    return { success: true };
  }

  async sendOtp(phone: string, otp: string, email?: string) {
    const msg = `Your Delivery verification code is: ${otp}. Valid for 30 minutes.`;
    await this.sendSms(phone, msg);
    await this.sendWhatsApp(phone, msg);
    if (email) await this.sendEmail(email, 'Delivery OTP Code', msg);
  }

  async notifyJobAvailable(phone: string, pickupAddress: string) {
    await this.sendSms(phone, `New delivery job available nearby! Pickup: ${pickupAddress}. Check the app to accept.`);
  }

  async notifyCourierAccepted(phone: string, courierName: string) {
    await this.sendSms(phone, `${courierName} has accepted your delivery. Chat with them in the app.`);
  }

  async notifyDeliveryStarted(phone: string) {
    await this.sendSms(phone, `Your courier is on the way! Track live in the app.`);
  }

  async notifyDeliveryCompleted(phone: string, courierName: string) {
    const msg = `Your delivery from ${courierName} is complete! Please rate your courier in the app.`;
    await this.sendSms(phone, msg);
    await this.sendWhatsApp(phone, msg);
  }

  async notifyMoneyReceived(phone: string, amount: number) {
    await this.sendSms(phone, `RWF ${amount.toLocaleString()} has been credited to your wallet. Withdraw to MoMo anytime.`);
  }
}
