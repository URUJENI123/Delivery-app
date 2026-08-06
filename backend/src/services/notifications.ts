/** Stub notification service — replace with real SMS/WhatsApp/email providers */
const log = (channel: string, to: string, msg: string) =>
  console.log(`[${channel}] To: ${to} | ${msg}`);

export async function sendOtp(phone: string, otp: string, email?: string) {
  const msg = `Your Delivery verification code is: ${otp}. Valid for 10 minutes.`;
  log('SMS',      phone, msg);
  log('WhatsApp', phone, msg);
  if (email) log('Email', email, msg);
}

export async function notifyJobAvailable(phone: string, pickupAddress: string) {
  log('SMS', phone, `New delivery job nearby! Pickup: ${pickupAddress}. Open the app to accept.`);
}

export async function notifyCourierAccepted(phone: string, courierName: string) {
  log('SMS', phone, `${courierName} has accepted your delivery. Chat with them in the app.`);
}

export async function notifyDeliveryStarted(phone: string) {
  log('SMS', phone, `Your courier is on the way! Track live in the app.`);
}

export async function notifyDeliveryCompleted(phone: string, courierName: string) {
  const msg = `Your delivery by ${courierName} is complete! Please rate your courier in the app.`;
  log('SMS',      phone, msg);
  log('WhatsApp', phone, msg);
}

export async function notifyMoneyReceived(phone: string, amount: number) {
  log('SMS', phone, `RWF ${amount.toLocaleString()} credited to your wallet. Withdraw to MoMo anytime.`);
}

export async function notifyRefundApproved(phone: string, amount: number, name: string) {
  const msg = `Hi ${name}, your refund of RWF ${amount.toLocaleString()} has been approved and sent to your MoMo. Thank you for using Delivery App.`;
  log('SMS',      phone, msg);
  log('WhatsApp', phone, msg);
}

export async function notifyRefundRequested(senderName: string, amount: number, deliveryRef: string) {
  log('ADMIN', 'admin@delivery.app',
    `NEW REFUND REQUEST — ${senderName} requested RWF ${amount.toLocaleString()} for delivery #${deliveryRef}. Review it in the admin panel.`);
}

export async function notifyRefundRejected(phone: string, reason: string) {
  const msg = `Your refund request has been reviewed. Decision: ${reason}. Contact support if you have questions.`;
  log('SMS', phone, msg);
}
