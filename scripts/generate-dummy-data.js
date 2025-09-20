const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/intake';

// Realistic Korean apartment complex requests
const smsMessages = [
    "엘리베이터가 고장났어요. 3층에서 멈춰있습니다.",
    "주차장에서 소음이 너무 심해요. 밤늦게까지 시끄럽습니다.",
    "관리비 청구서 확인 부탁드립니다.",
    "화장실 변기가 막혔어요. 수리 요청합니다.",
    "현관문 도어락이 작동하지 않아요.",
    "층간소음 때문에 잠을 못 자겠어요.",
    "주차 공간이 부족합니다. 개선 부탁드려요.",
    "쓰레기 분리수거 안내 부탁드립니다.",
    "인터넷이 자주 끊어져요. 확인 부탁합니다.",
    "보일러가 작동하지 않아요. 추워요.",
    "택배함 비밀번호를 잊어버렸어요.",
    "CCTV 확인 요청드립니다.",
    "누수가 발생했어요. 긴급 수리 필요합니다.",
    "전기가 나갔어요. 확인 부탁드립니다.",
    "가스 냄새가 나요. 점검 부탁드립니다.",
    "에어컨이 고장났어요. 더워서 못 살겠어요.",
    "윗집 소음이 심해요. 조치 부탁드립니다.",
    "주차위반 차량 신고합니다.",
    "관리사무소 전화가 안 받아져요.",
    "청소가 제대로 안 되고 있어요.",
    "방충망이 찢어졌어요. 교체 부탁드립니다.",
    "화재경보기가 계속 울려요.",
    "수도꼭지에서 물이 안 나와요.",
    "베란다 배수구가 막혔어요.",
    "공동현관 출입문이 고장났어요.",
    "관리비 할인 문의드립니다.",
    "이사 관련 안내 부탁드립니다.",
    "펜션 예약 문의합니다.",
    "주민회의 일정 알려주세요.",
    "분실물 찾고 있어요.",
    "소화기 점검 언제 하나요?",
    "정전 복구 언제 되나요?",
    "난방비가 너무 많이 나왔어요.",
    "방음 시설 개선 요청합니다.",
    "주차장 조명이 어두워요.",
    "엘리베이터 속도가 너무 느려요.",
    "복도 청소 상태가 안 좋아요.",
    "현관 매트 교체 부탁드립니다.",
    "우편함 열쇠를 잃어버렸어요.",
    "관리비 연체료 문의합니다.",
    "세대 내 곰팡이 문제 상담 요청합니다.",
    "발코니 방수 공사 언제 하나요?",
    "주차장 CCTV 확인 요청합니다.",
    "관리사무소 운영시간 알려주세요.",
    "입주자 대표회의 참석 방법 문의합니다.",
    "하수구 냄새가 올라와요.",
    "벽지 곰팡이 제거 요청합니다.",
    "창문 틈새 바람이 들어와요.",
    "전등이 깜빡거려요.",
    "화장실 환풍기가 안 돌아가요."
];

const emailMessages = [
    {
        subject: "엘리베이터 고장 신고",
        body: "안녕하세요. 101동 엘리베이터가 2일째 고장 상태입니다. 고령자분들이 계단 이용에 어려움을 겪고 계십니다. 빠른 수리 부탁드립니다."
    },
    {
        subject: "주차장 소음 민원",
        body: "매일 밤 11시 이후에도 주차장에서 큰 소리로 대화하시는 분들이 계십니다. 아이들이 잠을 못 자서 힘듭니다. 조치 부탁드립니다."
    },
    {
        subject: "관리비 내역 문의",
        body: "이번 달 관리비가 평소보다 많이 나왔습니다. 세부 내역을 확인하고 싶습니다. 청구서를 다시 보내주시면 감사하겠습니다."
    },
    {
        subject: "층간소음 해결 요청",
        body: "윗집에서 새벽 시간대에 발소리와 가구 끄는 소리가 심합니다. 여러 번 직접 말씀드렸지만 개선되지 않고 있습니다. 관리사무소에서 중재해 주세요."
    },
    {
        subject: "보안 시설 점검 요청",
        body: "현관 도어락과 CCTV 시설에 대한 정기 점검을 요청드립니다. 최근 보안 사고가 늘어나고 있어 걱정됩니다."
    },
    {
        subject: "수도 시설 문제",
        body: "세대 내 수압이 약해서 샤워하기 어렵습니다. 또한 온수가 나오는데 시간이 너무 오래 걸립니다. 점검 부탁드립니다."
    },
    {
        subject: "쓰레기 처리 개선 요청",
        body: "쓰레기 분리수거 공간이 항상 지저분합니다. 청소 횟수를 늘리거나 관리 방법을 개선해 주세요."
    },
    {
        subject: "주차 공간 부족 문제",
        body: "입주민 대비 주차 공간이 부족합니다. 방문자 주차 공간도 마련해 주시면 좋겠습니다. 개선 방안을 검토해 주세요."
    },
    {
        subject: "난방 시설 점검 요청",
        body: "겨울철 난방이 잘 안 됩니다. 보일러 점검과 배관 청소가 필요할 것 같습니다. 전문업체 점검을 요청드립니다."
    },
    {
        subject: "인터넷 연결 불안정",
        body: "공용 인터넷이 자주 끊어집니다. 재택근무에 지장이 있어 개선이 필요합니다. 통신업체와 협의 부탁드립니다."
    },
    {
        subject: "택배 보관함 관리",
        body: "택배 보관함이 항상 가득 차 있어서 이용하기 어렵습니다. 보관함 수를 늘리거나 관리 방법을 개선해 주세요."
    },
    {
        subject: "조경 관리 요청",
        body: "아파트 조경이 관리가 잘 안 되고 있는 것 같습니다. 정기적인 가지치기와 잔디 관리를 부탁드립니다."
    },
    {
        subject: "놀이터 시설 점검",
        body: "어린이 놀이터 시설 중 일부가 노후화되어 안전사고가 우려됩니다. 정기 점검과 교체를 검토해 주세요."
    },
    {
        subject: "방음 시설 개선",
        body: "복도와 계단에서 발생하는 소음이 세대 내로 전달됩니다. 방음 시설 개선을 검토해 주시면 감사하겠습니다."
    },
    {
        subject: "전기 시설 점검",
        body: "복도 전등이 자주 나가고 전기 콘센트 일부가 작동하지 않습니다. 전기 시설 전반적인 점검이 필요합니다."
    },
    {
        subject: "방충망 교체 요청",
        body: "베란다 방충망이 찢어져서 벌레가 들어옵니다. 교체 또는 수리를 요청드립니다."
    },
    {
        subject: "관리비 할인 문의",
        body: "장기간 해외 거주로 인한 관리비 할인이 가능한지 문의드립니다. 관련 규정을 알려주세요."
    },
    {
        subject: "입주민 편의시설 개선",
        body: "헬스장이나 독서실 같은 입주민 편의시설 설치를 검토해 주시면 좋겠습니다. 다른 입주민들 의견도 수렴해 주세요."
    },
    {
        subject: "주민회의 개최 요청",
        body: "아파트 관리와 관련된 여러 안건들을 논의하기 위한 주민회의 개최를 요청드립니다."
    },
    {
        subject: "보안 강화 요청",
        body: "최근 외부인 출입이 빈번합니다. 출입 통제를 강화하고 경비 시간을 늘려주시면 좋겠습니다."
    }
];

const webMessages = [
    "관리비 온라인 납부 방법을 알고 싶습니다.",
    "입주민 커뮤니티 가입 방법 문의합니다.",
    "주차 등록 신청하고 싶어요.",
    "이사 신고는 어떻게 하나요?",
    "관리사무소 운영 시간이 궁금합니다.",
    "분실물 신고하고 싶어요.",
    "하자보수 신청 방법 알려주세요.",
    "공동 시설 이용 규칙이 궁금해요.",
    "관리비 할인 혜택이 있나요?",
    "택배 보관함 이용 방법 문의합니다.",
    "주민 편의시설 예약하고 싶어요.",
    "관리규약을 확인하고 싶습니다.",
    "입주자 대표회의 참석 방법 문의합니다.",
    "아파트 시설 개선 건의사항이 있어요.",
    "보안 카드 재발급 신청합니다.",
    "주차장 월정액 요금이 궁금해요.",
    "관리비 연체 시 패널티가 있나요?",
    "공용 전기료는 어떻게 산정되나요?",
    "입주민 행사 일정을 알고 싶어요.",
    "관리사무소 직원 연락처 문의합니다.",
    "아파트 보험 관련 문의드려요.",
    "주변 편의시설 정보 알려주세요.",
    "관리비 자동이체 신청하고 싶어요.",
    "세대 내 수리 업체 추천 부탁드려요.",
    "입주민 게시판 이용 방법 문의합니다.",
    "관리비 영수증 재발급 요청합니다.",
    "아파트 규모와 세대수가 궁금해요.",
    "관리사무소 휴무일이 언제인가요?",
    "입주민 주차 우선권이 있나요?",
    "관리비 납부 기한이 언제까지인가요?",
    "공동 현관 비밀번호 변경 주기가 궁금해요.",
    "관리비 할부 납부가 가능한가요?",
    "입주민 소통 채널이 있나요?",
    "관리사무소 민원 처리 절차 문의합니다.",
    "아파트 청소 일정을 알고 싶어요.",
    "입주민 투표 참여 방법 문의합니다.",
    "관리비 항목별 세부 내역 확인하고 싶어요.",
    "아파트 보안 시설 현황이 궁금해요.",
    "입주민 편의를 위한 건의사항 접수 방법 문의합니다.",
    "관리비 미납 시 조치사항이 궁금해요.",
    "아파트 내 금연 구역이 어디인가요?",
    "입주민 간 분쟁 조정 절차 문의합니다.",
    "관리비 계산 방식을 자세히 알고 싶어요.",
    "아파트 시설물 이용 시간 제한이 있나요?",
    "입주민 대상 교육 프로그램이 있나요?",
    "관리비 영수증 온라인 발급 가능한가요?",
    "아파트 내 반려동물 사육 규칙 문의합니다.",
    "입주민 커뮤니티 활동 참여하고 싶어요.",
    "관리사무소 업무 처리 시간이 궁금해요.",
    "아파트 시설 개선 예산 관련 문의드려요."
];

const callTranscripts = [
    "여보세요? 관리사무소죠? 저희 집 보일러가 고장났는데 수리기사 연결 부탁드려요.",
    "안녕하세요. 주차장에 불법 주차된 차량이 있어서 신고하려고 전화드렸어요.",
    "관리비 관련해서 문의사항이 있어서 전화드렸습니다. 상담 가능한가요?",
    "엘리베이터가 멈춰서 갇혔어요! 빨리 도와주세요!",
    "층간소음 때문에 너무 힘들어요. 어떻게 해결할 수 있을까요?",
    "택배가 와서 부재중이었는데 어디에 보관되어 있나요?",
    "현관문 비밀번호를 잊어버렸어요. 어떻게 하면 되나요?",
    "가스 냄새가 나는 것 같아요. 점검 좀 부탁드려요.",
    "정전이 됐는데 언제 복구되나요?",
    "수도에서 물이 안 나와요. 확인 부탁드려요.",
    "CCTV 영상 확인이 필요해요. 절차가 어떻게 되나요?",
    "관리비 할인 받을 수 있는 조건이 뭔가요?",
    "이사 관련 신고는 어떻게 하면 되나요?",
    "주민회의 언제 열리나요? 참석하고 싶어요.",
    "분실물을 찾고 있어요. 신고된 게 있나요?",
    "소화기 점검 일정이 언제인가요?",
    "난방이 안 돼서 너무 추워요. 점검 부탁드려요.",
    "방음 관련해서 개선 요청하고 싶어요.",
    "주차 공간이 부족해서 불편해요. 해결 방법이 있나요?",
    "청소 상태가 좋지 않아요. 개선 부탁드려요.",
    "인터넷이 자주 끊어져요. 확인 부탁드려요.",
    "보안 카드를 분실했어요. 재발급 받으려면 어떻게 해야 하나요?",
    "관리사무소 운영 시간이 어떻게 되나요?",
    "하자보수 신청하려면 어떤 절차를 거쳐야 하나요?",
    "관리비 자동이체 신청하고 싶어요.",
    "아파트 내 금연 구역이 어디인가요?",
    "입주민 편의시설 이용 방법 알려주세요.",
    "관리규약 사본을 받을 수 있나요?",
    "주차장 월정액 요금이 얼마인가요?",
    "관리비 연체료는 어떻게 계산되나요?",
    "입주자 대표회의 참석 방법 문의드려요.",
    "아파트 보험 관련해서 문의사항이 있어요.",
    "관리비 영수증 재발급 받을 수 있나요?",
    "세대 내 수리 업체 추천 부탁드려요.",
    "입주민 게시판은 어디에 있나요?",
    "관리사무소 휴무일이 언제인가요?",
    "공동 현관 비밀번호는 언제 바뀌나요?",
    "관리비 할부 납부가 가능한가요?",
    "입주민 소통을 위한 채널이 있나요?",
    "민원 처리는 보통 얼마나 걸리나요?",
    "아파트 청소는 언제 하나요?",
    "입주민 투표는 어떻게 참여하나요?",
    "관리비 세부 내역을 자세히 알고 싶어요.",
    "보안 시설 현황이 궁금해요.",
    "건의사항은 어디에 접수하면 되나요?",
    "관리비 미납 시 어떤 조치가 취해지나요?",
    "반려동물 사육 규칙이 어떻게 되나요?",
    "커뮤니티 활동에 참여하고 싶어요.",
    "업무 처리 시간이 보통 얼마나 걸리나요?",
    "시설 개선 예산은 어떻게 결정되나요?"
];

// Phone numbers for variety
const phoneNumbers = [
    "010-1234-5678", "010-2345-6789", "010-3456-7890", "010-4567-8901", "010-5678-9012",
    "010-6789-0123", "010-7890-1234", "010-8901-2345", "010-9012-3456", "010-0123-4567",
    "010-1111-2222", "010-2222-3333", "010-3333-4444", "010-4444-5555", "010-5555-6666",
    "010-6666-7777", "010-7777-8888", "010-8888-9999", "010-9999-0000", "010-1357-2468"
];

const emailAddresses = [
    "resident1@apt.com", "resident2@apt.com", "resident3@apt.com", "resident4@apt.com",
    "kim.minsoo@gmail.com", "lee.younghee@naver.com", "park.jinho@daum.net", "choi.sujin@hanmail.net",
    "jung.hyunwoo@gmail.com", "kang.minji@naver.com", "yoon.seokjin@daum.net", "lim.jiyoung@hanmail.net",
    "han.dongwook@gmail.com", "song.eunhye@naver.com", "oh.taehyun@daum.net", "jang.soyeon@hanmail.net",
    "kwon.jinwoo@gmail.com", "shin.yejin@naver.com", "moon.sangho@daum.net", "baek.jisoo@hanmail.net"
];

const names = [
    "김민수", "이영희", "박진호", "최수진", "정현우", "강민지", "윤석진", "임지영",
    "한동욱", "송은혜", "오태현", "장소연", "권진우", "신예진", "문상호", "백지수",
    "조현석", "안미경", "홍준영", "서다은", "노태우", "구민정", "류성민", "도혜진"
];

async function sendRequest(url, data) {
    try {
        const response = await axios.post(url, data, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error(`Error sending request to ${url}:`, error.message);
        return null;
    }
}

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function addRandomDelay() {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
}

async function generateDummyData() {
    console.log('🚀 Starting dummy data generation...');
    
    let successCount = 0;
    let totalRequests = 0;

    // Generate SMS messages (100)
    console.log('📱 Generating SMS messages...');
    for (let i = 0; i < 100; i++) {
        const data = {
            from: getRandomElement(phoneNumbers),
            body: getRandomElement(smsMessages)
        };
        
        const result = await sendRequest(`${BASE_URL}/sms`, data);
        if (result) successCount++;
        totalRequests++;
        
        if ((i + 1) % 20 === 0) {
            console.log(`   📱 SMS: ${i + 1}/100 completed`);
        }
        
        await addRandomDelay();
    }

    // Generate Email messages (100)
    console.log('📧 Generating Email messages...');
    for (let i = 0; i < 100; i++) {
        const emailData = getRandomElement(emailMessages);
        const data = {
            from: getRandomElement(emailAddresses),
            subject: emailData.subject,
            body: emailData.body
        };
        
        const result = await sendRequest(`${BASE_URL}/email`, data);
        if (result) successCount++;
        totalRequests++;
        
        if ((i + 1) % 20 === 0) {
            console.log(`   📧 Email: ${i + 1}/100 completed`);
        }
        
        await addRandomDelay();
    }

    // Generate Web form messages (100)
    console.log('🌐 Generating Web form messages...');
    for (let i = 0; i < 100; i++) {
        const data = {
            name: getRandomElement(names),
            email: getRandomElement(emailAddresses),
            message: getRandomElement(webMessages)
        };
        
        const result = await sendRequest(`${BASE_URL}/web`, data);
        if (result) successCount++;
        totalRequests++;
        
        if ((i + 1) % 20 === 0) {
            console.log(`   🌐 Web: ${i + 1}/100 completed`);
        }
        
        await addRandomDelay();
    }

    // Generate Call transcripts (100)
    console.log('📞 Generating Call transcripts...');
    for (let i = 0; i < 100; i++) {
        const data = {
            caller: getRandomElement(phoneNumbers),
            duration: Math.floor(Math.random() * 10) + 1, // 1-10 minutes
            transcript: getRandomElement(callTranscripts)
        };
        
        const result = await sendRequest(`${BASE_URL}/call`, data);
        if (result) successCount++;
        totalRequests++;
        
        if ((i + 1) % 20 === 0) {
            console.log(`   📞 Call: ${i + 1}/100 completed`);
        }
        
        await addRandomDelay();
    }

    console.log('\n✅ Dummy data generation completed!');
    console.log(`📊 Total requests: ${totalRequests}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${totalRequests - successCount}`);
    console.log('\n🎯 You can now visit http://localhost:3000/reports to see the analytics!');
}

// Run the script
generateDummyData().catch(console.error);