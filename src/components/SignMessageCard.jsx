import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import './SignMessageCard.css';

export default function SignMessageCard() {
  // 1. Get publicKey and signMessage hook from wallet adapter
  const { publicKey, signMessage } = useWallet();

  // 2. State for the message input and resulting signature
  const [message, setMessage] = useState('Hello Solana! Authenticating my wallet.');
  const [signature, setSignature] = useState('');
  const [status, setStatus] = useState('');

  // Step 2: The Sign Message function
  const handleSignMessage = async () => {
    if (!publicKey) {
      setStatus('⚠️ Please connect your wallet first!');
      return;
    }

    if (!signMessage) {
      setStatus('❌ Your connected wallet does not support message signing.');
      return;
    }

    if (!message.trim()) {
      setStatus('⚠️ Please enter a message to sign.');
      return;
    }

    try {
      setStatus('👛 Please sign the message in your wallet...');

      // 1. Convert plain text into bytes (Uint8Array)
      const messageBytes = new TextEncoder().encode(message);

      // 2. Wallet popup: Phantom asks user to sign the message
      const signatureBytes = await signMessage(messageBytes);

      // 3. Convert signature bytes into Base58 string
      const base58Signature = bs58.encode(signatureBytes);

      setSignature(base58Signature);
      setStatus('✅ Message signed successfully!');
    } catch (err) {
      console.error('Sign message error:', err);
      setStatus(`❌ Signing failed: ${err.message || 'User rejected signature.'}`);
    }
  };

  return (
    <div className="sign-card">
      <h3 className="sign-title">✍️ Sign Message (Web3 Auth)</h3>
      <p className="sign-subtitle">
        Cryptographically prove you own this wallet without spending any gas fees ($0).
      </p>

      {/* Message Textarea */}
      <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
        MESSAGE TO SIGN:
      </label>
      <textarea
        className="message-textarea"
        rows="3"
        placeholder="Enter message to sign..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      {/* Action Button */}
      <button
        className="sign-button"
        onClick={handleSignMessage}
        disabled={!publicKey || !message.trim()}
      >
        {!publicKey ? 'Connect Wallet to Sign' : 'Sign Message with Wallet'}
      </button>

      {/* Status banner */}
      {status && (
        <div style={{ marginTop: '16px', fontSize: '13px', color: '#f8fafc' }}>
          {status}
        </div>
      )}

      {/* Resulting Base58 Signature */}
      {signature && (
        <div className="signature-result-box">
          <span className="signature-label">🔐 Cryptographic Signature Proof (Base58):</span>
          <div className="signature-value">{signature}</div>
        </div>
      )}
    </div>
  );
}
