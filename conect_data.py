# conect_data.py - COM AUTENTICAÇÃO E ORDENAÇÃO
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from database import DatabaseManager
import datetime
from werkzeug.security import generate_password_hash # ADICIONE OU VERIFIQUE ESTE IMPORT
# --- Imports para Login ---
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash
from functools import wraps
# --- Fim ---

app = Flask(__name__)
# --- Configuração de Chave Secreta e CORS com Suporte a Credenciais ---
app.config['SECRET_KEY'] = 'sua_chave_secreta_super_segura_aqui' 
CORS(app, supports_credentials=True) # supports_credentials é crucial para sessões
# --- Fim ---

# --- Configuração do Flask-Login ---
login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.unauthorized_handler
def unauthorized():
    return jsonify(error="Acesso não autorizado. Por favor, faça login."), 401

class User(UserMixin):
    """Classe de modelo que o Flask-Login espera."""
    def __init__(self, user_data):
        self.id = user_data['id']
        self.nome_completo = user_data['nome_completo']
        self.email = user_data['email']
        self.password_hash = user_data['password_hash']
        self.role_nome = user_data['role_nome']
        self.foto_perfil = user_data.get('foto_perfil')
        self.funcionario_id = user_data.get('funcionario_id') # Pega o ID do funcionário vinculado
    
    def to_dict(self):
        # Retorna dados seguros para o frontend
        return {
            "id": self.id,
            "nome": self.nome_completo,
            "email": self.email,
            "role": self.role_nome,
            "foto": self.foto_perfil,
            "funcionario_id": self.funcionario_id # Envia para o frontend, se necessário
        }

@login_manager.user_loader
def load_user(user_id):
    with DatabaseManager() as db:
        user_data = db.find_user_by_id(int(user_id)) # Assume que find_user_by_id já retorna funcionario_id
        return User(user_data) if user_data else None

# --- Decorador para verificar Roles (Permissões) ---
def role_required(allowed_roles):
    """Decorator para restringir acesso a roles específicas."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return jsonify(error="Acesso não autorizado. Por favor, faça login."), 401
            if current_user.role_nome not in allowed_roles:
                roles_str = ", ".join(allowed_roles)
                return jsonify(error=f"Acesso restrito a: {roles_str}."), 403 # 403 Forbidden
            return f(*args, **kwargs)
        return decorated_function
    return decorator
# --- Fim ---

# =================================================================
# --- ROTAS DE AUTENTICAÇÃO ---
# =================================================================

@app.route('/api/login', methods=['POST'])
def login():
    dados = request.json
    email = dados.get('email')
    password = dados.get('password')

    if not email or not password:
        return jsonify(error="Email e senha são obrigatórios."), 400

    with DatabaseManager() as db:
        user_data = db.find_user_by_email(email)
        
        if not user_data or not check_password_hash(user_data['password_hash'], password):
            return jsonify(error="Credenciais inválidas."), 401
        
        user = User(user_data)
        login_user(user) # <-- A mágica do Flask-Login acontece aqui
        
        return jsonify(message="Login bem-sucedido!", user=user.to_dict()), 200

@app.route('/api/logout', methods=['POST'])
@login_required 
def logout():
    logout_user()
    return jsonify(message="Logout bem-sucedido."), 200

@app.route('/api/check_session', methods=['GET'])
def check_session():
    """Verifica se o usuário já tem uma sessão ativa (cookie)."""
    if current_user.is_authenticated:
        return jsonify(user=current_user.to_dict()), 200
    return jsonify(error="Nenhuma sessão ativa."), 401

# =================================================================
# --- ROTAS DE FUNCIONÁRIOS (PROTEGIDAS E COM ORDENAÇÃO) ---
# =================================================================

@app.route('/api/funcionarios', methods=['GET', 'POST'])
@login_required 
def handle_funcionarios():
    """Lida com a listagem/filtro/paginação (GET) e criação (POST) de funcionários."""
    
    # Captura parâmetros de paginação e filtro da URL
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    id_str = request.args.get('id_str')
    nome = request.args.get('nome')
    cargo_nome = request.args.get('cargo_nome')
    
    # --- (MODIFICADO) Captura parâmetros de ordenação ---
    sort_by = request.args.get('sort_by', 'id')
    order = request.args.get('order', 'DESC')
    # --- Fim ---
            
    with DatabaseManager() as db:
        if request.method == 'GET':
            funcionarios, pagination = db.read_all_funcionarios(
                page=page, 
                limit=limit, 
                id_str=id_str, 
                nome=nome, 
                cargo_nome=cargo_nome,
                sort_by=sort_by, # Passa para o DB
                order=order      # Passa para o DB
            )
            return jsonify(data=funcionarios, pagination=pagination)
            
        elif request.method == 'POST':
            if current_user.role_nome != 'Administrador':
                 return jsonify(error="Apenas Administradores podem criar funcionários."), 403
            dados = request.json
            if not dados: return jsonify(error="Dados não fornecidos."), 400
            novo_id = db.create_funcionario(dados)
            return jsonify(message="Funcionário criado com sucesso!", id=novo_id), 201

@app.route('/api/funcionarios/nomes', methods=['GET'])
@login_required 
def get_funcionarios_nomes():
    with DatabaseManager() as db:
        nomes = db.read_all_funcionarios_nomes()
        return jsonify(data=nomes)

@app.route('/api/funcionarios/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@login_required 
def handle_funcionario_by_id(id):
    with DatabaseManager() as db:
        if request.method == 'GET':
            funcionario = db.read_funcionario_by_id(id)
            if funcionario: return jsonify(data=funcionario)
            return jsonify(error=f"Funcionário com ID {id} não encontrado."), 404
        
        elif request.method == 'PUT':
            if current_user.role_nome != 'Administrador':
                 return jsonify(error="Apenas Administradores podem editar funcionários."), 403
            dados = request.json
            if not dados: return jsonify(error="Dados não fornecidos."), 400
            sucesso = db.update_funcionario(id, dados)
            if sucesso: return jsonify(message=f"Funcionário com ID {id} atualizado.")
            return jsonify(error=f"Funcionário com ID {id} não encontrado."), 404
        
        elif request.method == 'DELETE':
            if current_user.role_nome != 'Administrador':
                 return jsonify(error="Apenas Administradores podem inativar funcionários."), 403
            sucesso = db.delete_funcionario(id)
            if sucesso: return jsonify(message=f"Funcionário com ID {id} inativado.")
            return jsonify(error=f"Funcionário com ID {id} não encontrado."), 404

# --- Rotas para os Selects (Protegidas) ---
@app.route('/api/departamentos', methods=['GET'])
@login_required
def get_all_departamentos():
    with DatabaseManager() as db: return jsonify(data=db.read_all_departamentos())
@app.route('/api/cargos', methods=['GET'])
@login_required
def get_all_cargos():
    with DatabaseManager() as db: return jsonify(data=db.read_all_cargos())
@app.route('/api/bancos', methods=['GET'])
@login_required
def get_all_bancos():
    with DatabaseManager() as db: return jsonify(data=db.read_all_bancos())
@app.route('/api/senioridades', methods=['GET'])
@login_required
def get_all_senioridades():
    with DatabaseManager() as db: return jsonify(data=db.read_all_senioridades())
@app.route('/api/beneficios', methods=['GET'])
@login_required
def get_all_beneficios():
    with DatabaseManager() as db: return jsonify(data=db.read_all_beneficios())


# =================================================================
# --- ROTAS DO MÓDULO DE AUSÊNCIAS (PROTEGIDAS E COM ORDENAÇÃO) ---
# =================================================================

@app.route('/api/ausencias/tipos', methods=['GET'])
@login_required
def get_tipos_ausencia():
    with DatabaseManager() as db:
        tipos = db.read_all_tipos_ausencia()
        return jsonify(data=tipos)

@app.route('/api/ausencias/solicitacoes', methods=['GET', 'POST'])
@login_required
def handle_solicitacoes():
    """Lê todas as solicitações (GET) ou cria uma nova (POST)."""

    # --- (MODIFICADO) Captura parâmetros de ordenação ---
    sort_by = request.args.get('sort_by', 'data_solicitacao')
    order = request.args.get('order', 'DESC')
    # --- Fim ---
            
    with DatabaseManager() as db:
        if request.method == 'GET':
            solicitacoes = db.read_all_solicitacoes(sort_by=sort_by, order=order) # Passa para o DB
            return jsonify(data=solicitacoes)
        
        elif request.method == 'POST':
            dados = request.json
            if not dados:
                return jsonify(error="Dados não fornecidos."), 400
            
            if 'funcionario_id' not in dados or not dados['funcionario_id']:
                return jsonify(error="O funcionário é obrigatório."), 400
            
            try:
                dados['funcionario_id'] = int(dados['funcionario_id'])
            except ValueError:
                return jsonify(error="ID de funcionário inválido."), 400
            
            try:
                data_inicio = datetime.date.fromisoformat(dados['data_inicio'])
                data_fim = datetime.date.fromisoformat(dados['data_fim'])
                dias_solicitados = (data_fim - data_inicio).days + 1
                if dias_solicitados <= 0:
                    return jsonify(error="A data final deve ser maior ou igual à data inicial."), 400
                dados['dias_solicitados'] = dias_solicitados
            except Exception as e:
                return jsonify(error=f"Formato de data inválido: {e}"), 400
            
            dados.pop('anexo', None)

            novo_id = db.create_solicitacao_ausencia(dados)
            return jsonify(message="Solicitação criada com sucesso!", id=novo_id), 201

@app.route('/api/ausencias/solicitacoes/<int:id>/status', methods=['PUT'])
@login_required
def update_solicitacao_status_route(id):
    """Rota para o gestor aprovar ou recusar uma solicitação."""
    
    # Pega o ID do usuário logado
    gestor_id = current_user.id 
    
    # Apenas Admins ou Gestores podem aprovar/recusar
    if current_user.role_nome not in ['Administrador', 'Gestor']:
        return jsonify(error="Acesso restrito a Gestores ou Administradores."), 403

    dados = request.json
    status = dados.get('status')
    justificativa = dados.get('justificativa_gestor', '')
    
    if not status or status not in ['Aprovado', 'Recusado']:
        return jsonify(error="Status inválido. Deve ser 'Aprovado' ou 'Recusado'."), 400
    
    with DatabaseManager() as db:
        try:
            sucesso = db.update_solicitacao_status(id, gestor_id, status, justificativa)
            if sucesso:
                return jsonify(message=f"Solicitação {id} foi atualizada para {status}.")
            else:
                return jsonify(error="Solicitação não encontrada."), 404
        except ValueError as ve: 
             return jsonify(error=str(ve)), 409 
        except Exception as e:
            return jsonify(error=f"Erro interno: {e}"), 500
@app.route('/api/usuarios', methods=['POST'])
@role_required(['Administrador']) # Só Admins podem criar usuários
def create_new_user():
    """Cria um novo usuário no sistema."""
    
    dados = request.json
    nome = dados.get('nome_completo')
    email = dados.get('email')
    password = dados.get('password')
    role_nome = dados.get('role_nome') # Espera 'Administrador', 'Gestor', ou 'Usuario'

    # 1. Validação básica dos dados recebidos
    if not all([nome, email, password, role_nome]):
        return jsonify(error="Nome completo, email, senha e papel (role_nome) são obrigatórios."), 400
        
    # (Opcional: Adicionar validação de formato de email, força da senha, etc.)

    # 2. Gerar o hash da senha
    try:
        password_hash = generate_password_hash(password)
    except Exception as e:
         print(f"Erro ao gerar hash da senha: {e}") # Log do erro no servidor
         return jsonify(error="Erro interno ao processar a senha."), 500

    # 3. Chamar a função do banco de dados
    with DatabaseManager() as db:
        try:
            # Verifica se o email já existe
            existing_user = db.find_user_by_email(email)
            if existing_user:
                 return jsonify(error=f"O email '{email}' já está cadastrado."), 409 # 409 Conflict
                 
            # Tenta criar o usuário
            novo_id = db.create_user(
                nome_completo=nome,
                email=email,
                password_hash=password_hash,
                role_nome=role_nome 
            )
            
            # (Opcional: Vincular a um funcionário se necessário, 
            #  mas isso pode ser feito depois na edição do usuário/funcionário)
            
            return jsonify(message="Usuário criado com sucesso!", id=novo_id), 201 # 201 Created

        except ValueError as ve: # Erro se a role_nome for inválida
            print(f"Erro ao criar usuário - ValueError: {ve}")
            return jsonify(error=str(ve)), 400 # Bad Request (role inválida)
        except sqlite3.Error as sqle: # Erro geral do banco
             print(f"Erro de banco de dados ao criar usuário: {sqle}")
             return jsonify(error="Erro no banco de dados ao criar usuário."), 500
        except Exception as e: # Outros erros inesperados
             print(f"Erro inesperado ao criar usuário: {e}")
             return jsonify(error="Erro interno inesperado."), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)