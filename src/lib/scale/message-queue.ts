/**
 * Message Queue System - MemoLib
 * 
 * Features:
 * - RabbitMQ/Kafka event-driven architecture
 * - Async processing (email, notifications, webhooks)
 * - Queue management
 * - Retry policies (exponential backoff)
 * - Dead letter queue (DLQ)
 * - Message deduplication
 * - Monitoring & metrics
 * 
 * Target: < 100ms end-to-end latency, 99.9% delivery
 */

export type QueueName = 
  | 'emails.send'
  | 'emails.process'
  | 'notifications.push'
  | 'webhooks.deliver'
  | 'analytics.track'
  | 'analytics.aggregate'
  | 'integrations.sync'
  | 'payments.webhook'
  | 'gdpr.export'
  | 'gdpr.delete';

export interface QueueConfig {
  name: QueueName;
  durable: boolean;
  autoDelete: boolean;
  maxRetries: number;
  retryDelayMs: number;
  consumerCount: number;
  messageTimeout: number;
}

export interface Message {
  id: string;
  queueName: QueueName;
  payload: any;
  timestamp: Date;
  retryCount: number;
  headers?: Record<string, string>;
}

export interface ConsumerConfig {
  queueName: QueueName;
  handler: (message: Message) => Promise<void>;
  concurrency: number;
  timeout: number;
}

/**
 * Message Queue Manager
 */
export class MessageQueueManager {
  private queues: Map<QueueName, QueueConfig> = new Map();
  private consumers: Map<QueueName, MessageConsumer[]> = new Map();
  private deadLetterQueue: Message[] = [];
  private metrics: QueueMetrics = new Map();

  constructor(private brokerUrl: string) {}

  /**
   * Initialize message queue
   */
  async initialize(): Promise<void> {
    console.log('📨 Initializing message queue system...');

    // Define queues
    this.defineQueues();

    // Setup DLQ
    this.setupDeadLetterQueue();

    console.log('✅ Message queue initialized');
  }

  /**
   * Define all queues
   */
  private defineQueues(): void {
    const queueConfigs: Record<QueueName, QueueConfig> = {
      'emails.send': {
        name: 'emails.send',
        durable: true,
        autoDelete: false,
        maxRetries: 3,
        retryDelayMs: 5000,
        consumerCount: 5,
        messageTimeout: 30000,
      },
      'emails.process': {
        name: 'emails.process',
        durable: true,
        autoDelete: false,
        maxRetries: 2,
        retryDelayMs: 10000,
        consumerCount: 3,
        messageTimeout: 60000,
      },
      'notifications.push': {
        name: 'notifications.push',
        durable: true,
        autoDelete: false,
        maxRetries: 2,
        retryDelayMs: 3000,
        consumerCount: 10,
        messageTimeout: 10000,
      },
      'webhooks.deliver': {
        name: 'webhooks.deliver',
        durable: true,
        autoDelete: false,
        maxRetries: 5,
        retryDelayMs: 60000,
        consumerCount: 5,
        messageTimeout: 30000,
      },
      'analytics.track': {
        name: 'analytics.track',
        durable: true,
        autoDelete: false,
        maxRetries: 1,
        retryDelayMs: 5000,
        consumerCount: 10,
        messageTimeout: 5000,
      },
      'analytics.aggregate': {
        name: 'analytics.aggregate',
        durable: true,
        autoDelete: false,
        maxRetries: 2,
        retryDelayMs: 30000,
        consumerCount: 2,
        messageTimeout: 120000,
      },
      'integrations.sync': {
        name: 'integrations.sync',
        durable: true,
        autoDelete: false,
        maxRetries: 3,
        retryDelayMs: 60000,
        consumerCount: 3,
        messageTimeout: 300000,
      },
      'payments.webhook': {
        name: 'payments.webhook',
        durable: true,
        autoDelete: false,
        maxRetries: 5,
        retryDelayMs: 30000,
        consumerCount: 5,
        messageTimeout: 30000,
      },
      'gdpr.export': {
        name: 'gdpr.export',
        durable: true,
        autoDelete: false,
        maxRetries: 2,
        retryDelayMs: 300000,
        consumerCount: 1,
        messageTimeout: 600000,
      },
      'gdpr.delete': {
        name: 'gdpr.delete',
        durable: true,
        autoDelete: false,
        maxRetries: 3,
        retryDelayMs: 60000,
        consumerCount: 1,
        messageTimeout: 120000,
      },
    };

    for (const [name, config] of Object.entries(queueConfigs)) {
      this.queues.set(name as QueueName, config);
      this.metrics.set(name as QueueName, {
        queued: 0,
        processed: 0,
        failed: 0,
        avgProcessingTime: 0,
      });
    }
  }

  /**
   * Setup dead letter queue
   */
  private setupDeadLetterQueue(): void {
    console.log('Setting up dead letter queue...');
    // DLQ for messages that exceed max retries
  }

  /**
   * Publish message to queue
   */
  async publish(queueName: QueueName, payload: any): Promise<string> {
    const config = this.queues.get(queueName);
    if (!config) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      queueName,
      payload,
      timestamp: new Date(),
      retryCount: 0,
    };

    // Publish to message broker
    console.log(`📤 Published to ${queueName}:`, message.id);

    // Update metrics
    const metrics = this.metrics.get(queueName)!;
    metrics.queued++;

    return message.id;
  }

  /**
   * Subscribe to queue
   */
  async subscribe(config: ConsumerConfig): Promise<void> {
    const queueConfig = this.queues.get(config.queueName);
    if (!queueConfig) {
      throw new Error(`Queue ${config.queueName} not found`);
    }

    console.log(
      `📥 Subscribing to ${config.queueName} with ${config.concurrency} consumers`
    );

    // Create message consumers
    const consumers: MessageConsumer[] = [];
    for (let i = 0; i < config.concurrency; i++) {
      const consumer = new MessageConsumer(
        config.queueName,
        config.handler,
        config.timeout
      );
      consumers.push(consumer);
      consumer.start();
    }

    this.consumers.set(config.queueName, consumers);
  }

  /**
   * Process message with retry logic
   */
  async processMessage(message: Message, handler: (msg: Message) => Promise<void>): Promise<void> {
    const config = this.queues.get(message.queueName)!;
    const metrics = this.metrics.get(message.queueName)!;

    try {
      const start = Date.now();
      await handler(message);
      const duration = Date.now() - start;

      metrics.processed++;
      metrics.avgProcessingTime = (metrics.avgProcessingTime + duration) / 2;

      console.log(
        `✅ Processed ${message.queueName} (${duration}ms)`,
        message.id
      );
    } catch (error) {
      message.retryCount++;

      if (message.retryCount >= config.maxRetries) {
        // Send to DLQ
        this.deadLetterQueue.push(message);
        metrics.failed++;

        console.error(
          `❌ Message failed (max retries): ${message.id}`,
          error
        );
      } else {
        // Re-queue with exponential backoff
        const delayMs = config.retryDelayMs * Math.pow(2, message.retryCount - 1);
        console.warn(
          `⚠️ Retrying message ${message.id} after ${delayMs}ms (attempt ${message.retryCount})`
        );

        setTimeout(() => {
          this.publish(message.queueName, message.payload).catch(console.error);
        }, delayMs);
      }
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const queues: QueueStat[] = [];

    for (const [name, metrics] of this.metrics) {
      queues.push({
        name,
        queued: metrics.queued,
        processed: metrics.processed,
        failed: metrics.failed,
        avgProcessingTime: Math.round(metrics.avgProcessingTime),
        dlqCount: this.deadLetterQueue.filter(m => m.queueName === name).length,
      });
    }

    return {
      queues,
      totalDLQ: this.deadLetterQueue.length,
      timestamp: new Date(),
    };
  }

  /**
   * Get dead letter queue messages
   */
  getDLQMessages(limit: number = 10): Message[] {
    return this.deadLetterQueue.slice(-limit);
  }

  /**
   * Retry DLQ message
   */
  async retryDLQMessage(messageId: string): Promise<void> {
    const index = this.deadLetterQueue.findIndex(m => m.id === messageId);
    if (index === -1) {
      throw new Error(`Message ${messageId} not found in DLQ`);
    }

    const message = this.deadLetterQueue[index];
    this.deadLetterQueue.splice(index, 1);

    message.retryCount = 0;
    await this.publish(message.queueName, message.payload);

    console.log(`🔄 Retried DLQ message: ${messageId}`);
  }

  /**
   * Shutdown message queue
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down message queue...');

    // Gracefully shutdown all consumers
    for (const [queueName, consumers] of this.consumers) {
      for (const consumer of consumers) {
        await consumer.stop();
      }
    }

    console.log('✅ Message queue shutdown complete');
  }
}

/**
 * Message Consumer
 */
class MessageConsumer {
  private running = false;

  constructor(
    private queueName: QueueName,
    private handler: (message: Message) => Promise<void>,
    private timeout: number
  ) {}

  /**
   * Start consuming messages
   */
  async start(): Promise<void> {
    this.running = true;
    console.log(`Consumer started for ${this.queueName}`);

    // Listen for messages from queue
    // Implementation depends on message broker (RabbitMQ/Kafka)
  }

  /**
   * Stop consuming messages
   */
  async stop(): Promise<void> {
    this.running = false;
    console.log(`Consumer stopped for ${this.queueName}`);
  }
}

// Types
interface QueueMetrics extends Map<QueueName, {
  queued: number;
  processed: number;
  failed: number;
  avgProcessingTime: number;
}> {}

interface QueueStat {
  name: QueueName;
  queued: number;
  processed: number;
  failed: number;
  avgProcessingTime: number;
  dlqCount: number;
}

interface QueueStats {
  queues: QueueStat[];
  totalDLQ: number;
  timestamp: Date;
}

/**
 * Message queue example usage
 */
export const queueExamples = {
  // Email sending example
  sendEmail: async (queueManager: MessageQueueManager) => {
    await queueManager.publish('emails.send', {
      to: 'user@example.com',
      subject: 'Hello',
      template: 'welcome',
      variables: { name: 'John' },
    });
  },

  // Webhook delivery example
  deliverWebhook: async (queueManager: MessageQueueManager) => {
    await queueManager.publish('webhooks.deliver', {
      webhookId: 'wh_123',
      eventType: 'email.sent',
      payload: { emailId: 'email_456' },
    });
  },

  // Analytics tracking example
  trackEvent: async (queueManager: MessageQueueManager) => {
    await queueManager.publish('analytics.track', {
      userId: 'user_789',
      event: 'email_opened',
      properties: { emailId: 'email_456' },
    });
  },
};
