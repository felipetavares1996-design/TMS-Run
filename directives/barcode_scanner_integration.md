# SOP: Integração e Operação de Leitor de Código de Barras (Bipador USB)

## 1. Objetivo
Padronizar e documentar o funcionamento dos leitores de código de barras físicos (USB / Bluetooth tipo pistola laser ou CCD) integrados ao TMS RUN para recepção, triagem de carga e conferência de embarque no PWA.

---

## 2. Princípio de Funcionamento do Hardware
- **Padrão:** USB HID (Human Interface Device / Emulação de Teclado).
- **Driver:** Plug & Play (reconhecido nativamente pelo Windows e navegadores sem softwares adicionais).
- **Comportamento:** Ao apertar o gatilho, o leitor dispara uma sequência rápida de pulsos de teclado (< 50ms por caractere) finalizada com a tecla `Enter` (CR/LF).

---

## 3. Recursos Implementados no Sistema

### A. Captura Global Anti-Perda de Foco (`setupGlobalBarcodeScanner`)
- Intercepta eventos `keydown` na janela do navegador quando o usuário está nas telas:
  - Central: **🏷️ Bipagem & Coleta** (`screen: 'collection'`)
  - Motorista: **📦 Bipagem de Carga** (`activeDriverTab === 'bip'`)
- Se o operador clicar na tabela ou em qualquer espaço vazio, a leitura do gatilho USB **não é perdida**.
- O buffer detecta a sequência rápida e redireciona o foco e o valor para o processador de bipagem instantaneamente.
- Não interfere caso o usuário esteja preenchendo observações ou selects de motorista.

### B. Decodificador Inteligente de DANFE / NF-e 44 Dígitos (`parseBarcodeOrDanfe`)
- Suporta leitura do código de barras de 44 dígitos da Nota Fiscal Eletrônica.
- Extrai automaticamente o número da NF (posições 25 a 34 exclusive) e remove zeros à esquerda.
- Exemplo: Chave `352309...000100234...` ➔ Extrai NF `#100234` e vincula com a entrega correspondente.
- Suporta também códigos EAN-13, Code 128 e números curtos digitados manualmente.

### C. Alerta Sonoro e Háptico Diferenciado (`playScannerBeep`)
- **Sucesso:** 1450Hz puro e curto (75ms) idêntico aos coletores industriais Zebra/Honeywell.
- **Erro / Duplicidade:** Tom duplo grave de alerta (320Hz seguido de 220Hz) com vibração háptica.
- **Lote Concluído:** Tom ascendente harmônico.

---

## 4. Procedimento Operacional Padrão (SOP de Uso)

1. Conecte o cabo USB do leitor no computador.
2. Inicie o sistema TMS RUN (execute `iniciar_servidor.bat` ou abra `http://localhost:8080`).
3. Acesse o menu lateral **🏷️ Bipagem & Coleta**.
4. (Opcional) Escolha a **Base Operacional** (ex: SMT, MCO ou FO2) e o motorista para auto-atribuição no lote.
5. Aponte a pistola para o código de barras da caixa ou DANFE da NF-e e aperte o gatilho.
6. Observe a confirmação visual (card verde "BIPADO COM SUCESSO") e o bipe sonoro. O pacote aparecerá imediatamente no topo da listagem de triagem.

---

## 5. Resolução de Problemas (Troubleshooting)

| Sintoma | Causa Provável | Solução |
| :--- | :--- | :--- |
| O leitor bipa mas o código não aparece | Cabo frouxo ou modo serial ativo | Reconectar na porta USB e certificar que está no modo USB Teclado (HID). |
| O código aparece mas não processa | Falta o sufixo `Enter` no leitor | Bipar o código de configuração *"Add Enter Suffix (CR/LF)"* no manual do leitor. |
| Diz "Código já bipado" | Pacote já foi conferido nesta sessão | O sistema impede duplicidade intencionalmente. Use o botão "Limpar Lote" se for uma nova sessão. |
