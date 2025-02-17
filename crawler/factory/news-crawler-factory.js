"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsCrawlerFactory = void 0;
const mongodb_1 = require("mongodb");
const dantri_crawler_1 = require("../crawlers/dantri-crawler");
const kafkajs_1 = require("kafkajs");
const constant_1 = require("../constant");
const vnexpress_crawler_1 = require("../crawlers/vnexpress-crawler");
const dotenv_1 = __importDefault(require("dotenv"));
// Load biến môi trường
dotenv_1.default.config();
const MONGO_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME || '';
const BROKER = process.env.KAFKA_BROKERS || '';
const CRAWLERS = new Map([
    [constant_1.DANTRI_URI, new dantri_crawler_1.DanTriCrawler(constant_1.DANTRI_URI)],
    [constant_1.VNEXPRESS_URI, new vnexpress_crawler_1.VnexpressCrawler(constant_1.VNEXPRESS_URI)]
]);
class NewsCrawlerFactory {
    connectDB() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = new mongodb_1.MongoClient(MONGO_URI);
            yield client.connect();
            console.log("Đã kết nối MongoDB");
            return client.db(DB_NAME).collection(COLLECTION_NAME);
        });
    }
    connectKafka() {
        return __awaiter(this, void 0, void 0, function* () {
            const kafka = new kafkajs_1.Kafka({
                clientId: 'dantri-crawler',
                brokers: [BROKER] // Thay đổi broker URL theo cấu hình của bạn
            });
            const producer = kafka.producer();
            return producer;
        });
    }
    createCrawler(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const crawler = CRAWLERS.get(url);
            if (!crawler) {
                throw new Error(`Không hỗ trợ domain: ${url}`);
            }
            crawler.collection = yield this.connectDB();
            crawler.producer = yield this.connectKafka();
            return crawler;
        });
    }
}
exports.NewsCrawlerFactory = NewsCrawlerFactory;
