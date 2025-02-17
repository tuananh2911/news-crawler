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
exports.Crawler = void 0;
const news_crawler_factory_1 = require("./factory/news-crawler-factory");
class Crawler {
    constructor(uri) {
        this.uri = uri;
    }
    createCrawler() {
        return __awaiter(this, void 0, void 0, function* () {
            const newsCrawlerFactory = new news_crawler_factory_1.NewsCrawlerFactory();
            this.crawler = yield newsCrawlerFactory.createCrawler(this.uri);
        });
    }
    crawl() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.crawler) {
                console.log(this.crawler.uri);
                this.crawler.crawlWebPage(this.uri);
            }
        });
    }
}
exports.Crawler = Crawler;
