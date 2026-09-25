import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Zap, 
  Network, 
  FileText, 
  HelpCircle, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface PricingFaqSectionProps {
  onScanClick: () => void;
  onSelectPlan?: (planId: 'free' | 'pro' | 'enterprise') => void;
}

export const PricingFaqSection: React.FC<PricingFaqSectionProps> = ({ onScanClick, onSelectPlan }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const features = [
    {
      title: 'SSL/TLS & Encryption',
      desc: 'Verify certificate validity, expiry timelines, intermediate chains, and modern TLS 1.3 protocol ciphers.',
      icon: ShieldCheck,
      color: 'blue'
    },
    {
      title: 'HTTP Security Headers',
      desc: 'Audit Content-Security-Policy, HSTS, X-Frame-Options, X-Content-Type-Options and flag server leaks.',
      icon: FileText,
      color: 'indigo'
    },
    {
      title: 'DNS & Email Defense',
      desc: 'Inspect A/AAAA records, authoritative nameservers, SPF spoofing protection, DMARC policies and CAA.',
      icon: Network,
      color: 'purple'
    },
    {
      title: 'Technical SEO & Crawl',
      desc: 'Check title lengths, meta descriptions, mobile viewport, H1-H3 semantics, broken links, robots & sitemaps.',
      icon: Search,
      color: 'emerald'
    },
    {
      title: 'Performance & TTFB',
      desc: 'Measure server response latency, payload weight, Brotli/gzip compression, and Cache-Control headers.',
      icon: Zap,
      color: 'amber'
    },
    {
      title: 'Cookie Hardening & Tech',
      desc: 'Verify Secure, HttpOnly, and SameSite flags on session cookies and detect visible framework signatures.',
      icon: ShieldCheck,
      color: 'teal'
    }
  ];

  const steps = [
    { num: '01', title: 'Enter Website URL', desc: 'Type in any public domain or landing page you want to audit.' },
    { num: '02', title: 'Run Automated Scan', desc: 'Our engine executes 45+ non-invasive technical and security checks.' },
    { num: '03', title: 'Review Health Report', desc: 'Get category scores from 0-100 and clear, prioritized issues.' },
    { num: '04', title: 'Fix Issues & Rescan', desc: 'Apply recommendations and verify improved scores over time.' }
  ];

  const plans = [
    {
      id: 'free' as const,
      name: 'Free Starter',
      price: '$0',
      period: 'forever',
      desc: 'Essential website health and security checks for personal sites and blogs.',
      features: [
        '5 scans / day',
        'Full security & SSL report',
        'HTTP headers evaluation',
        'Basic SEO & DNS audit',
        'Copy-paste code remediation'
      ],
      cta: 'Start Free Audit',
      popular: false
    },
    {
      id: 'pro' as const,
      name: 'Pro Engineer',
      price: '$29',
      period: 'per month',
      desc: 'High-frequency audits, deep link crawler, and priority remediation for pros.',
      features: [
        '50 scans / day',
        'Deep DNS, SPF & DMARC spoofing audits',
        'Executive AI remediation checklist',
        'Printable PDF reports',
        'Score trendline history (68 → 82)',
        'Deep link crawling (up to 50 URLs)'
      ],
      cta: 'Choose Pro (50 Scans/Day)',
      popular: true
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise Scale',
      price: '$99',
      period: 'per month',
      desc: 'Unlimited audit capability, continuous monitoring, and webhook alerting.',
      features: [
        'Unlimited scans / day',
        'Continuous uptime monitoring',
        'SSL expiry Slack/email alerts',
        'White-label branded reports',
        'Dedicated 24/7 technical support'
      ],
      cta: 'Choose Enterprise (Unlimited)',
      popular: false
    }
  ];

  const faqs = [
    {
      q: 'Is this scan safe and non-invasive?',
      a: 'Yes, 100%. The scanner performs passive inspection using standard public HTTP/HTTPS requests, TLS handshake negotiation, and DNS lookups. It does NOT perform intrusive penetration testing, brute forcing, or destructive operations.'
    },
    {
      q: 'Does this replace a professional penetration test?',
      a: 'No. This scanner performs automated hygiene checks using publicly accessible website information. It does not replace full manual penetration testing or code audits, but serves as an essential baseline for technical health and compliance.'
    },
    {
      q: 'How are the health scores calculated?',
      a: 'Scores are calculated on a weighted scale from 0 to 100 across 5 core categories: Security (30%), SEO (25%), Performance (20%), Availability (15%), and Technical/DNS (10%). Critical vulnerabilities trigger immediate score deductions.'
    },
    {
      q: 'How does SSRF protection safeguard internal networks?',
      a: 'Our scanning engine strictly enforces RFC 1918, RFC 3927, loopback, and IPv6 link-local prohibitions. Domain names are pre-resolved via DNS to verify they point to public Internet addresses before any connection is initiated.'
    }
  ];

  return (
    <div className="space-y-20 py-12">
      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Comprehensive Analysis
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Every layer of your website health inspected
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3">
            Translating dense technical findings into plain-English explanations, impact statements, and concrete solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-lg space-y-3"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">{feat.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Simple 4-Step Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              From input to actionable report in seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st, idx) => (
              <div key={idx} className="relative space-y-2">
                <span className="text-3xl font-black font-mono text-blue-500/40 block">
                  {st.num}
                </span>
                <h4 className="text-base font-bold text-white">{st.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SaaS Pricing Tiers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Scalable plans for developers and agencies
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Audit for free right now, or unlock team monitoring and client reports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all ${
                plan.popular
                  ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/40 border-2 border-blue-500 shadow-2xl shadow-blue-500/10'
                  : 'bg-slate-900 border border-slate-800 shadow-xl'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{plan.desc}</p>

                <div className="mt-5 mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-xs text-slate-400 font-medium">/{plan.period}</span>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800">
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2.5 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => {
                    if (onSelectPlan) {
                      onSelectPlan(plan.id);
                    } else {
                      onScanClick();
                    }
                  }}
                  className={`w-full py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <HelpCircle className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-white hover:text-blue-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-5 h-5 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Important Product Principle Disclaimer (Prompt section 57 requirement) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-300 block">
              Important Product & Security Disclaimer
            </span>
            <p className="leading-relaxed">
              This scanner performs automated, non-invasive checks using publicly accessible website information. It does not perform a full penetration test, vulnerability exploit, or guarantee that a website is impenetrable.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
