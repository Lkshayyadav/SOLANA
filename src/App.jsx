import React, { useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import SwapCard from './components/SwapCard';
import AirdropCard from './components/AirdropCard';
import SendSolCard from './components/SendSolCard';
import SignMessageCard from './components/SignMessageCard';
import ExplorerCard from './components/ExplorerCard';

// Import official Wallet Adapter CSS styles
import '@solana/wallet-adapter-react-ui/styles.css';
import './App.css';

function App() {
  // Alchemy Solana Devnet RPC endpoint
  const endpoint = "https://solana-devnet.g.alchemy.com/v2/alch_S6FOUrfTXMPRPVYnI0LY-";

  // Active tab state: 'airdrop' | 'transfer' | 'sign' | 'swap' | 'explorer'
  const [activeTab, setActiveTab] = useState('airdrop');

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <div className="app-wrapper">
            {/* Top Navigation Bar */}
            <header className="top-navbar">
              <div className="navbar-inner">
                <div className="brand-section">
                  <div className="brand-logo">
                    <div className="brand-icon">⚡</div>
                    <span className="brand-title">Solana Dev Suite</span>
                  </div>
                  <div className="badge-devnet">
                    <span className="pulse-dot"></span>
                    Devnet
                  </div>
                </div>

                <div className="nav-actions">
                  <WalletMultiButton />
                </div>
              </div>
            </header>

            {/* Main Content Area */}
            <div className="dashboard-container">
              {/* Header Hero */}
              <div className="dashboard-hero">
                <div className="hero-tag">✨ Web3 Developer Workbench</div>
                <h1 className="hero-heading">Explore, Transact & Build on Solana</h1>
                <p className="hero-subtext">
                  Complete developer tools for Devnet testing, native SOL transfers, message verification, DEX swaps, and deep blockchain inspection.
                </p>
              </div>

              {/* Modern Glassmorphic Tab Bar */}
              <div className="tab-bar-container">
                <nav className="tab-bar">
                  <button 
                    className={`tab-item ${activeTab === 'airdrop' ? 'active' : ''}`}
                    onClick={() => setActiveTab('airdrop')}
                  >
                    <span className="tab-icon">🪂</span> Faucet
                  </button>
                  <button 
                    className={`tab-item ${activeTab === 'transfer' ? 'active' : ''}`}
                    onClick={() => setActiveTab('transfer')}
                  >
                    <span className="tab-icon">💸</span> Transfer
                  </button>
                  <button 
                    className={`tab-item ${activeTab === 'sign' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sign')}
                  >
                    <span className="tab-icon">✍️</span> Sign Msg
                  </button>
                  <button 
                    className={`tab-item ${activeTab === 'swap' ? 'active' : ''}`}
                    onClick={() => setActiveTab('swap')}
                  >
                    <span className="tab-icon">🔄</span> Swap
                  </button>
                  <button 
                    className={`tab-item ${activeTab === 'explorer' ? 'active' : ''}`}
                    onClick={() => setActiveTab('explorer')}
                  >
                    <span className="tab-icon">🔍</span> Explorer
                  </button>
                </nav>
              </div>

              {/* Active Tab View */}
              <main className="card-wrapper">
                {activeTab === 'airdrop' && <AirdropCard />}
                {activeTab === 'transfer' && <SendSolCard />}
                {activeTab === 'sign' && <SignMessageCard />}
                {activeTab === 'swap' && <SwapCard />}
                {activeTab === 'explorer' && <ExplorerCard />}
              </main>
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
