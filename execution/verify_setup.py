import os

def verify_setup():
    folders = ['directives', 'execution', '.tmp']
    files = ['AGENTE.md', 'CLAUDE.md', 'AGENTS.md', 'GEMINI.md', '.env']
    
    print("Verificando estrutura de 3 camadas...")
    
    for folder in folders:
        if os.path.exists(folder) and os.path.isdir(folder):
            print(f"[OK] Pasta '{folder}' encontrada.")
        else:
            print(f"[ERRO] Pasta '{folder}' não encontrada.")
            
    for file in files:
        if os.path.exists(file) and os.path.isfile(file):
            print(f"[OK] Arquivo '{file}' encontrado.")
        else:
            print(f"[ERRO] Arquivo '{file}' não encontrado.")

if __name__ == "__main__":
    verify_setup()
