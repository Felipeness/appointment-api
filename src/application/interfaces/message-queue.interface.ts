export interface MessageQueue {
  sendMessage(message: any): Promise<void>;
  receiveMessages(maxMessages?: number): Promise<any[]>;
  deleteMessage(receiptHandle: string): Promise<void>;
}
