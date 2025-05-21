const puppeteer = require('puppeteer');
const axios = require('axios');
require('dotenv').config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.goto('https://shop.app/m/318kyptdam', { waitUntil: 'networkidle2' });
  const found = await page.evaluate(() => {
    return document.body.innerText.toLowerCase().includes('discount');
  });

  if (found) {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: '🎯 "discount" 글자가 화면에 나타났습니다!',
    });
  }

  await browser.close();
})();
