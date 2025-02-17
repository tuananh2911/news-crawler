import { Collection, MongoClient } from "mongodb";

export abstract class AbstractNewsCrawler {
    public uri: string;
    public producer:any;
    public collection: Collection | undefined;
    constructor(uri: string) {
        if (this.constructor === AbstractNewsCrawler) {
            throw new Error("Abstract class cannot be instantiated");
        }
        this.uri = uri;
    }

    public abstract getExistingArticleIds(collection: Collection,
        source: string,
        parentCategory: string,
        childCategory: string): Promise<Set<any>>;
    public abstract  crawlWebPage(uri: string): Promise<void>;
    public abstract sendToKafka(articles:any[]): Promise<any>;
    public abstract disconnectProducer(): Promise<void>;
}