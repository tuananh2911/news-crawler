import { AbstractNewsCrawler } from "./crawlers/abstract-crawler";
import { NewsCrawlerFactory } from "./factory/news-crawler-factory";

export class Crawler{
    private crawler:AbstractNewsCrawler | undefined;
    private uri:string;
    constructor(uri:string){
        this.uri = uri
    }
    
    public async createCrawler (){
        const newsCrawlerFactory = new NewsCrawlerFactory()
        this.crawler = await newsCrawlerFactory.createCrawler(this.uri)
    }
    public async crawl(){
        if(this.crawler){
            console.log(this.crawler.uri)
            this.crawler.crawlWebPage(this.uri);
        }
        
    }
}