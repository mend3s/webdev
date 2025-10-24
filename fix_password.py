import sqlite3
from werkzeug.security import generate_password_hash
from database import DatabaseManager  # Importa sua classe
import getpass  # Para digitar a senha de forma segura
import traceback # Para ver erros detalhados

def fix_admin_password():
    print("--- Atualizador de Senha de Admin ---")
    
    # 1. Pergunte qual usuário atualizar
    email = input("Digite o e-mail do usuário admin (o mesmo que está no DBeaver): ")
    
    # 2. Peça a nova senha
    # getpass esconde a senha enquanto você digita
    password = getpass.getpass(f"Digite a NOVA senha para '{email}': ")
    password_confirm = getpass.getpass("Confirme a NOVA senha: ")

    if password != password_confirm:
        print("\n[ERRO] As senhas não conferem. Tente novamente.")
        return

    # 3. Gere o Hash
    try:
        password_hash = generate_password_hash(password)
        print("\nHash gerado com sucesso.")
    except Exception as e:
        print(f"\n[ERRO] Falha ao gerar hash: {e}")
        print("Você instalou o 'werkzeug'? Tente: pip install werkzeug")
        return

    # 4. Atualize o banco de dados
    try:
        with DatabaseManager() as db:
            print(f"Conectado ao banco '{db.db_name}'.")
            
            # Verifica se o usuário existe
            user = db.find_user_by_email(email)
            if not user:
                print(f"[ERRO] Usuário com e-mail '{email}' não encontrado no banco.")
                return

            # Atualiza o hash da senha
            query = "UPDATE usuarios SET password_hash = ? WHERE email = ?;"
            db.execute_query(query, (password_hash, email))
            
            print("-------------------------------------------------")
            print(f"[SUCESSO] A senha para '{email}' foi atualizada!")
            print("-------------------------------------------------")
            print("Agora você pode rodar o 'conect_data.py' e tentar logar.")

    except sqlite3.Error as e:
        print(f"\n[ERRO DE BANCO] Falha ao atualizar o banco: {e}")
    except Exception as e:
        print(f"\n[ERRO INESPERADO] {e}")
        traceback.print_exc()

if __name__ == "__main__":
    fix_admin_password()