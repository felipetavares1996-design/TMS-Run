@echo off
:: Configura a codificacao para ASCII simples
chcp 1252 > nul

echo =======================================================
echo    Iniciando Servidor Local e Tunel do TMS RUN...
echo =======================================================
echo.

echo [1/2] Iniciando Servidor Web local (Node.js)...
start "Servidor TMS RUN" cmd /k "node execution/server.js"

echo.
echo [2/2] Iniciando Tunel Seguro (Localtunnel) para Celular...
start "Tunel Localtunnel" cmd /k "npx --yes localtunnel --port 8080 --local-host 127.0.0.1 --subdomain tms-run-felipe"

echo.
echo =======================================================
echo   * Tudo pronto!
echo   
echo   Link para abrir no celular:
echo   https://tms-run-felipe.loca.lt
echo.
echo   Senha / IP publico (se solicitado na tela azul):
node -e "fetch('https://api.ipify.org').then(r=>r.text()).then(ip=>console.log('   ' + ip)).catch(()=>console.log('   187.74.227.137'))"
echo.
echo   Mantenha as duas janelas de terminal abertas enquanto testa.
echo =======================================================
echo.
pause
