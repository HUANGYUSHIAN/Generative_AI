// 全域變數
let currentUser = null;

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeModalEvents();
});

// 初始化事件監聽器
function initializeEventListeners() {
    // 登入/註冊表單切換
    document.getElementById('showRegister').addEventListener('click', function(e) {
        e.preventDefault();
        showRegisterForm();
    });
    
    document.getElementById('showLogin').addEventListener('click', function(e) {
        e.preventDefault();
        showLoginForm();
    });
    
    // 表單提交
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // 主頁面選單項目點擊
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            showPage(page);
        });
    });
}

// 初始化彈出視窗事件
function initializeModalEvents() {
    const modal = document.getElementById('image-modal');
    
    // 點擊背景關閉彈出視窗
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeImageModal();
        }
    });
    
    // ESC鍵關閉彈出視窗
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeImageModal();
        }
    });
}

// 顯示註冊表單
function showRegisterForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

// 顯示登入表單
function showLoginForm() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

// 處理登入
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        username: formData.get('username'),
        password: formData.get('password')
    };
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentUser = result.user;
            showApp();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('登入錯誤:', error);
        alert('登入失敗，請稍後再試');
    }
}

// 處理註冊
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const registerData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        username: formData.get('username'),
        password: formData.get('password')
    };
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('註冊成功！請登入');
            showLoginForm();
            e.target.reset();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('註冊錯誤:', error);
        alert('註冊失敗，請稍後再試');
    }
}

// 顯示應用程式主頁面
function showApp() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    
    // 更新用戶信息
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userPoints').textContent = `${currentUser.points} 點`;
    document.getElementById('currentPoints').textContent = currentUser.points;
    
    showMainPage();
}

// 顯示主頁面
function showMainPage() {
    hideAllPages();
    document.getElementById('main-page').style.display = 'block';
}

// 顯示指定頁面
function showPage(pageId) {
    hideAllPages();
    
    switch(pageId) {
        case 'word-review':
            document.getElementById('word-review-page').style.display = 'block';
            break;
        case 'word-test':
            document.getElementById('word-test-page').style.display = 'block';
            break;
        case 'my-shop':
            document.getElementById('my-shop-page').style.display = 'block';
            updateShopPoints();
            break;
        case 'my-coupons':
            document.getElementById('my-coupons-page').style.display = 'block';
            loadCoupons();
            break;
    }
}

// 隱藏所有頁面
function hideAllPages() {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.style.display = 'none';
    });
}

// 更新商店頁面的點數顯示
function updateShopPoints() {
    document.getElementById('currentPoints').textContent = currentUser.points;
}

// 摸彩箱功能
async function drawPrize() {
    if (currentUser.points < 10) {
        alert('點數不足！需要10點才能抽取');
        return;
    }
    
    if (!confirm('確定要使用10點抽取獎品嗎？')) {
        return;
    }
    
    try {
        const response = await fetch('/api/draw', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: currentUser.username })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentUser.points = result.remainingPoints;
            updateUserPoints();
            
            // 顯示獎品結果
            const prizeResult = document.getElementById('prize-result');
            const prizeInfo = document.getElementById('prize-info');
            
            prizeInfo.innerHTML = `
                <div class="prize-details">
                    <h4>${result.prize.name}</h4>
                    <p>${result.prize.description}</p>
                    <p><strong>類型:</strong> ${result.prize.type}</p>
                    <p><strong>價值:</strong> ${result.prize.value}</p>
                    <p><strong>優惠券ID:</strong> ${result.couponId}</p>
                </div>
            `;
            
            prizeResult.style.display = 'block';
            
            // 3秒後隱藏結果
            setTimeout(() => {
                prizeResult.style.display = 'none';
            }, 5000);
            
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('抽獎錯誤:', error);
        alert('抽獎失敗，請稍後再試');
    }
}

// 單字解鎖功能
async function unlockWords() {
    if (currentUser.points < 5) {
        alert('點數不足！需要5點才能解鎖');
        return;
    }
    
    if (!confirm('確定要使用5點解鎖10個單字嗎？')) {
        return;
    }
    
    try {
        const response = await fetch('/api/unlock-words', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: currentUser.username })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentUser.points = result.remainingPoints;
            updateUserPoints();
            
            alert(`成功解鎖10個單字！\n單字ID: ${result.unlockedWords.join(', ')}\n剩餘點數: ${result.remainingPoints}`);
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('解鎖錯誤:', error);
        alert('解鎖失敗，請稍後再試');
    }
}

// 載入優惠券
async function loadCoupons() {
    try {
        const response = await fetch(`/api/coupons/${currentUser.username}`);
        const result = await response.json();
        
        if (result.success) {
            displayCoupons(result.coupons, result.expiryDate);
        } else {
            document.getElementById('coupons-list').innerHTML = '<p>載入優惠券失敗</p>';
        }
    } catch (error) {
        console.error('載入優惠券錯誤:', error);
        document.getElementById('coupons-list').innerHTML = '<p>載入優惠券失敗</p>';
    }
}

// 顯示優惠券
function displayCoupons(coupons, expiryDate) {
    const couponsList = document.getElementById('coupons-list');
    
    if (coupons.length === 0) {
        couponsList.innerHTML = '<p>目前沒有優惠券</p>';
        return;
    }
    
    couponsList.innerHTML = coupons.map(coupon => `
        <div class="coupon-item" onclick="showCouponImage('${coupon.id}', '${coupon.companyId}')">
            <div class="coupon-id">優惠券 ID: ${coupon.id}</div>
            <div class="coupon-expiry">使用期限: ${expiryDate}</div>
            <div class="coupon-image" id="image-${coupon.id}"></div>
        </div>
    `).join('');
}

// 顯示優惠券圖片（彈出視窗）
async function showCouponImage(couponId, companyId) {
    // 顯示彈出視窗
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const modalLoading = document.getElementById('modal-loading');
    const modalError = document.getElementById('modal-error');
    
    // 重置狀態
    modal.style.display = 'flex';
    modalImage.style.display = 'none';
    modalLoading.style.display = 'block';
    modalError.style.display = 'none';
    
    try {
        // 使用company ID來獲取圖片
        const response = await fetch(`/api/company-image/${companyId}`);
        
        if (response.ok) {
            const imageUrl = `/api/company-image/${companyId}`;
            modalImage.src = imageUrl;
            
            // 圖片載入成功
            modalImage.onload = function() {
                modalLoading.style.display = 'none';
                modalImage.style.display = 'block';
            };
            
            // 圖片載入失敗
            modalImage.onerror = function() {
                modalLoading.style.display = 'none';
                modalError.style.display = 'block';
            };
        } else {
            modalLoading.style.display = 'none';
            modalError.style.display = 'block';
        }
    } catch (error) {
        console.error('載入圖片錯誤:', error);
        modalLoading.style.display = 'none';
        modalError.style.display = 'block';
    }
}

// 關閉圖片彈出視窗
function closeImageModal() {
    const modal = document.getElementById('image-modal');
    modal.style.display = 'none';
}

// 更新用戶點數顯示
function updateUserPoints() {
    document.getElementById('userPoints').textContent = `${currentUser.points} 點`;
    document.getElementById('currentPoints').textContent = currentUser.points;
}
