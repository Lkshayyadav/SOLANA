import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import './AirdropCard.css';

export default function AirdropCard() {
  // 1. Get connection (our Devnet RPC) and wallet state from Solana Wallet Adapter
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  // 2. Local state
  const [amount, setAmount] = useState('1'); // Default 1 SOL
  const [balance, setBalance] = useState(null); // Current wallet balance in SOL
  const [loading, setLoading] = useState(false); // Disable button during request
  const [status, setStatus] = useState(''); // Feedback message

  // 3. Function to fetch the wallet's current SOL balance
  const fetchBalance = async () => {
    if (!publicKey) return null;
    try {
      // getBalance returns balance in Lamports (integer)
      const lamports = await connection.getBalance(publicKey);
      // Convert Lamports to SOL (divide by 1,000,000,000)
      const sol = lamports / LAMPORTS_PER_SOL;
      setBalance(sol);
      return sol;
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      return null;
    }
  };

  // 4. Automatically fetch balance whenever wallet connects or changes
  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [connected, publicKey, connection]);

  // 5. Function to request Devnet airdrop
  const handleAirdrop = async () => {
    if (!connected || !publicKey) {
      setStatus('❌ Please connect your wallet first!');
      return;
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setStatus('❌ Please enter a valid SOL amount.');
      return;
    }

    if (parseFloat(amount) > 1) {
      setStatus('⚠️ Solana Devnet faucet allows max 1 SOL per request. Please request 1 SOL.');
      return;
    }

    try {
      setLoading(true);
      setStatus('⏳ Requesting 1 SOL airdrop from Devnet faucet...');

      const currentBalance = balance;
      // Convert user input amount to lamports
      const lamportsToAirdrop = parseFloat(amount) * LAMPORTS_PER_SOL;

      // Step A: Request the airdrop from the network
      const signature = await connection.requestAirdrop(publicKey, lamportsToAirdrop);

      setStatus('⏳ Airdrop submitted! Confirming on Solana Devnet...');

      // Step B: Robust polling for confirmation or balance change
      let isConfirmed = false;
      for (let i = 0; i < 20; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Check signature status
        const sigStatus = await connection.getSignatureStatus(signature);
        if (
          sigStatus?.value &&
          (sigStatus.value.confirmationStatus === 'confirmed' ||
            sigStatus.value.confirmationStatus === 'finalized')
        ) {
          isConfirmed = true;
          break;
        }

        // Check if balance already updated
        const newBal = await fetchBalance();
        if (newBal !== null && currentBalance !== null && newBal > currentBalance) {
          isConfirmed = true;
          break;
        }
      }

      await fetchBalance();

      if (isConfirmed) {
        setStatus(`✅ Success! Airdropped ${amount} SOL to your wallet!`);
      } else {
        setStatus(`✅ Airdrop submitted! Devnet is confirming tx: ${signature.slice(0, 10)}...`);
      }
    } catch (err) {
      console.error("Airdrop error:", err);
      await fetchBalance();
      if (err.message && (err.message.includes('Internal error') || err.message.includes('429'))) {
        setStatus('⚠️ Devnet faucet limit: You already have ~3-4 SOL or the faucet is rate-limited. Try transferring some SOL or wait 1-2 minutes.');
      } else {
        setStatus(`❌ Airdrop error: ${err.message || 'Faucet limit reached.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="airdrop-card">
      <h2 className="airdrop-title">Devnet SOL Faucet</h2>

      {/* Wallet Balance Display */}
      <div className="balance-box">
        <span className="balance-label">Your Wallet Balance:</span>
        <span className="balance-value">
          {connected ? (balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...') : 'Not Connected'}
        </span>
        {connected && (
          <button className="refresh-btn" onClick={fetchBalance} title="Refresh balance">
            🔄
          </button>
        )}
      </div>

      {/* Amount Input */}
      <div className="airdrop-input-box">
        <label className="input-label">Amount (SOL)</label>
        <input
          type="number"
          className="airdrop-input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 1"
          min="0.1"
          max="2"
          step="0.5"
        />
        <span className="network-badge">Devnet Only</span>
      </div>

      {/* Action Button */}
      <button
        className="airdrop-btn"
        onClick={handleAirdrop}
        disabled={loading || !connected}
      >
        {loading ? 'Airdropping...' : connected ? `Request ${amount || 0} SOL Airdrop` : 'Connect Wallet to Airdrop'}
      </button>

      {/* Status Feedback Message */}
      {status && (
        <div className={`airdrop-status ${status.startsWith('✅') ? 'success' : status.startsWith('⏳') ? 'info' : 'error'}`}>
          {status}
        </div>
      )}
    </div>
  );
}
