import { useState } from 'react';
import MarketplaceLayout from '../components/MarketplaceLayout';
import FreeMobileVerificationTool from '../components/FreeMobileVerificationTool';
import MobileVerificationModal from '../components/MobileVerificationModal';
import SEO from '../components/SEO';
import { useStore } from '../components/StoreProvider';

export default function VerifyPhonePage() {
  const { user } = useStore();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <MarketplaceLayout>
      <SEO
        title="Mobile Verification"
        description="Verify your mobile phone number on OpenBazar using our instant OTP verification portal."
        canonical="/verify-phone"
      />

      <main style={{ maxWidth: 880, margin: '36px auto', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              background: 'rgba(99, 102, 241, 0.1)',
              color: '#4f46e5',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            📱 OpenBazar Security Portal
          </span>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '12px 0 8px', letterSpacing: '-0.5px' }}>
            Mobile Number Verification
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
            OpenBazar mandates phone number verification for all buyers and sellers to ensure a safe, fraud-free marketplace in Bangladesh.
          </p>
        </div>

        <FreeMobileVerificationTool />

        {/* Features & Help Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 20,
            marginTop: 32,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 20,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              100% Free OTP Service
            </h4>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Verify Bangladeshi numbers (013 - 019) at zero cost with instant 6-digit SMS verification.
            </p>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 20,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>🛡️</div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              Account Security
            </h4>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Prevents spam accounts, protects seller transactions, and secures order deliveries across Bangladesh.
            </p>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 20,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔥</div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              Firebase & Developer Sandbox
            </h4>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Supports Firebase Spark 10k Free SMS/month as well as developer free test auto-fill assistant mode.
            </p>
          </div>
        </div>

        {modalOpen && (
          <MobileVerificationModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            initialPhone={user?.phone || ''}
            userEmail={user?.email || ''}
          />
        )}
      </main>
    </MarketplaceLayout>
  );
}
