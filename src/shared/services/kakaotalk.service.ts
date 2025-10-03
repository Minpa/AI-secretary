import { MessageClassification } from '@/shared/types';
import { conversationService } from './conversation.service';
import { logger } from '@/shared/utils/logger';

export class KakaoTalkService {
  
  generateResponse(classification: MessageClassification, priority: string): string {
    const responses = {
      [MessageClassification.EMERGENCY]: '🚨 긴급상황이 접수되었습니다.\n즉시 담당자가 확인하겠습니다.\n추가 연락이 필요한 경우 관리사무소(02-1234-5678)로 연락해 주세요.',
      
      [MessageClassification.COMMON_FACILITY]: '🔧 공용시설 문제가 접수되었습니다.\n정확한 처리를 위해 몇 가지 질문드리겠습니다.',
      
      [MessageClassification.NOISE]: '🔇 소음 민원이 접수되었습니다.\n효과적인 해결을 위해 상세 정보를 수집하겠습니다.',
      
      [MessageClassification.PARKING]: '🚗 주차 관련 문의가 접수되었습니다.\n신속한 처리를 위해 추가 정보가 필요합니다.',
      
      [MessageClassification.HYGIENE]: '🧹 위생 문제가 접수되었습니다.\n담당자가 확인 후 조치하겠습니다.',
      
      [MessageClassification.BILLING]: '💰 관리비 문의가 접수되었습니다.\n회계 담당자가 확인 후 안내드리겠습니다.',
      
      [MessageClassification.ACCESS_CONTROL]: '🔐 출입 통제 요청이 접수되었습니다.\n보안 담당자가 처리하겠습니다.',
      
      [MessageClassification.LANDSCAPING]: '🌳 조경 관리 요청이 접수되었습니다.\n환경 담당자가 확인하겠습니다.',
      
      [MessageClassification.LIGHTING]: '💡 조명 관련 문의가 접수되었습니다.\n시설 담당자가 점검하겠습니다.',
      
      [MessageClassification.SMOKING]: '🚭 간접흡연 피해가 접수되었습니다.\n관리사무소에서 조치하겠습니다.',
      
      [MessageClassification.RESIDENT_DISPUTE]: '⚖️ 입주민 분쟁이 접수되었습니다.\n중재 담당자가 연락드리겠습니다.',
      
      [MessageClassification.STAFF_SERVICE]: '👥 직원 서비스 관련 문의가 접수되었습니다.\n관리팀에서 확인하겠습니다.',
      
      [MessageClassification.UNIT_REPAIR]: '🔨 세대 내 수리 요청이 접수되었습니다.\n기술 담당자가 연락드리겠습니다.',
      
      [MessageClassification.ADMINISTRATION]: '📋 행정 처리 문의가 접수되었습니다.\n담당 부서에서 안내드리겠습니다.',
      
      [MessageClassification.STATUS_INQUIRY]: '📊 처리 상태 문의가 접수되었습니다.\n현재 진행 상황을 확인해 드리겠습니다.',
      
      [MessageClassification.DELIVERY]: '📦 택배/우편물 문의가 접수되었습니다.\n배송 담당자가 확인하겠습니다.',
      
      [MessageClassification.SAFETY]: '🛡️ 안전 점검 요청이 접수되었습니다.\n안전 담당자가 점검하겠습니다.',
      
      [MessageClassification.SCHEDULE]: '📅 일정 문의가 접수되었습니다.\n해당 일정을 확인해 드리겠습니다.',
      
      [MessageClassification.INQUIRY]: '💬 문의사항이 접수되었습니다.\n정확한 답변을 위해 추가 정보를 수집하겠습니다.',
      
      [MessageClassification.COMPLAINT]: '📝 민원이 접수되었습니다.\n신속한 처리를 위해 상세 정보를 확인하겠습니다.',
      
      [MessageClassification.MAINTENANCE]: '🔧 시설 관리 요청이 접수되었습니다.\n담당자가 확인 후 처리하겠습니다.'
    };

    return responses[classification] || '✅ 접수되었습니다.\n담당자가 확인 후 연락드리겠습니다.';
  }

  startConversation(messageId: string, classification: MessageClassification): any {
    const conversationMessage = conversationService.startConversation(messageId, classification);
    
    return {
      message: {
        text: conversationMessage
      },
      keyboard: this.generateKeyboard(classification)
    };
  }

  processConversationResponse(messageId: string, userResponse: string): any {
    const responseMessage = conversationService.processResponse(messageId, userResponse);
    
    // 대화가 완료되었는지 확인
    const isActive = conversationService.isConversationActive(messageId);
    
    return {
      message: {
        text: responseMessage
      },
      keyboard: isActive ? this.generateGenericKeyboard() : null
    };
  }

  private generateKeyboard(classification: MessageClassification): any {
    // 분류별 맞춤 키보드 생성
    const keyboards = {
      [MessageClassification.COMMON_FACILITY]: {
        type: "buttons",
        buttons: [
          "엘리베이터",
          "복도", 
          "주차장",
          "기타"
        ]
      },
      
      [MessageClassification.NOISE]: {
        type: "buttons", 
        buttons: [
          "층간소음",
          "기계실 소음",
          "집회/파티 소리",
          "공사 소음",
          "기타"
        ]
      },
      
      [MessageClassification.PARKING]: {
        type: "buttons",
        buttons: [
          "불법 주차",
          "방문차량 등록", 
          "전기차 충전",
          "주차권 문의",
          "기타"
        ]
      },
      
      [MessageClassification.EMERGENCY]: {
        type: "buttons",
        buttons: [
          "정전",
          "단수",
          "급수 불량", 
          "난방/온수 불량",
          "가스 누출",
          "화재",
          "기타"
        ]
      }
    };

    return keyboards[classification] || this.generateGenericKeyboard();
  }

  private generateGenericKeyboard(): any {
    return {
      type: "buttons",
      buttons: [
        "네",
        "아니오", 
        "모름",
        "기타"
      ]
    };
  }

  isConversationActive(messageId: string): boolean {
    return conversationService.isConversationActive(messageId);
  }
}

export const kakaoTalkService = new KakaoTalkService();