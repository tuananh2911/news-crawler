import { MongoClient } from "mongodb";
import { AbstractNewsCrawler } from "../crawlers/abstract-crawler";
import { DanTriCrawler } from "../crawlers/dantri-crawler";
import { Kafka } from "kafkajs";
import { DANTRI_URI, VNEXPRESS_URI } from "../constant";
import { VnexpressCrawler } from "../crawlers/vnexpress-crawler";
import dotenv from 'dotenv';

// Load biến môi trường
dotenv.config();
const MONGO_URI = process.env.MONGODB_URI|| '';
const DB_NAME = process.env.DB_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME || '';
const BROKER = process.env.KAFKA_BROKERS||''
const CRAWLERS = new Map<string, any>([
    [DANTRI_URI, new DanTriCrawler(DANTRI_URI)],
    [VNEXPRESS_URI, new VnexpressCrawler(VNEXPRESS_URI)]
]);
export class NewsCrawlerFactory {

     async connectDB() {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        console.log("Đã kết nối MongoDB");
        return client.db(DB_NAME).collection(COLLECTION_NAME);
    }
    async connectKafka(){
        
        const kafka = new Kafka({
            clientId: 'dantri-crawler',
            brokers: [BROKER] // Thay đổi broker URL theo cấu hình của bạn
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