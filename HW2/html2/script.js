// 全域變數
let wordsData = [];
let reviewWords = [];
let currentWordIndex = 0;

// 頁面切換函數
function showPage(pageId) {
    // 隱藏所有頁面
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // 顯示目標頁面
    document.getElementById(pageId).classList.add('active');
    
    // 如果切換到複習頁面，重新排序單字
    if (pageId === 'review-page' && wordsData.length > 0) {
        setupReviewMode();
    }
    
    // 如果切換到商店頁面，更新顯示
    if (pageId === 'shop-page') {
        updateShopDisplay();
    }
}

// 載入Excel檔案
function loadExcelFile() {
    const mainStatus = document.getElementById('main-loading-status');
    const loadingMessage = document.getElementById('loading-message');
    
    mainStatus.textContent = '正在載入單字檔案...';
    mainStatus.className = 'loading-status';
    
    fetch('JP_words.xlsx')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.arrayBuffer();
        })
        .then(data => {
            try {
                const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
                
                // 讀取第一個工作表
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // 轉換為JSON格式
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // 解析資料
                parseWordsData(jsonData);
                
                // 更新UI狀態
                mainStatus.textContent = `成功載入 ${reviewWords.length} 個可複習的單字！`;
                mainStatus.className = 'loading-status success';
                
                if (loadingMessage) {
                    loadingMessage.textContent = `已載入 ${reviewWords.length} 個可複習的單字！`;
                }
                
            } catch (error) {
                console.error('檔案解析錯誤:', error);
                mainStatus.textContent = '檔案解析失敗，請確認檔案格式正確';
                mainStatus.className = 'loading-status error';
                
                if (loadingMessage) {
                    loadingMessage.textContent = '檔案解析失敗，請確認檔案格式正確';
                }
            }
        })
        .catch(error => {
            console.error('檔案載入錯誤:', error);
            mainStatus.textContent = '找不到 JP_words.xlsx 檔案，請確認檔案位於正確位置';
            mainStatus.className = 'loading-status error';
            
            if (loadingMessage) {
                loadingMessage.textContent = '找不到 JP_words.xlsx 檔案，請確認檔案位於正確位置';
            }
        });
}

// 解析單字資料
function parseWordsData(jsonData) {
    wordsData = [];
    
    if (jsonData.length < 2) {
        console.error('檔案格式錯誤：需要至少兩行資料');
        return;
    }
    
    // 第一行是標題
    const headers = jsonData[0];
    console.log('檔案標題:', headers);
    
    // 從第二行開始是資料
    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row.length < 5) continue; // 確保有足夠的欄位
        
        const word = {
            word: row[0] || '',        // Word (日文單字)
            spelling: row[1] || '',    // Spelling (50音拼音)
            meaning: row[2] || '',     // Meaning (中文解釋)
            sentence: row[3] || '',    // Sentence (例句)
            priority: parseInt(row[4]) || 0  // Priority (優先度)
        };
        
        wordsData.push(word);
    }
    
    console.log('載入的單字資料:', wordsData);
    setupReviewMode();
}

// 設定複習模式
function setupReviewMode() {
    // 篩選可複習的單字 (Priority > 0)
    const availableWords = wordsData.filter(word => word.priority > 0);
    
    if (availableWords.length === 0) {
        document.getElementById('loading-message').textContent = '沒有可複習的單字 (Priority > 0)';
        return;
    }
    
    // 按Priority分組
    const priorityGroups = {};
    availableWords.forEach(word => {
        if (!priorityGroups[word.priority]) {
            priorityGroups[word.priority] = [];
        }
        priorityGroups[word.priority].push(word);
    });
    
    // 排序：先按Priority由小到大，同Priority內隨機排序
    reviewWords = [];
    const sortedPriorities = Object.keys(priorityGroups).map(Number).sort((a, b) => a - b);
    
    sortedPriorities.forEach(priority => {
        const group = priorityGroups[priority];
        // 隨機排序同優先度的單字
        shuffleArray(group);
        reviewWords.push(...group);
    });
    
    console.log('複習順序:', reviewWords);
    
    // 重置到第一個單字
    currentWordIndex = 0;
    updateWordDisplay();
}

// 陣列隨機排序函數
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 獲取優先度CSS類別
function getPriorityClass(priority) {
    if (priority >= 1 && priority <= 5) {
        return 'low';    // 低優先度 (需要多練習) - 粉紅色
    } else if (priority >= 6 && priority <= 15) {
        return 'medium'; // 中優先度 (普通熟練度) - 橘色
    } else if (priority >= 16) {
        return 'high';   // 高優先度 (很熟練) - 綠色
    }
    return '';           // 預設樣式 (藍紫色)
}

// 更新主頁面狀態顯示
function updateMainPageStatus() {
    const mainStatus = document.getElementById('main-loading-status');
    const loadingMessage = document.getElementById('loading-message');
    
    if (reviewWords.length > 0) {
        mainStatus.textContent = `成功載入 ${reviewWords.length} 個可複習的單字！`;
        mainStatus.className = 'loading-status success';
        
        if (loadingMessage) {
            loadingMessage.textContent = `已載入 ${reviewWords.length} 個可複習的單字！`;
        }
    } else {
        mainStatus.textContent = '沒有可複習的單字，請前往商店解鎖新單字';
        mainStatus.className = 'loading-status error';
        
        if (loadingMessage) {
            loadingMessage.textContent = '沒有可複習的單字，請前往商店解鎖新單字';
        }
    }
}

// 更新單字顯示
function updateWordDisplay() {
    if (reviewWords.length === 0) {
        document.getElementById('word-content').style.display = 'none';
        document.getElementById('loading-message').style.display = 'block';
        return;
    }
    
    document.getElementById('loading-message').style.display = 'none';
    document.getElementById('word-content').style.display = 'block';
    
    const currentWord = reviewWords[currentWordIndex];
    
    // 更新單字資訊
    document.getElementById('word-text').textContent = currentWord.word;
    document.getElementById('spelling-text').textContent = currentWord.spelling;
    document.getElementById('meaning-text').textContent = currentWord.meaning;
    
    // 更新優先度顯示
    const priorityElement = document.getElementById('priority-text');
    priorityElement.textContent = currentWord.priority;
    priorityElement.className = 'priority-value ' + getPriorityClass(currentWord.priority);
    
    // 處理例句（移除<符號，但保留單字標記用於高亮）
    let sentenceDisplay = currentWord.sentence;
    if (sentenceDisplay.includes('<') && sentenceDisplay.includes('>')) {
        // 提取被<>包圍的單字用於高亮
        sentenceDisplay = sentenceDisplay.replace(/<([^>]+)>/g, '<span class="highlight">$1</span>');
    }
    document.getElementById('sentence-text').innerHTML = sentenceDisplay;
    
    // 更新計數器
    document.getElementById('current-word-index').textContent = currentWordIndex + 1;
    document.getElementById('total-words').textContent = reviewWords.length;
    
    // 更新按鈕狀態
    updateButtonStates();
}

// 更新按鈕狀態
function updateButtonStates() {
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    prevBtn.disabled = currentWordIndex === 0;
    nextBtn.disabled = currentWordIndex === reviewWords.length - 1;
}

// 上一個單字
function previousWord() {
    if (currentWordIndex > 0) {
        currentWordIndex--;
        updateWordDisplay();
    }
}

// 下一個單字
function nextWord() {
    if (currentWordIndex < reviewWords.length - 1) {
        currentWordIndex++;
        updateWordDisplay();
    }
}

// 語音播放功能
function playSound() {
    if (reviewWords.length === 0) return;
    
    const currentWord = reviewWords[currentWordIndex];
    
    // 使用Web Speech API進行語音合成
    if ('speechSynthesis' in window) {
        // 停止當前播放
        speechSynthesis.cancel();
        
        // 播放單字拼音（日文）
        const spellingUtterance = new SpeechSynthesisUtterance(currentWord.spelling);
        spellingUtterance.lang = 'ja-JP'; // 日文
        spellingUtterance.rate = 0.8; // 稍慢的語速
        
        // 播放例句（移除<>符號）
        let sentenceToSpeak = currentWord.sentence.replace(/<[^>]*>/g, '');
        const sentenceUtterance = new SpeechSynthesisUtterance(sentenceToSpeak);
        sentenceUtterance.lang = 'ja-JP';
        sentenceUtterance.rate = 0.7;
        
        // 先播放拼音，再播放例句
        spellingUtterance.onend = function() {
            setTimeout(() => {
                speechSynthesis.speak(sentenceUtterance);
            }, 500); // 間隔0.5秒
        };
        
        speechSynthesis.speak(spellingUtterance);
        
        // 視覺反饋
        const soundBtn = document.querySelector('.sound-btn');
        soundBtn.style.background = '#2d3748';
        setTimeout(() => {
            soundBtn.style.background = '#48bb78';
        }, 1000);
        
    } else {
        alert('您的瀏覽器不支援語音功能');
    }
}

// 頁面載入完成後的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 檢查是否有嵌入的單字資料
    if (typeof WORDS_DATA !== 'undefined' && WORDS_DATA.length > 0) {
        // 使用嵌入的單字資料
        loadFromEmbeddedData();
    } else {
        // 嘗試載入Excel檔案
        loadExcelFile();
    }
    
    // 初始化貪食蛇遊戲顯示
    updateSnakeGameDisplay();
});

// 從嵌入的資料載入
function loadFromEmbeddedData() {
    const mainStatus = document.getElementById('main-loading-status');
    const loadingMessage = document.getElementById('loading-message');
    
    try {
        // 首先嘗試載入已儲存的進度
        const hasLoadedProgress = loadGameProgress();
        
        if (!hasLoadedProgress) {
            // 沒有儲存的進度，使用嵌入的資料初始化
            // 複製資料並確保所有單字的priority都是0
            wordsData = WORDS_DATA.map(word => ({
                ...word,
                priority: 0  // 確保所有單字的priority都是0
            }));
            
            // 隨機選取20個單字設為可複習（priority > 0）
            const availableWords = [...wordsData];
            shuffleArray(availableWords);
            for (let i = 0; i < Math.min(20, availableWords.length); i++) {
                availableWords[i].priority = Math.floor(Math.random() * 3) + 1; // 隨機設為1-3
            }
            
            // 給予初始免費解鎖機會
            PLAYER_DATA.freeUnlocks = 1;
            
            // 儲存初始狀態
            saveGameProgress();
            
            console.log('初始化遊戲:', wordsData.length, '個單字');
        } else {
            console.log('載入已儲存的遊戲進度');
        }
        
        setupReviewMode();
        updateMainPageStatus();
        
    } catch (error) {
        console.error('載入遊戲資料錯誤:', error);
        mainStatus.textContent = '載入遊戲資料失敗';
        mainStatus.className = 'loading-status error';
        
        if (loadingMessage) {
            loadingMessage.textContent = '載入遊戲資料失敗';
        }
    }
}

// 添加高亮樣式
const style = document.createElement('style');
style.textContent = `
    .highlight {
        background-color: #ffd700;
        font-weight: bold;
        padding: 2px 4px;
        border-radius: 3px;
    }
`;
document.head.appendChild(style);

// ===================
// 本地儲存功能
// ===================

// 儲存遊戲進度
function saveGameProgress() {
    try {
        const gameData = {
            playerData: PLAYER_DATA,
            wordsData: wordsData,
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem('japaneseWordGame', JSON.stringify(gameData));
        console.log('遊戲進度已儲存');
    } catch (error) {
        console.error('儲存遊戲進度失敗:', error);
    }
}

// 載入遊戲進度
function loadGameProgress() {
    try {
        const savedData = localStorage.getItem('japaneseWordGame');
        if (savedData) {
            const gameData = JSON.parse(savedData);
            
            // 載入玩家資料
            Object.assign(PLAYER_DATA, gameData.playerData);
            
            // 載入單字資料
            if (gameData.wordsData && gameData.wordsData.length > 0) {
                wordsData = gameData.wordsData;
                console.log('載入已儲存的遊戲進度');
                return true;
            }
        }
    } catch (error) {
        console.error('載入遊戲進度失敗:', error);
    }
    return false;
}

// 清除儲存的遊戲進度
function clearGameProgress() {
    try {
        localStorage.removeItem('japaneseWordGame');
        console.log('遊戲進度已清除');
    } catch (error) {
        console.error('清除遊戲進度失敗:', error);
    }
}

// ===================
// 商店功能
// ===================

// 更新商店顯示
function updateShopDisplay() {
    if (typeof PLAYER_DATA === 'undefined') {
        console.error('PLAYER_DATA 未載入');
        return;
    }
    
    // 更新玩家狀態顯示
    document.getElementById('player-points').textContent = PLAYER_DATA.points;
    document.getElementById('player-health').textContent = `${PLAYER_DATA.health}/${PLAYER_DATA.maxHealth}`;
    document.getElementById('player-defense').textContent = `${PLAYER_DATA.defense}/${PLAYER_DATA.maxDefense}`;
    document.getElementById('player-attack').textContent = `${PLAYER_DATA.attack}/${PLAYER_DATA.maxAttack}`;
    document.getElementById('player-free-unlocks').textContent = PLAYER_DATA.freeUnlocks;
    
    // 更新可解鎖單字數量
    updateUnlockableCount();
    
    // 更新按鈕狀態
    updateShopButtons();
}

// 更新可解鎖單字數量
function updateUnlockableCount() {
    const unlockableWords = wordsData.filter(word => word.priority === 0);
    document.getElementById('unlockable-count').textContent = unlockableWords.length;
}

// 更新商店按鈕狀態
function updateShopButtons() {
    const upgradeButtons = document.querySelectorAll('.upgrade-btn');
    const unlockButton = document.querySelector('.unlock-btn');
    const freeUnlockButton = document.querySelector('.free-unlock-btn');
    
    // 升級按鈕狀態
    upgradeButtons.forEach(btn => {
        const isAffordable = PLAYER_DATA.points >= SHOP_PRICES.upgrade;
        btn.disabled = !isAffordable;
    });
    
    // 檢查是否已達到上限
    const healthUpgrade = upgradeButtons[0];
    const defenseUpgrade = upgradeButtons[1];
    const attackUpgrade = upgradeButtons[2];
    
    if (PLAYER_DATA.health >= PLAYER_DATA.maxHealth) {
        healthUpgrade.disabled = true;
        healthUpgrade.textContent = '已滿級';
    } else {
        healthUpgrade.textContent = '10點';
    }
    if (PLAYER_DATA.defense >= PLAYER_DATA.maxDefense) {
        defenseUpgrade.disabled = true;
        defenseUpgrade.textContent = '已滿級';
    } else {
        defenseUpgrade.textContent = '10點';
    }
    if (PLAYER_DATA.attack >= PLAYER_DATA.maxAttack) {
        attackUpgrade.disabled = true;
        attackUpgrade.textContent = '已滿級';
    } else {
        attackUpgrade.textContent = '10點';
    }
    
    // 解鎖按鈕狀態
    const canAffordUnlock = PLAYER_DATA.points >= SHOP_PRICES.unlock;
    const hasUnlockableWords = wordsData.filter(word => word.priority === 0).length > 0;
    unlockButton.disabled = !canAffordUnlock || !hasUnlockableWords;
    
    if (!hasUnlockableWords) {
        unlockButton.textContent = '無可解鎖';
    } else {
        unlockButton.textContent = '20點';
    }
    
    // 免費解鎖按鈕狀態
    const canFreeUnlock = PLAYER_DATA.freeUnlocks > 0;
    freeUnlockButton.disabled = !canFreeUnlock || !hasUnlockableWords;
    
    if (!hasUnlockableWords) {
        freeUnlockButton.textContent = '無可解鎖';
    } else if (!canFreeUnlock) {
        freeUnlockButton.textContent = '無免費次數';
    } else {
        freeUnlockButton.textContent = '免費解鎖';
    }
}

// 顯示商店訊息
function showShopMessage(message, type = 'info') {
    const messageElement = document.getElementById('shop-message');
    messageElement.textContent = message;
    messageElement.className = `shop-message ${type}`;
    
    // 3秒後清除訊息
    setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = 'shop-message';
    }, 3000);
}

// 還原遊戲
function resetGame() {
    if (confirm('確定要重置遊戲嗎？這將清除所有進度！')) {
        // 清除儲存的進度
        clearGameProgress();
        
        // 重新載入原始資料並重置所有單字的priority為0
        wordsData = WORDS_DATA.map(word => ({
            ...word,
            priority: 0  // 確保所有單字的priority都重置為0
        }));
        
        // 重置玩家資料
        Object.assign(PLAYER_DATA, INITIAL_PLAYER_DATA);
        
        // 隨機選取20個單字設為priority 1
        const availableWords = [...wordsData];
        shuffleArray(availableWords);
        for (let i = 0; i < Math.min(20, availableWords.length); i++) {
            availableWords[i].priority = 1;
        }
        
        // 重新設定複習模式
        setupReviewMode();
        updateMainPageStatus();
        
        // 儲存重置後的初始狀態
        saveGameProgress();
        
        // 更新商店顯示
        updateShopDisplay();
        
        // 更新貪食蛇遊戲顯示
        updateSnakeGameDisplay();
        
        showShopMessage('遊戲已重置！隨機選取了20個單字開始新遊戲，並獲得1次免費解鎖機會', 'success');
        
        console.log('遊戲已重置');
    }
}

// 升級生命值
function upgradeHealth() {
    if (PLAYER_DATA.points < SHOP_PRICES.upgrade) {
        showShopMessage('點數不足無法升級', 'error');
        return;
    }
    
    if (PLAYER_DATA.health >= PLAYER_DATA.maxHealth) {
        showShopMessage('生命值已達到上限', 'error');
        return;
    }
    
    PLAYER_DATA.points -= SHOP_PRICES.upgrade;
    PLAYER_DATA.health += 1;
    
    saveGameProgress(); // 自動保存進度
    updateShopDisplay();
    showShopMessage('生命值升級成功！+1 生命值', 'success');
}

// 升級防禦值
function upgradeDefense() {
    if (PLAYER_DATA.points < SHOP_PRICES.upgrade) {
        showShopMessage('點數不足無法升級', 'error');
        return;
    }
    
    if (PLAYER_DATA.defense >= PLAYER_DATA.maxDefense) {
        showShopMessage('防禦值已達到上限', 'error');
        return;
    }
    
    PLAYER_DATA.points -= SHOP_PRICES.upgrade;
    PLAYER_DATA.defense += 1;
    
    saveGameProgress(); // 自動保存進度
    updateShopDisplay();
    showShopMessage('防禦值升級成功！+1 防禦值', 'success');
}

// 升級攻擊力
function upgradeAttack() {
    if (PLAYER_DATA.points < SHOP_PRICES.upgrade) {
        showShopMessage('點數不足無法升級', 'error');
        return;
    }
    
    if (PLAYER_DATA.attack >= PLAYER_DATA.maxAttack) {
        showShopMessage('攻擊力已達到上限', 'error');
        return;
    }
    
    PLAYER_DATA.points -= SHOP_PRICES.upgrade;
    PLAYER_DATA.attack += 1;
    
    saveGameProgress(); // 自動保存進度
    updateShopDisplay();
    showShopMessage('攻擊力升級成功！+1 攻擊力', 'success');
}

// 解鎖單字（一次解鎖10個）
function unlockWord() {
    if (PLAYER_DATA.points < SHOP_PRICES.unlock) {
        showShopMessage('點數不足無法解鎖', 'error');
        return;
    }
    
    // 找到所有priority為0的單字
    const unlockableWords = wordsData.filter(word => word.priority === 0);
    
    if (unlockableWords.length === 0) {
        showShopMessage('沒有可解鎖的單字', 'error');
        return;
    }
    
    // 決定要解鎖的單字數量（最多10個，但不超過可解鎖的總數）
    const unlockCount = Math.min(10, unlockableWords.length);
    
    // 隨機選擇要解鎖的單字
    shuffleArray(unlockableWords);
    const wordsToUnlock = unlockableWords.slice(0, unlockCount);
    
    PLAYER_DATA.points -= SHOP_PRICES.unlock;
    
    // 解鎖選中的單字
    wordsToUnlock.forEach(word => {
        word.priority = 1;
    });
    
    // 重新設定複習模式以包含新解鎖的單字
    setupReviewMode();
    updateMainPageStatus();
    
    saveGameProgress(); // 自動保存進度
    updateShopDisplay();
    
    // 顯示解鎖訊息
    if (unlockCount === 1) {
        showShopMessage(`成功解鎖單字：${wordsToUnlock[0].word} (${wordsToUnlock[0].meaning})`, 'success');
    } else {
        const firstWord = wordsToUnlock[0];
        showShopMessage(`成功解鎖 ${unlockCount} 個單字！包含：${firstWord.word} (${firstWord.meaning}) 等`, 'success');
    }
}

// 免費解鎖單字
function freeUnlockWord() {
    if (PLAYER_DATA.freeUnlocks <= 0) {
        showShopMessage('沒有免費解鎖次數', 'error');
        return;
    }
    
    // 找到所有priority為0的單字
    const unlockableWords = wordsData.filter(word => word.priority === 0);
    
    if (unlockableWords.length === 0) {
        showShopMessage('沒有可解鎖的單字', 'error');
        return;
    }
    
    // 決定要解鎖的單字數量（最多10個，但不超過可解鎖的總數）
    const unlockCount = Math.min(10, unlockableWords.length);
    
    // 隨機選擇要解鎖的單字
    shuffleArray(unlockableWords);
    const wordsToUnlock = unlockableWords.slice(0, unlockCount);
    
    PLAYER_DATA.freeUnlocks -= 1; // 消耗一次免費解鎖
    
    // 解鎖選中的單字
    wordsToUnlock.forEach(word => {
        word.priority = 1;
    });
    
    // 重新設定複習模式以包含新解鎖的單字
    setupReviewMode();
    updateMainPageStatus();
    
    saveGameProgress(); // 自動保存進度
    updateShopDisplay();
    
    // 顯示解鎖訊息
    if (unlockCount === 1) {
        showShopMessage(`免費解鎖成功！解鎖單字：${wordsToUnlock[0].word} (${wordsToUnlock[0].meaning})`, 'success');
    } else {
        const firstWord = wordsToUnlock[0];
        showShopMessage(`免費解鎖成功！解鎖了 ${unlockCount} 個單字，包含：${firstWord.word} (${firstWord.meaning}) 等`, 'success');
    }
}

// 給玩家添加點數的函數（用於測試或獎勵機制）
function addPoints(amount) {
    PLAYER_DATA.points += amount;
    saveGameProgress(); // 自動保存進度
    updateShopDisplay();
    console.log(`獲得 ${amount} 點數！當前點數：${PLAYER_DATA.points}`);
}

// 測試用：添加一些點數
// 你可以在瀏覽器控制台中執行 addPoints(50) 來測試商店功能
console.log('商店功能已載入！使用 addPoints(數量) 來添加測試點數');

// 調試功能：查看當前遊戲狀態
function debugGameState() {
    console.log('=== 遊戲狀態 ===');
    console.log('玩家資料:', PLAYER_DATA);
    console.log('可複習單字數量:', reviewWords.length);
    console.log('可解鎖單字數量:', wordsData.filter(w => w.priority === 0).length);
    console.log('總單字數量:', wordsData.length);
    
    // 檢查priority分佈
    const priorityDistribution = {};
    wordsData.forEach(word => {
        priorityDistribution[word.priority] = (priorityDistribution[word.priority] || 0) + 1;
    });
    console.log('Priority分佈:', priorityDistribution);
}

// 調試功能：清除儲存的進度
function debugClearProgress() {
    clearGameProgress();
    console.log('已清除儲存的進度，重新載入頁面以重置遊戲');
}

console.log('調試功能已載入：debugGameState() 和 debugClearProgress()');

// ===================
// Boss戰鬥功能
// ===================

// Boss戰鬥狀態變數
let bossGameState = {
    isActive: false,
    round: 0,
    maxRounds: 20,
    score: 0,
    currentHealth: 0,
    timeRemaining: 0,
    timer: null,
    currentQuestion: null,
    questionQueue: [],
    correctAnswer: -1,
    isAnswered: false,
    wordPriorityUpdates: new Map(), // 記錄單字優先度的更新
    wordQuiz: null, // WordQuiz實例
    wrongAnswers: [] // 記錄答錯的題目
};

// 測驗模式枚舉
const QUIZ_MODES = {
    SENTENCE_TO_MEANING: 1,    // 給例句選意思
    MEANING_TO_SENTENCE: 2,    // 給意思選例句
    FILL_IN_BLANK: 3          // 填空題
};

// 優先隊列類
class PriorityQueue {
    constructor() {
        this.items = [];
    }
    
    enqueue(item, priority) {
        const queueElement = { item, priority };
        let added = false;
        
        for (let i = 0; i < this.items.length; i++) {
            if (queueElement.priority < this.items[i].priority) {
                this.items.splice(i, 0, queueElement);
                added = true;
                break;
            }
        }
        
        if (!added) {
            this.items.push(queueElement);
        }
    }
    
    dequeue() {
        return this.items.shift();
    }
    
    isEmpty() {
        return this.items.length === 0;
    }
    
    size() {
        return this.items.length;
    }
}

// 初始化Boss戰鬥頁面
function initializeBossPage() {
    if (typeof PLAYER_DATA === 'undefined') {
        console.error('PLAYER_DATA 未載入');
        return;
    }
    
    // 更新狀態顯示
    updateBossStatusDisplay();
    
    // 顯示開始畫面
    showBossStartScreen();
}

// 顯示Boss戰鬥開始畫面
function showBossStartScreen() {
    document.getElementById('boss-start-screen').style.display = 'block';
    document.getElementById('boss-game-screen').style.display = 'none';
    document.getElementById('boss-end-screen').style.display = 'none';
    
    // 重置戰鬥狀態
    bossGameState.isActive = false;
    bossGameState.round = 0;
    bossGameState.score = 0;
    bossGameState.currentHealth = PLAYER_DATA.health;
    bossGameState.wordPriorityUpdates.clear();
    
    // 啟用返回按鈕
    document.getElementById('boss-back-btn').disabled = false;
    
    updateBossStatusDisplay();
}

// 開始Boss戰鬥
function startBossBattle() {
    if (reviewWords.length === 0) {
        alert('沒有可複習的單字，請先前往商店解鎖新單字！');
        return;
    }
    
    // 初始化WordQuiz
    bossGameState.wordQuiz = new WordQuiz(wordsData);
    bossGameState.wrongAnswers = [];
    
    // 初始化戰鬥狀態
    bossGameState.isActive = true;
    bossGameState.round = 1;
    bossGameState.score = 0;
    bossGameState.currentHealth = PLAYER_DATA.health;
    bossGameState.timeRemaining = PLAYER_DATA.attack;
    bossGameState.wordPriorityUpdates.clear();
    
    // 禁用返回按鈕
    document.getElementById('boss-back-btn').disabled = true;
    
    // 建立優先隊列
    buildQuestionQueue();
    
    // 切換到遊戲畫面
    document.getElementById('boss-start-screen').style.display = 'none';
    document.getElementById('boss-game-screen').style.display = 'block';
    document.getElementById('boss-end-screen').style.display = 'none';
    
    // 開始第一回合
    startNextRound();
}

// 建立題目隊列
function buildQuestionQueue() {
    const priorityQueue = new PriorityQueue();
    
    // 將可複習的單字按優先度排入隊列
    reviewWords.forEach(word => {
        priorityQueue.enqueue(word, word.priority);
    });
    
    // 從優先隊列中取出單字，同優先度內隨機排序
    bossGameState.questionQueue = [];
    const priorityGroups = {};
    
    // 按優先度分組
    while (!priorityQueue.isEmpty()) {
        const item = priorityQueue.dequeue();
        const priority = item.priority;
        if (!priorityGroups[priority]) {
            priorityGroups[priority] = [];
        }
        priorityGroups[priority].push(item.item);
    }
    
    // 每組內隨機排序後加入隊列
    const sortedPriorities = Object.keys(priorityGroups).map(Number).sort((a, b) => a - b);
    sortedPriorities.forEach(priority => {
        const group = priorityGroups[priority];
        shuffleArray(group);
        bossGameState.questionQueue.push(...group);
    });
    
    console.log('Boss戰鬥題目隊列已建立:', bossGameState.questionQueue.length, '個題目');
}

// 開始下一回合
function startNextRound() {
    if (bossGameState.round > bossGameState.maxRounds) {
        endBossBattle(true); // 勝利
        return;
    }
    
    if (bossGameState.currentHealth <= 0) {
        endBossBattle(false); // 失敗
        return;
    }
    
    // 生成題目
    generateQuestion();
    
    // 重置計時器
    bossGameState.timeRemaining = PLAYER_DATA.attack;
    bossGameState.isAnswered = false;
    
    // 開始倒數計時
    startTimer();
    
    // 更新狀態顯示
    updateBossStatusDisplay();
}

// 生成題目
function generateQuestion() {
    if (!bossGameState.wordQuiz) {
        console.error('WordQuiz未初始化');
        return;
    }
    
    // 隨機選擇測驗模式
    const availableModes = [1, 3]; // SENTENCE_TO_MEANING 和 FILL_IN_BLANK
    const selectedMode = availableModes[Math.floor(Math.random() * availableModes.length)];
    
    let questionData = null;
    if (selectedMode === 1) {
        questionData = bossGameState.wordQuiz.test1();
    } else if (selectedMode === 3) {
        questionData = bossGameState.wordQuiz.test2();
    }
    
    if (!questionData) {
        console.error('無法生成題目');
        return;
    }
    
    bossGameState.currentQuestion = questionData;
    bossGameState.correctAnswer = questionData.correctIndex;
    
    // 顯示題目
    displayQuestionFromWordQuiz(questionData);
}

// 顯示WordQuiz生成的題目
function displayQuestionFromWordQuiz(questionData) {
    const questionType = document.getElementById('question-type');
    const questionTitle = document.getElementById('question-title');
    const questionText = document.getElementById('question-text');
    const answerOptions = document.getElementById('answer-options');
    
    if (questionData.mode === 'meaning') {
        questionType.textContent = '題型：例句選意思';
        questionTitle.textContent = '請選擇例句的正確中文意思：';
        questionText.innerHTML = questionData.question.replace(/<([^<]*)</g, '<span class="highlight-word">$1</span>');
    } else if (questionData.mode === 'sentence') {
        questionType.textContent = '題型：填空題';
        questionTitle.textContent = '請選擇正確的單字填入空格：';
        questionText.textContent = questionData.question;
    }
    
    // 生成答案選項
    answerOptions.innerHTML = '';
    questionData.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'answer-btn';
        button.textContent = option;
        button.onclick = () => selectAnswer(index);
        answerOptions.appendChild(button);
    });
}

// 生成「給例句選意思」題目
function generateSentenceToMeaningQuestion(word) {
    document.getElementById('question-type').textContent = '題型：例句選意思';
    document.getElementById('question-title').textContent = '請選擇例句的正確中文意思：';
    
    // 顯示例句（移除<>符號）
    const sentence = word.sentence.replace(/<[^>]*>/g, '');
    document.getElementById('question-text').textContent = sentence;
    
    // 生成選項（正確答案是意思）
    const options = generateOptions(word, 'meaning');
    displayAnswerOptions(options.options, options.correctIndex);
}

// 生成「給意思選例句」題目
function generateMeaningToSentenceQuestion(word) {
    document.getElementById('question-type').textContent = '題型：意思選例句';
    document.getElementById('question-title').textContent = '請選擇正確的例句：';
    
    // 顯示意思
    document.getElementById('question-text').textContent = word.meaning;
    
    // 生成選項（正確答案是例句）
    const options = generateOptions(word, 'sentence');
    displayAnswerOptions(options.options, options.correctIndex);
}

// 生成「填空題」
function generateFillInBlankQuestion(word) {
    if (!word.sentence.includes('<') || !word.sentence.includes('>')) {
        // 如果沒有<>標記，降級為例句選意思
        generateSentenceToMeaningQuestion(word);
        return;
    }
    
    document.getElementById('question-type').textContent = '題型：填空題';
    document.getElementById('question-title').textContent = '請選擇正確的單字填入空格：';
    
    // 將<單字>替換為空格
    const sentenceWithBlanks = word.sentence.replace(/<[^>]*>/g, '______');
    document.getElementById('question-text').textContent = sentenceWithBlanks;
    
    // 正確答案是被<>包圍的單字（去除<>符號）
    const correctWord = word.sentence.match(/<([^>]+)>/)[1];
    
    // 生成選項（包含正確單字和其他隨機單字）
    const options = generateFillInBlankOptions(correctWord);
    displayAnswerOptions(options.options, options.correctIndex);
}

// 生成選項
function generateOptions(correctWord, type) {
    const options = [];
    let correctValue;
    
    // 取得正確答案
    if (type === 'meaning') {
        correctValue = correctWord.meaning;
    } else if (type === 'sentence') {
        correctValue = correctWord.sentence.replace(/<[^>]*>/g, '');
    }
    
    // 隨機放置正確答案
    const correctIndex = Math.floor(Math.random() * 4);
    
    // 生成錯誤選項
    const wrongOptions = [];
    const allWords = [...wordsData]; // 包含所有單字（包括未解鎖的）
    shuffleArray(allWords);
    
    for (const word of allWords) {
        if (word.word_id !== correctWord.word_id && wrongOptions.length < 3) {
            let wrongValue;
            if (type === 'meaning') {
                wrongValue = word.meaning;
            } else if (type === 'sentence') {
                wrongValue = word.sentence.replace(/<[^>]*>/g, '');
            }
            
            // 避免重複和相同答案
            if (wrongValue !== correctValue && !wrongOptions.includes(wrongValue)) {
                wrongOptions.push(wrongValue);
            }
        }
    }
    
    // 組合選項
    for (let i = 0; i < 4; i++) {
        if (i === correctIndex) {
            options.push(correctValue);
        } else {
            const wrongIndex = Math.min(i < correctIndex ? i : i - 1, wrongOptions.length - 1);
            options.push(wrongOptions[wrongIndex] || '選項不足');
        }

    }
    
    return { options, correctIndex };
}

// 生成填空題選項
function generateFillInBlankOptions(correctWord) {
    const options = [];
    const correctIndex = Math.floor(Math.random() * 4);
    
    // 生成錯誤選項（其他單字的拼音）
    const wrongOptions = [];
    const allWords = [...wordsData];
    shuffleArray(allWords);
    
    for (const word of allWords) {
        if (wrongOptions.length < 3) {
            // 提取單字部分（可能包含在例句中的單字）
            let wordToAdd = word.word;
            if (word.sentence.includes('<') && word.sentence.includes('>')) {
                const match = word.sentence.match(/<([^>]+)>/);
                if (match) {
                    wordToAdd = match[1];
                }
            }
            
            if (wordToAdd !== correctWord && !wrongOptions.includes(wordToAdd)) {
                wrongOptions.push(wordToAdd);
            }
        }
    }
    
    // 組合選項
    for (let i = 0; i < 4; i++) {
        if (i === correctIndex) {
            options.push(correctWord);
        } else {
            const wrongIndex = Math.min(i < correctIndex ? i : i - 1, wrongOptions.length - 1);
            options.push(wrongOptions[wrongIndex] || '選項不足');
        }
    }
    
    return { options, correctIndex };
}

// 顯示答案選項
function displayAnswerOptions(options, correctIndex) {
    const answerButtons = document.querySelectorAll('.answer-btn');
    bossGameState.correctAnswer = correctIndex;
    
    answerButtons.forEach((btn, index) => {
        btn.textContent = options[index];
        btn.disabled = false;
        btn.className = 'answer-btn'; // 重置樣式
    });
}

// 開始計時器
function startTimer() {
    if (bossGameState.timer) {
        clearInterval(bossGameState.timer);
    }
    
    bossGameState.timer = setInterval(() => {
        bossGameState.timeRemaining--;
        updateBossStatusDisplay();
        
        if (bossGameState.timeRemaining <= 0) {
            clearInterval(bossGameState.timer);
            if (!bossGameState.isAnswered) {
                handleTimeOut();
            }
        }
    }, 1000);
}

// 處理超時（此函數已被下方的增強版本替換）

// 選擇答案（此函數已被下方的增強版本替換）

// 顯示正確答案
function showCorrectAnswer() {
    const answerButtons = document.querySelectorAll('.answer-btn');
    answerButtons.forEach(btn => btn.disabled = true);
    answerButtons[bossGameState.correctAnswer].classList.add('correct');
}

// 更新單字優先度
function updateWordPriority(word, isCorrect) {
    if (isCorrect) {
        // 答對：priority += 1
        const newPriority = (bossGameState.wordPriorityUpdates.get(word.word_id) || word.priority) + 1;
        bossGameState.wordPriorityUpdates.set(word.word_id, newPriority);
    } else {
        // 答錯或超時：priority = 1
        bossGameState.wordPriorityUpdates.set(word.word_id, 1);
    }
}

// 更新Boss狀態顯示
function updateBossStatusDisplay() {
    document.getElementById('boss-timer').textContent = bossGameState.timeRemaining;
    document.getElementById('boss-health').textContent = bossGameState.currentHealth;
    document.getElementById('boss-round').textContent = `${bossGameState.round}/${bossGameState.maxRounds}`;
    document.getElementById('boss-score').textContent = bossGameState.score;
}

// 結束Boss戰鬥
function endBossBattle(isVictory) {
    bossGameState.isActive = false;
    clearInterval(bossGameState.timer);
    
    // 使用WordQuiz.finish()保存結果
    if (bossGameState.wordQuiz) {
        bossGameState.wordQuiz.finish();
    }
    
    // 切換到結束畫面
    document.getElementById('boss-game-screen').style.display = 'none';
    document.getElementById('boss-end-screen').style.display = 'block';
    
    // 啟用返回按鈕
    document.getElementById('boss-back-btn').disabled = false;
    
    // 顯示結果
    showBattleResult(isVictory);
}

// 顯示戰鬥結果
function showBattleResult(isVictory) {
    const endResult = document.getElementById('end-result');
    
    if (isVictory) {
        // 勝利 - 確保至少獲得2點
        const finalScore = Math.max(2, bossGameState.score);
        PLAYER_DATA.points += finalScore;
        saveGameProgress();
        
        endResult.innerHTML = `
            <div class="victory-screen">
                <h2>🎉 挑戰成功！ 🎉</h2>
                <div class="victory-message">
                    <p>🏆 恭喜您戰勝了Boss！</p>
                    <p>⚔️ 完成了 ${bossGameState.maxRounds} 回合的激烈戰鬥</p>
                    <p>❤️ 剩餘生命值：${bossGameState.currentHealth}</p>
                </div>
                <div class="final-score">
                    💰 獲得點數：${finalScore}
                </div>
                <p>🎁 點數已自動加入您的帳戶</p>
                ${bossGameState.wrongAnswers.length > 0 ? 
                    `<button onclick="showWrongAnswersReview()" class="review-btn">📝 檢視答錯題目 (${bossGameState.wrongAnswers.length}題)</button>` : 
                    '<p>🎯 完美答題！沒有錯誤</p>'
                }
            </div>
        `;
        
        // 更新商店顯示（如果在商店頁面）
        updateShopDisplay();
        
    } else {
        // 失敗
        endResult.innerHTML = `
            <div class="defeat-screen">
                <h2>💀 挑戰失敗 💀</h2>
                <div class="defeat-message">
                    <p>😵 您的生命值歸零了...</p>
                    <p>⚔️ 在第 ${bossGameState.round} 回合倒下</p>
                    <p>💔 Boss太強大了，需要更多練習</p>
                </div>
                <div class="final-score">
                    💸 得分歸零：0
                </div>
                <p>💪 加油！提升實力再來挑戰吧！</p>
                ${bossGameState.wrongAnswers.length > 0 ? 
                    `<button onclick="showWrongAnswersReview()" class="review-btn">📝 檢視答錯題目 (${bossGameState.wrongAnswers.length}題)</button>` : 
                    ''
                }
            </div>
        `;
    }
}

// 應用單字優先度更新
function applyWordPriorityUpdates() {
    bossGameState.wordPriorityUpdates.forEach((newPriority, wordId) => {
        // 使用 word_id 找到對應的單字並更新優先度
        for (let word of wordsData) {
            if (word.word_id === wordId) {
                const oldPriority = word.priority;
                word.priority = newPriority;
                console.log(`更新單字 ${word.word} (ID: ${wordId}, ${word.spelling}) 優先度: ${oldPriority} → ${newPriority}`);
                break; // 找到唯一匹配後立即中斷，避免繼續搜尋
            }
        }
    });
    
    // 重新設定複習模式
    setupReviewMode();
    updateMainPageStatus();
    
    // 儲存遊戲進度
    saveGameProgress();
    
    console.log(`Boss戰鬥結束，共更新了 ${bossGameState.wordPriorityUpdates.size} 個單字的優先度`);
}

// 返回主頁面（帶有戰鬥狀態檢查）
function returnToMain() {
    if (bossGameState.isActive) {
        if (confirm('戰鬥進行中，確定要返回主頁面嗎？這將結束當前戰鬥。')) {
            bossGameState.isActive = false;
            clearInterval(bossGameState.timer);
            showPage('main-page');
        }
    } else {
        showPage('main-page');
    }
}

// 修改原有的showPage函數以支援Boss頁面初始化
const originalShowPage = showPage;
showPage = function(pageId) {
    originalShowPage(pageId);
    
    if (pageId === 'boss-page') {
        initializeBossPage();
    }
};

// ===================
// Boss戰鬥特效功能
// ===================

// 顯示傷害特效（火柱和流血） - 原始版本，將被增強版本替換

// 顯示得分特效（金幣和得分顯示）
function showScoreEffect(score) {
    const effectsContainer = document.getElementById('boss-effects');
    
    // 創建金幣特效
    const coinEffect = document.createElement('div');
    coinEffect.className = 'coin-effect';
    coinEffect.textContent = '💰';
    effectsContainer.appendChild(coinEffect);
    
    // 創建得分顯示特效
    const scorePopup = document.createElement('div');
    scorePopup.className = 'score-popup';
    scorePopup.textContent = `+${score} 分`;
    effectsContainer.appendChild(scorePopup);
    
    // 0.5秒後移除特效
    setTimeout(() => {
        if (coinEffect.parentNode) {
            effectsContainer.removeChild(coinEffect);
        }
        if (scorePopup.parentNode) {
            effectsContainer.removeChild(scorePopup);
        }
    }, 500);
}

// 播放成功音效（金幣聲音）
function playSuccessSound() {
    try {
        // 使用Web Audio API創建金幣音效
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 創建音頻序列
            const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
            const noteDuration = 0.1; // 每個音符0.1秒
            
            notes.forEach((frequency, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + noteDuration);
                
                const startTime = audioContext.currentTime + (index * noteDuration);
                oscillator.start(startTime);
                oscillator.stop(startTime + noteDuration);
            });
        } else {
            // 降級：使用頻率生成器模擬音效
            console.log('🔊 金幣音效播放（瀏覽器不支援Web Audio API）');
        }
    } catch (error) {
        console.log('🔊 金幣音效播放（音效生成失敗）');
    }
}

// 播放錯誤音效（低沉的嗡嗡聲）
function playErrorSound() {
    try {
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 創建低沉的錯誤音效
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(150, audioContext.currentTime); // 低頻
            oscillator.type = 'sawtooth'; // 鋸齒波形，聽起來更粗糙
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } else {
            console.log('🔊 錯誤音效播放（瀏覽器不支援Web Audio API）');
        }
    } catch (error) {
        console.log('🔊 錯誤音效播放（音效生成失敗）');
    }
}

// 增強版傷害特效（包含音效）
function showDamageEffect() {
    const effectsContainer = document.getElementById('boss-effects');
    
    // 創建火柱特效
    const fireEffect = document.createElement('div');
    fireEffect.className = 'fire-effect';
    effectsContainer.appendChild(fireEffect);
    
    // 創建流血特效
    const bloodEffect = document.createElement('div');
    bloodEffect.className = 'blood-effect';
    effectsContainer.appendChild(bloodEffect);
    
    // 播放錯誤音效
    playErrorSound();
    
    // 0.5秒後移除特效
    setTimeout(() => {
        if (fireEffect.parentNode) {
            effectsContainer.removeChild(fireEffect);
        }
        if (bloodEffect.parentNode) {
            effectsContainer.removeChild(bloodEffect);
        }
    }, 500);
}

// 創建浮動傷害數字特效
function showFloatingDamage(damage) {
    const effectsContainer = document.getElementById('boss-effects');
    
    const damageText = document.createElement('div');
    damageText.className = 'floating-damage';
    damageText.textContent = `-${damage}`;
    damageText.style.cssText = `
        position: absolute;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #e53e3e;
        font-size: 2rem;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        animation: floatUp 1s ease-out forwards;
        pointer-events: none;
        z-index: 10000;
    `;
    
    // 添加CSS動畫
    const style = document.createElement('style');
    style.textContent = `
        @keyframes floatUp {
            0% {
                transform: translate(-50%, -50%) scale(0.5);
                opacity: 0;
            }
            50% {
                transform: translate(-50%, -80%) scale(1.2);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -120%) scale(1);
                opacity: 0;
            }
        }
    `;
    
    if (!document.head.querySelector('style[data-floating-damage]')) {
        style.setAttribute('data-floating-damage', 'true');
        document.head.appendChild(style);
    }
    
    effectsContainer.appendChild(damageText);
    
    // 1秒後移除
    setTimeout(() => {
        if (damageText.parentNode) {
            effectsContainer.removeChild(damageText);
        }
    }, 1000);
}

// 修改後的handleTimeOut函數（替換原本的版本）
function handleTimeOut() {
    bossGameState.isAnswered = true;
    
    // 扣生命值
    bossGameState.currentHealth -= 1;
    
    // 記錄超時為答錯
    if (bossGameState.currentQuestion) {
        recordWrongAnswer(bossGameState.currentQuestion, -1, bossGameState.correctAnswer);
    }
    
    // 使用WordQuiz更新單字優先度
    if (bossGameState.wordQuiz && bossGameState.currentQuestion) {
        bossGameState.wordQuiz.answerQuestion(bossGameState.currentQuestion.wordData, false);
    }
    
    // 顯示正確答案
    showCorrectAnswer();
    
    // 播放錯誤特效和浮動傷害
    showDamageEffect();
    showFloatingDamage(2);
    
    // 延遲進入下一回合
    setTimeout(() => {
        bossGameState.round++;
        startNextRound();
    }, 1500);
}

// 重新定義selectAnswer以包含特效
function selectAnswer(answerIndex) {
    if (bossGameState.isAnswered || !bossGameState.isActive) {
        return;
    }
    
    bossGameState.isAnswered = true;
    clearInterval(bossGameState.timer);
    
    const answerButtons = document.querySelectorAll('.answer-btn');
    const isCorrect = answerIndex === bossGameState.correctAnswer;
    
    // 禁用所有按鈕
    answerButtons.forEach(btn => btn.disabled = true);
    
    if (isCorrect) {
        // 答對
        answerButtons[answerIndex].classList.add('correct');
        
        // 計算得分
        const score = Math.max(0, Math.floor(bossGameState.timeRemaining + PLAYER_DATA.defense - 13));
        bossGameState.score += score;
        
        // 使用WordQuiz更新單字優先度
        if (bossGameState.wordQuiz && bossGameState.currentQuestion) {
            bossGameState.wordQuiz.answerQuestion(bossGameState.currentQuestion.wordData, true);
        }
        
        // 顯示得分特效
        showScoreEffect(score);
        
    } else {
        // 答錯
        answerButtons[answerIndex].classList.add('wrong');
        answerButtons[bossGameState.correctAnswer].classList.add('correct');
        
        // 扣生命值
        bossGameState.currentHealth -= 2;
        
        // 記錄答錯的題目
        if (bossGameState.currentQuestion) {
            recordWrongAnswer(bossGameState.currentQuestion, answerIndex, bossGameState.correctAnswer);
        }
        
        // 使用WordQuiz更新單字優先度
        if (bossGameState.wordQuiz && bossGameState.currentQuestion) {
            bossGameState.wordQuiz.answerQuestion(bossGameState.currentQuestion.wordData, false);
        }
        
        // 播放錯誤特效和浮動傷害
        showDamageEffect();
        showFloatingDamage(2);
    }
    
    updateBossStatusDisplay();
    
    // 延遲進入下一回合
    setTimeout(() => {
        bossGameState.round++;
        startNextRound();
    }, 1500);
}

// ===================
// WordQuiz類別和相關功能
// ===================

// MinHeap優先隊列類
class MinHeapPQ {
    constructor() {
        this.heap = []; 
    }
    
    parent(i) { 
        return Math.floor((i - 1) / 2); 
    }
    
    left(i) { 
        return 2 * i + 1; 
    }
    
    right(i) { 
        return 2 * i + 2; 
    }
    
    swap(i, j) { 
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]]; 
    }
    
    enqueue(priority, word_id) {
        this.heap.push({ priority, word_id });
        this.bubbleUp(this.heap.length - 1);
    }
    
    bubbleUp(i) {
        while (i > 0 && this.heap[i].priority < this.heap[this.parent(i)].priority) {
            this.swap(i, this.parent(i));
            i = this.parent(i);
        }
    }
    
    dequeue() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();
        const root = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.bubbleDown(0);
        return root;
    }
    
    bubbleDown(i) {
        let minIndex = i;
        const left = this.left(i);
        const right = this.right(i);
        if (left < this.heap.length && this.heap[left].priority < this.heap[minIndex].priority) 
            minIndex = left;
        if (right < this.heap.length && this.heap[right].priority < this.heap[minIndex].priority) 
            minIndex = right;
        if (i !== minIndex) { 
            this.swap(i, minIndex); 
            this.bubbleDown(minIndex); 
        }
    }
    
    isEmpty() {
        return this.heap.length === 0; 
    }
}

// WordQuiz類別
class WordQuiz {
    constructor(wordsData) {
        this.words_data = wordsData;
        this.pq = this.initPQ();
        this.wordPriorityUpdates = new Map();
    }

    initPQ() {
        const pq = new MinHeapPQ();
        for (const item of this.words_data) {
            if (item.priority > 0 && item.word_id) {
                pq.enqueue(item.priority + Math.random(), item.word_id);
            }
        }
        return pq;
    }

    test1() {
        return this._runTest("meaning");
    }

    test2() {
        return this._runTest("sentence");
    }

    _runTest(mode) {
        if (this.pq.isEmpty()) {
            console.log("PQ is empty!");
            return null;
        }

        const dequeued = this.pq.dequeue();
        if (!dequeued) return null;

        const { word_id } = dequeued;
        const wordData = this.words_data[word_id - 1];
        let question, correctAnswer;

        if (mode === "meaning") {
            question = wordData.sentence;
            correctAnswer = wordData.meaning;
        } else if (mode === "sentence") {
            const regex = /<(.*?)</;
            const match = wordData.sentence.match(regex);
            if (!match) {
                console.log("❌ 該句子找不到 <單字< 格式:", wordData.sentence);
                return null;
            }
            correctAnswer = match[1];
            question = wordData.sentence.replace(regex, "____");
        } else {
            throw new Error("Unknown mode");
        }

        const options = [];
        const used = new Set();
        used.add(correctAnswer);

        while (options.length < 3) {
            const r = Math.floor(Math.random() * this.words_data.length);
            const candidate = this.words_data[r];
            let candidateWord;
            if (mode === "meaning") {
                candidateWord = candidate.meaning;
            } else {
                const m = candidate.sentence.match(/<(.*?)</);
                if (!m) continue;
                candidateWord = m[1];
            }
            if (candidate.spelling !== wordData.spelling && !used.has(candidateWord)) {
                options.push(candidateWord);
                used.add(candidateWord);
            }
        }

        const correctIndex = Math.floor(Math.random() * 4);
        options.splice(correctIndex, 0, correctAnswer);

        return {
            wordData,
            question,
            options,
            correctIndex,
            mode
        };
    }

    answerQuestion(wordData, isCorrect) {
        const word_id = wordData.word_id;
        if (!word_id) return;

        let newPriority;
        
        if (isCorrect) {
            console.log("✅ 答對了！");
            newPriority = Math.floor(wordData.priority) + 1 + Math.random();
        } else {
            console.log("❌ 答錯了！");
            newPriority = 1 + Math.random();
        }

        // 立即更新wordsData中的priority
        wordData.priority = newPriority;
        this.wordPriorityUpdates.set(word_id, newPriority);
        this.pq.enqueue(newPriority, word_id);
    }

    finish() {
        while (!this.pq.isEmpty()) {
            const dequeued = this.pq.dequeue();
            if (!dequeued) break;

            const { word_id, priority } = dequeued;
            let newPriority = Math.floor(priority);
            if (newPriority > 20) newPriority = 20;
            this.words_data[word_id - 1].priority = newPriority;
        }
        
        this.wordPriorityUpdates.forEach((newPriority, wordId) => {
            let finalPriority = Math.floor(newPriority);
            if (finalPriority > 20) finalPriority = 20;
            
            for (let word of this.words_data) {
                if (word.word_id === wordId) {
                    word.priority = finalPriority;
                    console.log(`更新單字 ${word.word} (ID: ${wordId}) 優先度: ${word.priority} → ${finalPriority}`);
                    break;
                }
            }
        });
        
        console.log("✅ 所有測驗結果已儲存。");
    }
}

// start_Nwords函數
function start_Nwords(N) {
    const zeroPriorityWords = wordsData.filter(word => word.priority === 0);
    if (zeroPriorityWords.length === 0) {
        return 0;
    }
    const actualN = Math.min(N, zeroPriorityWords.length);
    shuffleArray(zeroPriorityWords);
    const chosenWords = zeroPriorityWords.slice(0, actualN);
    chosenWords.forEach(word => {
        word.priority = 1;
    });
    console.log(`✅ 更新 priority 數量: ${actualN}`);
    return actualN;
}

// 錯題回顧功能
function recordWrongAnswer(questionData, selectedAnswer, correctAnswer) {
    bossGameState.wrongAnswers.push({
        round: bossGameState.round,
        question: questionData,
        selectedAnswer: selectedAnswer,
        correctAnswer: correctAnswer,
        options: questionData.options
    });
}

function showWrongAnswersReview() {
    if (bossGameState.wrongAnswers.length === 0) {
        alert('沒有答錯的題目！');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'review-modal';
    modal.innerHTML = `
        <div class="review-content">
            <div class="review-header">
                <h2>📝 答錯題目回顧</h2>
                <span class="review-count">共 ${bossGameState.wrongAnswers.length} 題錯誤</span>
                <button class="close-review" onclick="closeWrongAnswersReview()">✕</button>
            </div>
            <div class="review-navigation">
                <button onclick="navigateWrongAnswer(-1)">⬆ 上一題</button>
                <span id="review-counter">1 / ${bossGameState.wrongAnswers.length}</span>
                <button onclick="navigateWrongAnswer(1)">⬇ 下一題</button>
            </div>
            <div id="wrong-answer-display"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    currentWrongAnswerIndex = 0;
    displayWrongAnswer(0);
}

let currentWrongAnswerIndex = 0;

function displayWrongAnswer(index) {
    const display = document.getElementById('wrong-answer-display');
    const wrongAnswer = bossGameState.wrongAnswers[index];
    
    display.innerHTML = `
        <div class="wrong-question-display">
            <div class="wrong-round-info">第 ${wrongAnswer.round} 回合</div>
            <div class="wrong-question-type">${wrongAnswer.question.mode === 'meaning' ? '例句選意思' : '填空題'}</div>
            <div class="wrong-question-text">${wrongAnswer.question.mode === 'meaning' 
                ? wrongAnswer.question.question.replace(/<([^<]*)</g, '<span class="highlight-word">$1</span>')
                : wrongAnswer.question.question}</div>
            <div class="wrong-options">
                ${wrongAnswer.options.map((option, i) => {
                    let classes = ['wrong-option'];
                    let label = '';
                    
                    if (i === wrongAnswer.selectedAnswer) {
                        classes.push('selected');
                        label = '❌ 您的選擇：';
                    } else if (wrongAnswer.selectedAnswer === -1 && i === wrongAnswer.correctAnswer) {
                        classes.push('timeout');
                        label = '⏰ 超時未答：';
                    }
                    if (i === wrongAnswer.correctAnswer) {
                        classes.push('correct');
                        if (wrongAnswer.selectedAnswer !== -1) {
                            label = '✅ 正確答案：';
                        }
                    }
                    
                    return `<div class="${classes.join(' ')}"><span class="answer-label">${label}</span>${option}</div>`;
                }).join('')}
            </div>
        </div>
    `;
    
    updateReviewNavigation(index);
}

function navigateWrongAnswer(direction) {
    const newIndex = currentWrongAnswerIndex + direction;
    if (newIndex >= 0 && newIndex < bossGameState.wrongAnswers.length) {
        currentWrongAnswerIndex = newIndex;
        displayWrongAnswer(newIndex);
    }
}

function updateReviewNavigation(index) {
    const counter = document.getElementById('review-counter');
    counter.textContent = `${index + 1} / ${bossGameState.wrongAnswers.length}`;
}

function closeWrongAnswersReview() {
    const modal = document.querySelector('.review-modal');
    if (modal) {
        modal.remove();
    }
}

// ===================
// 貪食蛇小遊戲功能
// ===================

// 貪食蛇遊戲狀態
let snakeGameState = {
    canvas: null,
    ctx: null,
    snake: [{ x: 200, y: 200 }],
    direction: { x: 0, y: 0 },
    food: { x: 0, y: 0 },
    score: 0,
    gameRunning: false,
    gamePaused: false,
    gameLoop: null,
    gridSize: 20,
    canvasSize: 400
};

// 檢查今日貪食蛇遊戲次數
function checkSnakeGameLimit() {
    const today = new Date().toDateString();
    
    // 如果是新的一天，重置計數
    if (PLAYER_DATA.lastSnakeGameDate !== today) {
        PLAYER_DATA.snakeGamesPlayed = 0;
        PLAYER_DATA.lastSnakeGameDate = today;
        saveGameProgress();
    }
    
    return PLAYER_DATA.snakeGamesPlayed < 2;
}

// 更新貪食蛇遊戲次數顯示
function updateSnakeGameDisplay() {
    const remaining = 2 - PLAYER_DATA.snakeGamesPlayed;
    const remainingElement = document.getElementById('snake-remaining');
    const remainingInfoElement = document.getElementById('snake-remaining-info');
    
    if (remainingElement) {
        remainingElement.textContent = `(剩餘: ${remaining}次)`;
    }
    
    if (remainingInfoElement) {
        remainingInfoElement.textContent = `${remaining}`;
    }
    
    // 如果沒有剩餘次數，禁用按鈕
    const snakeBtn = document.getElementById('snake-game-btn');
    if (snakeBtn) {
        snakeBtn.disabled = remaining <= 0;
        if (remaining <= 0) {
            snakeBtn.style.opacity = '0.5';
            snakeBtn.style.cursor = 'not-allowed';
        } else {
            snakeBtn.style.opacity = '1';
            snakeBtn.style.cursor = 'pointer';
        }
    }
}

// 顯示貪食蛇遊戲
function showSnakeGame() {
    if (!checkSnakeGameLimit()) {
        alert('今日貪食蛇遊戲次數已用完！明天再來吧！');
        return;
    }
    
    // 切換到貪食蛇遊戲頁面
    showPage('snake-game-page');
    
    // 初始化遊戲
    initSnakeGame();
    updateSnakeGameDisplay();
}

// 初始化貪食蛇遊戲
function initSnakeGame() {
    snakeGameState.canvas = document.getElementById('snake-canvas');
    snakeGameState.ctx = snakeGameState.canvas.getContext('2d');
    
    // 重置遊戲狀態
    snakeGameState.snake = [{ x: 200, y: 200 }];
    snakeGameState.direction = { x: 0, y: 0 };
    snakeGameState.score = 0;
    snakeGameState.gameRunning = false;
    snakeGameState.gamePaused = false;
    
    // 生成食物
    generateFood();
    
    // 更新顯示
    updateSnakeDisplay();
    
    // 繪製初始畫面
    drawSnakeGame();
}

// 開始貪食蛇遊戲
function startSnakeGame() {
    if (snakeGameState.gameRunning) return;
    
    // 檢查並消耗遊戲次數
    if (!checkSnakeGameLimit()) {
        alert('今日貪食蛇遊戲次數已用完！明天再來吧！');
        return;
    }
    
    // 消耗一次遊戲次數
    PLAYER_DATA.snakeGamesPlayed++;
    saveGameProgress();
    updateSnakeGameDisplay();
    
    snakeGameState.gameRunning = true;
    snakeGameState.gamePaused = false;
    
    // 設置初始方向
    if (snakeGameState.direction.x === 0 && snakeGameState.direction.y === 0) {
        snakeGameState.direction = { x: snakeGameState.gridSize, y: 0 };
    }
    
    // 開始遊戲循環
    snakeGameState.gameLoop = setInterval(gameUpdate, 150);
    
    // 更新按鈕狀態
    document.getElementById('start-snake-btn').disabled = true;
    document.getElementById('pause-snake-btn').disabled = false;
}

// 暫停貪食蛇遊戲
function pauseSnakeGame() {
    if (!snakeGameState.gameRunning) return;
    
    snakeGameState.gamePaused = !snakeGameState.gamePaused;
    
    if (snakeGameState.gamePaused) {
        clearInterval(snakeGameState.gameLoop);
        document.getElementById('pause-snake-btn').textContent = '繼續';
    } else {
        snakeGameState.gameLoop = setInterval(gameUpdate, 150);
        document.getElementById('pause-snake-btn').textContent = '暫停';
    }
}

// 重置貪食蛇遊戲（僅供內部使用）
function resetSnakeGame() {
    clearInterval(snakeGameState.gameLoop);
    initSnakeGame();
    
    // 更新按鈕狀態
    document.getElementById('start-snake-btn').disabled = false;
    document.getElementById('pause-snake-btn').disabled = true;
    document.getElementById('pause-snake-btn').textContent = '暫停';
    
    // 隱藏結果
    document.getElementById('snake-game-result').style.display = 'none';
}

// 遊戲更新循環
function gameUpdate() {
    if (!snakeGameState.gameRunning || snakeGameState.gamePaused) return;
    
    // 移動蛇
    moveSnake();
    
    // 檢查碰撞
    if (checkCollision()) {
        endSnakeGame();
        return;
    }
    
    // 檢查是否吃到食物
    if (checkFoodCollision()) {
        eatFood();
    }
    
    // 繪製遊戲
    drawSnakeGame();
}

// 移動蛇
function moveSnake() {
    const head = { ...snakeGameState.snake[0] };
    head.x += snakeGameState.direction.x;
    head.y += snakeGameState.direction.y;
    
    snakeGameState.snake.unshift(head);
    
    // 如果沒有吃到食物，移除尾部
    if (!checkFoodCollision()) {
        snakeGameState.snake.pop();
    }
}

// 檢查碰撞
function checkCollision() {
    const head = snakeGameState.snake[0];
    
    // 檢查牆壁碰撞
    if (head.x < 0 || head.x >= snakeGameState.canvasSize || 
        head.y < 0 || head.y >= snakeGameState.canvasSize) {
        return true;
    }
    
    // 檢查自身碰撞
    for (let i = 1; i < snakeGameState.snake.length; i++) {
        if (head.x === snakeGameState.snake[i].x && head.y === snakeGameState.snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// 檢查食物碰撞
function checkFoodCollision() {
    const head = snakeGameState.snake[0];
    return head.x === snakeGameState.food.x && head.y === snakeGameState.food.y;
}

// 生成食物
function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * (snakeGameState.canvasSize / snakeGameState.gridSize)) * snakeGameState.gridSize,
            y: Math.floor(Math.random() * (snakeGameState.canvasSize / snakeGameState.gridSize)) * snakeGameState.gridSize
        };
    } while (snakeGameState.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    
    snakeGameState.food = newFood;
}

// 吃食物
function eatFood() {
    snakeGameState.score++;
    generateFood();
    updateSnakeDisplay();
}

// 結束遊戲
function endSnakeGame() {
    clearInterval(snakeGameState.gameLoop);
    snakeGameState.gameRunning = false;
    
    // 計算獲得的點數 (得分/10，最多100點)
    const earnedPoints = Math.min(Math.floor(snakeGameState.score / 10), 100);
    
    // 添加點數到玩家數據
    PLAYER_DATA.points += earnedPoints;
    saveGameProgress();
    
    // 顯示結果
    showSnakeGameResult(earnedPoints);
    
    // 更新按鈕狀態
    document.getElementById('start-snake-btn').disabled = true;
    document.getElementById('pause-snake-btn').disabled = true;
}

// 顯示遊戲結果
function showSnakeGameResult(earnedPoints) {
    document.getElementById('final-snake-score').textContent = snakeGameState.score;
    document.getElementById('earned-points').textContent = earnedPoints;
    document.getElementById('snake-game-result').style.display = 'block';
}

// 更新顯示
function updateSnakeDisplay() {
    document.getElementById('snake-score').textContent = snakeGameState.score;
    document.getElementById('snake-length').textContent = snakeGameState.snake.length;
}

// 繪製遊戲
function drawSnakeGame() {
    const ctx = snakeGameState.ctx;
    
    // 清空畫布
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, snakeGameState.canvasSize, snakeGameState.canvasSize);
    
    // 繪製蛇
    snakeGameState.snake.forEach((segment, index) => {
        if (index === 0) {
            // 蛇頭 - 特殊樣式
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(segment.x + 2, segment.y + 2, snakeGameState.gridSize - 4, snakeGameState.gridSize - 4);
            
            // 蛇頭眼睛
            ctx.fillStyle = '#fff';
            ctx.fillRect(segment.x + 4, segment.y + 4, 4, 4);
            ctx.fillRect(segment.x + 12, segment.y + 4, 4, 4);
        } else if (index === snakeGameState.snake.length - 1) {
            // 蛇尾 - 特殊樣式
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(segment.x + 4, segment.y + 4, snakeGameState.gridSize - 8, snakeGameState.gridSize - 8);
        } else {
            // 蛇身
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(segment.x + 1, segment.y + 1, snakeGameState.gridSize - 2, snakeGameState.gridSize - 2);
        }
    });
    
    // 繪製食物
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(
        snakeGameState.food.x + snakeGameState.gridSize / 2,
        snakeGameState.food.y + snakeGameState.gridSize / 2,
        snakeGameState.gridSize / 2 - 2,
        0,
        2 * Math.PI
    );
    ctx.fill();
}

// 鍵盤控制
document.addEventListener('keydown', (e) => {
    if (!snakeGameState.gameRunning || snakeGameState.gamePaused) return;
    
    switch (e.key) {
        case 'ArrowUp':
            if (snakeGameState.direction.y === 0) {
                snakeGameState.direction = { x: 0, y: -snakeGameState.gridSize };
            }
            break;
        case 'ArrowDown':
            if (snakeGameState.direction.y === 0) {
                snakeGameState.direction = { x: 0, y: snakeGameState.gridSize };
            }
            break;
        case 'ArrowLeft':
            if (snakeGameState.direction.x === 0) {
                snakeGameState.direction = { x: -snakeGameState.gridSize, y: 0 };
            }
            break;
        case 'ArrowRight':
            if (snakeGameState.direction.x === 0) {
                snakeGameState.direction = { x: snakeGameState.gridSize, y: 0 };
            }
            break;
    }
});

// 再玩一次
function playAgain() {
    // 重置遊戲
    resetSnakeGame();
    
    // 更新顯示
    updateSnakeGameDisplay();
}

// 返回主頁
function backToMain() {
    if (snakeGameState.gameRunning) {
        clearInterval(snakeGameState.gameLoop);
    }
    showPage('main-page');
    updateSnakeGameDisplay();
}

