export interface LegalSection {
  h: string;
  body: string[];
}

export interface LegalDocument {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export const LEGAL_DOCS: Record<'terms' | 'privacy', LegalDocument> = {
  terms: {
    title: 'Terms of service',
    updated: 'Last updated · April 12, 2025',
    intro:
      'Welcome to Predicto. These terms govern your use of our app, website, and services. By creating an account, you agree to everything below — please read carefully.',
    sections: [
      {
        h: '1. Your account',
        body: [
          'You must be at least 18 years old (or the legal age of majority where you live) to use Predicto. You agree to provide accurate information and keep your login credentials secret.',
          "You're responsible for activity that happens on your account. If you suspect unauthorized access, change your password and contact support immediately.",
        ],
      },
      {
        h: '2. Daily tickets and predictions',
        body: [
          'Predicto is a free social prediction game. Each user receives one free ticket per day. Additional tickets may be available through subscriptions or in-app purchases. Tickets carry no monetary value, cannot be redeemed for cash, and are non-transferable.',
          'Predictions submitted on a ticket are final once the first leg locks. Tickets settle automatically when results are confirmed by our data providers.',
        ],
      },
      {
        h: '3. Acceptable use',
        body: [
          "Don't use Predicto to harass, threaten, or impersonate others. Don't post hateful, illegal, or sexually explicit content. Don't attempt to manipulate leaderboards through fake accounts, automation, or coordinated activity.",
          'We may remove content, suspend accounts, or terminate access at our discretion if these rules are broken.',
        ],
      },
      {
        h: '4. User-generated content',
        body: [
          'You retain ownership of slips, comments, group names, and other content you create on Predicto. By posting, you grant us a worldwide, non-exclusive, royalty-free license to host, display, and distribute that content within the app.',
          "You're responsible for the content you publish. We can — but aren't obligated to — moderate or remove any content that violates these terms.",
        ],
      },
      {
        h: '5. Subscriptions and purchases',
        body: [
          "Optional subscriptions unlock additional tickets, advanced stats, and group features. Subscriptions auto-renew until canceled in your platform's app store. Refunds are handled by the app store per its policies.",
        ],
      },
      {
        h: '6. Disclaimers',
        body: [
          'Predicto is provided "as is." We don\'t guarantee uninterrupted service, accurate odds, or specific outcomes. Predictions are entertainment — they are not financial or sports-betting advice.',
          "To the extent permitted by law, we disclaim all warranties and limit our liability to the amount you've paid us in the past 12 months.",
        ],
      },
      {
        h: '7. Termination',
        body: [
          'You can delete your account anytime in Settings → Privacy → Delete account. We can suspend or terminate accounts for violations of these terms or for legal reasons.',
        ],
      },
      {
        h: '8. Changes',
        body: [
          'We may update these terms occasionally. Material changes will be announced in-app at least 14 days before they take effect. Continued use means you accept the updated terms.',
        ],
      },
      {
        h: '9. Contact',
        body: ['Questions? Reach us at legal@predicto.app or via Settings → Help & support.'],
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    updated: 'Last updated · April 12, 2025',
    intro:
      'Your privacy matters. This policy explains what we collect, how we use it, and the controls you have over your data.',
    sections: [
      {
        h: '1. Information we collect',
        body: [
          'Account info: your email, username, password (hashed), and any avatar you upload.',
          'Activity: tickets you create, picks, comments, group memberships, and basic device telemetry like crash logs and app version.',
          'Optional info: phone number, profile bio, and contacts you choose to import to find friends.',
        ],
      },
      {
        h: '2. How we use it',
        body: [
          'To run the service — settling tickets, ranking leaderboards, sending push notifications, and showing your slips to followers.',
          'To improve Predicto — understanding which features you use so we can fix bugs and ship better ones.',
          'To keep things safe — detecting fraud, abuse, and accounts that violate our terms.',
        ],
      },
      {
        h: '3. What we share',
        body: [
          'Public profile content (username, avatar, public slips, comments) is visible to other users by default. You can tighten this in Settings → Privacy.',
          'We share data with service providers (hosting, analytics, email delivery, push notifications) under strict agreements that limit them to acting on our behalf.',
          'We do not sell your personal information. We may disclose data when required by law, court order, or to protect rights and safety.',
        ],
      },
      {
        h: '4. Your controls',
        body: [
          'Profile visibility — switch between Public, Friends only, and Private.',
          'Notifications — toggle each channel under Settings → Notifications.',
          'Download — request a copy of your data via Settings → Privacy → Download my data.',
          'Delete — permanently remove your account at Settings → Privacy → Delete account. We retain anonymized aggregates for analytics.',
        ],
      },
      {
        h: '5. Data retention',
        body: [
          'Active account data is kept while your account is open. Deleted accounts are purged within 30 days, except where law requires longer retention (e.g., financial records for paid subscriptions).',
        ],
      },
      {
        h: '6. Security',
        body: [
          'Data is encrypted in transit (TLS 1.2+) and at rest. Passwords are stored using bcrypt. We run regular security reviews, but no system is perfectly secure — please use a strong, unique password.',
        ],
      },
      {
        h: '7. Children',
        body: [
          "Predicto is not intended for users under 18. We don't knowingly collect personal information from minors. If you believe a minor has signed up, contact privacy@predicto.app and we'll remove the account.",
        ],
      },
      {
        h: '8. International users',
        body: [
          'Predicto is operated from the United States. By using the service from outside the US, you consent to your data being transferred to and processed in the US in accordance with this policy.',
        ],
      },
      {
        h: '9. Changes',
        body: [
          "We'll post material changes in-app at least 14 days before they take effect, and update the date at the top of this policy.",
        ],
      },
      {
        h: '10. Contact',
        body: ['Questions or requests? Email privacy@predicto.app.'],
      },
    ],
  },
};
