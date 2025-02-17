import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class WebsiteService implements OnModuleInit, OnModuleDestroy {
  private readonly kafka: Kafka;
  private readonly consumer: Consumer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'website-consumer',
      brokers: [process.env.KAFKA_BROKERS],
    });

    this.consumer = this.kafka.consumer({ groupId: 'website-consumer-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'website', fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const websiteData = JSON.parse(message.value.toString());
          await this.processWebsite(websiteData);
        } catch (error) {
          console.error('Error processing website message:', error);
        }
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }

  private async processWebsite(data: { url: string }) {
    try {
      // Kiểm tra xem process đã tồn tại chưa
      const checkCmd = `pm2 list | grep "crawler-${this.getProcessName(data.url)}"`;
      const { stdout: checkResult } = await execAsync(checkCmd).catch(() => ({
        stdout: '',
      }));

      if (checkResult.includes(`crawler-${this.getProcessName(data.url)}`)) {
        console.log(`Crawler for ${data.url} is already running`);
        return;
      }

      // Khởi chạy crawler với PM2
      const cmd = `npx vite-node ..\..\..\crawler\runner.ts "${data.url}"`;


      const { stdout, stderr } = await execAsync(cmd);

      if (stderr) {
        console.error(`Error running crawler for ${data.url}:`, stderr);
        return;
      }

      console.log(`Started crawler for ${data.url}:`, stdout);
    } catch (error) {
      console.error('Error processing website:', error);
      throw error;
    }
  }

  private getProcessName(url: string): string {
    // Chuyển URL thành tên process hợp lệ
    return url
      .replace(/^https?:\/\//, '')
      .replace(/\./g, '-')
      .replace(/[^a-zA-Z0-9-]/g, '');
  }
}
