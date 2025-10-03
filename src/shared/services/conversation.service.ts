import { MessageClassification } from '@/shared/types';
import { logger } from '@/shared/utils/logger';

interface ConversationContext {
  messageId: string;
  classification: MessageClassification;
  currentStep: number;
  collectedInfo: Record<string, any>;
  isComplete: boolean;
}

interface ConversationStep {
  question: string;
  field: string;
  validation?: (answer: string) => boolean;
  options?: string[];
}

export class ConversationService {
  private conversations: Map<string, ConversationContext> = new Map();

  // 분류별 상세 정보 수집 단계 정의
  private conversationFlows: Record<MessageClassification, ConversationStep[]> = {
    [MessageClassification.COMMON_FACILITY]: [
      {
        question: "어떤 공용시설에 문제가 있나요?\n1️⃣ 엘리베이터\n2️⃣ 복도\n3️⃣ 주차장\n4️⃣ 기타",
        field: "facilityType",
        options: ["엘리베이터", "복도", "주차장", "기타"]
      },
      {
        question: "정확한 위치를 알려주세요 (예: 101동 앞, 지하1층 주차장)",
        field: "location"
      },
      {
        question: "어떤 문제인가요?\n1️⃣ 고장\n2️⃣ 파손\n3️⃣ 청소 필요\n4️⃣ 기타",
        field: "problemType",
        options: ["고장", "파손", "청소 필요", "기타"]
      },
      {
        question: "언제부터 문제가 있었나요? (예: 오늘 아침부터, 3일 전부터)",
        field: "duration"
      }
    ],

    [MessageClassification.NOISE]: [
      {
        question: "어떤 종류의 소음인가요?\n1️⃣ 층간소음\n2️⃣ 기계실 소음\n3️⃣ 집회/파티 소리\n4️⃣ 공사 소음\n5️⃣ 기타",
        field: "noiseType",
        options: ["층간소음", "기계실 소음", "집회/파티 소리", "공사 소음", "기타"]
      },
      {
        question: "소음 발생 위치를 알려주세요 (예: 윗집, 옆집, 아래층)",
        field: "noiseLocation"
      },
      {
        question: "주로 언제 소음이 발생하나요?\n1️⃣ 새벽 (00-06시)\n2️⃣ 오전 (06-12시)\n3️⃣ 오후 (12-18시)\n4️⃣ 저녁 (18-24시)\n5️⃣ 하루종일",
        field: "noiseTime",
        options: ["새벽", "오전", "오후", "저녁", "하루종일"]
      },
      {
        question: "소음 정도는 어떤가요?\n1️⃣ 약간 신경쓰임\n2️⃣ 생활에 지장\n3️⃣ 잠을 못잘 정도\n4️⃣ 매우 심각",
        field: "noiseSeverity",
        options: ["약간 신경쓰임", "생활에 지장", "잠을 못잘 정도", "매우 심각"]
      }
    ],

    [MessageClassification.PARKING]: [
      {
        question: "주차 관련 어떤 문제인가요?\n1️⃣ 불법 주차\n2️⃣ 방문차량 등록\n3️⃣ 전기차 충전\n4️⃣ 주차권 문의\n5️⃣ 기타",
        field: "parkingIssue",
        options: ["불법 주차", "방문차량 등록", "전기차 충전", "주차권 문의", "기타"]
      },
      {
        question: "정확한 위치를 알려주세요 (예: 지하1층 A구역, 101동 앞)",
        field: "parkingLocation"
      },
      {
        question: "차량 번호를 알고 계신가요? (알고 있다면 알려주세요)",
        field: "vehicleNumber"
      }
    ],

    [MessageClassification.EMERGENCY]: [
      {
        question: "어떤 긴급상황인가요?\n1️⃣ 정전\n2️⃣ 단수\n3️⃣ 급수 불량\n4️⃣ 난방/온수 불량\n5️⃣ 가스 누출\n6️⃣ 화재\n7️⃣ 기타",
        field: "emergencyType",
        options: ["정전", "단수", "급수 불량", "난방/온수 불량", "가스 누출", "화재", "기타"]
      },
      {
        question: "영향 범위는 어떻게 되나요?\n1️⃣ 우리 집만\n2️⃣ 같은 층\n3️⃣ 같은 동\n4️⃣ 단지 전체\n5️⃣ 모름",
        field: "emergencyScope",
        options: ["우리 집만", "같은 층", "같은 동", "단지 전체", "모름"]
      },
      {
        question: "언제부터 문제가 시작되었나요? (예: 방금 전, 30분 전, 오늘 아침)",
        field: "emergencyStart"
      }
    ],

    [MessageClassification.HYGIENE]: [
      {
        question: "어떤 위생 문제인가요?\n1️⃣ 악취\n2️⃣ 곰팡이\n3️⃣ 해충/벌레\n4️⃣ 쓰레기\n5️⃣ 기타",
        field: "hygieneType",
        options: ["악취", "곰팡이", "해충/벌레", "쓰레기", "기타"]
      },
      {
        question: "문제 발생 위치를 알려주세요 (예: 복도, 쓰레기장, 지하실)",
        field: "hygieneLocation"
      },
      {
        question: "언제부터 문제가 있었나요?",
        field: "hygieneDuration"
      }
    ],

    [MessageClassification.BILLING]: [
      {
        question: "관리비 관련 어떤 문의인가요?\n1️⃣ 요금 내역 확인\n2️⃣ 과다 청구\n3️⃣ 납부 방법\n4️⃣ 연체료\n5️⃣ 기타",
        field: "billingType",
        options: ["요금 내역 확인", "과다 청구", "납부 방법", "연체료", "기타"]
      },
      {
        question: "몇 월분 관리비에 대한 문의인가요?",
        field: "billingMonth"
      }
    ],

    // 기본 분류들에 대한 간단한 플로우
    [MessageClassification.INQUIRY]: [
      {
        question: "문의 내용을 자세히 알려주세요.",
        field: "inquiryDetails"
      },
      {
        question: "언제까지 답변이 필요하신가요?\n1️⃣ 오늘 중\n2️⃣ 내일까지\n3️⃣ 이번 주 중\n4️⃣ 급하지 않음",
        field: "urgency",
        options: ["오늘 중", "내일까지", "이번 주 중", "급하지 않음"]
      }
    ],

    [MessageClassification.COMPLAINT]: [
      {
        question: "민원 내용을 구체적으로 설명해 주세요.",
        field: "complaintDetails"
      },
      {
        question: "이전에도 같은 문제가 있었나요?\n1️⃣ 처음 발생\n2️⃣ 가끔 있었음\n3️⃣ 자주 발생\n4️⃣ 계속 지속됨",
        field: "frequency",
        options: ["처음 발생", "가끔 있었음", "자주 발생", "계속 지속됨"]
      }
    ],

    [MessageClassification.MAINTENANCE]: [
      {
        question: "수리가 필요한 곳을 알려주세요.",
        field: "maintenanceLocation"
      },
      {
        question: "어떤 문제인가요?",
        field: "maintenanceIssue"
      }
    ],

    // 나머지 분류들도 기본 플로우 적용
    [MessageClassification.ACCESS_CONTROL]: [
      {
        question: "출입 통제 관련 어떤 요청인가요?\n1️⃣ 비밀번호 변경\n2️⃣ 출입카드 발급\n3️⃣ 방문자 등록\n4️⃣ 기타",
        field: "accessType",
        options: ["비밀번호 변경", "출입카드 발급", "방문자 등록", "기타"]
      }
    ],

    [MessageClassification.LANDSCAPING]: [
      {
        question: "조경 관리 요청 위치를 알려주세요 (예: 정원, 놀이터, 운동시설)",
        field: "landscapeLocation"
      }
    ],

    [MessageClassification.LIGHTING]: [
      {
        question: "조명 관련 어떤 문의인가요?\n1️⃣ 고장 신고\n2️⃣ 점등 시간\n3️⃣ 추가 설치\n4️⃣ 기타",
        field: "lightingType",
        options: ["고장 신고", "점등 시간", "추가 설치", "기타"]
      }
    ],

    [MessageClassification.SMOKING]: [
      {
        question: "간접흡연 피해 위치를 알려주세요 (예: 복도, 베란다, 계단)",
        field: "smokingLocation"
      }
    ],

    [MessageClassification.RESIDENT_DISPUTE]: [
      {
        question: "분쟁 상황을 간단히 설명해 주세요.",
        field: "disputeDetails"
      }
    ],

    [MessageClassification.STAFF_SERVICE]: [
      {
        question: "어떤 직원과 관련된 문의인가요?\n1️⃣ 관리사무소\n2️⃣ 경비\n3️⃣ 미화\n4️⃣ 기타",
        field: "staffType",
        options: ["관리사무소", "경비", "미화", "기타"]
      }
    ],

    [MessageClassification.UNIT_REPAIR]: [
      {
        question: "세대 내 어떤 부분에 문제가 있나요?",
        field: "unitRepairLocation"
      }
    ],

    [MessageClassification.ADMINISTRATION]: [
      {
        question: "행정 처리 관련 어떤 문의인가요?",
        field: "adminType"
      }
    ],

    [MessageClassification.STATUS_INQUIRY]: [
      {
        question: "어떤 민원의 처리 상태를 확인하고 싶으신가요?",
        field: "statusTarget"
      }
    ],

    [MessageClassification.DELIVERY]: [
      {
        question: "택배/우편물 관련 어떤 문제인가요?\n1️⃣ 분실\n2️⃣ 미수령\n3️⃣ 잘못 배송\n4️⃣ 기타",
        field: "deliveryIssue",
        options: ["분실", "미수령", "잘못 배송", "기타"]
      }
    ],

    [MessageClassification.SAFETY]: [
      {
        question: "안전 점검 요청 항목을 알려주세요 (예: 비상벨, CCTV, 소화기)",
        field: "safetyItem"
      }
    ],

    [MessageClassification.SCHEDULE]: [
      {
        question: "어떤 일정에 대한 문의인가요?\n1️⃣ 공사 일정\n2️⃣ 소독 일정\n3️⃣ 도색 일정\n4️⃣ 기타",
        field: "scheduleType",
        options: ["공사 일정", "소독 일정", "도색 일정", "기타"]
      }
    ]
  };

  startConversation(messageId: string, classification: MessageClassification): string {
    const flow = this.conversationFlows[classification];
    if (!flow || flow.length === 0) {
      return "접수되었습니다. 담당자가 확인 후 연락드리겠습니다.";
    }

    const context: ConversationContext = {
      messageId,
      classification,
      currentStep: 0,
      collectedInfo: {},
      isComplete: false
    };

    this.conversations.set(messageId, context);
    
    const firstStep = flow[0];
    return `📝 더 정확한 처리를 위해 몇 가지 질문드리겠습니다.\n\n${firstStep.question}`;
  }

  processResponse(messageId: string, userResponse: string): string {
    const context = this.conversations.get(messageId);
    if (!context || context.isComplete) {
      return "대화가 종료되었습니다. 새로운 문의는 다시 접수해 주세요.";
    }

    const flow = this.conversationFlows[context.classification];
    const currentStep = flow[context.currentStep];

    // 현재 단계의 답변 저장
    context.collectedInfo[currentStep.field] = userResponse.trim();

    // 다음 단계로 이동
    context.currentStep++;

    // 모든 단계 완료 확인
    if (context.currentStep >= flow.length) {
      context.isComplete = true;
      this.conversations.delete(messageId); // 메모리 정리
      
      return this.generateCompletionMessage(context.classification, context.collectedInfo);
    }

    // 다음 질문 반환
    const nextStep = flow[context.currentStep];
    return nextStep.question;
  }

  private generateCompletionMessage(classification: MessageClassification, collectedInfo: Record<string, any>): string {
    const baseMessage = "✅ 정보 수집이 완료되었습니다.\n\n";
    const summary = this.generateSummary(classification, collectedInfo);
    const nextSteps = this.getNextSteps(classification);

    return `${baseMessage}📋 **접수 내용 요약:**\n${summary}\n\n${nextSteps}`;
  }

  private generateSummary(classification: MessageClassification, info: Record<string, any>): string {
    const entries = Object.entries(info);
    return entries.map(([key, value]) => `• ${this.getFieldDisplayName(key)}: ${value}`).join('\n');
  }

  private getFieldDisplayName(field: string): string {
    const displayNames: Record<string, string> = {
      facilityType: "시설 종류",
      location: "위치",
      problemType: "문제 유형",
      duration: "발생 기간",
      noiseType: "소음 종류",
      noiseLocation: "소음 위치",
      noiseTime: "발생 시간",
      noiseSeverity: "심각도",
      parkingIssue: "주차 문제",
      parkingLocation: "주차 위치",
      vehicleNumber: "차량 번호",
      emergencyType: "긴급상황 종류",
      emergencyScope: "영향 범위",
      emergencyStart: "시작 시간",
      hygieneType: "위생 문제",
      hygieneLocation: "발생 위치",
      hygieneDuration: "지속 기간",
      billingType: "문의 유형",
      billingMonth: "해당 월",
      inquiryDetails: "문의 내용",
      urgency: "긴급도",
      complaintDetails: "민원 내용",
      frequency: "발생 빈도"
    };
    return displayNames[field] || field;
  }

  private getNextSteps(classification: MessageClassification): string {
    const nextSteps: Record<MessageClassification, string> = {
      [MessageClassification.EMERGENCY]: "🚨 긴급상황으로 분류되어 즉시 담당자에게 전달됩니다.\n📞 추가 연락이 필요한 경우 관리사무소(02-1234-5678)로 연락해 주세요.",
      [MessageClassification.COMMON_FACILITY]: "🔧 시설 담당자가 확인 후 수리 일정을 안내드리겠습니다.\n⏰ 예상 처리 시간: 1-3일",
      [MessageClassification.NOISE]: "🔇 소음 담당자가 현장 확인 후 조치하겠습니다.\n📋 필요시 층간소음 측정을 진행할 수 있습니다.",
      [MessageClassification.PARKING]: "🚗 주차 관리 담당자가 확인 후 조치하겠습니다.\n⚠️ 불법 주차의 경우 경고장 발송 예정입니다.",
      [MessageClassification.BILLING]: "💰 회계 담당자가 확인 후 상세 내역을 안내드리겠습니다.\n📄 관리비 내역서는 관리사무소에서 발급 가능합니다."
    };

    return nextSteps[classification] || "📞 담당자가 확인 후 연락드리겠습니다.\n⏰ 처리 완료까지 1-3일 소요 예정입니다.";
  }

  isConversationActive(messageId: string): boolean {
    const context = this.conversations.get(messageId);
    return context !== undefined && !context.isComplete;
  }

  getConversationInfo(messageId: string): ConversationContext | undefined {
    return this.conversations.get(messageId);
  }
}

export const conversationService = new ConversationService();