import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include tenantId
declare module 'express' {
  interface Request {
    tenantId?: number;
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantHeader = req.headers['x-tenant-id'];
    
    if (tenantHeader && typeof tenantHeader === 'string') {
      const parsed = parseInt(tenantHeader, 10);
      if (!isNaN(parsed)) {
        req.tenantId = parsed;
      }
    }
    
    next();
  }
}
