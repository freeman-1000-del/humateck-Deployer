name: Daily Scout Collect

on:
  schedule:
    # 매일 UTC 00:00 (한국시간 오전 9시)에 자동 실행
    - cron: '0 0 * * *'
  workflow_dispatch:   # 수동 실행 버튼도 제공 (테스트용)

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Run collector
        env:
          YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: node fetch.mjs
