import { NextFunction, Request, Response } from 'express';
import { nanoid } from 'nanoid';

declare module 'express-serve-static-core' {
  interface Request {
    id: string;
  }
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'];
  req.id = typeof incoming === 'string' && incoming.length > 0 ? incoming : nanoid();
  res.setHeader('X-Request-Id', req.id);
  next();
}
