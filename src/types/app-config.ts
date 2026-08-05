export interface AppConfig {
  mongodb: {
    uri: string;
  };
  telegram: {
    botToken: string;
    chatId: string;
  };
  backblaze: {
    region: string;
    endpoint: string;
    keyId: string;
    appKey: string;
    bucketName: string;
  };
  scraper: { 
    timeoutMs: number;       
    maxRetries: number;  
  };
}