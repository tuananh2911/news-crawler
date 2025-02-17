import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class WebsiteProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly kafka: Kafka;
  private readonly producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'website-producer',
      brokers: [process.env.KAFKA_BROKERS],
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async sendWebsiteMessage(url: string) {
    try {
      await this.producer.send({
        topic: 'website',
        messages: [{ value: JSON.stringify({ url }) }],
      });
      return {
        success: true,
        message: `Message sent successfully for URL: ${url}`,
      };
    } catch (error) {
      console.error('Error sending message to Kafka:', error);
      throw error;
    }
  }
}
