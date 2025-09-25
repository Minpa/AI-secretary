import { Request, Response, NextFunction } from 'express';
import { IntakeService } from '../services/intake.service';
import { ClassificationService } from '../services/classification.service';
import { ApiResponse, IntakeChannel, ApartmentUnitInfo } from '@/shared/types';
import { AppError } from '@/shared/middleware/error-handler';
import { apartmentParser } from '@/shared/services/apartment-parser.service';

export class IntakeController {
  private intakeService: IntakeService;
  private classificationService: ClassificationService;

  constructor() {
    this.intakeService = new IntakeService();
    this.classificationService = new ClassificationService();
  }

  handleSMS = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { from, body, createdAt } = req.body;
      
      if (!from || !body) {
        throw new AppError('Missing required fields: from, body', 400);
      }

      const message = await this.intakeService.processMessage({
        channel: IntakeChannel.SMS,
        content: body,
        sender: from,
        createdAt: createdAt ? new Date(createdAt) : undefined
      });

      const response: ApiResponse = {
        success: true,
        data: message,
        message: 'SMS message processed successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  handleEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { from, subject, body, createdAt } = req.body;
      
      if (!from || !body) {
        throw new AppError('Missing required fields: from, body', 400);
      }

      const content = subject ? `${subject}\n\n${body}` : body;
      
      const message = await this.intakeService.processMessage({
        channel: IntakeChannel.EMAIL,
        content,
        sender: from,
        createdAt: createdAt ? new Date(createdAt) : undefined
      });

      const response: ApiResponse = {
        success: true,
        data: message,
        message: 'Email message processed successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  handleWeb = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, message, createdAt } = req.body;
      
      if (!email || !message) {
        throw new AppError('Missing required fields: email, message', 400);
      }

      const processedMessage = await this.intakeService.processMessage({
        channel: IntakeChannel.WEB,
        content: message,
        sender: email,
        createdAt: createdAt ? new Date(createdAt) : undefined
      });

      const response: ApiResponse = {
        success: true,
        data: processedMessage,
        message: 'Web form submitted successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  handleCall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { caller, transcript, duration, createdAt } = req.body;
      
      if (!caller || !transcript) {
        throw new AppError('Missing required fields: caller, transcript', 400);
      }

      const message = await this.intakeService.processMessage({
        channel: IntakeChannel.CALL,
        content: transcript,
        sender: caller,
        createdAt: createdAt ? new Date(createdAt) : undefined
      });

      const response: ApiResponse = {
        success: true,
        data: message,
        message: 'Call transcript processed successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const messages = await this.intakeService.getMessages(req.query);

      const response: ApiResponse = {
        success: true,
        data: messages
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const message = await this.intakeService.getMessageById(id);

      if (!message) {
        throw new AppError('Message not found', 404);
      }

      const response: ApiResponse = {
        success: true,
        data: message
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  classifyMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const message = await this.classificationService.classifyMessage(id);

      const response: ApiResponse = {
        success: true,
        data: message,
        message: 'Message classified successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const totalMessages = await this.intakeService.getMessageCount();
      const recentMessages = await this.intakeService.getMessages({ limit: 10 });

      const response: ApiResponse = {
        success: true,
        data: {
          totalMessages,
          recentMessages
        }
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        throw new AppError('Status is required', 400);
      }

      const message = await this.intakeService.updateMessageStatus(id, status);

      if (!message) {
        throw new AppError('Message not found', 404);
      }

      const response: ApiResponse = {
        success: true,
        data: message,
        message: 'Message status updated successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}