import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import './ExplorerCard.css';

// Official Solana Token Program ID (used to query SPL token accounts)
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
// Alchemy Solana Mainnet RPC endpoint (public solana RPC blocks browser requests with 403)
const MAINNET_RPC = 'https://solana-mainnet.g.alchemy.com/v2/alch_S6FOUrfTXMPRPVYnI0LY-';

export default function ExplorerCard() {
  const { connection: devnetConnection } = useConnection();
  const { publicKey } = useWallet();

  // Network selector: 'mainnet' or 'devnet'
  const [network, setNetwork] = useState('mainnet');

  // Search input state
  const [searchAddress, setSearchAddress] = useState('');
  
  // Inspected Account Data
  const [accountData, setAccountData] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Function to inspect any Solana address
  const inspectAddress = async (target, targetNetwork) => {
    const addressStr = (target || searchAddress).trim();
    const net = targetNetwork || network;

    if (!addressStr) {
      setStatus('⚠️ Please enter a Solana address.');
      return;
    }

    try {
      setLoading(true);
      setStatus(`🔍 Querying Solana ${net.toUpperCase()}...`);
      setAccountData(null);
      setTokens([]);
      setTransactions([]);

      // 1. Choose active connection based on network
      const activeConnection = net === 'mainnet' 
        ? new Connection(MAINNET_RPC, 'confirmed')
        : devnetConnection;

      // 2. Validate the public key
      const targetPubKey = new PublicKey(addressStr);

      // 3. Fetch SOL Balance
      const lamports = await activeConnection.getBalance(targetPubKey);
      const solBalance = lamports / LAMPORTS_PER_SOL;

      // 4. Check if account is a regular Wallet or a Smart Contract Program
      const accountInfo = await activeConnection.getAccountInfo(targetPubKey);
      const isProgram = accountInfo ? accountInfo.executable : false;
      const ownerProgram = accountInfo ? accountInfo.owner.toString() : 'None';

      setAccountData({
        address: addressStr,
        solBalance,
        isProgram,
        ownerProgram,
        network: net,
      });

      // 5. Query all SPL Token holdings owned by this wallet
      try {
        const tokenAccounts = await activeConnection.getParsedTokenAccountsByOwner(targetPubKey, {
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

      // 6. Fetch Recent Transactions (last 10)
      const signatures = await activeConnection.getSignaturesForAddress(targetPubKey, { limit: 10 });
      setTransactions(signatures);

      setStatus(`✅ Ready! Displaying ${net.toUpperCase()} data for ${addressStr.slice(0, 4)}...${addressStr.slice(-4)}`);
    } catch (err) {
      console.error('Inspect error:', err);
      setStatus(`❌ Invalid address or error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Change network and re-inspect automatically
  const handleNetworkSwitch = (newNet) => {
    setNetwork(newNet);
    if (searchAddress.trim()) {
      inspectAddress(searchAddress, newNet);
    }
  };

  // Load wallet or default address on mount
  useEffect(() => {
    if (publicKey && network === 'devnet') {
      const pubkeyStr = publicKey.toString();
      setSearchAddress(pubkeyStr);
      inspectAddress(pubkeyStr, 'devnet');
    }
  }, [publicKey]);

  return (
    <div className="explorer-card">
      <div className="explorer-top-row">
        <div>
          <h3 className="explorer-title">🔍 Solana Inspector (Mini Solscan)</h3>
          <p className="explorer-subtitle">
            Inspect real accounts on Mainnet or test wallets on Devnet.
          </p>
        </div>

        {/* Network Toggle */}
        <div className="network-pill-toggle">
          <button
            className={`net-toggle-btn ${network === 'mainnet' ? 'active-mainnet' : ''}`}
            onClick={() => handleNetworkSwitch('mainnet')}
          >
            🟣 Mainnet-Beta
          </button>
          <button
            className={`net-toggle-btn ${network === 'devnet' ? 'active-devnet' : ''}`}
            onClick={() => handleNetworkSwitch('devnet')}
          >
            🟢 Devnet
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="search-box">
        <input
          type="text"
          className="search-input"
          placeholder="Paste any Solana Public Key (e.g. 3rcg3ncgrLzw5c1yX8...)"
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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`account-type-pill ${accountData.isProgram ? 'pill-program' : 'pill-user'}`}>
                {accountData.isProgram ? '⚙️ Smart Contract (Program)' : '👤 User Wallet'}
              </span>
              <span className={`net-indicator-pill ${accountData.network === 'mainnet' ? 'net-mainnet' : 'net-devnet'}`}>
                {accountData.network.toUpperCase()}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Owner: {accountData.ownerProgram.slice(0, 8)}...
            </span>
          </div>

          <div className="account-address">{accountData.address}</div>

          <div className="sol-balance-banner">
            <span style={{ color: '#9da4b0', fontSize: '13px', fontWeight: 600 }}>Native SOL Balance</span>
            <span className="balance-amount">{accountData.solBalance.toFixed(4)} SOL</span>
          </div>

          {/* SPL Token Holdings Section */}
          <div className="section-title">
            <span>🪙 SPL Token Portfolio</span>
            <span style={{ fontSize: '12px', color: '#9da4b0' }}>{tokens.length} token(s)</span>
          </div>

          {tokens.length > 0 ? (
            <div className="token-list">
              {tokens.map((token, idx) => (
                <div key={idx} className="token-row">
                  <span className="token-mint" title={token.mint}>
                    {token.mint.slice(0, 8)}...{token.mint.slice(-8)}
                  </span>
                  <span className="token-qty">{token.amount}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-text">No SPL tokens found for this address on {accountData.network}.</div>
          )}

          {/* Recent Transactions List */}
          <div className="section-title">
            <span>⚡ Recent On-Chain Transactions</span>
            <span style={{ fontSize: '12px', color: '#9da4b0' }}>Latest {transactions.length}</span>
          </div>

          {transactions.length > 0 ? (
            <div className="tx-list">
              {transactions.map((tx, idx) => {
                const dateStr = tx.blockTime
                  ? new Date(tx.blockTime * 1000).toLocaleTimeString()
                  : 'Pending';
                const explorerUrl = `https://solscan.io/tx/${tx.signature}${accountData.network === 'devnet' ? '?cluster=devnet' : ''}`;
                
                return (
                  <div key={idx} className="tx-item">
                    <div className="tx-left">
                      <a
                        href={explorerUrl}
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
            <div className="empty-text">No recent transactions found on {accountData.network}.</div>
          )}
        </div>
      )}
    </div>
  );
}
