module.exports = {
    apps: [
      {
        name: "crawler-dantri",
        script: "npx vite-node .\runner.ts",
        args: "https://dantri.com.vn"
      }
    ]
  };
  