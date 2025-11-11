export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using Sociallim, you accept and agree to be bound by the terms and provision of this agreement.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Service Description</h2>
            <p>Sociallim is an AI-powered social media analytics platform that helps users analyze comments and engagement across various social media platforms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. User Responsibilities</h2>
            <p>Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Usage</h2>
            <p>We collect and analyze social media data in accordance with platform APIs and user permissions. All data is processed securely and in compliance with applicable privacy laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Limitation of Liability</h2>
            <p>Sociallim shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Contact Information</h2>
            <p>For questions about these Terms of Service, please contact us at support@sociallim.com</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-gray-500 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
