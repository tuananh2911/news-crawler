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
exports.DanTriCrawler = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const abstract_crawler_1 = require("./abstract-crawler");
class DanTriCrawler extends abstract_crawler_1.AbstractNewsCrawler {
    getExistingArticleIds(collection, source, parentCategory, childCategory) {
        return __awaiter(this, void 0, void 0, function* () {
            const articles = yield collection.find({
                source: source,
                parentCategory: parentCategory,
                childCategory: childCategory
            }, { projection: { id: 1 } }).toArray();
            return new Set(articles.map(a => a.id));
        });
    }
    disconnectProducer() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.producer.disconnect();
        });
    }
    sendToKafka(articles) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.producer.connect();
            try {
                const messages = articles.map(article => ({
                    value: JSON.stringify(article)
                }));
                yield this.producer.send({
                    topic: 'article',
                    messages
                });
                console.log(`Đã gửi ${articles.length} bài viết vào Kafka topic`);
            }
            catch (error) {
                console.error('Lỗi khi gửi vào Kafka:', error);
                throw error;
            }
        });
    }
    crawlWebPage(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const browser = yield puppeteer_1.default.launch({ headless: false,
                defaultViewport: null,
                args: [
                    `--proxy-server=${process.env.PROXY_IP}:${process.env.PROXY_PORT}`,
                    '--start-maximized',
                    '--disable-notifications',
                    '--disable-geolocation',
                    '--disable-infobars',
                    '--disable-permissions-api'
                ], });
            const collection = this.collection;
            try {
                const [proxyUser, proxyPass] = [process.env.PROXY_USERNAME, process.env.PROXY_PASSWORD];
                const page = yield browser.newPage();
                if (proxyUser && proxyPass) {
                    yield page.authenticate({ username: proxyUser, password: proxyPass });
                }
                yield page.goto(uri);
                yield page.click('body > nav > ol > li.menu-more');
                yield new Promise(resolve => setTimeout(resolve, 2000));
                const menuData = yield page.evaluate(() => {
                    return Array.from(document.querySelectorAll('body > nav > nav > div > ol > li')).map(li => {
                        const parentLink = li.querySelector(':scope > a');
                        const parentTitle = parentLink ? parentLink.innerText.trim() : "No Title";
                        const parentUrl = parentLink ? parentLink.href : "#";
                        const children = Array.from(li.querySelectorAll(':scope > ol > li > a'))
                            .map((a) => ({
                            title: a.innerText.trim(),
                            url: a.href.startsWith('https://dantri.com.vn') ? a.href : null
                        })).filter(el => el.url !== null);
                        return { parentTitle, parentUrl, children };
                    });
                });
                for (const menu of menuData) {
                    for (const child of menu.children) {
                        let pageNum = 1, stopCrawling = false;
                        while (!stopCrawling) {
                            let subUrl = pageNum === 1 ? child.url : `${child.url.replace('.htm', '')}/trang-${pageNum}.htm`;
                            const childPage = yield browser.newPage();
                            yield childPage.goto(subUrl, { waitUntil: "domcontentloaded" });
                            console.log(` Đang crawl: ${subUrl}`);
                            const articles = yield childPage.evaluate(() => {
                                return Array.from(document.querySelectorAll('#bai-viet > div.main > div.article.list > article > div.article-content > h3 > a'))
                                    .map((a) => {
                                    const url = a.href;
                                    const title = a.innerText.trim();
                                    const idMatch = url.match(/-(\d+)\.htm$/);
                                    const id = idMatch ? Number(idMatch[1]) : null;
                                    return { title, url, id };
                                });
                            });
                            console.log(`Tìm thấy ${articles.length} bài viết  trang ${pageNum}`);
                            if (articles.length == 0) {
                                stopCrawling = true;
                                break;
                            }
                            let newArticles = [];
                            let existingIds;
                            if (collection) {
                                existingIds = yield this.getExistingArticleIds(collection, uri, menu.parentTitle, child.title);
                            }
                            for (const article of articles) {
                                if (existingIds === null || existingIds === void 0 ? void 0 : existingIds.has(article.id)) {
                                    console.log(` Dừng vì gặp bài viết cũ: ${article.title}`);
                                    stopCrawling = true;
                                    break;
                                }
                                newArticles.push(Object.assign(Object.assign({}, article), { source: uri, parentCategory: menu.parentTitle, childCategory: child.title }));
                            }
                            if (newArticles.length > 0) {
                                yield this.sendToKafka(newArticles);
                            }
                            yield childPage.close();
                            pageNum++;
                            yield new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }
                }
            }
            catch (error) {
                console.error(' Error:', error);
            }
            finally {
                yield this.disconnectProducer();
                yield browser.close();
            }
        });
    }
}
exports.DanTriCrawler = DanTriCrawler;
