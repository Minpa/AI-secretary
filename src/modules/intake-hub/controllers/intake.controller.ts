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

      // Send AI response to gather more details
      await this.intakeService.sendSMSDetailRequest(from, message);

      const response: ApiResponse = {
        success: true,
        data: message,
        message: 'SMS message processed successfully with AI response sent'
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

  handleTwilioCall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { From, TranscriptionText, CallDuration, CallSid } = req.body;
      
      if (!From || !TranscriptionText) {
        throw new AppError('Missing required Twilio fields', 400);
      }

      const message = await this.intakeService.processMessage({
        channel: IntakeChannel.CALL,
        content: TranscriptionText,
        sender: From,
        metadata: {
          callSid: CallSid,
          duration: CallDuration
        }
      });

      // Respond to Twilio with Korean TwiML
      res.set('Content-Type', 'text/xml');
      res.send(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice" language="ko-KR">
            접수되었습니다. 빠른 시일 내에 연락드리겠습니다.
          </Say>
          <Hangup/>
        </Response>
      `);
    } catch (error) {
      next(error);
    }
  };

  handleKakaoTalk = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user_key, content, type, createdAt } = req.body;
      
      if (!user_key || !content) {
        throw new AppError('Missing required fields: user_key, content', 400);
      }

      const message = await this.intakeService.processMessage({
        channel: IntakeChannel.KAKAOTALK,
        content: content,
        sender: user_key,
        createdAt: createdAt ? new Date(createdAt) : undefined,
        metadata: {
          messageType: type
        }
      });

      // Generate appropriate KakaoTalk response based on classification
      const classification = message.classification || 'inquiry';
      const kakaoResponse = this.generateKakaoTalkResponse(classification, message.priority);

      // Respond with KakaoTalk format
      const response = {
        success: true,
        data: message,
        message: 'KakaoTalk message processed successfully',
        kakaoResponse: {
          message: {
            text: kakaoResponse
          }
        }
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  private generateKakaoTalkResponse(classification: string, priority: string): string {
    const responses = {
      emergency: '🚨 긴급상황이 접수되었습니다.\n즉시 담당자가 확인하겠습니다.\n추가 연락이 필요한 경우 관리사무소(02-1234-5678)로 연락해 주세요.',
      maintenance: '🔧 시설 관련 문의가 접수되었습니다.\n정확한 처리를 위해 다음 정보를 알려주세요:\n\n1️⃣ 정확한 위치 (동/호수)\n2️⃣ 문제 상황 상세 설명\n3️⃣ 긴급도 (긴급/보통)',
      complaint: '📝 민원이 접수되었습니다.\n신속한 처리를 위해 추가 정보를 알려주세요:\n\n1️⃣ 발생 위치\n2️⃣ 발생 시간\n3️⃣ 구체적인 상황',
      inquiry: '💬 문의사항이 접수되었습니다.\n정확한 답변을 위해 다음을 알려주세요:\n\n1️⃣ 문의 내용 상세\n2️⃣ 연락 가능한 시간\n3️⃣ 회신 방법 선택',
      default: '✅ 접수되었습니다.\n더 정확한 처리를 위해 상세한 정보를 알려주시면 신속히 처리하겠습니다.'
    };

    return responses[classification as keyof typeof responses] || responses.default;
  }

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