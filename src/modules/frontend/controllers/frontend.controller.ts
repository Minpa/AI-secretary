import { Request, Response, NextFunction } from 'express';
import path from 'path';

export class FrontendController {
  getHomePage = (req: Request, res: Response, next: NextFunction): void => {
    try {
      res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
    } catch (error) {
      next(error);
    }
  };

  getDashboard = (req: Request, res: Response, next: NextFunction): void => {
    try {
      res.sendFile(path.join(process.cwd(), 'public', 'dashboard.html'));
    } catch (error) {
      next(error);
    }
  };

  getTestPage = (req: Request, res: Response, next: NextFunction): void => {
    try {
      res.sendFile(path.join(process.cwd(), 'public', 'test.html'));
    } catch (error) {
      next(error);
    }
  };
}