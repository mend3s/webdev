# database.py - COM AUTENTICAÇÃO E ORDENAÇÃO
import sqlite3
import math

class DatabaseManager:
    def __init__(self, db_name='staff.db'):
        self.db_name = db_name
        self.conn = None

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def connect(self):
        try:
            self.conn = sqlite3.connect(self.db_name)
            self.conn.row_factory = sqlite3.Row
            self.conn.execute("PRAGMA foreign_keys = ON;")
        except sqlite3.Error as e:
            print(f"Erro ao conectar ao banco de dados: {e}")
            raise

    def close(self):
        if self.conn:
            self.conn.close()

    def execute_query(self, query, params=()):
        try:
            cursor = self.conn.cursor()
            cursor.execute(query, params)
            self.conn.commit()
            return cursor
        except sqlite3.Error as e:
            print(f"Erro ao executar a query: {e}")
            self.conn.rollback()
            raise

    def fetch_query(self, query, params=()):
        try:
            cursor = self.conn.cursor()
            cursor.execute(query, params)
            return cursor.fetchall()
        except sqlite3.Error as e:
            print(f"Erro ao buscar dados: {e}")
            raise
    
    def execute_many(self, query, data):
        try:
            cursor = self.conn.cursor()
            cursor.executemany(query, data)
            self.conn.commit()
            return cursor
        except sqlite3.Error as e:
            print(f"Erro ao executar a query em massa: {e}")
            self.conn.rollback()
            raise

    def create_tables(self):
        """
        Cria todas as tabelas do zero. 
        """
        
        # Apaga as tabelas na ordem inversa de dependência
        self.execute_query("DROP TABLE IF EXISTS funcionario_beneficios;")
        self.execute_query("DROP TABLE IF EXISTS solicitacoes_ausencia;") 
        self.execute_query("DROP TABLE IF EXISTS tipos_ausencia;")
        
        # --- Apaga tabelas de usuário ---
        self.execute_query("DROP TABLE IF EXISTS usuarios;")
        self.execute_query("DROP TABLE IF EXISTS roles;")
        
        self.execute_query("DROP TABLE IF EXISTS funcionarios;")
        self.execute_query("DROP TABLE IF EXISTS cargos;")
        self.execute_query("DROP TABLE IF EXISTS departamentos;")
        self.execute_query("DROP TABLE IF EXISTS bancos;")
        self.execute_query("DROP TABLE IF EXISTS senioridades;")
        self.execute_query("DROP TABLE IF EXISTS beneficios;")

        # --- Tabela de Roles (Permissões) ---
        self.execute_query("""
        CREATE TABLE roles (
            id INTEGER PRIMARY KEY,
            nome TEXT NOT NULL UNIQUE
        );
        """)
        self.execute_many("INSERT INTO roles (nome) VALUES (?);", [('Administrador',), ('Gestor',), ('Usuario',)])

        # --- Tabela de Usuários ---
        self.execute_query("""
        CREATE TABLE usuarios (
            id INTEGER PRIMARY KEY,
            nome_completo TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            foto_perfil TEXT,
            role_id INTEGER NOT NULL,
            funcionario_id INTEGER,
            FOREIGN KEY (role_id) REFERENCES roles (id),
            FOREIGN KEY (funcionario_id) REFERENCES funcionarios (id) ON DELETE SET NULL
        );
        """)

        # --- Criação das Tabelas de Apoio (Lookup Tables) ---
        self.execute_query("CREATE TABLE departamentos (id INTEGER PRIMARY KEY, nome TEXT NOT NULL UNIQUE);")
        self.execute_query("CREATE TABLE cargos (id INTEGER PRIMARY KEY, nome TEXT NOT NULL UNIQUE);")
        self.execute_query("CREATE TABLE bancos (id INTEGER PRIMARY KEY, nome TEXT NOT NULL UNIQUE);")
        self.execute_query("CREATE TABLE senioridades (id INTEGER PRIMARY KEY, nome TEXT NOT NULL UNIQUE);")
        self.execute_query("CREATE TABLE beneficios (id INTEGER PRIMARY KEY, nome TEXT NOT NULL UNIQUE, tipo_beneficio TEXT NOT NULL);")
        
        self.execute_query("""
        CREATE TABLE tipos_ausencia (
            id INTEGER PRIMARY KEY,
            nome TEXT NOT NULL UNIQUE,
            desconta_saldo INTEGER NOT NULL DEFAULT 0 CHECK(desconta_saldo IN (0, 1))
        );
        """)

        query_funcionarios = """
        CREATE TABLE funcionarios (
            id INTEGER PRIMARY KEY,
            nome TEXT NOT NULL,
            status TEXT DEFAULT 'Ativo',
            data_admissao DATE,
            departamento_id INTEGER,
            cargo_id INTEGER,
            senioridade_id INTEGER,
            salario REAL,
            email TEXT UNIQUE,
            telefone TEXT,
            endereco TEXT,
            cidade TEXT,
            estado TEXT,
            cep TEXT,
            pais TEXT,
            data_nascimento DATE,
            genero TEXT,
            nacionalidade TEXT,
            numero_identificacao TEXT UNIQUE,
            banco_id INTEGER,
            agencia TEXT,
            conta TEXT,
            tipo_contrato TEXT,
            jornada_trabalho TEXT,
            saldo_ferias REAL DEFAULT 30, 
            observacoes TEXT,
            FOREIGN KEY (departamento_id) REFERENCES departamentos (id),
            FOREIGN KEY (cargo_id) REFERENCES cargos (id),
            FOREIGN KEY (banco_id) REFERENCES bancos (id),
            FOREIGN KEY (senioridade_id) REFERENCES senioridades (id)
        );
        """
        self.execute_query(query_funcionarios)
        
        query_solicitacoes_ausencia = """
        CREATE TABLE solicitacoes_ausencia (
            id INTEGER PRIMARY KEY,
            funcionario_id INTEGER NOT NULL,
            tipo_ausencia_id INTEGER NOT NULL,
            data_inicio DATE NOT NULL,
            data_fim DATE NOT NULL,
            dias_solicitados REAL NOT NULL,
            motivo_solicitante TEXT,
            anexo_path TEXT,
            status TEXT NOT NULL DEFAULT 'Pendente',
            gestor_id INTEGER,
            justificativa_gestor TEXT,
            data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            data_decisao DATETIME,
            FOREIGN KEY (funcionario_id) REFERENCES funcionarios (id) ON DELETE CASCADE,
            FOREIGN KEY (tipo_ausencia_id) REFERENCES tipos_ausencia (id),
            FOREIGN KEY (gestor_id) REFERENCES funcionarios (id)
        );
        """
        self.execute_query(query_solicitacoes_ausencia)

        query_funcionario_beneficios = """
        CREATE TABLE funcionario_beneficios (
            funcionario_id INTEGER,
            beneficio_id INTEGER,
            PRIMARY KEY (funcionario_id, beneficio_id),
            FOREIGN KEY (funcionario_id) REFERENCES funcionarios (id) ON DELETE CASCADE,
            FOREIGN KEY (beneficio_id) REFERENCES beneficios (id) ON DELETE CASCADE
        );
        """
        self.execute_query(query_funcionario_beneficios)
        
        print("Tabelas (incluindo Usuários e Roles) recriadas com sucesso!")

    # =================================================================
    # --- FUNÇÕES DE AUTENTICAÇÃO ---
    # =================================================================

    def find_user_by_email(self, email):
        """Busca um usuário pelo email para o login."""
        query = """
        SELECT u.*, r.nome AS role_nome 
        FROM usuarios u
        JOIN roles r ON u.role_id = r.id
        WHERE u.email = ?;
        """
        rows = self.fetch_query(query, (email,))
        return dict(rows[0]) if rows else None

    def find_user_by_id(self, user_id):
        """Busca um usuário pelo ID para o gerenciador de sessão."""
        query = """
        SELECT u.*, r.nome AS role_nome 
        FROM usuarios u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?;
        """
        rows = self.fetch_query(query, (user_id,))
        return dict(rows[0]) if rows else None

    def create_user(self, nome_completo, email, password_hash, role_nome):
        """Cria um novo usuário."""
        role_id_row = self.fetch_query("SELECT id FROM roles WHERE nome = ?", (role_nome,))
        if not role_id_row:
            raise ValueError(f"Role '{role_nome}' não encontrada.")
        role_id = role_id_row[0]['id']
        
        query = """
        INSERT INTO usuarios (nome_completo, email, password_hash, role_id)
        VALUES (?, ?, ?, ?);
        """
        cursor = self.execute_query(query, (nome_completo, email, password_hash, role_id))
        return cursor.lastrowid

    # =================================================================
    # --- CRUD DE FUNCIONÁRIOS (COM ORDENAÇÃO) ---
    # =================================================================

    def create_funcionario(self, funcionario_data):
        # ... (código igual) ...
        beneficios_ids = funcionario_data.pop('beneficios', [])
        columns = ', '.join(funcionario_data.keys())
        placeholders = ', '.join(['?'] * len(funcionario_data))
        query = f"INSERT INTO funcionarios ({columns}) VALUES ({placeholders});"
        cursor = self.execute_query(query, tuple(funcionario_data.values()))
        novo_id = cursor.lastrowid
        if novo_id and beneficios_ids:
            for beneficio_id in beneficios_ids:
                self.execute_query("INSERT INTO funcionario_beneficios (funcionario_id, beneficio_id) VALUES (?, ?);", (novo_id, beneficio_id))
        return novo_id

    # --- (MODIFICADO) Função com ORDENAÇÃO ---
    def read_all_funcionarios(self, page=1, limit=10, id_str=None, nome=None, cargo_nome=None, sort_by='id', order='DESC'):
        """Lê todos os funcionários com filtros, paginação, benefícios E ORDENAÇÃO."""
        
        params = []
        where_clauses = ["1=1"] 
        
        if id_str:
            try:
                id_int = int(id_str)
                where_clauses.append("f.id = ?")
                params.append(id_int)
            except ValueError:
                pass 
        
        if nome:
            where_clauses.append("f.nome LIKE ?")
            params.append(f"%{nome}%")
            
        if cargo_nome:
            where_clauses.append("c.nome LIKE ?")
            params.append(f"%{cargo_nome}%")
        
        where_sql = " AND ".join(where_clauses)
        
        # --- LÓGICA DE ORDENAÇÃO SEGURA ---
        valid_sort_columns = {
            'id': 'f.id',
            'nome': 'f.nome',
            'email': 'f.email',
            'cargo': 'c.nome',
            'depto': 'd.nome',
            'admissao': 'f.data_admissao',
            'status': 'f.status'
        }
        
        sort_column = valid_sort_columns.get(sort_by, 'f.id')
        safe_order = 'ASC' if order.upper() == 'ASC' else 'DESC'
        order_by_sql = f"ORDER BY {sort_column} {safe_order}"
        # --- FIM DA NOVA LÓGICA ---

        count_query = f"""
        SELECT COUNT(f.id) 
        FROM funcionarios f
        LEFT JOIN cargos c ON f.cargo_id = c.id
        LEFT JOIN departamentos d ON f.departamento_id = d.id
        WHERE {where_sql};
        """
        total_items = self.fetch_query(count_query, tuple(params))[0][0]
        total_pages = math.ceil(total_items / limit) if total_items > 0 else 1
        offset = (page - 1) * limit

        data_query = f"""
        SELECT f.*, 
               d.nome AS departamento_nome, 
               c.nome AS cargo_nome,
               s.nome AS senioridade_nome,
               (SELECT GROUP_CONCAT(b.nome, ', ') 
                FROM beneficios b
                JOIN funcionario_beneficios fb ON b.id = fb.beneficio_id
                WHERE fb.funcionario_id = f.id) AS beneficios_lista
        FROM funcionarios f
        LEFT JOIN departamentos d ON f.departamento_id = d.id
        LEFT JOIN cargos c ON f.cargo_id = c.id
        LEFT JOIN senioridades s ON f.senioridade_id = s.id
        WHERE {where_sql}
        {order_by_sql} -- SUBSTITUÍDO
        LIMIT ? OFFSET ?;
        """
        
        params_paginated = params + [limit, offset]
        rows = self.fetch_query(data_query, tuple(params_paginated))
        data = [dict(row) for row in rows]
        
        pagination = {
            "currentPage": page,
            "totalPages": total_pages,
            "totalItems": total_items,
            "itemsPerPage": limit
        }
        
        return data, pagination
    
    # ... (read_funcionario_by_id, update_funcionario, delete_funcionario... iguais) ...
    def read_funcionario_by_id(self, funcionario_id):
        query = """
        SELECT f.*, 
               (SELECT GROUP_CONCAT(fb.beneficio_id) 
                FROM funcionario_beneficios fb 
                WHERE fb.funcionario_id = f.id) AS beneficios
        FROM funcionarios f 
        WHERE f.id = ?;
        """
        rows = self.fetch_query(query, (funcionario_id,))
        if not rows:
            return None
        
        funcionario = dict(rows[0])
        if funcionario.get('beneficios'):
            funcionario['beneficios'] = [int(id_str) for id_str in funcionario['beneficios'].split(',')]
        else:
            funcionario['beneficios'] = []
            
        return funcionario

    def update_funcionario(self, funcionario_id, funcionario_data):
        beneficios_ids = funcionario_data.pop('beneficios', None)
        
        if funcionario_data:
            set_clause = ', '.join([f'{key} = ?' for key in funcionario_data.keys()])
            query = f"UPDATE funcionarios SET {set_clause} WHERE id = ?;"
            params = tuple(funcionario_data.values()) + (funcionario_id,)
            self.execute_query(query, params)

        if beneficios_ids is not None:
            self.execute_query("DELETE FROM funcionario_beneficios WHERE funcionario_id = ?;", (funcionario_id,))
            
            if beneficios_ids:
                beneficios_tuplas = [(funcionario_id, b_id) for b_id in beneficios_ids]
                self.execute_many("INSERT INTO funcionario_beneficios (funcionario_id, beneficio_id) VALUES (?, ?);", beneficios_tuplas)
        
        return True

    def delete_funcionario(self, funcionario_id):
        query = "UPDATE funcionarios SET status = 'Inativo' WHERE id = ?;"
        cursor = self.execute_query(query, (funcionario_id,))
        return cursor.rowcount > 0

    # --- Métodos de Leitura Padronizados ---
    def read_all_departamentos(self):
        return [dict(row) for row in self.fetch_query("SELECT id, nome FROM departamentos;")]
    def read_all_cargos(self):
        return [dict(row) for row in self.fetch_query("SELECT id, nome FROM cargos;")]
    def read_all_bancos(self):
        return [dict(row) for row in self.fetch_query("SELECT id, nome FROM bancos;")]
    def read_all_senioridades(self):
        return [dict(row) for row in self.fetch_query("SELECT id, nome FROM senioridades;")]
    def read_all_beneficios(self):
        return [dict(row) for row in self.fetch_query("SELECT id, nome, tipo_beneficio FROM beneficios;")]
    
    def read_all_funcionarios_nomes(self):
        query = "SELECT id, nome, saldo_ferias FROM funcionarios WHERE status = 'Ativo' ORDER BY nome;"
        return [dict(row) for row in self.fetch_query(query)]

    # =================================================================
    # --- CRUD MÓDULO DE AUSÊNCIAS (COM ORDENAÇÃO) ---
    # =================================================================

    def read_all_tipos_ausencia(self):
        return [dict(row) for row in self.fetch_query("SELECT id, nome, desconta_saldo FROM tipos_ausencia;")]

    def create_solicitacao_ausencia(self, data):
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['?'] * len(data))
        query = f"INSERT INTO solicitacoes_ausencia ({columns}) VALUES ({placeholders});"
        cursor = self.execute_query(query, tuple(data.values()))
        return cursor.lastrowid

    # --- (MODIFICADO) Função com ORDENAÇÃO ---
    def read_all_solicitacoes(self, sort_by='data_solicitacao', order='DESC'):
        """Lê todas as solicitações, juntando os nomes E COM ORDENAÇÃO."""
        
        # --- LÓGICA DE ORDENAÇÃO SEGURA ---
        valid_sort_columns = {
            'id': 's.id',
            'funcionario': 'f.nome',
            'tipo': 't.nome',
            'inicio': 's.data_inicio',
            'fim': 's.data_fim',
            'dias': 's.dias_solicitados',
            'status': 's.status',
            'data_solicitacao': 's.data_solicitacao' # Coluna padrão
        }
        
        sort_column = valid_sort_columns.get(sort_by, 's.data_solicitacao')
        safe_order = 'ASC' if order.upper() == 'ASC' else 'DESC'
        order_by_sql = f"ORDER BY {sort_column} {safe_order}"
        # --- FIM DA NOVA LÓGICA ---
        
        query = f"""
        SELECT 
            s.*,
            f.nome AS funcionario_nome,
            t.nome AS tipo_ausencia_nome,
            g.nome AS gestor_nome
        FROM solicitacoes_ausencia s
        JOIN funcionarios f ON s.funcionario_id = f.id
        JOIN tipos_ausencia t ON s.tipo_ausencia_id = t.id
        LEFT JOIN funcionarios g ON s.gestor_id = g.id
        {order_by_sql}; -- SUBSTITUÍDO
        """
        return [dict(row) for row in self.fetch_query(query)]

    def update_solicitacao_status(self, solicitacao_id, gestor_id, status, justificativa):
        # ... (código igual) ...
        solicitacao_row = self.fetch_query("""
            SELECT s.dias_solicitados, s.funcionario_id, t.desconta_saldo, s.status
            FROM solicitacoes_ausencia s
            JOIN tipos_ausencia t ON s.tipo_ausencia_id = t.id
            WHERE s.id = ?
        """, (solicitacao_id,))
        
        if not solicitacao_row:
            raise ValueError("Solicitação não encontrada.")
            
        solicitacao = dict(solicitacao_row[0])

        if solicitacao['status'] == 'Aprovado' and status == 'Aprovado':
            raise ValueError("Esta solicitação já foi aprovada.")

        if status == 'Aprovado' and solicitacao['desconta_saldo'] == 1:
            saldo_atual_row = self.fetch_query("SELECT saldo_ferias FROM funcionarios WHERE id = ?", (solicitacao['funcionario_id'],))
            saldo_atual = saldo_atual_row[0]['saldo_ferias']
            
            if saldo_atual < solicitacao['dias_solicitados']:
                raise ValueError(f"Saldo insuficiente. Saldo atual: {saldo_atual} dias.")
                
            self.execute_query(
                "UPDATE funcionarios SET saldo_ferias = saldo_ferias - ? WHERE id = ?;",
                (solicitacao['dias_solicitados'], solicitacao['funcionario_id'])
            )
        
        if solicitacao['status'] == 'Aprovado' and status != 'Aprovado' and solicitacao['desconta_saldo'] == 1:
             self.execute_query(
                "UPDATE funcionarios SET saldo_ferias = saldo_ferias + ? WHERE id = ?;",
                (solicitacao['dias_solicitados'], solicitacao['funcionario_id'])
            )

        query = """
        UPDATE solicitacoes_ausencia
        SET status = ?,
            gestor_id = ?,
            justificativa_gestor = ?,
            data_decisao = CURRENT_TIMESTAMP
        WHERE id = ?;
        """
        cursor = self.execute_query(query, (status, gestor_id, justificativa, solicitacao_id))
        return cursor.rowcount > 0