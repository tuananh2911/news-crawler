import puppeteer, { Browser, Page } from 'puppeteer';
import { MongoClient, Collection } from 'mongodb';
import { AbstractNewsCrawler } from './abstract-crawler';
import { DANTRI_URI } from '../constant';
import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

// Load biến môi trường
dotenv.config();
type Article = {
    title: string;
    url: string;
    id: number | null;
    source: string;
  parentCategory: string;

  childCategory: string;
};

type MenuItem = {
    parentTitle: string;
    parentUrl: string;
    children: { title: string; url: string }[];
};
export class DanTriCrawler extends AbstractNewsCrawler  {

    public async getExistingArticleIds(
        collection: Collection,
        source: string,
        parentCategory: string,
        childCategory: string
    ) {
        const articles: any[] = await collection.find(
            {
                source: source,
                parentCategory: parentCategory,
                childCategory: childCategory
            },
            { projection: { id: 1 } }
        ).toArray();
        
        return new Set(articles.map(a => a.id));
    }

    public async disconnectProducer() {
        await this.producer.disconnect();
    }

    public async sendToKafka(articles: Article[]) {
        await this.producer.connect();
        try {
            const messages = articles.map(article => ({
                value: JSON.stringify(article)
            }));

            await this.producer.send({
                topic: 'article',
                messages
            });

            console.log(`Đã gửi ${articles.length} bài viết vào Kafka topic`);
        } catch (error) {
            console.error('Lỗi khi gửi vào Kafka:', error);
            throw error;
        }
    }

    public async crawlWebPage(uri:string) {
        const browser = await puppeteer.launch({ headless: false,
            defaultViewport: null,
            args: [
                `--proxy-server=${process.env.PROXY_IP}:${process.env.PROXY_PORT}`,
                '--start-maximized',
                '--disable-notifications',
                '--disable-geolocation',
                '--disable-infobars',
                '--disable-permissions-api'
            ],});
        const collection = this.collection
        
        
        
        try {
            const [proxyUser,proxyPass] = [process.env.PROXY_USERNAME,process.env.PROXY_PASSWORD]
            const page = await browser.newPage();
            if (proxyUser && proxyPass) {
                await page.authenticate({ username: proxyUser , password: proxyPass  });
            }
            await page.goto(uri);
            await page.click('body > nav > ol > li.menu-more');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const menuData: MenuItem[] = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('body > nav > nav > div > ol > li')).map(li => {
                    const parentLink:any = li.querySelector(':scope > a');

                    const parentTitle = parentLink ? parentLink.innerText.trim() : "No Title";

                    const parentUrl = parentLink ? parentLink.href : "#";
                    const children = Array.from(li.querySelectorAll(':scope > ol > li > a'))
                        .map((a:any) => ({
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
                        const childPage = await browser.newPage();
                        await childPage.goto(subUrl, { waitUntil: "domcontentloaded" });
                        console.log(` Đang crawl: ${subUrl}`);
    
                        const articles = await childPage.evaluate(() => {
                            return Array.from(document.querySelectorAll('#bai-viet > div.main > div.article.list > article > div.article-content > h3 > a'))
                                .map((a:any) => {
                                    const url = a.href;
                                    const title = a.innerText.trim();
                                    const idMatch = url.match(/-(\d+)\.htm$/);
                                    const id = idMatch ? Number(idMatch[1]) : null
    
                                    return { title, url, id };
                                });
                        });
    
                        console.log(`Tìm thấy ${articles.length} bài viết  trang ${pageNum}`);
                        if(articles.length == 0){
                            stopCrawling = true;
                            break;
                        }
                        let newArticles:Article[] = [];
                        let existingIds;
                        if(collection){
                            existingIds = await this.getExistingArticleIds(
                                collection,
                                uri,
                                menu.parentTitle,
                                child.title
                            );
                        }
                        for (const article of articles) {
                            if (existingIds?.has(article.id)) {
                                console.log(` Dừng vì gặp bài viết cũ: ${article.title}`);
                                stopCrawling = true;
                                break;
                            }
                            newArticles.push({ ...article, source:uri ,parentCategory: menu.parentTitle,
                                childCategory: child.title});
                        }
    
                        if (newArticles.length > 0) {
                            await this.sendToKafka(newArticles);
                        }
                        
                        await childPage.close();
                        pageNum++;
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }
        } catch (error) {
            console.error(' Error:', error);
        } finally {
            await this.disconnectProducer();
            await browser.close();
        }
    }
}
