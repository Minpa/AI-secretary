import { logger } from '@/shared/utils/logger';

export class PIIMaskingService {
  private phoneRegex = /(\d{3})-?(\d{3,4})-?(\d{4})/g;
  private emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  private nameRegex = /[가-힣]{2,4}(?=\s|님|씨|$)/g;
  private addressRegex = /(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)[시도]?\s*[가-힣구군시]+\s*[가-힣동면읍로길]+\s*\d+/g;

  async maskContent(content: string): Promise<string> {
    try {
      let maskedContent = content;

      // Mask phone numbers
      maskedContent = maskedContent.replace(this.phoneRegex, (match) => {
        return match.substring(0, 3) + '-****-' + match.substring(match.length - 4);
      });

      // Mask email addresses
      maskedContent = maskedContent.replace(this.emailRegex, (match) => {
        const [localPart, domain] = match.split('@');
        const maskedLocal = localPart.substring(0, 2) + '***';
        return `${maskedLocal}@${domain}`;
      });

      // Mask Korean names (2-4 characters)
      maskedContent = maskedContent.replace(this.nameRegex, (match) => {
        if (match.length === 2) {
          return match.charAt(0) + '*';
        } else if (match.length === 3) {
          return match.charAt(0) + '*' + match.charAt(2);
        } else {
          return match.charAt(0) + '**' + match.charAt(match.length - 1);
        }
      });

      // Mask addresses
      maskedContent = maskedContent.replace(this.addressRegex, '[주소]');

      return maskedContent;
    } catch (error) {
      logger.error('Error masking content', { error });
      return content; // Return original if masking fails
    }
  }

  async maskSender(sender: string): Promise<string> {
    try {
      // If it's a phone number
      if (this.phoneRegex.test(sender)) {
        return sender.replace(this.phoneRegex, (match) => {
          return match.substring(0, 3) + '-****-' + match.substring(match.length - 4);
        });
      }

      // If it's an email
      if (this.emailRegex.test(sender)) {
        return sender.replace(this.emailRegex, (match) => {
          const [localPart, domain] = match.split('@');
          const maskedLocal = localPart.substring(0, 2) + '***';
          return `${maskedLocal}@${domain}`;
        });
      }

      // If it's a name
      if (this.nameRegex.test(sender)) {
        return sender.replace(this.nameRegex, (match) => {
          if (match.length === 2) {
            return match.charAt(0) + '*';
          } else if (match.length === 3) {
            return match.charAt(0) + '*' + match.charAt(2);
          } else {
            return match.charAt(0) + '**' + match.charAt(match.length - 1);
          }
        });
      }

      return sender;
    } catch (error) {
      logger.error('Error masking sender', { error });
      return sender; // Return original if masking fails
    }
  }

  async validateMasking(original: string, masked: string): Promise<boolean> {
    // Ensure no PII patterns remain in masked content
    const piiPatterns = [this.phoneRegex, this.emailRegex, this.addressRegex];
    
    for (const pattern of piiPatterns) {
      if (pattern.test(masked)) {
        logger.warn('PII detected in masked content', { original: original.substring(0, 50) });
        return false;
      }
    }

    return true;
  }
}