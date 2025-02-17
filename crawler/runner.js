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
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const crawler_main_1 = require("./crawler-main");
const urls = [
    "https://dantri.com.vn",
    "https://vnexpress.net"
];
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        while (true) {
            try {
                console.log(" Starting new crawl cycle.");
                for (const url of urls) {
                    console.log(` Crawling: ${url}`);
                    const crawler = new crawler_main_1.Crawler(url);
                    yield crawler.createCrawler();
                    yield crawler.crawl();
                    console.log(` Done crawling: ${url}`);
                }
                const delayMinutes = 15;
                console.log(` Waiting ${delayMinutes} minutes before next cycle...`);
                yield new Promise(resolve => setTimeout(resolve, delayMinutes * 60 * 1000));
            }
            catch (error) {
                console.error(" Error during crawl cycle:", error);
                yield new Promise(resolve => setTimeout(resolve, 60 * 1000));
            }
        }
    });
}
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\n👋 Gracefully shutting down...');
    process.exit(0);
}));
console.log("🚀 Starting continuous crawler...");
start();
