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