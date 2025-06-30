// index.js
require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const Stealth = require('puppeteer-extra-plugin-stealth');
puppeteer.use(Stealth());
const TelegramBot = require('node-telegram-bot-api');

// 환경변수 읽기
const {
  TELEGRAM_TOKEN,
  CHAT_ID,
  PRODUCT_URL,
  THRESHOLD,
  INTERVAL
} = process.env;

const bot = new TelegramBot(TELEGRAM_TOKEN);

(async () => {
  // 헤드리스 브라우저 열기 (화면 안 보여요)
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  while (true) {
    try {
      // 1) 제품 페이지 열기
      await page.goto(PRODUCT_URL, { waitUntil: 'networkidle2' });

      // 2) Add to Bag 버튼 누르기
      await page.click('button[name="add"]'); // 필요시 셀렉터 조정
      await page.waitForSelector('a[href*="/cart"]', { timeout: 5000 });
      await page.click('a[href*="/cart"]');

      // 3) 장바구니에서 Checkout 누르기
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      await page.click('button[name="checkout"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      // 4) 총액 읽어서 숫자로 변환
      const totalText = await page.$eval('.payment-due__price', el => el.innerText);
      const price = parseFloat(totalText.replace(/[^0-9.]/g, ''));

      console.log('현재 가격:', price);

      // 5) 기준 이하이면 텔레그램 알림
      if (price <= parseFloat(THRESHOLD)) {
        await bot.sendMessage(CHAT_ID,
          `🎉 가격 알림! 현재 총액이 $${price}로 설정한 기준(${THRESHOLD}$) 이하로 내려갔어요!`
        );
        // 브라우저 닫고 종료하려면 아래 주석 해제
        // await browser.close();
        // process.exit(0);
      }
    } catch (e) {
      console.error('오류 발생:', e.message);
    }
    console.log(`다음 확인까지 ${INTERVAL}초 대기 중...`);
    await new Promise(res => setTimeout(res, parseInt(INTERVAL) * 1000));
  }
})();
