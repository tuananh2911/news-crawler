module.exports = {
  apps: [{
    name: "news-crawler",
    script: "./runner.js",  // Chạy file đã được build
    instances: 2,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}