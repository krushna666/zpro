import { NextFunction, Request, RequestHandler, Response } from 'express';

/** Express 4 doesn't forward rejected promises to the error handler on its own. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
