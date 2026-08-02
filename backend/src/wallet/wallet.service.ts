import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

const SERVICE_FEE_RWF = 100;

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId, balance: 0 },
        include: { transactions: true },
      });
    }

    return {
      balance: wallet.balance,
      transactions: wallet.transactions,
    };
  }

  async topUp(userId: string, amount: number, method: string) {
    const wallet = await this.upsertWallet(userId);

    const [, transaction] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'credit',
          description: `Top up via ${method}`,
          amount,
        },
      }),
    ]);

    return transaction;
  }

  async withdraw(userId: string, amount: number, method: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.balance < amount) throw new BadRequestException('Insufficient balance');

    const [, transaction] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'withdrawal',
          description: `Withdrawal via ${method}`,
          amount,
        },
      }),
    ]);

    return transaction;
  }

  async creditCourier(courierUserId: string, amount: number, deliveryId: string) {
    const fee = SERVICE_FEE_RWF;
    const netAmount = amount - fee;
    const wallet = await this.upsertWallet(courierUserId);

    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: netAmount } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'credit',
          description: `Payment for delivery #${deliveryId.slice(0, 8)}`,
          amount: netAmount,
          referenceType: 'delivery',
          referenceId: deliveryId,
        },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'fee',
          description: `Service fee - Delivery #${deliveryId.slice(0, 8)}`,
          amount: fee,
          referenceType: 'delivery',
          referenceId: deliveryId,
        },
      }),
    ]);

    return { netAmount, fee };
  }

  async debitSender(senderUserId: string, amount: number, deliveryId: string) {
    const wallet = await this.upsertWallet(senderUserId);

    // Placeholder escrow — no balance check (gateway would handle real charge)
    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'debit',
          description: `Payment held in escrow for delivery #${deliveryId.slice(0, 8)}`,
          amount,
          referenceType: 'delivery',
          referenceId: deliveryId,
        },
      }),
    ]);

    return { success: true, amount };
  }

  private async upsertWallet(userId: string) {
    return this.prisma.wallet.upsert({
      where: { userId },
      create: { userId, balance: 0 },
      update: {},
    });
  }
}
