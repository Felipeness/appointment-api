export interface MessageQueue<T = Record<string, unknown>> {
    sendMessage(message: T): Promise<void>;
    receiveMessages(maxMessages?: number): Promise<T[]>;
    deleteMessage(receiptHandle: string): Promise<void>;
}
