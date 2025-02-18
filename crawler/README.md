# news-crawler
## Installation

```bash
$ npm install
```

## Add environment file
1) Change file '.env.example' to '.env'
2) Add values ​​to environment variables ( See more in the .env file attached to the email )

## Running the crawler

```bash
$ pm2 start .\ecosystem.config.js
```

## Config multiprocess
1) Open file "ecosystem.config.js"
2) Change config below
module.exports = {
  apps: [{
    name: "news-crawler",    // tên app
    script: "./runner.js",  // Chạy file đã được build
    instances: 2,           // số process
    autorestart: true,      // auto restart
    watch: false,           // xem process
    max_memory_restart: '1G' // số ram tối đa, nếu vượt quá sẽ restart
  }]
}

## Edit code and run code
# After edit code, you need run: 
1) Run 'tsc' to compile typescript to javascript
2) Run "pm2 start .\ecosystem.config.js"
