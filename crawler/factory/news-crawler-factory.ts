import { MongoClient } from "mongodb";
import { AbstractNewsCrawler } from "../new-crawlers/abstract-news-crawler";
import { DanTriCrawler } from "../new-crawlers/dantri-crawler";
import { CRAWLERS } from "../constant";
import { Kafka } from "kafkajs";

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'dantri_db';
const COLLECTION_NAME = 'articles';

export class NewsCrawlerFactory {

     async connectDB() {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        console.log("✅ Đã kết nối MongoDB");
        return client.db(DB_NAME).collection(COLLECTION_NAME);
    }
    async connectKafka(){
        const kafka = new Kafka({
            clientId: 'dantri-crawler',
            brokers: ['localhost:9092'] // Thay đổi broker URL theo cấu hình của bạn
        });
        
        const producer = kafka.producer();
        return producer
    }

    public  async createCrawler(url: string): Promise<AbstractNewsCrawler> {
        const crawler = CRAWLERS.get(url);
        if (!crawler) {
            throw new Error(`Không hỗ trợ domain: ${url}`);
        }
        crawler.collection = await this.connectDB()
        crawler.producer = await this.connectKafka()
        
        return crawler;
    }
}