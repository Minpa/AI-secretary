import { Request, Response, NextFunction } from 'express';
import { IntakeService } from '../services/intake.service';
import { ClassificationService } from '../services/classification.service';
import { ApiResponse, IntakeChannel, ApartmentUnitInfo, MessageClassification } from '@/shared/types';
import { AppError } from '@/shared/middleware/error-handler';
import { apartmentParser } from '@/shared/services/apartment-parser.service';
import { kakaoTalkService } from '@/shared/services/kakaotalk.service';

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

      // Generate appropriate KakaoTalk response with conversation
      const classification = message.classification || MessageClassification.INQUIRY;
      const kakaoResponse = kakaoTalkService.startConversation(message.id, classification);

      // Respond with KakaoTalk format
      const response = {
        success: true,
        data: message,
        message: 'KakaoTalk message processed successfully',
        kakaoResponse
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  private autoClassifyMessage(content: string): MessageClassification {
    const lowerContent = content.toLowerCase();

    // 긴급상황 키워드
    if (lowerContent.includes('응급') || lowerContent.includes('긴급') || 
        lowerContent.includes('위험') || lowerContent.includes('화재') || 
        lowerContent.includes('가스') || lowerContent.includes('정전') ||
        lowerContent.includes('단수') || lowerContent.includes('누출')) {
      return MessageClassification.EMERGENCY;
    }

    // 공용시설 키워드
    if (lowerContent.includes('엘리베이터') || lowerContent.includes('복도') || 
        lowerContent.includes('주차장') || lowerContent.includes('고장') || 
        lowerContent.includes('파손') || lowerContent.includes('수리')) {
      return MessageClassification.COMMON_FACILITY;
    }

    // 소음 키워드
    if (lowerContent.includes('소음') || lowerContent.includes('시끄') || 
        lowerContent.includes('층간') || lowerContent.includes('기계실')) {
      return MessageClassification.NOISE;
    }

    // 주차 키워드
    if (lowerContent.includes('주차') || lowerContent.includes('차량') || 
        lowerContent.includes('불법') || lowerContent.includes('방문차')) {
      return MessageClassification.PARKING;
    }

    // 위생 키워드
    if (lowerContent.includes('악취') || lowerContent.includes('곰팡이') || 
        lowerContent.includes('해충') || lowerContent.includes('벌레') || 
        lowerContent.includes('쓰레기')) {
      return MessageClassification.HYGIENE;
    }

    // 관리비 키워드
    if (lowerContent.includes('관리비') || lowerContent.includes('요금') || 
        lowerContent.includes('청구') || lowerContent.includes('납부')) {
      return MessageClassification.BILLING;
    }

    // 출입통제 키워드
    if (lowerContent.includes('비밀번호') || lowerContent.includes('출입') || 
        lowerContent.includes('현관') || lowerContent.includes('카드')) {
      return MessageClassification.ACCESS_CONTROL;
    }

    // 조경 키워드
    if (lowerContent.includes('정원') || lowerContent.includes('놀이터') || 
        lowerContent.includes('운동시설') || lowerContent.includes('조경')) {
      return MessageClassification.LANDSCAPING;
    }

    // 조명 키워드
    if (lowerContent.includes('조명') || lowerContent.includes('전등') || 
        lowerContent.includes('점등') || lowerContent.includes('소등')) {
      return MessageClassification.LIGHTING;
    }

    // 흡연 키워드
    if (lowerContent.includes('흡연') || lowerContent.includes('담배') || 
        lowerContent.includes('베란다')) {
      return MessageClassification.SMOKING;
    }

    // 택배 키워드
    if (lowerContent.includes('택배') || lowerContent.includes('우편') || 
        lowerContent.includes('배송') || lowerContent.includes('분실')) {
      return MessageClassification.DELIVERY;
    }

    // 안전 키워드
    if (lowerContent.includes('안전') || lowerContent.includes('비상벨') || 
        lowerContent.includes('cctv') || lowerContent.includes('소화기')) {
      return MessageClassification.SAFETY;
    }

    return MessageClassification.INQUIRY; // 기본값
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

  handleSMSResponse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { from, body, messageId } = req.body;
      
      if (!from || !body || !messageId) {
        throw new AppError('Missing required fields: from, body, messageId', 400);
      }

      // Process conversation response
      await this.intakeService.processSMSResponse(from, messageId, body);

      const response: ApiResponse = {
        success: true,
        message: 'SMS conversation response processed successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  handleKakaoTalkResponse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user_key, content, messageId } = req.body;
      
      if (!user_key || !content || !messageId) {
        throw new AppError('Missing required fields: user_key, content, messageId', 400);
      }

      // Process KakaoTalk conversation response
      const kakaoResponse = kakaoTalkService.processConversationResponse(messageId, content);

      const response = {
        success: true,
        message: 'KakaoTalk conversation response processed successfully',
        kakaoResponse
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}