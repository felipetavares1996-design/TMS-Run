const fs = require('fs');
const path = require('path');

function main() {
    const generatedIconPath = 'C:\\Users\\felipe\\.gemini\\antigravity-ide\\brain\\ecab1e47-2c01-43c2-a1e6-61e8ec3a21c5\\run_app_icon_1781758120487.png';
    const assetsDir = path.join(__dirname, '..', 'assets');
    
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    const dest512 = path.join(assetsDir, 'icon-512.png');
    const dest192 = path.join(assetsDir, 'icon-192.png');
    
    if (fs.existsSync(generatedIconPath)) {
        console.log(`[INFO] Copiando ícone gerado para ${dest512}...`);
        fs.copyFileSync(generatedIconPath, dest512);
        
        console.log(`[INFO] Copiando ícone gerado para ${dest192}...`);
        fs.copyFileSync(generatedIconPath, dest192);
        
        console.log('[OK] Ícones de PWA gerados com sucesso!');
    } else {
        console.error(`[ERRO] Ícone original não encontrado no caminho: ${generatedIconPath}`);
        // Fallback para driver.png caso ocorra algum imprevisto
        const driverPng = path.join(assetsDir, 'driver.png');
        if (fs.existsSync(driverPng)) {
            console.log('[INFO] Usando driver.png como fallback para ícones do PWA...');
            fs.copyFileSync(driverPng, dest512);
            fs.copyFileSync(driverPng, dest192);
            console.log('[OK] Ícones de fallback gerados.');
        } else {
            console.error('[ERRO] Nenhum ícone disponível para PWA.');
            process.exit(1);
        }
    }
}

main();
