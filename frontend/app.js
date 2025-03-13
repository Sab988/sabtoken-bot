const tg = window.Telegram?.WebApp;
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: "https://sabbot.vercel.app/tonconnect-manifest.json"
});

let userData = null;
let currentTab = 'home';

// Main Initialization
async function init() {
    try {
        if (tg) {
            tg.expand();
            tg.enableClosingConfirmation();
        }
        await loadUserData();
        setupAutoReset();
        renderUI();
        setupNavigation();
    } catch (error) {
        showError('Failed to initialize app. Please try again.');
    }
}

// Load User Data
async function loadUserData() {
    try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: tg?.initDataUnsafe?.user || {} })
        });
        userData = await response.json();
    } catch (error) {
        showError('Failed to load user data');
    }
}

// UI Rendering
function renderUI() {
    const appContainer = document.getElementById('app');
    if (!appContainer) return;
    
    appContainer.innerHTML = `
        <div class="main-content">
            ${renderCurrentTab()}
        </div>
        ${renderTabBar()}
    `;
}

// Tab Navigation
function renderTabBar() {
    return `
    <div class="tab-bar">
        <button class="${currentTab === 'home' ? 'active' : ''}" onclick="switchTab('home')">🏠 Home</button>
        <button class="${currentTab === 'play' ? 'active' : ''}" onclick="switchTab('play')">🎮 Play</button>
        <button class="${currentTab === 'socials' ? 'active' : ''}" onclick="switchTab('socials')">🌐 Socials</button>
        <button class="${currentTab === 'wallet' ? 'active' : ''}" onclick="switchTab('wallet')">💰 Wallet</button>
    </div>
    `;
}

// Tab Content Rendering
function renderCurrentTab() {
    switch(currentTab) {
        case 'home': return renderHome();
        case 'play': return renderPlay();
        case 'socials': return renderSocials();
        case 'wallet': return renderWallet();
        default: return renderHome();
    }
}

// Home Tab
function renderHome() {
    return `
    <div class="tab-content">
        <img src="${userData?.photoUrl || 'https://drive.google.com/uc?export=view&id=1uXbKTmOKqJJul2iuUGXtiwY2fUibwIgn'}" 
             class="profile-pic" 
             alt="Profile">
        <h2>@${userData?.username || 'Guest'}</h2>
        <div class="balance-box">
            <img src="https://drive.google.com/uc?export=view&id=1uXbKTmOKqJJul2iuUGXtiwY2fUibwIgn" 
                 class="token-logo" 
                 alt="Token">
            <span class="balance-amount">${userData?.balance || 0} SAB</span>
        </div>
        <div class="referrals-box">
            <h3>📈 Referrals: ${userData?.referrals || 0}</h3>
            <p class="referral-code">Your Code: <code>${userData?.referralCode || 'LOADING...'}</code></p>
        </div>
    </div>
    `;
}

// Play Tab
function renderPlay() {
    const remaining = userData?.dailyLimit || 0;
    const progress = (remaining / 1500) * 100;
    
    return `
    <div class="tab-content">
        <div class="click-container">
            <div class="click-area" onclick="handleTokenClick()">
                <img src="https://drive.google.com/uc?export=view&id=1uXbKTmOKqJJul2iuUGXtiwY2fUibwIgn" 
                     class="click-logo" 
                     alt="Click">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="click-counter">${remaining}/1500</div>
            </div>
        </div>
    </div>
    `;
}

// Socials Tab
function renderSocials() {
    return `
    <div class="tab-content socials-grid">
        <a href="https://t.me/sabtokenAnn" class="social-card telegram" target="_blank">
            <img src="https://www.freepnglogos.com/uploads/telegram-logo-png-0.png" alt="Telegram">
            <span>Announcements</span>
        </a>
        <a href="https://t.me/sabtokengroup" class="social-card telegram" target="_blank">
            <img src="https://www.freepnglogos.com/uploads/telegram-logo-png-0.png" alt="Telegram">
            <span>Discussion</span>
        </a>
        <a href="https://x.com/sabtoken" class="social-card twitter" target="_blank">
            <img src="https://www.freepnglogos.com/uploads/twitter-logo-png/twitter-logo-vector-png-clipart-1.png" alt="Twitter">
            <span>Twitter/X</span>
        </a>
        <div class="social-card instagram" onclick="alert('Coming soon!')">
            <img src="https://www.freepnglogos.com/uploads/instagram-logo-png-transparent-0.png" alt="Instagram">
            <span>Instagram</span>
        </div>
    </div>
    `;
}

// Wallet Tab
function renderWallet() {
    return `
    <div class="tab-content wallet-content">
        ${userData?.walletAddress ? `
            <div class="connected-wallet">
                <span>✅ Connected:</span>
                <code>${userData.walletAddress.slice(0, 6)}...${userData.walletAddress.slice(-4)}</code>
            </div>
        ` : `
            <button class="connect-button" onclick="connectWallet()">
                🔗 Connect Wallet
            </button>
        `}
        <div class="wallet-instruction">
            Supported: Tonkeeper, Tonhub
        </div>
    </div>
    `;
}

// Tab Switching
function switchTab(tab) {
    currentTab = tab;
    renderUI();
}

// Click Handler
async function handleTokenClick() {
    try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/click`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userData?._id })
        });
        userData = await response.json();
        showClickFeedback();
        renderUI();
    } catch (error) {
        showError('Failed to process click');
    }
}

// Wallet Connection
async function connectWallet() {
    try {
        const connector = tonConnectUI.connector;
        const wallets = await tonConnectUI.getWallets();
        await connector.connect(wallets[0]);
    } catch (error) {
        showError('Wallet connection failed');
    }
}

// Helper Functions
function showClickFeedback() {
    const feedback = document.createElement('div');
    feedback.className = 'click-feedback';
    feedback.textContent = '+1';
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 1000);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Daily Reset
function setupAutoReset() {
    const now = Date.now();
    const nextReset = new Date(now);
    nextReset.setUTCHours(24, 0, 0, 0);
    setTimeout(() => location.reload(), nextReset - now);
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
