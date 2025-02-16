import { Crawler } from "./crawler-main";


const url = process.argv[2]; // Nhận URL từ tham số dòng lệnh

if (!url) {
  console.error("❌ Missing URL argument!");
  process.exit(1);
}

async function start() {
  const crawler = new Crawler(url);
  await crawler.createCrawler();
  await crawler.crawl();
  console.log(`✅ Done crawling: ${url}`);
}

start();
