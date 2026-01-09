# Serverless Newsletter System & Contact Management System using Cloudflare Workers

A production-ready, serverless newsletter and contact form management system built on Cloudflare Workers with enterprise-grade security, dual-layer data persistence, and multiple email provider support.

## 🌐 Live Links
- **Website**: https://sujal2048.github.io
- **RSS Feed**: https://sujal2048.github.io/index.xml
- **Newsletter System**: https://sujal-newsletter.sujalgupta.workers.dev/


## 🚀 Features

### Core Functionality
- **Newsletter Management**: Automated RSS feed monitoring and batch email delivery
- **Contact Forms**: Integrated contact system with auto-subscribe option
- **Subscriber Management**: Double opt-in support with secure unsubscribe links
- **Multiple Email Providers**: Gmail SMTP, MailerLite API, and Cloudflare Email Routing

### Security & Protection
- **Admin Panel Security**: Session-only authentication, no external API access
- **Bot Protection**: Cloudflare Turnstile CAPTCHA integration
- **Native Rate Limiting Only**:
  - Uses Cloudflare's built-in Rate Limiting API exclusively
  - No KV operations for rate limiting (prevents hitting free tier limits)
  - Multi-layer protection: burst, global, forms, admin, API, bot
- **XSS Protection**: Comprehensive input sanitization
- **No PII Exposure**: Customer data never exposed through APIs

### Data Management
- **Dual Storage System**:
  - KV for operational data (fast access, subscriber management)
  - D1 database for archival (SQL-based, permanent append-only storage)
- **Real-time D1 Replication**: Automatic async replication from KV to D1
- **Auto-Cleanup**: TTL-based expiration for temporary data
- **Append-Only Archive**: D1 maintains permanent audit trail

### Performance Optimizations
- **Async Processing**: Non-blocking D1 replication using ctx.waitUntil()
- **Prefix-Based Queries**: Efficient KV operations using prefix filtering
- **Batch Processing**: Configurable batch sizes for email delivery
- **Retry Logic**: Exponential backoff with dead letter queue
