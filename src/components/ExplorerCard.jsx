import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import './ExplorerCard.css';

// Official Solana Token Program ID (used to query SPL token accounts)
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

export default function ExplorerCard() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  // Search input state
  const [searchAddress, setSearchAddress] = useState('');
  
  // Inspected Account Data
  const [accountData, setAccountData] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Function to inspect any Solana address
  const inspectAddress = async (target) => {
    const addressStr = (target || searchAddress).trim();
    if (!addressStr) {
      setStatus('⚠️ Please enter a Solana address.');
      return;
    }

    try {
      setLoading(true);
      setStatus('🔍 Querying Solana blockchain...');
      setAccountData(null);
      setTokens([]);
      setTransactions([]);

      // 1. Validate the public key
      const targetPubKey = new PublicKey(addressStr);

      // 2. Fetch SOL Balance
      const lamports = await connection.getBalance(targetPubKey);
      const solBalance = lamports / LAMPORTS_PER_SOL;

      // 3. Check if account is a regular Wallet or a Smart Contract Program
      const accountInfo = await connection.getAccountInfo(targetPubKey);
      const isProgram = accountInfo ? accountInfo.executable : false;
      const ownerProgram = accountInfo ? accountInfo.owner.toString() : 'None';

      setAccountData({
        address: addressStr,
        solBalance,
        isProgram,
        ownerProgram,
      });

      // 4. Query all SPL Token holdings owned by this wallet
      try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(targetPubKey, {
          programId: TOKEN_PROGRAM_ID,
        });

        const parsedTokens = tokenAccounts.value
          .map((item) => {
            const info = item.account.data.parsed.info;
            return {
              mint: info.mint,
              amount: info.tokenAmount.uiAmount,
              decimals: info.tokenAmount.decimals,
            };
          })
          .filter((t) => t.amount > 0);

        setTokens(parsedTokens);
      } catch (tokenErr) {
        console.warn('Could not fetch token accounts:', tokenErr);
      }

      // 5. Fetch Recent Transactions (last 10)
      const signatures = await connection.getSignaturesForAddress(targetPubKey, { limit: 10 });
      setTransactions(signatures);

      setStatus(`✅ Ready! Displaying data for ${addressStr.slice(0, 4)}...${addressStr.slice(-4)}`);
    } catch (err) {
      console.error('Inspect error:', err);
      setStatus(`❌ Invalid address or error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Automatically inspect user's wallet when connected
  useEffect(() => {
    if (publicKey) {
      const pubkeyStr = publicKey.toString();
      setSearchAddress(pubkeyStr);
      inspectAddress(pubkeyStr);
    }
  }, [publicKey]);

  return (
    <div className="explorer-card">
      <h3 className="explorer-title">🔍 Solana Inspector (Mini Solscan)</h3>
      <p className="explorer-subtitle">
        Search any Solana wallet address or smart contract to view balances, tokens & live transactions.
      </p>

      {/* Search Input Bar */}
      <div className="search-box">
        <input
          type="text"
          className="search-input"
          placeholder="Paste any Solana Public Key..."
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && inspectAddress()}
          disabled={loading}
        />
        <button
          className="inspect-btn"
          onClick={() => inspectAddress()}
          disabled={loading || !searchAddress.trim()}
        >
          {loading ? 'Inspecting...' : 'Inspect'}
        </button>
      </div>

      {/* Status banner */}
      {status && <div className="status-badge">{status}</div>}

      {/* Account Overview Card */}
      {accountData && (
        <div className="account-overview-card">
          <div className="account-header">
            <span className={`account-type-pill ${accountData.isProgram ? 'pill-program' : 'pill-user'}`}>
              {accountData.isProgram ? '⚙️ Smart Contract (Program)' : '👤 User Wallet'}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Owner: {accountData.ownerProgram.slice(0, 8)}...
            </span>
          </div>

          <div className="account-address">{accountData.address}</div>

          <div className="sol-balance-banner">
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Native SOL Balance</span>
            <span className="balance-amount">{accountData.solBalance.toFixed(4)} SOL</span>
          </div>

          {/* SPL Token Holdings Section */}
          <div className="section-title">
            <span>🪙 SPL Token Portfolio</span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{tokens.length} token(s)</span>
          </div>

          {tokens.length > 0 ? (
            <div className="token-list">
              {tokens.map((token, idx) => (
                <div key={idx} className="token-row">
                  <span className="token-mint" title={token.mint}>
                    {token.mint.slice(0, 6)}...{token.mint.slice(-6)}
                  </span>
                  <span className="token-qty">{token.amount}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-text">No SPL tokens found for this address.</div>
          )}

          {/* Recent Transactions List */}
          <div className="section-title">
            <span>⚡ Recent On-Chain Transactions</span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Latest {transactions.length}</span>
          </div>

          {transactions.length > 0 ? (
            <div className="tx-list">
              {transactions.map((tx, idx) => {
                const dateStr = tx.blockTime
                  ? new Date(tx.blockTime * 1000).toLocaleTimeString()
                  : 'Pending';
                return (
                  <div key={idx} className="tx-item">
                    <div className="tx-left">
                      <a
                        href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                        target="_blank"
                        rel="noreferrer"
                        className="tx-sig-link"
                      >
                        {tx.signature.slice(0, 10)}...{tx.signature.slice(-8)} ↗
                      </a>
                      <span className="tx-time">Time: {dateStr} • Slot: {tx.slot}</span>
                    </div>
                    <div>
                      {tx.err ? (
                        <span className="tx-badge-failed">❌ Failed</span>
                      ) : (
                        <span className="tx-badge-success">✅ Success</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-text">No recent transactions found.</div>
          )}
        </div>
      )}
    </div>
  );
}
