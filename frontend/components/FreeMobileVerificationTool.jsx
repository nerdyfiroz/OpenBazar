import { useState } from 'react';
import { useStore } from './StoreProvider';
import MobileVerificationModal from './MobileVerificationModal';

export default function FreeMobileVerificationTool() {
  const { user } = useStore();
  const [modalOpen, setModalOpen] = useState(false);

  const isVerified = user?.phoneVerified;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
        borderRadius: 20,
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 12px 32px rgba(49, 46, 129, 0.25)',
        position: 'relative',
        overflow: 'hidden',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.06)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 20,
              background: 'rgba(255, 255, 255, 0.15)',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.5px',
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            📱 Mobile Phone Verification
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.3px' }}>
            Mobile Number Verification Status
          </h3>
          <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', margin: 0, maxWidth: 520, lineHeight: 1.5 }}>
            Verify your 11-digit Bangladesh mobile number to enhance account security and receive instant order notifications.
          </p>
        </div>

        <div>
          {isVerified ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 50,
                background: 'rgba(34, 197, 94, 0.2)',
                border: '1.5px solid rgba(34, 197, 94, 0.5)',
                color: '#4ade80',
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              ✅ Verified ({user.phone})
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{
                padding: '12px 24px',
                borderRadius: 50,
                background: '#ffffff',
                color: '#4338ca',
                border: 'none',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.15s ease',
              }}
            >
              📱 Verify Mobile Number
            </button>
          )}
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
    </div>
  );
}
