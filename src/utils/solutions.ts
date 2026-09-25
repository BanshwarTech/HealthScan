import { SolutionGuide } from '../types';

export function getClientSolutionForFinding(check_key: string, domain: string = 'yourdomain.com'): SolutionGuide {
  switch (check_key) {
    case 'ssl_no_http_redirect':
      return {
        summary: 'Force all plain HTTP connections (port 80) to automatically redirect to encrypted HTTPS (port 443) using a 301 Moved Permanently redirect.',
        steps: [
          'Choose your platform below (Nginx, Apache, or Cloudflare).',
          'Add the redirect rule to your configuration.',
          'Reload your web server and verify that http:// redirects to https://.'
        ],
        code_snippets: [
          {
            label: 'Nginx Configuration',
            language: 'nginx',
            code: `# In /etc/nginx/sites-available/${domain}:
server {
    listen 80;
    listen [::]:80;
    server_name ${domain} www.${domain};

    # 301 Permanent Redirect to HTTPS
    return 301 https://$host$request_uri;
}`
          },
          {
            label: 'Apache (.htaccess)',
            language: 'apache',
            code: `# In your website root .htaccess file:
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`
          },
          {
            label: 'Cloudflare Dashboard',
            language: 'text',
            code: `1. Log in to Cloudflare Dashboard
2. Select domain '${domain}'
3. Navigate to: SSL/TLS > Edge Certificates
4. Toggle "Always Use HTTPS" to ON
5. Optionally enable "Automatic HTTPS Rewrites" to ON`
          }
        ]
      };

    case 'header_content_security_policy_missing':
      return {
        summary: 'Add a Content-Security-Policy (CSP) header to specify trusted domains for scripts, styles, images, and frames, preventing Cross-Site Scripting (XSS).',
        steps: [
          'Choose a baseline policy that fits your application resources.',
          'Apply it via your web server (Nginx/Apache), cloud proxy (Cloudflare), or application headers.',
          'Audit your browser developer console to ensure required third-party resources are not blocked.'
        ],
        code_snippets: [
          {
            label: 'Nginx',
            language: 'nginx',
            code: `add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https: data:; connect-src 'self' https:;" always;`
          },
          {
            label: 'Apache (.htaccess)',
            language: 'apache',
            code: `<IfModule mod_headers.c>
    Header always set Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:;"
</IfModule>`
          },
          {
            label: 'HTML Meta Tag (Alternative)',
            language: 'html',
            code: `<meta http-equiv="Content-Security-Policy" content="default-src 'self' https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:;">`
          },
          {
            label: 'Cloudflare Transform Rule',
            language: 'text',
            code: `1. Go to Rules > Transform Rules > Modify Response Header
2. Click "Create rule"
3. Action: Set static
4. Header Name: Content-Security-Policy
5. Value: default-src 'self' https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:;`
          }
        ]
      };

    case 'header_strict_transport_security_missing':
      return {
        summary: 'Add the Strict-Transport-Security (HSTS) header to instruct browsers that the website must only be accessed over HTTPS for the next year.',
        steps: [
          'Ensure your SSL certificate is functioning without certificate errors.',
          'Add the HSTS response header with a max-age of at least 31536000 seconds (1 year).',
          'Include subdomains and optionally submit to hstspreload.org.'
        ],
        code_snippets: [
          {
            label: 'Nginx',
            language: 'nginx',
            code: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`
          },
          {
            label: 'Apache (.htaccess)',
            language: 'apache',
            code: `<IfModule mod_headers.c>
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
</IfModule>`
          },
          {
            label: 'Cloudflare',
            language: 'text',
            code: `1. In Cloudflare Dashboard, go to SSL/TLS > Edge Certificates
2. Scroll to "HTTP Strict Transport Security (HSTS)"
3. Click "Change HSTS settings"
4. Enable HSTS, set Max-Age Header to 1 year (31,536,000s)
5. Check "Apply HSTS policy to subdomains"`
          }
        ]
      };

    case 'header_x_content_type_options_missing':
      return {
        summary: 'Add `X-Content-Type-Options: nosniff` to prevent browsers from interpreting non-script MIME types as executable JavaScript.',
        steps: [
          'Add the header to your web server or CDN response headers.',
          'Verify with `curl -I https://' + domain + '` that the header is present.'
        ],
        code_snippets: [
          {
            label: 'Nginx',
            language: 'nginx',
            code: `add_header X-Content-Type-Options "nosniff" always;`
          },
          {
            label: 'Apache (.htaccess)',
            language: 'apache',
            code: `<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
</IfModule>`
          }
        ]
      };

    case 'header_x_frame_options_missing':
      return {
        summary: 'Protect visitors against UI redressing and Clickjacking attacks by preventing other websites from embedding your pages inside iframes.',
        steps: [
          'Set X-Frame-Options to SAMEORIGIN (or DENY if site should never be framed).',
          'Alternatively, define `frame-ancestors \'self\';` in your Content-Security-Policy.'
        ],
        code_snippets: [
          {
            label: 'Nginx',
            language: 'nginx',
            code: `add_header X-Frame-Options "SAMEORIGIN" always;`
          },
          {
            label: 'Apache (.htaccess)',
            language: 'apache',
            code: `<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
</IfModule>`
          }
        ]
      };

    case 'header_referrer_policy_missing':
      return {
        summary: 'Specify a strict Referrer-Policy so that path names and sensitive query parameters are not leaked to external third-party sites.',
        steps: [
          'Add the Referrer-Policy header to your web server.'
        ],
        code_snippets: [
          {
            label: 'Nginx',
            language: 'nginx',
            code: `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`
          },
          {
            label: 'Apache (.htaccess)',
            language: 'apache',
            code: `<IfModule mod_headers.c>
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>`
          }
        ]
      };

    case 'header_permissions_policy_missing':
      return {
        summary: 'Disable unnecessary browser capabilities such as camera, microphone, and geolocation so compromised scripts cannot invoke them.',
        steps: [
          'Define the Permissions-Policy header in your web server.'
        ],
        code_snippets: [
          {
            label: 'Nginx',
            language: 'nginx',
            code: `add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;`
          },
          {
            label: 'Apache (.htaccess)',
            language: 'apache',
            code: `<IfModule mod_headers.c>
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
</IfModule>`
          }
        ]
      };

    case 'header_server_version_leaked':
    case 'header_x_powered_by_leaked':
      return {
        summary: 'Prevent automated bot scanners and attackers from fingerprinting your exact backend framework and operating system version.',
        steps: [
          'Turn off server version tokens in Nginx or Apache.',
          'Disable `expose_php` in php.ini if using PHP.'
        ],
        code_snippets: [
          {
            label: 'Nginx (/etc/nginx/nginx.conf)',
            language: 'nginx',
            code: `http {
    # Hides Nginx version from Server header
    server_tokens off;
}`
          },
          {
            label: 'Apache (/etc/apache2/conf-available/security.conf)',
            language: 'apache',
            code: `ServerTokens Prod
ServerSignature Off`
          },
          {
            label: 'PHP (php.ini)',
            language: 'ini',
            code: `; Disables "X-Powered-By: PHP/x.x.x" header
expose_php = Off`
          }
        ]
      };

    case 'dns_spf_record_missing':
      return {
        summary: 'Add an SPF (Sender Policy Framework) TXT record at your DNS provider to authorize legitimate mail senders and prevent email spoofing.',
        steps: [
          'Log in to your DNS provider (Cloudflare, GoDaddy, Namecheap, Route 53, etc.).',
          'Add a new TXT record for the root domain (@).',
          'Enter the SPF record value corresponding to your email setup.'
        ],
        code_snippets: [
          {
            label: 'DNS Record (If domain does NOT send email)',
            language: 'text',
            code: `Type: TXT
Name: @ (or leave blank)
TTL: Auto / 3600
Value: v=spf1 -all`
          },
          {
            label: 'DNS Record (If using Google Workspace / Gmail)',
            language: 'text',
            code: `Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com ~all`
          },
          {
            label: 'DNS Record (If using Microsoft 365 / Outlook)',
            language: 'text',
            code: `Type: TXT
Name: @
Value: v=spf1 include:spf.protection.outlook.com ~all`
          }
        ]
      };

    case 'dns_dmarc_record_missing':
    case 'dns_dmarc_not_found':
      return {
        summary: 'Publish a DMARC policy record at `_dmarc.' + domain + '` to instruct receiving mail servers how to treat spoofed emails.',
        steps: [
          'Go to your DNS management console.',
          'Create a new TXT record with host `_dmarc`.',
          'Start with a monitoring policy `p=none` or quarantine policy `p=quarantine`.'
        ],
        code_snippets: [
          {
            label: 'Standard Quarantine Policy (Recommended)',
            language: 'text',
            code: `Type: TXT
Name: _dmarc
TTL: Auto / 3600
Value: v=DMARC1; p=quarantine; sp=quarantine; pct=100; rua=mailto:dmarc@${domain};`
          },
          {
            label: 'Monitoring Only Policy (Initial Setup)',
            language: 'text',
            code: `Type: TXT
Name: _dmarc
TTL: Auto / 3600
Value: v=DMARC1; p=none; sp=none; rua=mailto:dmarc@${domain};`
          }
        ]
      };

    case 'dns_caa_record_missing':
      return {
        summary: 'Add CAA (Certificate Authority Authorization) records to specify which Certificate Authorities are permitted to issue SSL certificates for your domain.',
        steps: [
          'Open your DNS management dashboard.',
          'Add a CAA record targeting your designated CA (e.g. Let\'s Encrypt, Google Trust Services, Cloudflare, DigiCert).'
        ],
        code_snippets: [
          {
            label: 'DNS CAA Record (Let\'s Encrypt)',
            language: 'text',
            code: `Type: CAA
Name: @
Flag: 0
Tag: issue
Value: "letsencrypt.org"`
          },
          {
            label: 'DNS CAA Record (Google Trust Services)',
            language: 'text',
            code: `Type: CAA
Name: @
Flag: 0
Tag: issue
Value: "pki.goog"`
          }
        ]
      };

    case 'robots_txt_not_found':
    case 'robots_txt_no_sitemap':
    case 'robots_txt_soft_404':
      return {
        summary: 'Create a standard `/robots.txt` plain text file in the public root folder of your website to guide search engine crawlers and declare your sitemap.',
        steps: [
          'Create a file named `robots.txt` in your website\'s public web directory (e.g., `public/robots.txt` or `/var/www/html/robots.txt`).',
          'Add crawler directives and reference your sitemap URL.',
          'Verify by visiting https://' + domain + '/robots.txt in your browser.'
        ],
        code_snippets: [
          {
            label: 'Recommended robots.txt',
            language: 'text',
            code: `# Allow standard search engines to index public pages
User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /login/

# Point search engines directly to your sitemap
Sitemap: https://${domain}/sitemap.xml`
          }
        ]
      };

    case 'sitemap_xml_missing':
    case 'sitemap_invalid_xml':
      return {
        summary: 'Create and publish an XML sitemap at `/sitemap.xml` so search engines can discover and index all your published pages.',
        steps: [
          'Generate a sitemap using your CMS, framework plugin (e.g., spatie/laravel-sitemap, next-sitemap), or an online generator.',
          'Upload or route the file at https://' + domain + '/sitemap.xml.',
          'Submit your sitemap URL in Google Search Console.'
        ],
        code_snippets: [
          {
            label: 'Sample sitemap.xml',
            language: 'xml',
            code: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${domain}/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://${domain}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`
          }
        ]
      };

    case 'seo_title_missing':
    case 'seo_title_too_short':
    case 'seo_title_too_long':
      return {
        summary: 'Define an optimal `<title>` tag inside the `<head>` of your webpage, ideally between 30 and 60 characters long.',
        steps: [
          'Locate the `<head>` section of your index HTML or page layout template.',
          'Write a descriptive title containing your primary topic and brand name.'
        ],
        code_snippets: [
          {
            label: 'HTML Title Tag',
            language: 'html',
            code: `<head>
  <title>Your Brand Name — High Performance Web Platform</title>
</head>`
          }
        ]
      };

    case 'seo_description_missing':
    case 'seo_description_too_short':
    case 'seo_description_too_long':
      return {
        summary: 'Add a meta description between 120 and 160 characters to provide an engaging preview summary in Google search results.',
        steps: [
          'Add `<meta name="description" content="...">` inside the `<head>` tag of your page.'
        ],
        code_snippets: [
          {
            label: 'HTML Meta Description',
            language: 'html',
            code: `<meta name="description" content="Discover professional web solutions, portfolio projects, and technical insights designed for high performance and top-tier security.">`
          }
        ]
      };

    case 'seo_viewport_missing':
      return {
        summary: 'Add a viewport meta tag so mobile browsers render your website at device width instead of scaling down desktop views.',
        steps: [
          'Insert the viewport tag into the `<head>` of your HTML document.'
        ],
        code_snippets: [
          {
            label: 'HTML Viewport Tag',
            language: 'html',
            code: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
          }
        ]
      };

    case 'seo_h1_missing':
    case 'seo_h1_multiple':
      return {
        summary: 'Structure your webpage content hierarchy with exactly one primary `<h1>` heading to establish clear page context.',
        steps: [
          'Check your page template and ensure only one `<h1>` tag exists on the page.',
          'Use `<h2>` for major sections and `<h3>` for sub-sections.'
        ],
        code_snippets: [
          {
            label: 'Semantic Heading Hierarchy',
            language: 'html',
            code: `<main>
  <!-- Single primary H1 -->
  <h1>Welcome to ${domain}</h1>

  <!-- Use H2 for sections -->
  <h2>Our Core Services</h2>
  <h3>Web Application Security</h3>
  
  <h2>About Our Team</h2>
</main>`
          }
        ]
      };

    case 'seo_images_missing_alt':
      return {
        summary: 'Add descriptive `alt="..."` attributes to images so screen readers can describe them and search engines can index them.',
        steps: [
          'Find all `<img>` elements in your HTML/JSX.',
          'Add a concise, descriptive `alt` attribute.'
        ],
        code_snippets: [
          {
            label: 'HTML Image With Alt Text',
            language: 'html',
            code: `<!-- Descriptive alt attribute for informative images -->
<img src="/images/hero-banner.jpg" alt="Website Security and Health Dashboard Preview" width="1200" height="630">

<!-- Empty alt="" only for purely decorative graphic shapes -->
<img src="/images/decorative-line.svg" alt="" role="presentation">`
          }
        ]
      };

    case 'cookie_insecure_flags':
      return {
        summary: 'Enforce `Secure`, `HttpOnly`, and `SameSite` flags on cookies to protect session IDs and tokens against network eavesdropping and XSS theft.',
        steps: [
          'Configure session settings in your backend framework or PHP configuration.',
          'Ensure `Secure` is enabled so cookies are only sent over HTTPS.',
          'Ensure `HttpOnly` is enabled so malicious JavaScript cannot access document.cookie.'
        ],
        code_snippets: [
          {
            label: 'PHP / Laravel (config/session.php)',
            language: 'php',
            code: `// In config/session.php:
'secure' => env('SESSION_SECURE_COOKIE', true),
'http_only' => true,
'same_site' => 'lax',`
          },
          {
            label: 'php.ini',
            language: 'ini',
            code: `session.cookie_secure = 1
session.cookie_httponly = 1
session.cookie_samesite = "Lax"`
          },
          {
            label: 'Node.js / Express',
            language: 'javascript',
            code: `app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: true,      // HTTPS only
    httpOnly: true,    // Prevent XSS access
    sameSite: 'lax',   // CSRF mitigation
    maxAge: 24 * 60 * 60 * 1000
  }
}));`
          }
        ]
      };

    case 'perf_no_compression':
      return {
        summary: 'Enable Gzip or Brotli compression on your web server to reduce HTML, CSS, and JS transfer sizes by 60% to 80%.',
        steps: [
          'Turn on gzip or brotli compression module in your web server.',
          'Add MIME types for html, css, javascript, json, and svg.'
        ],
        code_snippets: [
          {
            label: 'Nginx (/etc/nginx/nginx.conf)',
            language: 'nginx',
            code: `gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;`
          },
          {
            label: 'Apache (.htaccess)',
            language: 'apache',
            code: `<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json image/svg+xml
</IfModule>`
          }
        ]
      };

    case 'perf_no_cache_control':
      return {
        summary: 'Configure Cache-Control headers to instruct browsers and CDNs how long they should cache resources.',
        steps: [
          'Add Cache-Control headers distinguishing between static assets (images, CSS, JS) and dynamic HTML pages.'
        ],
        code_snippets: [
          {
            label: 'Nginx',
            language: 'nginx',
            code: `# Static assets cached for 1 year
location ~* \.(jpg|jpeg|png|gif|ico|css|js|webp|svg)$ {
    expires 365d;
    add_header Cache-Control "public, no-transform, immutable";
}

# Dynamic HTML page - must revalidate
location / {
    add_header Cache-Control "no-cache, must-revalidate";
}`
          }
        ]
      };

    default:
      return {
        summary: 'Follow standard industry security best practices to resolve this technical configuration finding.',
        steps: [
          'Review the technical details in this report.',
          'Apply the recommended configuration changes to your server or code.',
          'Rescan your domain to verify the issue is resolved.'
        ]
      };
  }
}
