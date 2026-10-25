import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';
import './SwapCard.css';

// Constants: Official Solana Mints for SOL and USDC
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export default function SwapCard() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const [amount, setAmount] = useState('1');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');


  

  // 1. Fetch live quote from Jupiter whenever amount changes
  useEffect(() => {
    const getQuote = async () => {
      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return; 
      try {
        const lamports = Math.round(parseFloat(amount) * 1000000000);
        const url = `https://api.jup.ag/swap/v1/quote?inputMint=${SOL_MINT}&outputMint=${USDC_MINT}&amount=${lamports}&slippageBps=50`;
        const res = await axios.get(url);
        setQuote(res.data);
      } catch (err) {
        console.error("Quote fetch error:", err);
      }
    };

    // Debounce by 500ms so we don't spam Jupiter while typing
    const timer = setTimeout(getQuote, 500);
    return () => clearTimeout(timer);
  }, [amount]);

  // 2. Handle Swap Execution
  const handleSwap = async () => {
    if (!connected || !publicKey) {
      setStatus('❌ Please connect your wallet first!');
      return;
    }
    if (!quote) {
      setStatus('❌ No quote available.');
      return;
    }

    try {
      setLoading(true);
      setStatus('⏳ Getting transaction from Jupiter...');

      // Step A: Request the transaction from Jupiter
      const swapRes = await axios.post('https://api.jup.ag/swap/v1/swap', {
        quoteResponse: quote,
        userPublicKey: publicKey.toString()
      });

      const { swapTransaction } = swapRes.data;

      // Step B: Deserialize Base64 into VersionedTransaction
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      setStatus('🔐 Please approve the transaction in Phantom...');

      // Step C: Hand transaction to Phantom to sign and broadcast
      const txid = await sendTransaction(transaction, connection);

      setStatus(`✅ Swap submitted! TX: https://solscan.io/tx/${txid}`);
    } catch (err) {
      console.error("Swap failed:", err);
      setStatus(`❌ Swap failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="swap-card">
      <h2 className="swap-title">Swap Tokens</h2>

      {/* Input: You Pay SOL */}
      <div className="token-box">
        <div className="token-header">
          <span>You Pay</span>
          <span>SOL</span>
        </div>
        <input
          type="number"
          className="token-input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
        />
      </div>

      {/* Output: You Receive USDC */}
      <div className="token-box">
        <div className="token-header">
          <span>You Receive</span>
          <span>USDC</span>
        </div>
        <div className="token-output">
          {quote ? (quote.outAmount / 1000000).toFixed(4) : '0.00'}
        </div>
      </div>

      {/* Action Button */}
      <button
        className="swap-btn"
        onClick={handleSwap}
        disabled={loading || !connected}
      >
        {loading ? 'Processing...' : connected ? 'Swap Now' : 'Connect Wallet to Swap'}
      </button>

      {/* Status Message */}
      {status && (
        <div className="status-msg">
          {status}
        </div>
      )}

      <h1>The current price of 1 SOL is {quote ? (quote.outAmount / 1000000).toFixed(4) : '0.00'} USDC</h1>
    </div>
  );
}
