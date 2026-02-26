/**
 * Legal Document Generator for MemoLib
 * Generates jurisdiction-specific legal documents dynamically
 * 
 * Supports:
 * - Terms of Service (ToS)
 * - Privacy Policy
 * - Cookie Policy
 * - Data Processing Agreement (DPA)
 * - Acceptable Use Policy (AUP)
 */

export type Jurisdiction =
    | 'EU'        // European Union (GDPR)
    | 'US'        // United States (CCPA, various state laws)
    | 'UK'        // United Kingdom (UK GDPR)
    | 'CA'        // Canada (PIPEDA)
    | 'AU'        // Australia (Privacy Act)
    | 'BR'        // Brazil (LGPD)
    | 'IN'        // India (DPDPA)
    | 'JP'        // Japan (APPI)
    | 'SG'        // Singapore (PDPA)
    | 'GLOBAL';   // Generic/Multi-jurisdiction

export type DocumentType =
    | 'tos'           // Terms of Service
    | 'privacy'       // Privacy Policy
    | 'cookies'       // Cookie Policy
    | 'dpa'           // Data Processing Agreement
    | 'aup';          // Acceptable Use Policy

export interface LegalDocument {
    type: DocumentType;
    jurisdiction: Jurisdiction;
    version: string;
    effectiveDate: Date;
    lastUpdated: Date;
    content: string;
    metadata: {
        language: string;
        wordCount: number;
        sections: string[];
    };
}

export class LegalDocumentGenerator {
    private companyName = 'MemoLib';
    private companyEntity = 'MemoLib Inc.';
    private companyAddress = '123 Tech Street, San Francisco, CA 94105, USA';
    private contactEmail = 'legal@memolib.com';
    private dpoEmail = 'privacy@memolib.com';

    /**
     * Generate Terms of Service
     */
    generateToS(jurisdiction: Jurisdiction): LegalDocument {
        const sections = [
            this.tosAcceptance(),
            this.tosServices(),
            this.tosUserAccounts(),
            this.tosUserContent(),
            this.tosPayment(),
            this.tosIntellectualProperty(),
            this.tosProhibitedUses(),
            this.tosTermination(),
            this.tosLimitation(jurisdiction),
            this.tosDisputes(jurisdiction),
            this.tosChanges(),
            this.tosContact()
        ];

        return {
            type: 'tos',
            jurisdiction,
            version: '2.1.0',
            effectiveDate: new Date('2026-01-01'),
            lastUpdated: new Date(),
            content: sections.join('\n\n'),
            metadata: {
                language: 'en',
                wordCount: sections.join(' ').split(' ').length,
                sections: sections.map((_, i) => `Section ${i + 1}`)
            }
        };
    }

    /**
     * Generate Privacy Policy
     */
    generatePrivacyPolicy(jurisdiction: Jurisdiction): LegalDocument {
        const sections = [
            this.privacyIntro(),
            this.privacyDataCollection(),
            this.privacyDataUse(),
            this.privacyDataSharing(),
            this.privacyDataSecurity(),
            this.privacyDataRetention(),
            this.privacyUserRights(jurisdiction),
            this.privacyCookies(),
            this.privacyChildren(),
            this.privacyInternational(jurisdiction),
            this.privacyChanges(),
            this.privacyContact()
        ];

        return {
            type: 'privacy',
            jurisdiction,
            version: '3.0.0',
            effectiveDate: new Date('2026-01-01'),
            lastUpdated: new Date(),
            content: sections.join('\n\n'),
            metadata: {
                language: 'en',
                wordCount: sections.join(' ').split(' ').length,
                sections: sections.map((_, i) => `Section ${i + 1}`)
            }
        };
    }

    /**
     * Generate Cookie Policy
     */
    generateCookiePolicy(jurisdiction: Jurisdiction): LegalDocument {
        const sections = [
            this.cookiesIntro(),
            this.cookiesWhat(),
            this.cookiesTypes(),
            this.cookiesThirdParty(),
            this.cookiesControl(),
            this.cookiesChanges(),
            this.cookiesContact()
        ];

        return {
            type: 'cookies',
            jurisdiction,
            version: '1.5.0',
            effectiveDate: new Date('2026-01-01'),
            lastUpdated: new Date(),
            content: sections.join('\n\n'),
            metadata: {
                language: 'en',
                wordCount: sections.join(' ').split(' ').length,
                sections: sections.map((_, i) => `Section ${i + 1}`)
            }
        };
    }

    // ===========================
    // Terms of Service Sections
    // ===========================

    private tosAcceptance(): string {
        return `# 1. Acceptance of Terms

By accessing or using ${this.companyName} ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.

These Terms constitute a legally binding agreement between you and ${this.companyEntity}. By creating an account or using our Service, you represent that you are at least 18 years old and have the legal capacity to enter into this agreement.`;
    }

    private tosServices(): string {
        return `# 2. Description of Services

${this.companyName} provides email management, AI-powered organization, and productivity tools ("Services"). We reserve the right to modify, suspend, or discontinue any part of the Services at any time with or without notice.

**Service Features:**
- Email aggregation and management
- AI-powered email categorization
- Task and workspace management
- Calendar integration
- Analytics and insights

We do not guarantee that the Services will be uninterrupted, secure, or error-free.`;
    }

    private tosUserAccounts(): string {
        return `# 3. User Accounts

**Account Creation:**
You must provide accurate, current, and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials.

**Account Responsibility:**
You are solely responsible for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.

**Account Termination:**
We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent, illegal, or abusive behavior.`;
    }

    private tosUserContent(): string {
        return `# 4. User Content

**Ownership:**
You retain all rights to the content you upload, store, or transmit through our Service ("User Content"). By using our Service, you grant us a limited license to host, store, and process your User Content solely for the purpose of providing the Services.

**Prohibited Content:**
You agree not to upload, store, or transmit:
- Illegal, harmful, or offensive content
- Content that infringes intellectual property rights
- Malware, viruses, or malicious code
- Spam or unsolicited communications

**Data Privacy:**
We will handle your User Content in accordance with our Privacy Policy. We do not sell your personal data to third parties.`;
    }

    private tosPayment(): string {
        return `# 5. Payment Terms

**Subscription Plans:**
Certain features require a paid subscription (PRO or ENTERPRISE). All fees are in USD unless otherwise stated.

**Billing:**
- Monthly subscriptions are billed in advance on a monthly basis
- Annual subscriptions are billed in advance annually with a 20% discount
- All fees are non-refundable except as required by law

**Payment Processing:**
Payments are processed securely through Stripe. We do not store your full credit card information.

**Cancellation:**
You may cancel your subscription at any time. Cancellation will take effect at the end of your current billing period.

**Price Changes:**
We reserve the right to change our pricing with 30 days' notice. Continued use after a price change constitutes acceptance.`;
    }

    private tosIntellectualProperty(): string {
        return `# 6. Intellectual Property

**Our Rights:**
The Service, including all content, features, and functionality, is owned by ${this.companyEntity} and is protected by copyright, trademark, and other intellectual property laws.

**License:**
We grant you a limited, non-exclusive, non-transferable license to use the Service for your personal or internal business purposes.

**Restrictions:**
You may not:
- Copy, modify, or create derivative works
- Reverse engineer or decompile the Service
- Remove any copyright or proprietary notices
- Use our trademarks without permission`;
    }

    private tosProhibitedUses(): string {
        return `# 7. Prohibited Uses

You agree not to:
- Violate any laws or regulations
- Infringe on others' intellectual property rights
- Transmit viruses, malware, or harmful code
- Attempt to gain unauthorized access to our systems
- Use automated tools to access the Service without permission
- Interfere with or disrupt the Service
- Impersonate any person or entity
- Harass, abuse, or harm other users`;
    }

    private tosTermination(): string {
        return `# 8. Termination

**By You:**
You may terminate your account at any time through your account settings.

**By Us:**
We may terminate or suspend your account immediately if you:
- Violate these Terms
- Engage in fraudulent activity
- Fail to pay fees when due
- Abuse the Service or harm other users

**Effect of Termination:**
Upon termination, your right to use the Service will immediately cease. We may delete your User Content after a 30-day grace period, except where we are required to retain it by law.`;
    }

    private tosLimitation(jurisdiction: Jurisdiction): string {
        if (jurisdiction === 'EU' || jurisdiction === 'UK') {
            return `# 9. Limitation of Liability

To the extent permitted by applicable law, ${this.companyEntity} shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service.

Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.

Nothing in these Terms excludes or limits our liability for death or personal injury caused by our negligence, fraud, or any other liability that cannot be excluded under applicable law.`;
        }

        return `# 9. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${this.companyEntity.toUpperCase()} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR USE.

OUR TOTAL LIABILITY SHALL NOT EXCEED THE GREATER OF $100 USD OR THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.

SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF CERTAIN WARRANTIES OR LIMITATION OF LIABILITY, SO SOME OF THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.`;
    }

    private tosDisputes(jurisdiction: Jurisdiction): string {
        if (jurisdiction === 'EU' || jurisdiction === 'UK') {
            return `# 10. Dispute Resolution

**Governing Law:**
These Terms shall be governed by the laws of Ireland (EU) or England and Wales (UK), without regard to conflict of law principles.

**Dispute Resolution:**
You have the right to bring disputes before the courts of your country of residence. We may also bring disputes before such courts.

**EU Online Dispute Resolution:**
EU consumers may use the Online Dispute Resolution platform: https://ec.europa.eu/consumers/odr`;
        }

        return `# 10. Dispute Resolution

**Governing Law:**
These Terms shall be governed by the laws of the State of California, USA, without regard to conflict of law principles.

**Arbitration:**
Any disputes shall be resolved through binding arbitration in accordance with the American Arbitration Association rules, except for claims that may be brought in small claims court.

**Class Action Waiver:**
You agree to resolve disputes on an individual basis and waive the right to participate in class actions.`;
    }

    private tosChanges(): string {
        return `# 11. Changes to Terms

We reserve the right to modify these Terms at any time. We will notify you of material changes by email or through the Service. Your continued use after changes constitutes acceptance of the new Terms.

Previous versions of these Terms are available upon request.`;
    }

    private tosContact(): string {
        return `# 12. Contact Information

If you have questions about these Terms, please contact us:

${this.companyEntity}
${this.companyAddress}
Email: ${this.contactEmail}

Last Updated: ${new Date().toLocaleDateString()}`;
    }

    // ===========================
    // Privacy Policy Sections
    // ===========================

    private privacyIntro(): string {
        return `# Privacy Policy

**Effective Date:** January 1, 2026

${this.companyEntity} ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use ${this.companyName}.

**Key Points:**
- We collect only the data necessary to provide our Services
- We do not sell your personal data
- You have full control over your data
- We comply with GDPR, CCPA, and other privacy regulations`;
    }

    private privacyDataCollection(): string {
        return `# 1. Information We Collect

**Information You Provide:**
- Account information (name, email, password)
- Profile information (avatar, preferences)
- Payment information (processed securely by Stripe)
- User Content (emails, notes, tasks)

**Information Collected Automatically:**
- Device information (browser, OS, IP address)
- Usage data (features used, pages visited)
- Cookies and tracking technologies
- Log files (timestamps, errors)

**Information from Third Parties:**
- Email providers (Gmail, Outlook, etc.) via authorized OAuth connections
- Payment processors (Stripe)
- Analytics providers (Google Analytics)`;
    }

    private privacyDataUse(): string {
        return `# 2. How We Use Your Information

We use your information to:
- **Provide Services:** Deliver email management and productivity features
- **Improve Services:** Analyze usage patterns and develop new features
- **Communicate:** Send service updates, marketing (with consent), and support
- **Security:** Detect fraud, prevent abuse, and secure our platform
- **Legal Compliance:** Comply with legal obligations and enforce our Terms
- **Personalization:** Customize your experience based on preferences

**Legal Basis (GDPR):**
- Consent for marketing and non-essential cookies
- Contract performance for service delivery
- Legitimate interests for security and improvements
- Legal obligation for compliance`;
    }

    private privacyDataSharing(): string {
        return `# 3. How We Share Your Information

We share your information with:

**Service Providers:**
- Cloud hosting (AWS, CloudFlare)
- Payment processing (Stripe)
- Email delivery (SendGrid)
- Analytics (Google Analytics, Mixpanel)

**Legal Requirements:**
- Law enforcement when required by law
- To protect our rights or safety
- In connection with legal proceedings

**Business Transfers:**
- In case of merger, acquisition, or sale of assets

**We Do NOT:**
- Sell your personal data to advertisers
- Share your data without proper safeguards
- Use your email content for advertising`;
    }

    private privacyDataSecurity(): string {
        return `# 4. Data Security

We implement industry-standard security measures:
- **Encryption:** All data encrypted in transit (TLS 1.3) and at rest (AES-256)
- **Access Controls:** Role-based access, multi-factor authentication
- **Regular Audits:** Security assessments and penetration testing
- **Monitoring:** 24/7 monitoring for suspicious activity
- **Incident Response:** Data breach notification within 72 hours (GDPR)

Despite our efforts, no system is 100% secure. Please use strong passwords and enable 2FA.`;
    }

    private privacyDataRetention(): string {
        return `# 5. Data Retention

We retain your data for as long as necessary:
- **Account Data:** While your account is active + 30 days after deletion
- **Emails:** 1 year (can be configured in settings)
- **Financial Records:** 7 years (tax/legal requirement)
- **Audit Logs:** 2 years
- **Anonymous Analytics:** 3 years

You can request deletion at any time through your privacy settings.`;
    }

    private privacyUserRights(jurisdiction: Jurisdiction): string {
        let rights = `# 6. Your Privacy Rights

You have the right to:
- **Access:** Request a copy of your personal data
- **Rectification:** Correct inaccurate data
- **Erasure:** Request deletion of your data ("Right to be Forgotten")
- **Portability:** Export your data in a structured format
- **Object:** Object to certain processing activities
- **Restrict:** Limit how we use your data
- **Withdraw Consent:** Opt-out of marketing or cookies anytime`;

        if (jurisdiction === 'US' || jurisdiction === 'GLOBAL') {
            rights += `\n\n**California Residents (CCPA):**
- Right to know what data we collect
- Right to opt-out of sale (we don't sell data)
- Right to non-discrimination`;
        }

        if (jurisdiction === 'CA') {
            rights += `\n\n**Canadian Residents (PIPEDA):**
- Right to access personal information
- Right to challenge accuracy
- Right to withdraw consent`;
        }

        rights += `\n\nTo exercise these rights, visit your Privacy Settings or contact ${this.dpoEmail}`;

        return rights;
    }

    private privacyCookies(): string {
        return `# 7. Cookies and Tracking

We use cookies for:
- **Essential:** Authentication, security, preferences
- **Analytics:** Understand usage patterns (Google Analytics)
- **Marketing:** Targeted advertising (if consented)
- **Personalization:** Remember your settings

You can control cookies through:
- Our cookie consent banner
- Browser settings
- Privacy settings page

See our Cookie Policy for details.`;
    }

    private privacyChildren(): string {
        return `# 8. Children's Privacy

Our Service is not directed to children under 16. We do not knowingly collect data from children. If you believe a child has provided us with personal data, please contact us immediately.`;
    }

    private privacyInternational(jurisdiction: Jurisdiction): string {
        return `# 9. International Data Transfers

Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards:
- **EU Standard Contractual Clauses** for EU data transfers
- **Adequacy Decisions** where available
- **Privacy Shield** (US-EU, invalidated but principles followed)

Your data is primarily stored in:
- US (AWS us-east-1)
- EU (AWS eu-west-1 for EU users)`;
    }

    private privacyChanges(): string {
        return `# 10. Changes to Privacy Policy

We may update this Privacy Policy. We'll notify you of material changes via email or Service notification. Your continued use constitutes acceptance.

Version history available upon request.`;
    }

    private privacyContact(): string {
        return `# 11. Contact Us

**Data Protection Officer:**
Email: ${this.dpoEmail}

**General Inquiries:**
${this.companyEntity}
${this.companyAddress}
Email: ${this.contactEmail}

**EU Representative:** [If applicable]
**UK Representative:** [If applicable]

**Supervisory Authority (EU):**
You have the right to lodge a complaint with your local data protection authority.`;
    }

    // ===========================
    // Cookie Policy Sections
    // ===========================

    private cookiesIntro(): string {
        return `# Cookie Policy

This Cookie Policy explains how ${this.companyName} uses cookies and similar technologies.`;
    }

    private cookiesWhat(): string {
        return `# What Are Cookies?

Cookies are small text files stored on your device that help websites remember your preferences and improve user experience.`;
    }

    private cookiesTypes(): string {
        return `# Types of Cookies We Use

**Essential Cookies:**
- Session management
- Authentication
- Security (CSRF protection)

**Analytics Cookies:**
- Google Analytics
- Usage statistics
- Performance monitoring

**Marketing Cookies:**
- Advertising (Facebook, Google Ads)
- Conversion tracking

**Personalization Cookies:**
- Theme preferences
- Language settings
- UI state`;
    }

    private cookiesThirdParty(): string {
        return `# Third-Party Cookies

We use third-party services that may set cookies:
- Google Analytics
- Stripe (payment processing)
- Social media plugins

See their privacy policies for more information.`;
    }

    private cookiesControl(): string {
        return `# Managing Cookies

You can control cookies through:
1. Our cookie consent banner
2. Privacy settings page
3. Browser settings (delete/block cookies)

Note: Disabling essential cookies may affect functionality.`;
    }

    private cookiesChanges(): string {
        return `# Changes to Cookie Policy

We may update this policy. Check back regularly for updates.`;
    }

    private cookiesContact(): string {
        return `# Contact

Questions? Email: ${this.contactEmail}

Last Updated: ${new Date().toLocaleDateString()}`;
    }
}

/**
 * Singleton instance
 */
export const legalDocs = new LegalDocumentGenerator();
