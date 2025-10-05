@echo off
echo 設置Windows防火牆允許Node.js伺服器...
echo.

echo 正在添加防火牆規則...
netsh advfirewall firewall add rule name="Node.js Server Port 3000" dir=in action=allow protocol=TCP localport=3000

if %errorlevel% equ 0 (
    echo ✅ 防火牆規則添加成功！
    echo.
    echo 現在其他人可以通過以下地址訪問您的應用程式：
    echo 區域網路：http://100.75.34.107:3000
    echo 本地：http://localhost:3000
) else (
    echo ❌ 防火牆規則添加失敗！
    echo 請以管理員身份運行此腳本
)

echo.
echo 按任意鍵退出...
pause > nul
