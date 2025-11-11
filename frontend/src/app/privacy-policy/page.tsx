export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create an account, connect social media platforms, or contact us for support.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To provide and maintain our service</li>
              <li>To analyze social media comments and engagement</li>
              <li>To improve our AI algorithms and analytics</li>
              <li>To communicate with you about your account</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Social Media Data</h2>
            <p>When you connect your social media accounts, we access only the data necessary to provide our analytics services. This includes:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Public comments on your posts</li>
              <li>Basic profile information</li>
              <li>Post engagement metrics</li>
              <li>Video/content metadata</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Third-Party Services</h2>
            <p>Our service integrates with social media platforms (YouTube, Instagram, Twitter, TikTok) through their official APIs. Your use of these platforms is subject to their respective privacy policies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
            <p>We retain your information for as long as your account is active or as needed to provide you services. You may request deletion of your data at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
            <p>You have the right to access, update, or delete your personal information. You may also disconnect social media accounts at any time through your account settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at privacy@sociallim.com</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-gray-500 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
