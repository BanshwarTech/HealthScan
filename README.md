# HealthScan 🛡️⚡

> **Production-grade Website Security, Performance & Technical Health Audit SaaS Platform**

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28.svg)](https://firebase.google.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**HealthScan** is a modern security and technical health auditing platform designed for developers, DevOps engineers, and digital agencies. It performs 45+ non-invasive automated checks across security, performance, SEO, DNS spoofing defenses, cookie hardening, and crawler hygiene, delivering clear health scores (0–100) and actionable copy-paste code remediations.

---

## ✨ Core Features

### 1. 🔒 Security & SSL/TLS Audit
- **Certificate Validation**: Expiry countdown, issuer details, subject alternative names (SANs), and certificate chains.
- **Protocol & Cipher Testing**: TLS 1.3 / TLS 1.2 modern cipher negotiation and legacy protocol depreciation warnings.
- **HTTPS Redirection**: Checks unencrypted HTTP to HTTPS auto-redirection.
- **HSTS Preload**: Strict-Transport-Security header enforcement and preload verification.

### 2. 🛡️ HTTP Security Headers Evaluation
- Evaluates missing or weak response headers:
  - `Content-Security-Policy` (CSP)
  - `Strict-Transport-Security` (HSTS)
  - `X-Frame-Options` (Clickjacking prevention)
  - `X-Content-Type-Options` (MIME sniffing prevention)
  - `Referrer-Policy`
  - `Permissions-Policy`
- Provides exact Nginx, Apache, Cloudflare, and Next.js copy-paste header snippets to fix findings instantly.

### 3. 🌐 DNS & Email Spoofing Defense
- **SPF (Sender Policy Framework)**: Validates authorized mail sending IPs.
- **DMARC Alignment**: Validates domain-based message authentication and reject/quarantine policies.
- **MX Records**: Confirms presence and routing for legitimate mail servers.
- **CAA (Certificate Authority Authorization)**: Ensures unauthorized CAs cannot issue certificates for your domain.

### 4. ⚡ Performance & Server Latency
- **Time to First Byte (TTFB)**: Response latency measurement and categorization.
- **HTTP Compression**: Brotli (`br`) and Gzip detection and verification.
- **Caching Policies**: `Cache-Control`, `ETag`, and `Age` optimization checks.

### 5. 🔍 SEO & Crawl Hygiene
- Semantic Title tags, Meta descriptions, OpenGraph tags, and canonical URLs.
- Heading tag hierarchy (`H1`, `H2`) and image `alt` attributes.
- `robots.txt` accessibility and syntax analysis.
- `sitemap.xml` presence, schema validation, and URL counting.

### 6. 🍪 Cookie Hardening & Technology Detection
- Flags `Secure`, `HttpOnly`, and `SameSite` attributes on all session cookies.
- Server and framework banner leakage detection (`Server`, `X-Powered-By`).

### 7. 🔐 Authentication & Plan-based Quotas
- **Google Sign-In**: 1-click authentication using Google OAuth (`signInWithPopup`).
- **Email & Password**: User registration and sign-in with full credential validation.
- **Google reCAPTCHA**: Integrated anti-bot verification challenge on authentication forms.
- **Tiered Plans & Live Quotas**:
  - **Guest Mode**: 3 daily scans
  - **Free Starter**: 5 daily scans, full security report & code fixes
  - **Pro Engineer**: 50 daily scans, deep DNS spoofing audits, crawler, and PDF/JSON export
  - **Enterprise Scale**: Unlimited scans, continuous monitoring, and webhook alerts
- **User Audit History**: Automatic persistence of user audits in Firebase Firestore for instant 1-click re-scans.

### 8. 🛡️ Enterprise-Grade SSRF Defense
- Strict enforcement of RFC 1918 private IP ranges, loopback (`127.0.0.1`, `localhost`), link-local (`169.254.169.254`), and IPv6 unicast addresses.
- DNS resolution validation before outbound fetching to prevent DNS-rebinding attacks.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Motion
- **Backend**: Node.js, Express, TSX, Cheerio
- **Database & Auth**: Google Firebase Auth & Cloud Firestore
- **Security**: Custom SSRF validator, reCAPTCHA challenge, non-invasive passive crawlers
- **AI Engine**: Google `@google/genai` TypeScript SDK (optional intelligent remediation advisor)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- A Firebase project (or use the built-in configured credentials)

### 1. Clone the Repository
```bash
git clone https://github.com/BanshwarTech/HealthScan.git
cd HealthScan
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory (refer to `.env.example`):
```env
PORT=3000
NODE_ENV=development
# Optional: GEMINI_API_KEY for AI-powered executive remediation notes
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

---

## 📁 Project Structure

```
HealthScan/
├── firebase-applet-config.json # Firebase project credentials
├── firebase-blueprint.json    # Firestore schema & entity definitions
├── firestore.rules            # Firestore security & RBAC rules
├── server.ts                  # Express server & Vite middleware integration
├── server/
│   ├── routes.ts              # API endpoints for scans, streams, and history
│   ├── storage.ts             # In-memory and persistent scan storage
│   ├── security/
│   │   └── ssrf.ts            # RFC 1918 & DNS-rebinding protection engine
│   └── scanners/
│       ├── WebsiteScanner.ts   # Core scan orchestrator
│       ├── SslScanner.ts       # TLS/SSL & certificate checks
│       ├── HeaderScanner.ts    # HTTP security headers audit
│       ├── DnsScanner.ts       # SPF, DMARC, MX, and CAA checks
│       ├── PerformanceScanner.ts # TTFB & compression analysis
│       ├── SeoScanner.ts       # Meta tags, headings, and OpenGraph audit
│       ├── CookieScanner.ts    # Cookie attributes & flag enforcement
│       ├── TechnologyScanner.ts# Server framework & version leak detection
│       ├── LinkScanner.ts      # Broken link crawler
│       ├── RobotsScanner.ts    # robots.txt validator
│       ├── SitemapScanner.ts   # sitemap.xml parser
│       └── ScoreCalculator.ts  # Weighted category scoring algorithm (0-100)
├── src/
│   ├── components/
│   │   ├── auth/              # AuthModal, reCAPTCHA, PlanUpgrade & Dropdowns
│   │   ├── tabs/              # Overview, SSL, Headers, DNS, SEO, Tech tabs
│   │   ├── HeroScanner.tsx    # Primary scan input & live quota indicator
│   │   ├── Navbar.tsx         # Navigation, user profile & plan badges
│   │   ├── PricingFaqSection.tsx # Tiered plans (Free, Pro, Enterprise)
│   │   ├── ReportView.tsx     # Comprehensive interactive audit report
│   │   ├── ScoreGauge.tsx     # Circular score gauges
│   │   └── DashboardView.tsx  # Historical reports & monitoring view
│   ├── context/
│   │   └── AuthContext.tsx    # Firebase Auth & daily scan quota provider
│   ├── firebase.ts            # Firebase app, auth, and firestore client
│   └── api.ts                 # Frontend API client
└── package.json
```

---

## 📊 Subscription Tiers & Feature Matrix

| Feature | Free Starter | Pro Engineer | Enterprise Scale |
| :--- | :---: | :---: | :---: |
| **Price** | $0 / mo | $29 / mo | $99 / mo |
| **Daily Scans** | 5 / day | 50 / day | Unlimited |
| **SSL/TLS & HTTP Headers** | ✅ | ✅ | ✅ |
| **DNS, SPF & DMARC Audits** | Basic | ✅ Deep | ✅ Deep |
| **Code Remediation Snippets** | ✅ | ✅ | ✅ |
| **Broken Link Crawler** | — | Up to 50 URLs | Unlimited |
| **PDF & JSON Export** | — | ✅ Priority | ✅ White-label |
| **Uptime Monitoring** | — | Weekly | Continuous |
| **Webhooks (Slack/Discord)**| — | — | ✅ |
| **Dedicated Support** | Community | Priority | 24/7 Dedicated |

---

## 🔒 Security Best Practices
- **SSRF Hardened**: All target URLs are resolved and validated against loopback, private, and reserved subnets before any connection is initiated.
- **Passive Scanning**: Non-invasive auditing that respects server loads without exploiting or injecting payloads.
- **Least-Privilege Firestore Rules**: Each user can only read and write their own scan records and profile documents.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author & Contributions
Developed with ❤️ by **[BanshwarTech](https://github.com/BanshwarTech)** (Alekh Banshwar).  
Contributions, issues, and feature requests are welcome!
