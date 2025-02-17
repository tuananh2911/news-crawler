// src/index.ts
import { Crawler } from "./crawler-main";
const urls = [
  "https://dantri.com.vn",
  "https://vnexpress.net"
];

async function start() {
  while (true) {
    try {
      console.log(" Starting new crawl cycle.");
      
      for (const url of urls) {
        console.log(` Crawling: ${url}`);
        const crawler = new Crawler(url);
        await crawler.createCrawler();
        await crawler.crawl();
        console.log(` Done crawling: ${url}`);
      }

      const delayMinutes = 15;
      console.log(` Waiting ${delayMinutes} minutes before next cycle...`);
      await new Promise(resolve => setTimeout(resolve, delayMinutes * 60 * 1000));
      
    } catch (error) {
      console.error(" Error during crawl cycle:", error);
      await new Promise(resolve => setTimeout(resolve, 60 * 1000));
    }
  }
}

process.on('SIGINT', async () => {
  console.log('\n👋 Gracefully shutting down...');
  process.exit(0);
});

console.log("🚀 Starting continuous crawler...");
start();