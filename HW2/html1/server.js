const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件設置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 確保必要的目錄存在
const userDir = path.join(__dirname, 'user');
const companyDir = path.join(__dirname, 'company');
const imagesDir = path.join(__dirname, 'images');

[userDir, companyDir, imagesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// 初始化Excel檔案
function initializeExcelFiles() {
    // 初始化user.xlsx
    const userFilePath = path.join(userDir, 'user.xlsx');
    if (!fs.existsSync(userFilePath)) {
        const userHeaders = ['姓名', 'email', '手機', '帳號名稱', '密碼', '解鎖的單字ID', 'priority', '點數', '優惠券ID', '使用期限', '優惠券CompanyID'];
        const userData = [userHeaders];
        const userWS = XLSX.utils.aoa_to_sheet(userData);
        const userWB = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(userWB, userWS, 'Users');
        XLSX.writeFile(userWB, userFilePath);
    }

    // 初始化company.xlsx
    const companyFilePath = path.join(companyDir, 'company.xlsx');
    if (!fs.existsSync(companyFilePath)) {
        const companyHeaders = ['ID', '名稱', '描述', '類型', '價值'];
        const companyData = [
            companyHeaders,
            ['1', '金幣', '100金幣', 'currency', '100'],
            ['2', '經驗值', '50經驗值', 'experience', '50'],
            ['3', '特殊道具', '稀有道具', 'item', '1'],
            ['4', '點數', '20點數', 'points', '20'],
            ['5', '優惠券', '商店優惠券', 'coupon', '1']
        ];
        const companyWS = XLSX.utils.aoa_to_sheet(companyData);
        const companyWB = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(companyWB, companyWS, 'Company');
        XLSX.writeFile(companyWB, companyFilePath);
    }
}

// 讀取Excel檔案
function readExcelFile(filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    } catch (error) {
        console.error('讀取Excel檔案錯誤:', error);
        return [];
    }
}

// 寫入Excel檔案
function writeExcelFile(filePath, data) {
    try {
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, filePath);
        return true;
    } catch (error) {
        console.error('寫入Excel檔案錯誤:', error);
        return false;
    }
}

// 初始化Excel檔案
initializeExcelFiles();

// 路由設置

// 主頁面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 註冊API
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, username, password } = req.body;
        
        if (!name || !email || !phone || !username || !password) {
            return res.status(400).json({ success: false, message: '所有欄位都是必填的' });
        }

        const userFilePath = path.join(userDir, 'user.xlsx');
        const userData = readExcelFile(userFilePath);
        
        // 檢查用戶名是否已存在
        const existingUser = userData.find(row => row[3] === username);
        if (existingUser) {
            return res.status(400).json({ success: false, message: '用戶名已存在' });
        }

        // 加密密碼
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 添加新用戶
        const newUser = [name, email, phone, username, hashedPassword, '', 0, 100, '', '', ''];
        userData.push(newUser);
        
        if (writeExcelFile(userFilePath, userData)) {
            res.json({ success: true, message: '註冊成功' });
        } else {
            res.status(500).json({ success: false, message: '註冊失敗' });
        }
    } catch (error) {
        console.error('註冊錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 登入API
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, message: '請輸入用戶名和密碼' });
        }

        const userFilePath = path.join(userDir, 'user.xlsx');
        const userData = readExcelFile(userFilePath);
        
        // 找到用戶
        const user = userData.find(row => row[3] === username);
        if (!user) {
            return res.status(400).json({ success: false, message: '用戶名或密碼錯誤' });
        }

        // 驗證密碼
        const isValidPassword = await bcrypt.compare(password, user[4]);
        if (!isValidPassword) {
            return res.status(400).json({ success: false, message: '用戶名或密碼錯誤' });
        }

        // 返回用戶信息（不包含密碼）
        const userInfo = {
            name: user[0],
            email: user[1],
            phone: user[2],
            username: user[3],
            points: user[7] || 0,
            coupons: user[8] || '',
            priority: user[6] || 0
        };

        res.json({ success: true, user: userInfo });
    } catch (error) {
        console.error('登入錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 摸彩箱API
app.post('/api/draw', async (req, res) => {
    try {
        const { username } = req.body;
        
        const userFilePath = path.join(userDir, 'user.xlsx');
        const companyFilePath = path.join(companyDir, 'company.xlsx');
        
        const userData = readExcelFile(userFilePath);
        const companyData = readExcelFile(companyFilePath);
        
        // 找到用戶
        const userIndex = userData.findIndex(row => row[3] === username);
        if (userIndex === -1) {
            return res.status(400).json({ success: false, message: '用戶不存在' });
        }

        const user = userData[userIndex];
        const currentPoints = parseInt(user[7]) || 0;
        
        if (currentPoints < 10) {
            return res.status(400).json({ success: false, message: '點數不足' });
        }

        // 隨機選擇獎品
        const prizes = companyData.slice(1); // 跳過標題行
        const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
        
        // 扣除點數
        userData[userIndex][7] = currentPoints - 10;
        
        // 生成優惠券ID和期限
        const couponId = uuidv4();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        // 更新用戶的優惠券
        const currentCoupons = user[8] || '';
        const newCoupons = currentCoupons ? `${currentCoupons},${couponId}` : couponId;
        userData[userIndex][8] = newCoupons;
        userData[userIndex][9] = expiryDate.toISOString().split('T')[0];
        
        // 更新優惠券的company ID
        const currentCompanyIds = user[10] || '';
        const newCompanyIds = currentCompanyIds ? `${currentCompanyIds},${randomPrize[0]}` : randomPrize[0];
        userData[userIndex][10] = newCompanyIds;
        
        if (writeExcelFile(userFilePath, userData)) {
            res.json({ 
                success: true, 
                prize: {
                    id: randomPrize[0],
                    name: randomPrize[1],
                    description: randomPrize[2],
                    type: randomPrize[3],
                    value: randomPrize[4]
                },
                couponId: couponId,
                remainingPoints: currentPoints - 10
            });
        } else {
            res.status(500).json({ success: false, message: '抽獎失敗' });
        }
    } catch (error) {
        console.error('抽獎錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 單字解鎖API
app.post('/api/unlock-words', async (req, res) => {
    try {
        const { username } = req.body;
        
        const userFilePath = path.join(userDir, 'user.xlsx');
        const userData = readExcelFile(userFilePath);
        
        // 找到用戶
        const userIndex = userData.findIndex(row => row[3] === username);
        if (userIndex === -1) {
            return res.status(400).json({ success: false, message: '用戶不存在' });
        }

        const user = userData[userIndex];
        const currentPoints = parseInt(user[7]) || 0;
        
        if (currentPoints < 5) {
            return res.status(400).json({ success: false, message: '點數不足' });
        }

        // 生成10個隨機單字ID
        const wordIds = [];
        for (let i = 0; i < 10; i++) {
            wordIds.push(Math.floor(Math.random() * 1000) + 1);
        }
        
        // 扣除點數
        userData[userIndex][7] = currentPoints - 5;
        
        // 更新解鎖的單字ID
        const currentWords = user[5] || '';
        const newWords = currentWords ? `${currentWords},${wordIds.join(',')}` : wordIds.join(',');
        userData[userIndex][5] = newWords;
        
        if (writeExcelFile(userFilePath, userData)) {
            res.json({ 
                success: true, 
                unlockedWords: wordIds,
                remainingPoints: currentPoints - 5
            });
        } else {
            res.status(500).json({ success: false, message: '解鎖失敗' });
        }
    } catch (error) {
        console.error('解鎖錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 獲取用戶優惠券API
app.get('/api/coupons/:username', (req, res) => {
    try {
        const { username } = req.params;
        
        const userFilePath = path.join(userDir, 'user.xlsx');
        const userData = readExcelFile(userFilePath);
        
        // 找到用戶
        const user = userData.find(row => row[3] === username);
        if (!user) {
            return res.status(400).json({ success: false, message: '用戶不存在' });
        }

        const coupons = user[8] || '';
        const expiryDate = user[9] || '';
        const companyIds = user[10] || '';
        
        // 將優惠券ID和company ID配對
        const couponList = coupons.split(',').filter(id => id.trim());
        const companyIdList = companyIds.split(',').filter(id => id.trim());
        
        const couponData = couponList.map((couponId, index) => ({
            id: couponId,
            companyId: companyIdList[index] || ''
        }));
        
        res.json({ 
            success: true, 
            coupons: couponData,
            expiryDate: expiryDate
        });
    } catch (error) {
        console.error('獲取優惠券錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 獲取優惠券圖片API
app.get('/api/coupon-image/:couponId', (req, res) => {
    try {
        const { couponId } = req.params;
        
        // 從摸彩箱結果中獲取company ID
        // 這裡我們需要從用戶的優惠券記錄中找到對應的company ID
        const userFilePath = path.join(userDir, 'user.xlsx');
        const userData = readExcelFile(userFilePath);
        
        // 找到包含此優惠券ID的用戶
        const user = userData.find(row => {
            const coupons = row[8] || '';
            return coupons.split(',').includes(couponId);
        });
        
        if (!user) {
            return res.status(404).json({ success: false, message: '優惠券不存在' });
        }
        
        // 這裡我們需要一個更好的方式來關聯優惠券ID和company ID
        // 讓我們修改摸彩箱API來儲存這個關聯
        res.status(404).json({ success: false, message: '圖片不存在' });
    } catch (error) {
        console.error('獲取圖片錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 獲取優惠券圖片API（根據company ID）
app.get('/api/company-image/:companyId', (req, res) => {
    try {
        const { companyId } = req.params;
        const imagePath = path.join(imagesDir, `company_${companyId}.jpg`);
        
        if (fs.existsSync(imagePath)) {
            res.sendFile(imagePath);
        } else {
            // 如果圖片不存在，返回預設圖片或404
            res.status(404).json({ success: false, message: '圖片不存在' });
        }
    } catch (error) {
        console.error('獲取圖片錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 啟動伺服器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`伺服器運行在 http://localhost:${PORT}`);
    console.log('本地訪問：http://localhost:3000');
    console.log('區域網路訪問：http://100.75.34.107:3000');
    console.log('請在瀏覽器中打開上述網址來使用應用程式');
    console.log('其他人可以通過區域網路IP地址訪問您的應用程式');
});
