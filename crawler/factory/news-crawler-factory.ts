import { MongoClient } from "mongodb";
import { AbstractNewsCrawler } from "../new-crawlers/abstract-news-crawler";
import { DanTriCrawler } from "../new-crawlers/dantri-crawler";
import { CRAWLERS } from "../constant";

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

    public  async createCrawler(url: string): Promise<AbstractNewsCrawler> {
        const crawler = CRAWLERS.get(url);
        if (!crawler) {
            throw new Error(`Không hỗ trợ domain: ${url}`);
        }
        crawler.collection = await this.connectDB()
        
        return crawler;
    }
}