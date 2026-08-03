import { Request, Response, NextFunction } from 'express';
import * as chatService from '../services/chat';

export async function getConversations(req: Request, res: Response, next: NextFunction) {
  try { res.json(await chatService.getConversations(req.user!.id)); }
  catch (err) { next(err); }
}

export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try { res.json(await chatService.getMessages(req.params.id, req.user!.id)); }
  catch (err) { next(err); }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await chatService.sendMessage(req.params.id, req.user!.id, req.body)); }
  catch (err) { next(err); }
}
