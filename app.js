const tg = window.Telegram.WebApp;
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://YOUR_FRONTEND_URL/tonconnect-manifest.json'
});

let userData = null;

async function init() {
    tg.expand();
    tg.enableClosingConfirmation();
    await loadUserData();
    renderUI();
}

async function loadUserData() {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: tg.initDataUnsafe.user })
    });
    userData = await response.json();
}

function renderHome() {
    return `
        <div class="tab-content">
            <img src="${userData.photoUrl}" class="profile-pic">
            <h2>@${userData.username}</h2>
            <div class="balance">
                <img src="TOKEN_LOGO_URL" class="token-logo">
                <span>${userData.balance} SAB</span>
            </div>
            <div class="referrals">
                <h3>Referrals: ${userData.referrals}</h3>
                <p>Your Code: ${userData.referralCode}</p>
            </div>
        </div>
    `;
}

// Add similar render functions for Play, Socials, and Wallet tabs

init();
