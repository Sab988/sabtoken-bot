const tg = window.Telegram.WebApp;
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: "https://sabbot.vercel.app/tonconnect-manifest.json"
});

let userData = null;
let currentTab = 'home';

async function init() {
    try {
        tg.expand();
        tg.enableClosingConfirmation();
        await loadUserData();
        setupAutoReset();
        renderUI();
        setupNavigation();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize app. Please try again.');
    }
}

async function loadUserData() {
    try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: tg.initDataUnsafe.user })
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        userData = await response.json();
    } catch (error) {
        console.error('Failed to load user data:', error);
        showError('Failed to load user data. Please refresh.');
    }
}

function renderUI() {
    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    appContainer.innerHTML = `
        <div class="main-content">
            ${renderCurrentTab()}
        </div>
        ${renderTabBar()}
    `;

    // Initialize tab-specific functionality
    if (currentTab === 'play') initPlayTab();
    if (currentTab === 'wallet') initWalletTab();
}

function renderCurrentTab() {
    switch(currentTab) {
        case 'home': return renderHome();
        case 'play': return renderPlay();
        case 'socials': return renderSocials();
        case 'wallet': return renderWallet();
        default: return renderHome();
    }
}

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

// Home Tab
function renderHome() {
    return `
    <div class="tab-content">
        <img src="${userData?.photoUrl || 'https://drive.google.com/uc?export=view&id=1uXbKTmOKqJJul2iuUGXtiwY2fUibwIgn'}" 
             class="profile-pic" 
             alt="Profile Picture">
        <h2>@${userData?.username || 'Unknown User'}</h2>
        
        <div class="balance-box">
            <img src="https://drive.google.com/uc?export=view&id=1uXbKTmOKqJJul2iuUGXtiwY2fUibwIgn" 
                 class="token-logo" 
                 alt="Token Logo">
            <span class="balance-amount">${userData?.balance || 0} SAB</span>
        </div>
        
        <div class="referrals-box">
            <h3>📊 Referrals: ${userData?.referrals || 0}</h3>
            <div class="referral-code">
                <span>Your Code:</span>
                <code>${userData?.referralCode || 'GENERATING...'}</code>
            </div>
        </div>
    </div>
    `;
}

// Play Tab
function renderPlay() {
    const remaining = userData?.dailyLimit || 0;
    const progressPercent = (remaining / 1500) * 100;
    
    return `
    <div class="tab-content">
        <div class="click-container">
            <div class="click-area" onclick="handleTokenClick()">
                <img src="https://drive.google.com/uc?export=view&id=1uXbKTmOKqJJul2iuUGXtiwY2fUibwIgn" 
                     class="click-logo" 
                     alt="Click Logo">
                <div class="click-counter">${remaining}/1500</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
            </div>
            <div class="click-instruction">Tap the logo to earn tokens!</div>
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
            <span>Discussion Group</span>
        </a>
        <a href="https://x.com/sabtoken" class="social-card twitter" target="_blank">
            <img src="https://www.freepnglogos.com/uploads/twitter-logo-png/twitter-logo-vector-png-clipart-1.png" alt="Twitter">
            <span>Twitter/X</span>
        </a>
        <div class="social-card instagram" onclick="alert('Instagram coming soon!')">
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
        <div class="wallet-status">
            ${userData?.walletAddress ? `
                <div class="connected-wallet">
                    <span>✅ Connected to:</span>
                    <code>${userData.walletAddress.slice(0, 6)}...${userData.walletAddress.slice(-4)}</code>
                </div>
            ` : `
                <button class="connect-button" onclick="connectWallet()">
                    🔗 Connect Wallet
                </button>
            `}
        </div>
        <div class="wallet-instruction">
            Supported wallets: Tonkeeper, Tonhub
        </div>
    </div>
    `;
}

// Tab Switching
function switchTab(tab) {
    currentTab = tab;
    renderUI();
}

// Token Click Handler
async function handleTokenClick() {
    try {
        if (!userData || userData.dailyLimit <= 0) return;
        
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/click`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userData._id })
        });

        if (!response.ok) throw new Error('Click failed');
        
        userData = await response.json().user;
        showClickFeedback();
        renderUI();
    } catch (error) {
        console.error('Click error:', error);
        showError('Failed to register click. Try again.');
    }
}

// Wallet Connection
async function connectWallet() {
    try {
        const connector = tonConnectUI.connector;
        const walletsList = await tonConnectUI.getWallets();
        
        connector.onStatusChange(wallet => {
            if (wallet) {
                userData.walletAddress = wallet.account.address;
                renderUI();
            }
        });
        
        await connector.connect(walletsList[0]);
    } catch (error) {
        console.error('Wallet connection failed:', error);
        showError('Wallet connection failed. Please try again.');
    }
}

// Helper Functions
function showClickFeedback() {
    const feedback = document.createElement('div');
    feedback.className = 'click-feedback';
    feedback.textContent = '+1';
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
    }, 1000);
}

function showError(message) {
    tg.showAlert(message);
}

function setupAutoReset() {
    const now = new Date();
    const nextReset = new Date(now);
    nextReset.setUTCHours(24, 0, 0, 0); // Next UTC midnight
    
    setTimeout(() => {
        location.reload();
    }, nextReset - now);
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
