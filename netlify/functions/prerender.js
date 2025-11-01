// Netlify Functions는 Node.js 18+ 내장 fetch 사용
export const handler = async (event) => {
  console.log('=== Prerender Function Called ===');
  console.log('Path:', event.path);
  console.log('User-Agent:', event.headers['user-agent']);
  
  const prerenderToken = process.env.PRERENDER_TOKEN;
  
  // 토큰 확인
  if (!prerenderToken) {
    console.error('ERROR: PRERENDER_TOKEN is not set!');
    return {
      statusCode: 500,
      body: 'Prerender token configuration error',
    };
  }
  
  const userAgent = event.headers['user-agent'] || '';
  const path = event.path;

  // URL 재구성 (event.rawUrl이 없을 경우 대비)
  const protocol = event.headers['x-forwarded-proto'] || 'https';
  const host = event.headers.host;
  const fullUrl = event.rawUrl || `${protocol}://${host}${path}`;
  
  console.log('Full URL:', fullUrl);

  // 인증 콜백 경로는 렌더링에서 제외
  if (path === '/auth/callback') {
    console.log('Auth callback detected, returning index.html');
    try {
      const rootUrl = `${protocol}://${host}`;
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
    'meta-externalagent', // Facebook 크롤러
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
    'whatsapp',
    'yandex',
    'Prerender',
  ];

  // Check if the user-agent is a bot
  const isBot = botUserAgents.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));

  // Prerender.io 자체 크롤러는 무한 루프 방지를 위해 직접 처리
  const isPrerenderBot = userAgent.toLowerCase().includes('prerender');

  console.log('Is Bot?', isBot);
  console.log('Is Prerender Bot?', isPrerenderBot);

  // Prerender.io 크롤러면 직접 index.html 제공 (무한 루프 방지)
  if (isPrerenderBot) {
    console.log('Prerender.io bot detected, serving index.html directly');
    try {
      const rootUrl = `${protocol}://${host}`;
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
      console.error('Error fetching index.html for Prerender bot:', error);
      return {
        statusCode: 500,
        body: 'Error loading the application.',
      };
    }
  }

  // If it's a bot, proxy to Prerender.io
  if (isBot) {
    console.log('Bot detected! Fetching from Prerender.io...');
    try {
      const prerenderUrl = `https://service.prerender.io/${encodeURIComponent(fullUrl)}`;
      console.log('Prerender URL:', prerenderUrl);
      
      // 타임아웃 추가 (10초)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(prerenderUrl, {
        headers: {
          'X-Prerender-Token': prerenderToken,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      console.log('Prerender.io response status:', response.status);
      
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
      // Prerender 실패 시 fallback으로 index.html 제공
      console.log('Falling back to index.html');
      try {
        const rootUrl = `${protocol}://${host}`;
        const response = await fetch(`${rootUrl}/index.html`);
        const body = await response.text();
        return {
          statusCode: 200,
          body: body,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return {
          statusCode: 500,
          body: 'Error fetching pre-rendered page.',
        };
      }
    }
  }

  // If not a bot, serve the main index.html file to let the SPA handle routing
  console.log('Regular user detected, serving index.html');
  try {
    const rootUrl = `${protocol}://${host}`;
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