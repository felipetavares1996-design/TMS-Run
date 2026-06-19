import os
import sys
import subprocess

def install_pillow():
    print("Tentando instalar a biblioteca Pillow para redimensionamento de imagens...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
        print("[OK] Pillow instalada com sucesso.")
        return True
    except Exception as e:
        print(f"[ERRO] Não foi possível instalar a biblioteca Pillow: {e}")
        return False

def resize_icon(source_path, target_path, size):
    try:
        from PIL import Image
    except ImportError:
        if install_pillow():
            from PIL import Image
        else:
            print("[INFO] Usando fallback: copiando imagem original sem redimensionar.")
            import shutil
            shutil.copy2(source_path, target_path)
            return

    try:
        with Image.open(source_path) as img:
            # Converter para RGBA se necessário
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Redimensionar mantendo proporção ou forçando quadrado para ícone de app
            resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
            resized_img.save(target_path, "PNG")
            print(f"[OK] Ícone gerado em: {target_path} ({size}x{size})")
    except Exception as e:
        print(f"[ERRO] Falha ao redimensionar {source_path}: {e}")
        import shutil
        shutil.copy2(source_path, target_path)
        print("[INFO] Fallback acionado: cópia de segurança efetuada.")

def main():
    source_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets_dir = os.path.join(source_dir, "assets")
    
    logo_path = os.path.join(assets_dir, "logo_run.png")
    icon_192 = os.path.join(assets_dir, "icon-192.png")
    icon_512 = os.path.join(assets_dir, "icon-512.png")
    
    if not os.path.exists(logo_path):
        print(f"[ERRO] Logotipo de origem não encontrado em: {logo_path}")
        sys.exit(1)
        
    print(f"Redimensionando '{logo_path}' para criar ícones do PWA...")
    resize_icon(logo_path, icon_192, 192)
    resize_icon(logo_path, icon_512, 512)
    print("Processamento de ícones concluído.")

if __name__ == "__main__":
    main()
