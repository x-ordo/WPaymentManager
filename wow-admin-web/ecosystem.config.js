module.exports = {
  apps: [
    {
      name: "CreativePaymentManager",
      // npm 대신 next 실행파일을 직접 가리킵니다.
      script: "./node_modules/next/dist/bin/next",
      args: "start -p 5000",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};
