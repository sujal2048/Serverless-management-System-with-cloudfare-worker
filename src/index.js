// src/index.js - Minimal working version
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Homepage
    if (path === '/') {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sujal's Newsletter System</title>
          <style>
            body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
            .card { background: #f5f5f5; padding: 30px; border-radius: 12px; margin: 20px 0; }
            .btn { display: inline-block; padding: 12px 24px; margin: 10px 5px; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .btn-primary { background: #4f46e5; color: white; }
            .btn-danger { background: #ef4444; color: white; }
            .btn-success { background: #10b981; color: white; }
          </style>
        </head>
        <body>
          <h1>📬 Sujal's Newsletter System</h1>
          <p>Welcome to the newsletter system for <strong>${env.SITE_OWNER}</strong></p>
          
          <div class="card">
            <h2>Quick Links</h2>
            <a href="/subscribe" class="btn btn-primary">Subscribe</a>
            <a href="/unsubscribe" class="btn btn-danger">Unsubscribe</a>
            <a href="/contact" class="btn btn-success">Contact</a>
            <a href="/status" class="btn">System Status</a>
          </div>
          
          <div class="card">
            <h2>System Info</h2>
            <p><strong>Version:</strong> ${env.WORKER_VERSION}</p>
            <p><strong>RSS Feed:</strong> <a href="${env.RSS_FEED_URL}">${env.RSS_FEED_URL}</a></p>
            <p><strong>Blog URL:</strong> <a href="${env.SITE_URL}">${env.SITE_URL}</a></p>
            <p><strong>Environment:</strong> ${env.ENVIRONMENT}</p>
          </div>
        </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }
    
    // Subscribe page
    if (path === '/subscribe') {
      return serveSubscribePage(env);
    }
    
    // Unsubscribe page
    if (path === '/unsubscribe') {
      return serveUnsubscribePage(env);
    }
    
    // Contact page
    if (path === '/contact') {
      return serveContactPage(env);
    }
    
    // Status page
    if (path === '/status') {
      return Response.json({
        status: 'operational',
        version: env.WORKER_VERSION,
        timestamp: new Date().toISOString(),
        endpoints: {
          home: '/',
          subscribe: '/subscribe',
          unsubscribe: '/unsubscribe',
          contact: '/contact',
          rss_feed: env.RSS_FEED_URL
        }
      });
    }
    
    // API: Subscribe
    if (path === '/api/subscribe' && request.method === 'POST') {
      return handleSubscribe(request, env);
    }
    
    // API: Unsubscribe
    if (path === '/api/unsubscribe' && request.method === 'POST') {
      return handleUnsubscribe(request, env);
    }
    
    // API: Contact
    if (path === '/api/contact' && request.method === 'POST') {
      return handleContact(request, env);
    }
    
    // API: Check RSS (for testing)
    if (path === '/api/check-rss') {
      try {
        const response = await fetch(env.RSS_FEED_URL);
        const text = await response.text();
        return Response.json({
          success: true,
          length: text.length,
          isXml: text.includes('<?xml'),
          firstLine: text.split('\n')[0]
        });
      } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }
    }
    
    // 404
    return new Response('Not Found', { status: 404 });
  }
};

// HTML Pages
function serveSubscribePage(env) {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Subscribe • ${env.SITE_OWNER}</title>
      <script src="${env.TURNSTILE_API_URL}" async defer></script>
      <style>
        body { font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 600; }
        input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; }
        button { width: 100%; padding: 14px; background: #4f46e5; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; }
        .message { margin-top: 20px; padding: 12px; border-radius: 6px; }
        .success { background: #d1fae5; color: #065f46; }
        .error { background: #fee2e2; color: #991b1b; }
      </style>
    </head>
    <body>
      <h1>Subscribe to Newsletter</h1>
      <p>Get weekly insights on system design, algorithms, and software engineering.</p>
      
      <form id="subscribeForm">
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="email" required>
        </div>
        <div class="form-group">
          <label>Name (optional)</label>
          <input type="text" id="name">
        </div>
        
        <div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY_HERE"></div>
        
        <button type="submit">Subscribe</button>
        
        <div id="message" class="message" style="display: none;"></div>
      </form>
      
      <p style="margin-top: 30px;"><a href="/">← Back to Home</a></p>
      
      <script>
        document.getElementById('subscribeForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const btn = e.target.querySelector('button');
          const originalText = btn.textContent;
          btn.textContent = 'Subscribing...';
          btn.disabled = true;
          
          const data = {
            email: document.getElementById('email').value,
            name: document.getElementById('name').value || ''
          };
          
          try {
            const response = await fetch('/api/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            const result = await response.json();
            const message = document.getElementById('message');
            message.style.display = 'block';
            message.textContent = result.message || result.error;
            message.className = 'message ' + (response.ok ? 'success' : 'error');
            
            if (response.ok) {
              document.getElementById('subscribeForm').reset();
            }
          } catch (error) {
            const message = document.getElementById('message');
            message.style.display = 'block';
            message.textContent = 'Network error. Please try again.';
            message.className = 'message error';
          } finally {
            btn.textContent = originalText;
            btn.disabled = false;
          }
        });
      </script>
    </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } });
}

function serveUnsubscribePage(env) {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Unsubscribe • ${env.SITE_OWNER}</title>
      <style>
        body { font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 600; }
        input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; }
        button { width: 100%; padding: 14px; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; }
        .message { margin-top: 20px; padding: 12px; border-radius: 6px; }
        .success { background: #d1fae5; color: #065f46; }
        .error { background: #fee2e2; color: #991b1b; }
      </style>
    </head>
    <body>
      <h1>Unsubscribe</h1>
      <p>We're sorry to see you go. Enter your email to unsubscribe.</p>
      
      <form id="unsubscribeForm">
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="email" required>
        </div>
        
        <button type="submit">Unsubscribe</button>
        
        <div id="message" class="message" style="display: none;"></div>
      </form>
      
      <p style="margin-top: 30px;"><a href="/">← Back to Home</a> • <a href="/subscribe">Resubscribe</a></p>
      
      <script>
        document.getElementById('unsubscribeForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const btn = e.target.querySelector('button');
          const originalText = btn.textContent;
          btn.textContent = 'Processing...';
          btn.disabled = true;
          
          const data = {
            email: document.getElementById('email').value
          };
          
          try {
            const response = await fetch('/api/unsubscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            const result = await response.json();
            const message = document.getElementById('message');
            message.style.display = 'block';
            message.textContent = result.message || result.error;
            message.className = 'message ' + (response.ok ? 'success' : 'error');
            
            if (response.ok) {
              document.getElementById('unsubscribeForm').reset();
            }
          } catch (error) {
            const message = document.getElementById('message');
            message.style.display = 'block';
            message.textContent = 'Network error. Please try again.';
            message.className = 'message error';
          } finally {
            btn.textContent = originalText;
            btn.disabled = false;
          }
        });
      </script>
    </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } });
}

function serveContactPage(env) {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Contact • ${env.SITE_OWNER}</title>
      <script src="${env.TURNSTILE_API_URL}" async defer></script>
      <style>
        body { font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 600; }
        input, textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; }
        textarea { min-height: 150px; resize: vertical; }
        button { width: 100%; padding: 14px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; }
        .message { margin-top: 20px; padding: 12px; border-radius: 6px; }
        .success { background: #d1fae5; color: #065f46; }
        .error { background: #fee2e2; color: #991b1b; }
      </style>
    </head>
    <body>
      <h1>Contact ${env.SITE_OWNER}</h1>
      <p>Have questions or feedback? Send me a message!</p>
      
      <form id="contactForm">
        <div class="form-group">
          <label>Name</label>
          <input type="text" id="name" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="email" required>
        </div>
        <div class="form-group">
          <label>Subject</label>
          <input type="text" id="subject" required>
        </div>
        <div class="form-group">
          <label>Message</label>
          <textarea id="message" required></textarea>
        </div>
        
        <div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY_HERE"></div>
        
        <button type="submit">Send Message</button>
        
        <div id="responseMessage" class="message" style="display: none;"></div>
      </form>
      
      <p style="margin-top: 30px;"><a href="/">← Back to Home</a></p>
      
      <script>
        document.getElementById('contactForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const btn = e.target.querySelector('button');
          const originalText = btn.textContent;
          btn.textContent = 'Sending...';
          btn.disabled = true;
          
          const data = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
          };
          
          try {
            const response = await fetch('/api/contact', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            const result = await response.json();
            const messageDiv = document.getElementById('responseMessage');
            messageDiv.style.display = 'block';
            messageDiv.textContent = result.message || result.error;
            messageDiv.className = 'message ' + (response.ok ? 'success' : 'error');
            
            if (response.ok) {
              document.getElementById('contactForm').reset();
            }
          } catch (error) {
            const messageDiv = document.getElementById('responseMessage');
            messageDiv.style.display = 'block';
            messageDiv.textContent = 'Network error. Please try again.';
            messageDiv.className = 'message error';
          } finally {
            btn.textContent = originalText;
            btn.disabled = false;
          }
        });
      </script>
    </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } });
}

// API Handlers
async function handleSubscribe(request, env) {
  try {
    const data = await request.json();
    const email = data.email?.trim();
    
    // Basic validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Valid email address required' }, { status: 400 });
    }
    
    // For now, just log and return success
    console.log(`[SUBSCRIBE] New subscription: ${email}`);
    
    return Response.json({
      success: true,
      message: 'Subscription successful! (Demo mode - email will be stored in production)'
    });
  } catch (error) {
    return Response.json({ error: 'Subscription failed' }, { status: 500 });
  }
}

async function handleUnsubscribe(request, env) {
  try {
    const data = await request.json();
    const email = data.email?.trim();
    
    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }
    
    console.log(`[UNSUBSCRIBE] Request: ${email}`);
    
    return Response.json({
      success: true,
      message: 'Unsubscribed successfully! (Demo mode)'
    });
  } catch (error) {
    return Response.json({ error: 'Unsubscribe failed' }, { status: 500 });
  }
}

async function handleContact(request, env) {
  try {
    const data = await request.json();
    
    console.log(`[CONTACT] Message from: ${data.name} <${data.email}>`);
    console.log(`[CONTACT] Subject: ${data.subject}`);
    console.log(`[CONTACT] Message: ${data.message.substring(0, 100)}...`);
    
    return Response.json({
      success: true,
      message: 'Message received! (Demo mode - will send email in production)'
    });
  } catch (error) {
    return Response.json({ error: 'Message sending failed' }, { status: 500 });
  }
}
