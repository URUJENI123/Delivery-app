import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DbService, mapRow } from '../db/db.service';

const SERVICE_FEE_RWF = 100;

@Injectable()
export class WalletService {
  constructor(private readonly db: DbService) {}

  async getWallet(userId: string) {
    let wallet = await this.db.findOne('wallets', 'userId', userId);
    if (!wallet) {
      wallet = await this.db.create('wallets', { userId, balance: 0 });
    }
    const sb = this.db.getClient();
    const { data: transactions } = await sb
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(50);
    return {
      balance: wallet.balance || 0,
      transactions: transactions ? mapRow(transactions) : [],
    };
  }

  async topUp(userId: string, amount: number, method: string) {
    let wallet = await this.db.findOne('wallets', 'userId', userId);
    if (!wallet) {
      wallet = await this.db.create('wallets', { userId, balance: 0 });
    }
    await this.db.update('wallets', 'id', wallet.id, {
      balance: (wallet.balance || 0) + amount,
    });
    const sb = this.db.getClient();
    const { data: transaction } = await sb
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'credit',
        description: `Top up via ${method}`,
        amount,
      })
      .select()
      .single();
    return transaction || { success: true };
  }

  async withdraw(userId: string, amount: number, method: string) {
    const wallet = await this.db.findOne('wallets', 'userId', userId);
    if (!wallet) throw new NotFoundException('Wallet not found');
    if ((wallet.balance || 0) < amount) {
      throw new BadRequestException('Insufficient balance');
    }
    await this.db.update('wallets', 'id', wallet.id, {
      balance: (wallet.balance || 0) - amount,
    });
    const sb = this.db.getClient();
    const { data: transaction } = await sb
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'withdrawal',
        description: `Withdrawal via ${method}`,
        amount,
      })
      .select()
      .single();
    return transaction || { success: true };
  }

  async creditCourier(courierUserId: string, amount: number, deliveryId: string) {
    const fee = SERVICE_FEE_RWF;
    const netAmount = amount - fee;
    let wallet = await this.db.findOne('wallets', 'userId', courierUserId);
    if (!wallet) {
      wallet = await this.db.create('wallets', { userId: courierUserId, balance: 0 });
    }

    await this.db.update('wallets', 'id', wallet.id, {
      balance: (wallet.balance || 0) + netAmount,
    });

    const sb = this.db.getClient();
    await sb.from('wallet_transactions').insert([
      {
        wallet_id: wallet.id,
        type: 'credit',
        description: `Payment for delivery #${deliveryId.slice(0, 8)}`,
        amount: netAmount,
        reference_type: 'delivery',
        reference_id: deliveryId,
      },
      {
        wallet_id: wallet.id,
        type: 'fee',
        description: `Service fee - Delivery #${deliveryId.slice(0, 8)}`,
        amount: fee,
        reference_type: 'delivery',
        reference_id: deliveryId,
      },
    ]);

    return { netAmount, fee };
  }

  async debitSender(senderUserId: string, amount: number, deliveryId: string) {
    let wallet = await this.db.findOne('wallets', 'userId', senderUserId);
    if (!wallet) {
      wallet = await this.db.create('wallets', { userId: senderUserId, balance: 0 });
    }

    // Don't require balance - this is a placeholder escrow hold
    // In production, the payment gateway would have already charged the sender
    await this.db.update('wallets', 'id', wallet.id, {
      balance: (wallet.balance || 0) - amount,
    });

    const sb = this.db.getClient();
    await sb.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      type: 'debit',
      description: `Payment held in escrow for delivery #${deliveryId.slice(0, 8)}`,
      amount,
      reference_type: 'delivery',
      reference_id: deliveryId,
    });

    return { success: true, amount };
  }
}
