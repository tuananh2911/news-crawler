import puppeteer, { Browser, Page } from 'puppeteer';
import { MongoClient, Collection } from 'mongodb';
import { AbstractNewsCrawler } from './abstract-news-crawler';
import { proxies } from '../constant';

type Article = {
    title: string;
    url: string;
    id: number | null;
    timestamp: number | null;
    source: string;
};

type MenuItem = {
    parentTitle: string;
    parentUrl: string;
    children: { title: string; url: string }[];
};
export class DanTriCrawler extends AbstractNewsCrawler  {
    public async getExistingArticleIds(collection: Collection) {
        const articles: any[] = await collection.find({}, { projection: { id: 1 } }).toArray();
        return new Set(articles.map(a => a.id));
    }

    public async crawlWebPage(uri:string) {
        const proxy = '103.179.185.60:5544:dfg546:s4235';
        const [proxyIp, proxyPort, proxyUser, proxyPass] = proxy.split(":");
        const browser = await puppeteer.launch({ headless: false,
            defaultViewport: null,
            args: [
                `--proxy-server=${proxyIp}:${proxyPort}`,
                '--start-maximized',
                '--disable-notifications',
                '--disable-geolocation',
                '--disable-infobars',
                '--disable-permissions-api'
            ],});
        const collection = this.collection
        let existingIds;
        if(collection){
             existingIds = await this.getExistingArticleIds(collection);
        }
        
        
        try {
            const page = await browser.newPage();
            if (proxyUser && proxyPass) {
                await page.authenticate({ username: proxyUser, password: proxyPass });
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
                            url: a.href.startsWith("https://dantri.com.vn") ? a.href : null
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
                                    const timestamp = id; 
    
                                    return { title, url, id, timestamp };
                                });
                        });
    
                        console.log(`Tìm thấy ${articles.length} bài viết  trang ${pageNum}`);
                        if(articles.length == 0){
                            break;
                        }
                        let newArticles:Article[] = [];
                        for (const article of articles) {
                            if (existingIds?.has(article.id)) {
                                console.log(` Dừng vì gặp bài viết cũ: ${article.title}`);
                                stopCrawling = true;
                                break;
                            }
                            newArticles.push({ ...article, source:uri });
                        }
    
                        if (newArticles.length > 0) {
                            await collection?.insertMany(newArticles);
                            console.log(` Đã lưu ${newArticles.length} bài viết mới từ ${child.title}`);
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
            await browser.close();
        }
    }
}
