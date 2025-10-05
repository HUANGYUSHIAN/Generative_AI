// 遊戲資料檔案
// 儲存玩家的遊戲狀態和設定

// 玩家資料
const PLAYER_DATA = {
    points: 0,      // 遊戲點數
    health: 5,      // 生命值 (最大10)
    defense: 5,     // 防禦值 (最大10)  
    attack: 10,     // 攻擊力 (最大15)
    freeUnlocks: 0, // 免費解鎖次數
    
    // 貪食蛇遊戲相關
    snakeGamesPlayed: 0,    // 今日已玩次數
    lastSnakeGameDate: null, // 最後遊戲日期
    
    // 最大值限制
    maxHealth: 10,
    maxDefense: 10,
    maxAttack: 15
};

// 初始資料備份（用於重置）
const INITIAL_PLAYER_DATA = {
    points: 0,
    health: 5,
    defense: 5,
    attack: 10,
    freeUnlocks: 1, // 重置後給一次免費解鎖機會
    snakeGamesPlayed: 0,    // 重置貪食蛇遊戲次數
    lastSnakeGameDate: null, // 重置最後遊戲日期
    maxHealth: 10,
    maxDefense: 10,
    maxAttack: 15
};

// 商店價格設定
const SHOP_PRICES = {
    upgrade: 10,    // 升級參數價格
    unlock: 20      // 解鎖單字價格
};

// 載入資料到全域變數
if (typeof window !== 'undefined') {
    window.PLAYER_DATA = PLAYER_DATA;
    window.INITIAL_PLAYER_DATA = INITIAL_PLAYER_DATA;
    window.SHOP_PRICES = SHOP_PRICES;
}

// 支援Node.js環境
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PLAYER_DATA,
        INITIAL_PLAYER_DATA,
        SHOP_PRICES
    };
}
