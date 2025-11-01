// eslint-disable-next-line @typescript-eslint/no-require-imports
const fetch = require('node-fetch');

exports.handler = async (event) => {
  const prerenderToken = process.env.PRERENDER_TOKEN;
  const userAgent = event.headers['user-agent'];
  const path = event.path;

  // 인증 콜백 경로는 렌더링에서 제외
  if (path === '/auth/callback') {
    // SPA가 처리하도록 index.html을 반환
    try {
      const siteUrl = new URL(event.rawUrl);
      const rootUrl = `${siteUrl.protocol}//${siteUrl.host}`;
      const response = await fetch(`${rootUrl}/index.html`);
      const body = await response.text();
      return {
        statusCode: 200,
        body: body,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      };
    } catch (error) {
      console.error('Error fetching index.html for auth callback:', error);
      return {
        statusCode: 500,
        body: 'Error loading the application for auth callback.',
      };
    }
  }

  // List of bots to prerender
  const botUserAgents = [
    'googlebot',
    'yahoo',
    'bingbot',
    'baiduspider',
    'facebookexternalhit',
    'twitterbot',
    'rogerbot',
    'linkedinbot',
    'embedly',
    'quora link preview',
    'showyoubot',
    'outbrain',
    'pinterest',
    'slackbot',
    'vkShare',
    'W3C_Validator',
    'yandex',
  ];

  // Check if the user-agent is a bot
  const isBot = botUserAgents.some(bot => userAgent && userAgent.toLowerCase().includes(bot));

  // If it's a bot, proxy to Prerender.io
  if (isBot) {
    try {
      const prerenderUrl = `https://service.prerender.io/${encodeURIComponent(event.rawUrl)}`;
      const response = await fetch(prerenderUrl, {
        headers: {
          'X-Prerender-Token': prerenderToken,
        },
      });
      const body = await response.text();
      return {
        statusCode: response.status,
        body: body,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      };
    } catch (error) {
      console.error('Error fetching from Prerender.io:', error);
      return {
        statusCode: 500,
        body: 'Error fetching pre-rendered page.',
      };
    }
  }

  // If not a bot, serve the main index.html file to let the SPA handle routing
  try {
    const siteUrl = new URL(event.rawUrl);
    const rootUrl = `${siteUrl.protocol}//${siteUrl.host}`;
    const response = await fetch(`${rootUrl}/index.html`);
    const body = await response.text();
    return {
      statusCode: 200,
      body: body,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    };
  } catch (error) {
    console.error('Error fetching index.html:', error);
    return {
      statusCode: 500,
      body: 'Error loading the application.',
    };
  }
};
