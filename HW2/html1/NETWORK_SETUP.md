# 網路訪問設置指南

## 🌐 讓其他人連線到您的伺服器

### 方法一：區域網路訪問（推薦）

#### 1. 確認您的IP地址
```bash
ipconfig
```
您的當前IP地址：`100.75.34.107`

#### 2. 啟動伺服器
```bash
npm start
```

#### 3. 其他人訪問方式
- **您自己**：`http://localhost:3000`
- **同區域網路的人**：`http://100.75.34.107:3000`

#### 4. 注意事項
- 確保所有設備都在同一個Wi-Fi網路下
- 可能需要關閉Windows防火牆或添加例外規則
- 如果無法訪問，請檢查路由器設置

### 方法二：防火牆設置

#### Windows防火牆設置
1. 打開「Windows Defender 防火牆」
2. 點擊「允許應用程式或功能通過Windows Defender 防火牆」
3. 點擊「變更設定」
4. 找到「Node.js」或「node.exe」
5. 勾選「私人」和「公用」網路
6. 如果找不到，點擊「允許其他應用程式」添加Node.js

#### 手動添加防火牆規則
```bash
# 以管理員身份運行PowerShell
netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=3000
```

### 方法三：使用ngrok（外網訪問）

#### 1. 安裝ngrok
- 訪問 https://ngrok.com/
- 下載並安裝ngrok
- 註冊帳號獲取authtoken

#### 2. 設置ngrok
```bash
ngrok authtoken YOUR_AUTHTOKEN
```

#### 3. 啟動隧道
```bash
ngrok http 3000
```

#### 4. 獲得公網地址
ngrok會提供一個公網地址，例如：`https://abc123.ngrok.io`
任何人都可以通過這個地址訪問您的應用程式

### 方法四：雲端部署

#### 使用Heroku
1. 安裝Heroku CLI
2. 創建Procfile：
```
web: node server.js
```
3. 部署：
```bash
heroku create your-app-name
git push heroku main
```

#### 使用Vercel
1. 安裝Vercel CLI
2. 部署：
```bash
vercel --prod
```

## 🔧 故障排除

### 常見問題

#### 1. 無法訪問
- 檢查IP地址是否正確
- 確認防火牆設置
- 檢查路由器是否阻擋了端口

#### 2. 連接被拒絕
- 確認伺服器正在運行
- 檢查端口3000是否被其他程式佔用
- 重啟伺服器

#### 3. 圖片無法顯示
- 確認images目錄存在
- 檢查圖片檔案權限
- 確認API路由正確

## 📱 手機訪問測試

1. 確保手機連接到同一個Wi-Fi
2. 在手機瀏覽器中輸入：`http://100.75.34.107:3000`
3. 測試所有功能是否正常

## 🔒 安全注意事項

- 區域網路訪問相對安全
- 使用ngrok時，任何人都可以訪問您的應用程式
- 生產環境建議使用HTTPS
- 考慮添加身份驗證機制

## 📞 聯絡資訊

如果遇到問題，請檢查：
1. 網路連接
2. 防火牆設置
3. 伺服器日誌
4. 瀏覽器控制台錯誤
