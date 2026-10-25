import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import './SendSolCard.css';

export default function SendSolCard() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  // Inputs entered by the user
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');

  // Status and loading states
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Step 2: The Send SOL function
  const handleSend = async () => {
    if (!publicKey) {
      setStatus('⚠️ Please connect your wallet first!');
      return;
    }

    if (!toAddress || !amount) {
      setStatus('⚠️ Please fill in both recipient address and amount.');
      return;
    }

    try {
      setLoading(true);
      setStatus('⏳ Preparing transaction...');

      // 1. Convert recipient string into a Solana PublicKey object
      const recipientPubKey = new PublicKey(toAddress.trim());

      // 2. Convert SOL amount to Lamports (1 SOL = 1,000,000,000 Lamports)
      const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;

      // 3. Create an empty transaction container
      const transaction = new Transaction();

      // 4. Create the transfer instruction using SystemProgram
      const sendSolInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: recipientPubKey,
        lamports: lamports,
      });

      // 5. Add the instruction into our transaction
      transaction.add(sendSolInstruction);

      // Get latest blockhash before signing so the transaction has the exact blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      setStatus('👛 Please approve the transaction in your wallet...');

      // 6. Send transaction: opens Phantom popup, user approves, Phantom signs and sends
      const signature = await sendTransaction(transaction, connection);

      setStatus('⏳ Confirming transaction on Solana Devnet...');

      // 7. Wait for confirmation with a safety polling fallback
      let isConfirmed = false;
      try {
        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        }, 'confirmed');
        isConfirmed = true;
      } catch (confirmErr) {
        // If confirmation timed out, poll getSignatureStatus to see if it landed on-chain
        for (let i = 0; i < 15; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const sigStatus = await connection.getSignatureStatus(signature);
          if (
            sigStatus?.value &&
            (sigStatus.value.confirmationStatus === 'confirmed' ||
              sigStatus.value.confirmationStatus === 'finalized')
          ) {
            isConfirmed = true;
            break;
          }
        }
        if (!isConfirmed) throw confirmErr;
      }

      if (isConfirmed) {
        setStatus(`✅ Success! Sent ${amount} SOL. Tx: ${signature.slice(0, 8)}...`);
      }
    } catch (err) {
      console.error('Send SOL error:', err);
      // If error mentions expired block height, check if tx actually went through
      setStatus(`❌ Failed: ${err.message || 'Transaction rejected'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="send-sol-card">
      <h3 className="send-sol-title">💸 Transfer SOL</h3>
      <p className="send-sol-subtitle">Send Devnet SOL to any Solana wallet address</p>

      {/* Recipient Address Input */}
      <div className="input-group">
        <label className="input-label">Recipient Public Key</label>
        <input
          type="text"
          className="sol-input"
          placeholder="e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Amount Input */}
      <div className="input-group">
        <label className="input-label">Amount (SOL)</label>
        <input
          type="number"
          className="sol-input"
          placeholder="0.1"
          step="0.05"
          min="0.001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Action Button */}
      <button
        className="send-button"
        onClick={handleSend}
        disabled={loading || !publicKey}
      >
        {!publicKey
          ? 'Connect Wallet to Send'
          : loading
          ? 'Processing Transfer...'
          : `Send ${amount || '0'} SOL`}
      </button>

      {/* Status Message */}
      {status && <div className="status-box">{status}</div>}
    </div>
  );
}
