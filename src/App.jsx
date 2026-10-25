import React, { useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletDisconnectButton, WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import SwapCard from './components/SwapCard';
import AirdropCard from './components/AirdropCard';
import SendSolCard from './components/SendSolCard';
import SignMessageCard from './components/SignMessageCard';

// Import official Wallet Adapter CSS styles
import '@solana/wallet-adapter-react-ui/styles.css';
import './App.css';

function App() {
  // Alchemy Solana Devnet RPC endpoint
  const endpoint = "https://solana-devnet.g.alchemy.com/v2/alch_S6FOUrfTXMPRPVYnI0LY-";

  // Active tab state: 'airdrop' | 'transfer' | 'sign' | 'swap'
  const [activeTab, setActiveTab] = useState('airdrop');

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <div className="app-container">
            <header className="header"> 
              <div className="logo">⚡ Solana Dev Suite</div>
              <div className="wallet-actions">
                <WalletMultiButton />
              </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="tab-navigation">
              <button 
                className={`tab-btn ${activeTab === 'airdrop' ? 'active' : ''}`}
                onClick={() => setActiveTab('airdrop')}
              >
                🪂 Airdrop
              </button>
              <button 
                className={`tab-btn ${activeTab === 'transfer' ? 'active' : ''}`}
                onClick={() => setActiveTab('transfer')}
              >
                💸 Send SOL
              </button>
              <button 
                className={`tab-btn ${activeTab === 'sign' ? 'active' : ''}`}
                onClick={() => setActiveTab('sign')}
              >
                ✍️ Sign Msg
              </button>
              <button 
                className={`tab-btn ${activeTab === 'swap' ? 'active' : ''}`}
                onClick={() => setActiveTab('swap')}
              >
                🔄 Swap
              </button>
            </nav>

            {/* Active View */}
            <main>
              {activeTab === 'airdrop' && <AirdropCard />}
              {activeTab === 'transfer' && <SendSolCard />}
              {activeTab === 'sign' && <SignMessageCard />}
              {activeTab === 'swap' && <SwapCard />}
            </main> 
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
