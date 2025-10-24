document.addEventListener('DOMContentLoaded', function() {
    
    // =================================================================
    // --- ELEMENTOS DO DOM (AUTENTICAÇÃO) ---
    // =================================================================
    const loginPage = document.getElementById('login-page');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    
    // --- ELEMENTOS DO DOM (APP) ---
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('#toggle-btn');
    const menuLinks = document.querySelectorAll('.menu-links a');
    const pages = document.querySelectorAll('.page-content');
    
    // --- Elementos do Header Principal ---
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    const userProfileButton = document.getElementById('user-profile-button');
    const userProfileDropdown = document.getElementById('user-profile-dropdown');
    const userProfileMenu = document.getElementById('user-profile-menu'); 
    const logoutButton = document.getElementById('logout-button');
    const userNameDisplay = document.getElementById('user-name');
    const userRoleDisplay = document.getElementById('user-role');
    const userAvatarDisplay = document.getElementById('user-avatar');

    // --- Links do Dropdown (para navegação) ---
    const dropdownLinks = document.querySelectorAll('.profile-dropdown .dropdown-item');
    
    // --- Página: Funcionários ---
    const tableBody = document.getElementById('funcionarios-table-body');
    const modal = document.getElementById('funcionario-modal');
    const btnNovoFuncionario = document.getElementById('btn-novo-funcionario');
    

    // --- (NOVO) Elementos da Página de Configurações ---
    const addUserForm = document.getElementById('add-user-form');
    const newUserNameInput = document.getElementById('new-user-name');
    const newUserEmailInput = document.getElementById('new-user-email');
    const newUserPasswordInput = document.getElementById('new-user-password');
    const newUserRoleSelect = document.getElementById('new-user-role');
    const addUserMessage = document.getElementById('add-user-message');

const btnCancelarModal = document.getElementById('btn-cancelar-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const funcionarioForm = document.getElementById('funcionario-form');
    const modalTitle = document.getElementById('modal-title');
    const statusToggle = document.getElementById('status-toggle');
    const statusHiddenInput = document.getElementById('status');
    const statusBadgeText = document.getElementById('status-badge-text');
    const confirmModal = document.getElementById('confirm-delete-modal');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    let employeeIdToDelete = null;
    const btnFiltrar = document.getElementById('btn-filtrar');
    const btnLimpar = document.getElementById('btn-limpar');
    const filterId = document.getElementById('filter-id');
    const filterNome = document.getElementById('filter-nome');
    const filterCargo = document.getElementById('filter-cargo');
    const paginationInfo = document.getElementById('pagination-info');
    const paginationControls = document.getElementById('pagination-controls');

    // --- Página: Ausências ---
    const btnNovaAusencia = document.getElementById('btn-nova-ausencia');
    const ausenciaModal = document.getElementById('ausencia-modal');
    const btnCloseAusenciaModal = document.getElementById('btn-close-ausencia-modal');
    const btnCancelarAusencia = document.getElementById('btn-cancelar-ausencia');
    const ausenciaForm = document.getElementById('ausencia-form');
    const ausenciasTableBody = document.getElementById('ausencias-table-body');
    const tipoAusenciaSelect = document.getElementById('tipo_ausencia_id');
    const ausenciaFuncionarioSelect = document.getElementById('ausencia_funcionario_id');
    const rejectModal = document.getElementById('confirm-reject-modal');
    const btnCancelReject = document.getElementById('btn-cancel-reject');
    const btnConfirmReject = document.getElementById('btn-confirm-reject');
    const rejectJustificativaInput = document.getElementById('rejeicao-justificativa');
    let absenceIdToReject = null; 

    // --- Seletores e instâncias do Choices.js ---
    const deptoSelect = document.getElementById('departamento_id');
    const cargoSelect = document.getElementById('cargo_id');
    const bancoSelect = document.getElementById('banco_id');
    const senioridadeSelect = document.getElementById('senioridade_id');
    const beneficiosSelect = document.getElementById('beneficios');
    let deptoChoices, cargoChoices, bancoChoices, senioridadeChoices, beneficiosChoices;
    let ausenciaFuncionarioChoices;

    // --- Instâncias dos Gráficos ---
    let deptChartInstance = null;
    let ausenciaTipoChartInstance = null;
    let ausenciaStatusChartInstance = null; 
    let senioridadeChartInstance = null; 

    // --- ESTADO DA APLICAÇÃO ---
    const API_BASE_URL = 'http://localhost:5000/api';
    let currentPage = 1;
    let itemsPerPage = 10;
    
    // --- Estado de Ordenação ---
    let currentSortFunc = { by: 'id', order: 'ASC' }; // ASC como padrão
    let currentSortAus = { by: 'data_solicitacao', order: 'ASC' }; // ASC como padrão

    // --- Estado do Usuário Logado ---
    let currentUserRole = null;
    let currentUserData = null; // Guarda todos os dados do usuário logado

    // --- Títulos das Páginas ---
    const pageInfo = {
        'Home': { title: 'Dashboard', subtitle: 'Visão geral do sistema' },
        'Funcionarios': { title: 'Funcionários', subtitle: 'Cadastro e Edição' },
        'Ausencias': { title: 'Controle de Ausências', subtitle: 'Gestão de férias, licenças e faltas' },
        'Configuracoes': { title: 'Configurações', subtitle: 'Gerenciamento do sistema' },
        'Perfil': { title: 'Meu Perfil', subtitle: 'Suas informações pessoais' }
    };
    
    // --- Mapa de Páginas Atualizado ---
    const pageMap = {
        'Home': 'page-home',
        'Funcionarios': 'page-funcionarios',
        'Ausencias': 'page-ausencias',
        'Configuracoes': 'page-configuracoes',
        'Perfil': 'page-perfil'
    };
    
    // --- Flags de carregamento ---
    let dataLoadFlags = {
        'page-home': false,
        'page-funcionarios': false,
        'page-ausencias': false,
        'page-configuracoes': false, // Adicionado
        'page-perfil': false // Adicionado
    };


    // =================================================================
    // --- FUNÇÕES DA API (COM TRATAMENTO DE AUTH) ---
    // =================================================================

    async function apiRequest(endpoint, method = 'GET', bodyData = null) {
        const url = `${API_BASE_URL}/${endpoint}`;
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' // Envia o cookie de sessão
        };

        if (bodyData) {
            options.body = JSON.stringify(bodyData);
        }

        try {
            const response = await fetch(url, options);

            if (response.status === 401) {
                console.error("Sessão expirada ou não autorizado. Redirecionando para login.");
                redirectToLogin();
                return null; 
            }
            
            // Tenta ler como JSON, mesmo se não for OK, para pegar a mensagem de erro
            const data = await response.json().catch(() => ({ error: `Erro ${response.status}: ${response.statusText}` }));
            
            if (!response.ok) {
                throw new Error(data.error || `Erro HTTP: ${response.status}`);
            }
            
            return data;
            
        } catch (error) {
            console.error(`Falha na API para ${endpoint}:`, error.message);
            if (error.message.includes("401")) return null; // Evita alert duplicado
            
            // Exibe o erro de forma mais amigável
            alert(`Erro na operação: ${error.message}`); 
            return null;
        }
    }

    // Funções helper
    async function apiFetch(endpoint) { return apiRequest(endpoint, 'GET'); }
    async function apiPost(endpoint, bodyData) { return apiRequest(endpoint, 'POST', bodyData); }
    async function apiUpdate(endpoint, id, bodyData) { return apiRequest(`${endpoint}/${id}`, 'PUT', bodyData); }
    async function apiDelete(endpoint, id) { return apiRequest(`${endpoint}/${id}`, 'DELETE'); }
    async function apiUpdateStatus(endpoint, id, bodyData) { return apiRequest(`${endpoint}/${id}/status`, 'PUT', bodyData); }
    // Nova função helper para cancelar
    async function apiCancelSolicitacao(id) { return apiRequest(`ausencias/solicitacoes/${id}/cancel`, 'PUT'); }
    
    // =================================================================
    // --- LÓGICA DE AUTENTICAÇÃO E SESSÃO ---
    // =================================================================
    
    async function handleLogin(event) {
        event.preventDefault();
        loginError.style.display = 'none';
        
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || "Erro desconhecido ao tentar logar");
            }

            console.log("Login OK:", data.user);
            showApp(data.user);

        } catch (error) {
            loginError.textContent = `Erro: ${error.message}`;
            loginError.style.display = 'block';
        }
    }

    async function handleLogout() {
        const result = await apiPost('logout');
        if(result) { // Só redireciona se o logout deu certo
            redirectToLogin();
        }
    }
    
    function redirectToLogin() {
        currentUserData = null; // Limpa dados do usuário
        currentUserRole = null;
        appContainer.style.display = 'none';
        loginPage.style.display = 'flex';
        // Limpa inputs do login para segurança
        loginEmailInput.value = '';
        loginPasswordInput.value = '';
        loginError.style.display = 'none';
    }

    function showApp(userData) {
        loginPage.style.display = 'none';
        appContainer.style.display = 'flex'; // Corrigido para flex

        // --- Armazena dados e atualiza UI ---
        currentUserData = userData;
        currentUserRole = userData.role;
        updateUIForRole(currentUserRole);
        // --- Fim ---

        // Popula o menu de perfil
        userNameDisplay.textContent = userData.nome || 'Usuário';
        userRoleDisplay.textContent = `[${userData.role || 'N/A'}]`;
        userAvatarDisplay.src = userData.foto || 'avatar_placeholder.png'; // Usa placeholder se não tiver foto
        
        // Carrega a página inicial (Home por padrão)
        showPage('Home');
    }

    // =================================================================
    // --- LÓGICA DE NAVEGAÇÃO SPA ---
    // =================================================================
    
    async function showPage(pageKey) {
        const pageId = pageMap[pageKey];
        if (!pageId) {
            console.error(`Chave de página inválida: ${pageKey}`);
            return;
        }
        
        // Esconde todas as páginas
        pages.forEach(page => { page.style.display = 'none'; });
        
        // Mostra a página ativa
        const activePage = document.getElementById(pageId);
        if (activePage) {
            activePage.style.display = 'block';
            
            // Atualiza o título no header principal
            const info = pageInfo[pageKey];
            if (info) {
                pageTitle.textContent = info.title;
                pageSubtitle.textContent = info.subtitle;
            }
        } else {
            console.error(`Elemento da página não encontrado: ${pageId}`);
            return; // Sai se a página não existe no HTML
        }
        
        // Atualiza o menu lateral
        document.querySelector('.menu-links li.active')?.classList.remove('active');
        document.querySelector(`.menu-links a[data-page="${pageKey}"]`)?.closest('li').classList.add('active');

        // Carrega os dados da página (apenas na primeira vez ou se necessário recarregar)
        await loadPageData(pageId);
    }
    
    async function loadPageData(pageId) {
        // Se a role ainda não foi definida (primeiro carregamento), espera
        if (!currentUserRole) {
            console.log("Aguardando definição da role do usuário...");
            return; 
        }

        // Não recarrega se já carregou, exceto para Home que pode precisar atualizar KPIs
        if (dataLoadFlags[pageId] && pageId !== 'page-home') return; 

        console.log(`Carregando dados para ${pageId}...`);

        try {
            switch (pageId) {
                case 'page-home':
                    await loadDashboardData();
                    break;
                case 'page-funcionarios':
                    if (currentUserRole === 'Administrador' || currentUserRole === 'Gestor') {
                        await refreshFuncionariosList();
                        if (!dataLoadFlags[pageId]) await populateSelectBoxes(); // Popula selects só na 1a vez
                    } else {
                        console.warn("Usuário sem permissão para carregar dados de funcionários.");
                    }
                    break;
                case 'page-ausencias':
                    await refreshAusenciasList();
                    if (!dataLoadFlags[pageId]) await populateAusenciaPageData(); // Popula selects só na 1a vez
                    break;
                case 'page-configuracoes':
                    // (Lógica futura aqui, só carrega se for Admin)
                    break;
                case 'page-perfil':
                    // (Lógica futura aqui)
                    break;
            }
            dataLoadFlags[pageId] = true; // Marca como carregado após sucesso
        } catch (error) {
            console.error(`Erro ao carregar dados para ${pageId}:`, error);
            // Poderia mostrar uma mensagem de erro na UI aqui
        }
    }
    
    // =================================================================
    // --- LÓGICA DE UI BASEADA NA ROLE ---
    // =================================================================
    
    function updateUIForRole(role) {
        console.log("Atualizando UI para Role:", role);

        // --- Elementos a serem controlados ---
        const navFuncionarios = document.querySelector('.menu-links a[data-page="Funcionarios"]')?.closest('li');
        const navConfiguracoes = document.querySelector('.menu-links a[data-page="Configuracoes"]')?.closest('li');
        const btnNovoFuncionarioWrapper = document.querySelector('#page-funcionarios .header-actions-bar');
        const btnNovaAusenciaWrapper = document.querySelector('#page-ausencias .header-actions-bar');
        // Adicionar seletores para colunas ou botões específicos se necessário

        // Reset: Deixa visível por padrão o que todos podem ver
        if (navFuncionarios) navFuncionarios.style.display = 'none'; // Esconde por padrão
        if (navConfiguracoes) navConfiguracoes.style.display = 'none'; // Esconde por padrão
        if (btnNovoFuncionarioWrapper) btnNovoFuncionarioWrapper.style.display = 'none'; // Esconde por padrão
        if (btnNovaAusenciaWrapper) btnNovaAusenciaWrapper.style.display = 'flex'; // Todos podem solicitar

        // --- Lógica de Visibilidade ---
        if (role === 'Administrador') {
            if (navFuncionarios) navFuncionarios.style.display = 'list-item';
            if (navConfiguracoes) navConfiguracoes.style.display = 'list-item';
            if (btnNovoFuncionarioWrapper) btnNovoFuncionarioWrapper.style.display = 'flex';
        } else if (role === 'Gestor') {
            if (navFuncionarios) navFuncionarios.style.display = 'list-item'; // Gestor pode ver funcionários
        } else if (role === 'Usuario') {
            // Nenhuma ação extra necessária, já que os itens restritos estão escondidos por padrão
        }

        // Força recarregamento/re-renderização das tabelas se já foram carregadas
        // para aplicar filtros visuais e de botões
        if (dataLoadFlags['page-funcionarios']) refreshFuncionariosList();
        if (dataLoadFlags['page-ausencias']) refreshAusenciasList();
    }

    // =================================================================
    // --- SEÇÃO: FUNCIONÁRIOS ---
    // =================================================================
    
    function renderFuncionarios(funcionarios) {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        if (!funcionarios || funcionarios.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Nenhum funcionário encontrado.</td></tr>';
            return;
        }
        funcionarios.forEach(func => {
            const tr = document.createElement('tr');
            const statusClass = func.status === 'Ativo' ? 'status-ativo' : 'status-inativo';
            const dataAdmissao = func.data_admissao ? new Date(func.data_admissao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A';
            
            // --- Lógica Condicional para Ações ---
            let actionsHtml = '<span>N/A</span>'; // Padrão para não-Admins
            if (currentUserRole === 'Administrador') {
                actionsHtml = `
                    <a href="#" class="edit-btn" data-id="${func.id}" title="Editar"><span class="material-symbols-outlined">edit</span></a>
                    <a href="#" class="delete-btn" data-id="${func.id}" title="Inativar"><span class="material-symbols-outlined">delete</span></a>
                `;
            }
            // --- Fim ---

            tr.innerHTML = `
                <td>${String(func.id).padStart(3, '0')}</td>
                <td>${func.nome}</td>
                <td>${func.email || 'N/A'}</td>
                <td>${func.cargo_nome || 'N/A'}</td>
                <td>${func.departamento_nome || 'N/A'}</td>
                <td>${dataAdmissao}</td>
                <td><span class="status ${statusClass}">${func.status}</span></td>
                <td class="table-actions">${actionsHtml}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    async function refreshFuncionariosList() {
        const params = new URLSearchParams({ 
            page: currentPage, 
            limit: itemsPerPage,
            sort_by: currentSortFunc.by,
            order: currentSortFunc.order
        });
        
        const id = filterId.value.trim();
        const nome = filterNome.value.trim();
        const cargo = filterCargo.value.trim();
        if (id) params.append('id_str', id);
        if (nome) params.append('nome', nome);
        if (cargo) params.append('cargo_nome', cargo);

        const response = await apiFetch(`funcionarios?${params.toString()}`); 
        if (response && response.data !== undefined) { // Verifica se 'data' existe, mesmo que seja array vazio
            renderFuncionarios(response.data);
            renderPagination(response.pagination);
        } else if (response === null) {
            // apiFetch já tratou o erro 401/redirect
        } else {
             // Caso a resposta não tenha 'data' ou 'pagination'
             console.warn("Resposta da API de funcionários inesperada:", response);
             renderFuncionarios([]);
             renderPagination(null); // Limpa paginação
        }
    }
    
    // --- Funções do Modal de Funcionários (sem mudanças significativas) ---
    function renderPagination(pagination) {
        if (!paginationControls || !paginationInfo) return;
        paginationControls.innerHTML = '';
        paginationInfo.textContent = ''; // Limpa info
        if (!pagination || pagination.totalItems === 0) {
             paginationInfo.textContent = 'Nenhum item encontrado.';
             return;
        };
        const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(startItem + itemsPerPage - 1, totalItems);
        paginationInfo.textContent = `Mostrando ${startItem}-${endItem} de ${totalItems}`;
        if (totalPages <= 1) return;
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.dataset.page = i;
            if (i === currentPage) { pageButton.classList.add('active'); }
            paginationControls.appendChild(pageButton);
        }
    }
    
    async function populateSelectBoxes() {
        const endpoints = ['departamentos', 'cargos', 'bancos', 'senioridades', 'beneficios'];
        const results = await Promise.all(endpoints.map(ep => apiFetch(ep)));
        // Desestruturação segura
        const [departamentos, cargos, bancos, senioridades, beneficios] = results.map(r => r?.data || []);
        
        const createOptions = (items) => (items || []).map(item => ({ value: item.id, label: `${item.id} - ${item.nome}` }));
        const choicesConfig = { searchEnabled: true, removeItemButton: true, itemSelectText: 'Pressione para selecionar', noResultsText: 'Nenhum resultado', noChoicesText: 'Sem opções' };
        
        // Inicializa Choices apenas se o elemento existir
        if (deptoSelect) {
            if (deptoChoices) deptoChoices.destroy();
            deptoChoices = new Choices(deptoSelect, { ...choicesConfig, choices: [{ value: '', label: 'Selecione...' }, ...createOptions(departamentos)] });
        }
        if (cargoSelect) {
            if (cargoChoices) cargoChoices.destroy();
            cargoChoices = new Choices(cargoSelect, { ...choicesConfig, choices: [{ value: '', label: 'Selecione...' }, ...createOptions(cargos)] });
        }
        if (bancoSelect) {
            if (bancoChoices) bancoChoices.destroy();
            bancoChoices = new Choices(bancoSelect, { ...choicesConfig, choices: [{ value: '', label: 'Selecione...' }, ...createOptions(bancos)] });
        }
        if (senioridadeSelect) {
            if (senioridadeChoices) senioridadeChoices.destroy();
            senioridadeChoices = new Choices(senioridadeSelect, { ...choicesConfig, choices: [{ value: '', label: 'Selecione...' }, ...createOptions(senioridades)] });
        }
        if (beneficiosSelect) {
             if (beneficiosChoices) beneficiosChoices.destroy();
             const gruposDeBeneficios = (beneficios || []).reduce((acc, beneficio) => {
                 const tipo = beneficio.tipo_beneficio || 'Outros'; // Agrupa sem tipo em 'Outros'
                 if (!acc[tipo]) acc[tipo] = [];
                 acc[tipo].push({ value: beneficio.id, label: beneficio.nome });
                 return acc;
             }, {});
             const benefitOptionsGrouped = Object.keys(gruposDeBeneficios).map(grupo => ({ label: grupo, choices: gruposDeBeneficios[grupo] }));
             beneficiosChoices = new Choices(beneficiosSelect, { ...choicesConfig, removeItemButton: true, placeholder: true, placeholderValue: 'Selecione os benefícios...', choices: benefitOptionsGrouped });
        }
    }

    function showModal(funcionario = null) {
        if (!funcionarioForm || !modal) return;
        funcionarioForm.reset();
        document.getElementById('funcionarioId').value = '';
        
        // Reseta Choices
        if (deptoChoices) deptoChoices.setChoiceByValue('');
        if (cargoChoices) cargoChoices.setChoiceByValue('');
        if (bancoChoices) bancoChoices.setChoiceByValue('');
        if (senioridadeChoices) senioridadeChoices.setChoiceByValue('');
        if (beneficiosChoices) beneficiosChoices.removeActiveItems();
        
        if (funcionario) {
            modalTitle.textContent = "Editar Funcionário";
            Object.keys(funcionario).forEach(key => {
                const field = funcionarioForm.querySelector(`[name="${key}"]`);
                if (field && key !== 'beneficios' && key !== 'status') field.value = funcionario[key] ?? ''; // Usa ?? para tratar null/undefined
            });
            // Seta Choices com tratamento para valores nulos/ausentes
            if (deptoChoices) deptoChoices.setChoiceByValue(String(funcionario.departamento_id || ''));
            if (cargoChoices) cargoChoices.setChoiceByValue(String(funcionario.cargo_id || ''));
            if (bancoChoices) bancoChoices.setChoiceByValue(String(funcionario.banco_id || ''));
            if (senioridadeChoices) senioridadeChoices.setChoiceByValue(String(funcionario.senioridade_id || ''));
            if (beneficiosChoices && Array.isArray(funcionario.beneficios)) {
                beneficiosChoices.setChoiceByValue(funcionario.beneficios.map(id => String(id)));
            }
            // Status Toggle
            const isActive = funcionario.status === 'Ativo';
            statusToggle.checked = isActive;
            statusHiddenInput.value = funcionario.status;
            statusBadgeText.textContent = funcionario.status;
            statusBadgeText.classList.toggle('inativo', !isActive);
        } else {
            modalTitle.textContent = "Adicionar Novo Funcionário";
            statusToggle.checked = true;
            statusHiddenInput.value = 'Ativo';
            statusBadgeText.textContent = 'Ativo';
            statusBadgeText.classList.remove('inativo');
        }
        modal.style.display = 'flex';
    }
    function hideModal() { if (modal) modal.style.display = 'none'; }
    function showConfirmModal(id) { employeeIdToDelete = id; if (confirmModal) confirmModal.style.display = 'flex'; }
    function hideConfirmModal() { employeeIdToDelete = null; if (confirmModal) confirmModal.style.display = 'none'; }

    // =================================================================
    // --- SEÇÃO: AUSÊNCIAS ---
    // =================================================================

    async function refreshAusenciasList() {
        const params = new URLSearchParams({
            sort_by: currentSortAus.by,
            order: currentSortAus.order
        });
        
        // TODO: Adicionar filtros de ausência
        // const nome = document.getElementById('filter-aus-nome').value.trim();
        // if (nome) params.append('nome', nome);

        const response = await apiFetch(`ausencias/solicitacoes?${params.toString()}`); 
        if (response && response.data !== undefined) {
            renderAusencias(response.data);
        } else if (response === null) {
            // Erro 401 tratado
        } else {
             console.warn("Resposta da API de ausências inesperada:", response);
             renderAusencias([]);
        }
    }
    
    function renderAusencias(solicitacoes) {
        if (!ausenciasTableBody) return;
        ausenciasTableBody.innerHTML = '';
        
        // Garante que a coluna funcionário e seu header existam antes de manipular
        const thFuncionario = document.querySelector('#page-ausencias .staff-table th.col-funcionario');
        
        if (!solicitacoes || solicitacoes.length === 0) {
            // Ajusta colspan se a coluna funcionário estiver oculta
            const colspan = (thFuncionario && thFuncionario.style.display === 'none') ? 7 : 8;
            ausenciasTableBody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center;">Nenhuma solicitação de ausência encontrada.</td></tr>`;
            return;
        }

        // Esconde/mostra header ANTES do loop
        if (thFuncionario) {
             thFuncionario.style.display = (currentUserRole === 'Usuario') ? 'none' : '';
        }

        solicitacoes.forEach(sol => {
            const tr = document.createElement('tr');
            const dataInicio = new Date(sol.data_inicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            const dataFim = new Date(sol.data_fim).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            let statusClass = '';
            if (sol.status === 'Aprovado') statusClass = 'status-ativo';
            else if (sol.status === 'Recusado') statusClass = 'status-inativo';
            else if (sol.status === 'Cancelado') statusClass = 'status-inativo'; // Reutiliza estilo 'inativo'
            else statusClass = 'status-pendente'; // Pendente

            // --- Lógica Condicional para Ações ---
            let actionsHtml = '';
            if (sol.status === 'Pendente') {
                if (currentUserRole === 'Administrador' || currentUserRole === 'Gestor') {
                    actionsHtml = `
                        <div class="table-actions-wrapper">
                            <button class="btn-action-table approve-btn" data-id="${sol.id}" title="Aprovar"><span class="material-symbols-outlined">check_circle</span></button>
                            <button class="btn-action-table reject-btn" data-id="${sol.id}" title="Recusar"><span class="material-symbols-outlined">cancel</span></button>
                        </div>`;
                } else if (currentUserRole === 'Usuario' && currentUserData && sol.funcionario_id === currentUserData.funcionario_id) {
                     actionsHtml = `
                        <div class="table-actions-wrapper">
                            <button class="btn-action-table cancel-btn" data-id="${sol.id}" title="Cancelar Solicitação"><span class="material-symbols-outlined">cancel_schedule_send</span></button>
                        </div>`;
                } else {
                     actionsHtml = '<span>Pendente</span>';
                }
            } else if (sol.status === 'Cancelado') {
                 actionsHtml = '<span>Cancelado</span>';
            } else { // Aprovado ou Recusado
                const justificativa = sol.justificativa_gestor ? ` title="Justificativa: ${sol.justificativa_gestor}"` : '';
                actionsHtml = `<span${justificativa}>Decidido por ${sol.gestor_nome || 'N/A'}</span>`;
            }
            // --- Fim ---

            // --- Esconder coluna Funcionário para Usuario ---
            let funcionarioCell = `<td>${sol.funcionario_nome}</td>`;
            if (currentUserRole === 'Usuario') {
                funcionarioCell = `<td style="display: none;">${sol.funcionario_nome}</td>`; 
            }
            // --- Fim ---

            tr.innerHTML = `
                <td>${String(sol.id).padStart(3, '0')}</td>
                ${funcionarioCell}
                <td>${sol.tipo_ausencia_nome}</td>
                <td>${dataInicio}</td>
                <td>${dataFim}</td>
                <td>${sol.dias_solicitados}</td>
                <td><span class="status ${statusClass}">${sol.status}</span></td>
                <td class="table-actions-ausencia">${actionsHtml}</td>
            `;
            ausenciasTableBody.appendChild(tr);
        });
    }

    async function populateAusenciaPageData() {
        // Roda em paralelo
        const [tiposResponse, funcionariosResponse] = await Promise.all([
            apiFetch('ausencias/tipos'),
            apiFetch('funcionarios/nomes') 
        ]);

        if (tiposResponse?.data) {
            const tipos = tiposResponse.data;
            tipoAusenciaSelect.innerHTML = '<option value="">Selecione um tipo...</option>';
            tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.id;
                option.textContent = tipo.nome;
                option.dataset.descontaSaldo = tipo.desconta_saldo;
                tipoAusenciaSelect.appendChild(option);
            });
            // Popula filtro também
            const filterTipoSelect = document.getElementById('filter-aus-tipo');
            if (filterTipoSelect) {
                filterTipoSelect.innerHTML = '<option value="">Todos os Tipos</option>';
                tipos.forEach(tipo => {
                    const option = document.createElement('option');
                    option.value = tipo.id;
                    option.textContent = tipo.nome;
                    filterTipoSelect.appendChild(option);
                });
            }
        }

        if (funcionariosResponse?.data) {
            const funcionarios = funcionariosResponse.data.map(func => ({
                value: func.id,
                label: `${String(func.id).padStart(3, '0')} - ${func.nome}`,
                customProperties: { saldo: func.saldo_ferias ?? 0 } // Usa ?? para saldo null/undefined
            }));
            const choicesConfig = { searchEnabled: true, itemSelectText: 'Pressione para selecionar', noResultsText: 'Nenhum resultado', noChoicesText: 'Sem opções' };
            if (ausenciaFuncionarioSelect) {
                if (ausenciaFuncionarioChoices) ausenciaFuncionarioChoices.destroy(); // Limpa instância anterior
                ausenciaFuncionarioChoices = new Choices(ausenciaFuncionarioSelect, {
                    ...choicesConfig,
                    choices: [{ value: '', label: 'Selecione o funcionário...' }, ...funcionarios]
                });

                 // Se for usuário comum, pré-seleciona e desabilita
                 if (currentUserRole === 'Usuario' && currentUserData?.funcionario_id) {
                     ausenciaFuncionarioChoices.setChoiceByValue(String(currentUserData.funcionario_id));
                     ausenciaFuncionarioChoices.disable();
                 } else {
                      ausenciaFuncionarioChoices.enable(); // Garante que esteja habilitado para Admin/Gestor
                 }
            }
        }
    }

    function showAusenciaModal() { 
        if(ausenciaModal) {
            // Reseta e ajusta o select de funcionário ANTES de mostrar
             if(ausenciaFuncionarioChoices) {
                if (currentUserRole === 'Usuario' && currentUserData?.funcionario_id) {
                    ausenciaFuncionarioChoices.setChoiceByValue(String(currentUserData.funcionario_id));
                    ausenciaFuncionarioChoices.disable();
                } else {
                    ausenciaFuncionarioChoices.setChoiceByValue(''); // Limpa seleção
                    ausenciaFuncionarioChoices.enable(); // Habilita
                }
             }
             if(ausenciaForm) ausenciaForm.reset(); // Reseta outros campos
             document.getElementById('saldo-ferias-display').value = 'N/A'; // Reseta saldo

             ausenciaModal.style.display = 'flex'; 
        }
    }
    function hideAusenciaModal() { 
        if(ausenciaModal) ausenciaModal.style.display = 'none'; 
        // Não precisa resetar aqui, fazemos ao abrir
    }
    function showRejectModal(id) {
        absenceIdToReject = id;
        if(rejectModal) {
            rejectJustificativaInput.value = ''; 
            rejectModal.style.display = 'flex';
            rejectJustificativaInput.focus(); 
        }
    }
    function hideRejectModal() {
        absenceIdToReject = null;
        if(rejectModal) rejectModal.style.display = 'none';
    }

    // =================================================================
    // --- SEÇÃO: DASHBOARD (Sem mudanças lógicas) ---
    // =================================================================
    
    async function loadDashboardData() {
        // Roda em paralelo
        const [funcionariosResponse, ausenciasResponse] = await Promise.all([
            apiFetch('funcionarios?limit=9999'), // Pega todos para KPIs precisos
            apiFetch('ausencias/solicitacoes?limit=9999') // Pega todos para KPIs precisos
        ]);
        
        // Tratamento seguro dos dados
        const funcionarios = funcionariosResponse?.data || []; 
        const solicitacoes = ausenciasResponse?.data || [];

        const totalFuncionarios = funcionarios.length;
        const funcionariosAtivos = funcionarios.filter(f => f.status === 'Ativo').length;
        const ausenciasPendentes = solicitacoes.filter(s => s.status === 'Pendente').length;

        // Atualiza KPIs (com verificação se elementos existem)
        const kpiTotal = document.getElementById('kpi-total-funcionarios');
        const kpiAtivos = document.getElementById('kpi-funcionarios-ativos');
        const kpiPendentes = document.getElementById('kpi-ausencias-pendentes');
        if (kpiTotal) kpiTotal.textContent = totalFuncionarios;
        if (kpiAtivos) kpiAtivos.textContent = funcionariosAtivos;
        if (kpiPendentes) kpiPendentes.textContent = ausenciasPendentes;

        // Processa dados para gráficos (sem mudanças)
        const funcionariosPorDepto = funcionarios.filter(f => f.status === 'Ativo').reduce((acc, func) => { const n = func.departamento_nome || 'N/A'; acc[n] = (acc[n] || 0) + 1; return acc; }, {});
        const funcionariosPorSenioridade = funcionarios.filter(f => f.status === 'Ativo').reduce((acc, func) => { const n = func.senioridade_nome || 'N/A'; acc[n] = (acc[n] || 0) + 1; return acc; }, {});
        const ausenciasPorTipo = solicitacoes.filter(s => s.status === 'Aprovado').reduce((acc, sol) => { const n = sol.tipo_ausencia_nome || 'N/A'; acc[n] = (acc[n] || 0) + 1; return acc; }, {});
        const ausenciasPorStatus = solicitacoes.reduce((acc, sol) => { const n = sol.status || 'N/A'; acc[n] = (acc[n] || 0) + 1; return acc; }, {});

        // Renderiza gráficos (sem mudanças)
        renderDeptChart(funcionariosPorDepto);
        renderAusenciaTipoChart(ausenciasPorTipo);
        renderAusenciaStatusChart(ausenciasPorStatus); 
        renderSenioridadeChart(funcionariosPorSenioridade);
    }
    // Funções de renderização de gráficos (iguais)
    function renderDeptChart(data) { const ctx = document.getElementById('deptChart')?.getContext('2d'); if (!ctx) return; const l = Object.keys(data), v = Object.values(data); if (deptChartInstance) deptChartInstance.destroy(); deptChartInstance = new Chart(ctx, { type: 'bar', data: { labels: l, datasets: [{ label: 'Nº Funcionários', data: v, backgroundColor: '#1e2a47CC', borderColor: '#1e2a47', borderWidth: 1, borderRadius: 8 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } } }); }
    function renderAusenciaTipoChart(data) { const ctx = document.getElementById('ausenciaTipoChart')?.getContext('2d'); if (!ctx) return; const l = Object.keys(data), v = Object.values(data); if (ausenciaTipoChartInstance) ausenciaTipoChartInstance.destroy(); ausenciaTipoChartInstance = new Chart(ctx, { type: 'doughnut', data: { labels: l, datasets: [{ label: 'Qtd', data: v, backgroundColor: ['#f7941dCC','#1e2a47CC','#35466eCC','#5c71a0CC','#727272CC','#ffc107CC'], borderColor: '#fff', borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } } }); }
    function renderAusenciaStatusChart(data) { const ctx = document.getElementById('ausenciaStatusChart')?.getContext('2d'); if (!ctx) return; const l = Object.keys(data), v = Object.values(data); const bg = l.map(lbl => lbl==='Aprovado'?'#28a745CC':lbl==='Recusado'?'#dc3545CC':lbl==='Pendente'?'#ffc107CC':'#727272CC'); if (ausenciaStatusChartInstance) ausenciaStatusChartInstance.destroy(); ausenciaStatusChartInstance = new Chart(ctx, { type: 'pie', data: { labels: l, datasets: [{ label: 'Qtd', data: v, backgroundColor: bg, borderColor: '#fff', borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } } }); }
    function renderSenioridadeChart(data) { const ctx = document.getElementById('senioridadeChart')?.getContext('2d'); if (!ctx) return; const l = Object.keys(data), v = Object.values(data); if (senioridadeChartInstance) senioridadeChartInstance.destroy(); senioridadeChartInstance = new Chart(ctx, { type: 'bar', data: { labels: l, datasets: [{ label: 'Nº Funcionários', data: v, backgroundColor: '#f7941dCC', borderColor: '#f7941d', borderWidth: 1, borderRadius: 8 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } } }); }
    
    // =================================================================
    // --- LÓGICA DE ORDENAÇÃO DE TABELA ---
    // =================================================================

    function setupTableSorting(tableSelector, sortState, refreshFunction) {
        const table = document.querySelector(tableSelector);
        if(!table) return; // Sai se a tabela não existe na página atual
        const headers = table.querySelectorAll('thead th.sortable');

        // Limpa listeners antigos (importante para SPA)
        headers.forEach(header => {
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
        });
        
        // Re-seleciona os headers clonados e adiciona listeners
        const newHeaders = table.querySelectorAll('thead th.sortable');
        newHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const newSortBy = header.dataset.sort;
                if (!newSortBy) return; // Sai se não tiver data-sort
                
                if (newSortBy === sortState.by) {
                    sortState.order = (sortState.order === 'ASC') ? 'DESC' : 'ASC';
                } else {
                    sortState.by = newSortBy;
                    sortState.order = 'ASC'; // Começa com ASC ao mudar coluna
                }

                newHeaders.forEach(h => h.classList.remove('asc', 'desc'));
                header.classList.add(sortState.order.toLowerCase());

                if (refreshFunction === refreshFuncionariosList) {
                    currentPage = 1; // Reseta paginação só para funcionários
                }
                refreshFunction(); // Chama a função de recarregar dados (refreshFuncionariosList ou refreshAusenciasList)
            });
            
            // Adiciona classe inicial se for a coluna atual
            if(header.dataset.sort === sortState.by) {
                 header.classList.add(sortState.order.toLowerCase());
            }
        });
    }

    // =================================================================
    // --- INICIALIZAÇÃO E LISTENERS GERAIS ---
    // =================================================================
    
    function initializeApp() {
        
        // --- Listeners da Interface Principal (Configurar uma vez) ---
        if(toggleBtn) toggleBtn.addEventListener('click', () => {
             // Adiciona/remove classe no #app-container também para ajustar o margin do main-content
             sidebar.classList.toggle('collapsed');
             appContainer.classList.toggle('sidebar-collapsed'); 
        });
        
        // Navegação pelo Menu Lateral
        menuLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                showPage(link.dataset.page);
            });
        });
        
        // Navegação pelo Dropdown do Perfil (Items que levam a páginas)
        dropdownLinks.forEach(link => {
             link.addEventListener('click', (event) => {
                event.preventDefault();
                const pageKey = link.dataset.page;
                if(pageKey) { // Se for um link de página
                    showPage(pageKey);
                    // Fecha o dropdown após clicar
                    userProfileDropdown.classList.remove('show');
                    userProfileButton.classList.remove('active');
                }
                // Se não tiver data-page (como o botão Sair), o listener dele cuidará
            });
        });

        // Toggle do Dropdown de Perfil
        if (userProfileButton) {
            userProfileButton.addEventListener('click', (event) => {
                 event.stopPropagation(); // Impede que o clique feche imediatamente
                 userProfileDropdown.classList.toggle('show');
                 userProfileButton.classList.toggle('active');
            });
        }
        
        // Fechar dropdown se clicar fora
        document.addEventListener('click', (event) => {
            // Verifica se userProfileMenu existe antes de acessar contains
            if (userProfileMenu && !userProfileMenu.contains(event.target)) {
                 if (userProfileDropdown) userProfileDropdown.classList.remove('show');
                 if (userProfileButton) userProfileButton.classList.remove('active');
            }
        });
        
        // Listeners de Login/Logout
        if (loginForm) loginForm.addEventListener('submit', handleLogin);
        if (logoutButton) logoutButton.addEventListener('click', handleLogout);
        
        // --- Listeners dos Modais e Páginas (Adicionados com segurança) ---
        
        // Funcionários
        if(btnNovoFuncionario) btnNovoFuncionario.addEventListener('click', () => showModal());
        if(btnCancelarModal) btnCancelarModal.addEventListener('click', hideModal);
        if(btnCloseModal) btnCloseModal.addEventListener('click', hideModal);
        if(modal) modal.addEventListener('click', (event) => { if (event.target === modal) hideModal(); });
        if(btnConfirmDelete) btnConfirmDelete.addEventListener('click', async () => { /* ... código delete ... */ if (employeeIdToDelete) { await apiDelete('funcionarios', employeeIdToDelete); hideConfirmModal(); await refreshFuncionariosList(); } });
        if(btnCancelDelete) btnCancelDelete.addEventListener('click', hideConfirmModal);
        if(statusToggle) statusToggle.addEventListener('change', () => { /* ... código status toggle ... */ const isActive = statusToggle.checked; statusHiddenInput.value = isActive ? 'Ativo' : 'Inativo'; statusBadgeText.textContent = isActive ? 'Ativo' : 'Inativo'; statusBadgeText.classList.toggle('inativo', !isActive); });
        if(funcionarioForm) funcionarioForm.addEventListener('submit', async (event) => { /* ... código submit funcionário ... */ event.preventDefault(); const formData = new FormData(funcionarioForm); const d = Object.fromEntries(formData.entries()); const id = d.id; d.beneficios = formData.getAll('beneficios'); for (const k in d) if (d[k] === '') delete d[k]; ['departamento_id', 'cargo_id', 'banco_id', 'senioridade_id'].forEach(k => { if (d[k]) d[k] = parseInt(d[k]); }); if (d.beneficios) d.beneficios = d.beneficios.map(bId => parseInt(bId)); if (d.salario) d.salario = parseFloat(d.salario); let r; if (id) { delete d.id; r = await apiUpdate('funcionarios', id, d); } else { r = await apiPost('funcionarios', d); } if (r) { hideModal(); await refreshFuncionariosList(); } });
        if(tableBody) tableBody.addEventListener('click', async (event) => { /* ... código edit/delete na tabela ... */ const editBtn = event.target.closest('.edit-btn'); const delBtn = event.target.closest('.delete-btn'); if (editBtn) { event.preventDefault(); const id = editBtn.dataset.id; const resp = await apiFetch(`funcionarios/${id}`); if(resp?.data) showModal(resp.data); } if (delBtn) { event.preventDefault(); showConfirmModal(delBtn.dataset.id); } });
        if(btnFiltrar) btnFiltrar.addEventListener('click', () => { currentPage = 1; refreshFuncionariosList(); });
        if(btnLimpar) btnLimpar.addEventListener('click', () => { filterId.value = ''; filterNome.value = ''; filterCargo.value = ''; currentPage = 1; refreshFuncionariosList(); });
        if(paginationControls) paginationControls.addEventListener('click', (event) => { /* ... código paginação ... */ if (event.target.tagName === 'BUTTON') { const page = parseInt(event.target.dataset.page); if (page !== currentPage) { currentPage = page; refreshFuncionariosList(); } } });

        // Ausências
        if(btnNovaAusencia) btnNovaAusencia.addEventListener('click', showAusenciaModal);
        if(btnCancelarAusencia) btnCancelarAusencia.addEventListener('click', hideAusenciaModal);
        if(btnCloseAusenciaModal) btnCloseAusenciaModal.addEventListener('click', hideAusenciaModal);
        if(ausenciaModal) ausenciaModal.addEventListener('click', (event) => { if (event.target === ausenciaModal) hideAusenciaModal(); });
        if(ausenciaFuncionarioSelect) ausenciaFuncionarioSelect.addEventListener('change', () => { /* ... código saldo férias display ... */ const display = document.getElementById('saldo-ferias-display'); const item = ausenciaFuncionarioChoices.getValue(true); display.value = (item?.customProperties?.saldo !== undefined) ? `${item.customProperties.saldo} dias` : 'N/A'; });
        if(ausenciaForm) ausenciaForm.addEventListener('submit', async (event) => { /* ... código submit ausência ... */ event.preventDefault(); const formData = new FormData(ausenciaForm); const d = Object.fromEntries(formData.entries()); const r = await apiPost('ausencias/solicitacoes', d); if (r) { hideAusenciaModal(); await refreshAusenciasList(); await populateAusenciaPageData(); } }); // Recarrega selects
        if(btnCancelReject) btnCancelReject.addEventListener('click', hideRejectModal);
        if(rejectModal) rejectModal.addEventListener('click', (event) => { if (event.target === rejectModal) hideRejectModal(); });
        if(btnConfirmReject) btnConfirmReject.addEventListener('click', async () => { /* ... código confirmar recusa ... */ const just = rejectJustificativaInput.value.trim(); if (!just) { alert('Justificativa obrigatória.'); return; } if (absenceIdToReject) { const r = await apiUpdateStatus('ausencias/solicitacoes', absenceIdToReject, { status: 'Recusado', justificativa_gestor: just }); if (r) { hideRejectModal(); await refreshAusenciasList(); await populateAusenciaPageData();} } }); // Recarrega selects
        // Listener delegado para Approve/Reject/Cancel na tabela de Ausências
        if(ausenciasTableBody) ausenciasTableBody.addEventListener('click', async (event) => { 
            const approveBtn = event.target.closest('.approve-btn');
            const rejectBtn = event.target.closest('.reject-btn');
            const cancelBtn = event.target.closest('.cancel-btn'); // Novo
            
            if (approveBtn) {
                const id = approveBtn.dataset.id;
                 if (confirm(`Aprovar solicitação ID ${id}?`)) {
                    const r = await apiUpdateStatus('ausencias/solicitacoes', id, { status: 'Aprovado' });
                    if (r) { await refreshAusenciasList(); await populateAusenciaPageData(); } // Recarrega selects
                }
            } else if (rejectBtn) {
                const id = rejectBtn.dataset.id;
                showRejectModal(id);
            } else if (cancelBtn) { // Novo
                 const id = cancelBtn.dataset.id;
                 if (confirm(`Cancelar sua solicitação ID ${id}?`)) {
                     const r = await apiCancelSolicitacao(id);
                     if (r) await refreshAusenciasList(); // Só atualiza a lista
                 }
            }
        });

        // --- Ativa a Ordenação das Tabelas ---
        // (Só serão configuradas se as tabelas existirem na página atual)
        setupTableSorting('#page-funcionarios .staff-table', currentSortFunc, refreshFuncionariosList);
        setupTableSorting('#page-ausencias .staff-table', currentSortAus, refreshAusenciasList);
        
        // --- Verifica a Sessão ao Carregar ---
        (async () => {
            const data = await apiFetch('check_session');
            if (data?.user) { // Verifica se data e data.user existem
                console.log("Sessão ativa encontrada:", data.user);
                showApp(data.user); // Mostra o app e define currentUserRole
            } else {
                console.log("Nenhuma sessão ativa. Mostrando login.");
                redirectToLogin();
            }
        })();
    }
    
    // Inicia tudo
    

        // --- (NOVO) Listener para Formulário de Adicionar Usuário ---
        if (addUserForm) {
            addUserForm.addEventListener('submit', async (event) => {
                event.preventDefault(); // Impede recarregamento da página
                if (addUserMessage) {
                    addUserMessage.style.display = 'none'; // Esconde mensagens antigas
                    addUserMessage.textContent = '';
                    addUserMessage.className = 'user-message'; // Reseta classes de cor
                }

                // Coleta os dados do formulário
                const nome_completo = newUserNameInput ? newUserNameInput.value.trim() : '';
                const email = newUserEmailInput ? newUserEmailInput.value.trim() : '';
                const password = newUserPasswordInput ? newUserPasswordInput.value : '';
                const role_nome = newUserRoleSelect ? newUserRoleSelect.value : '';

                // Validação básica (opcional, backend já valida)
                if (!nome_completo || !email || !password || !role_nome) {
                    displayUserMessage("Por favor, preencha todos os campos obrigatórios.", 'error');
                    return;
                }
                if (password.length < 6) {
                     displayUserMessage("A senha provisória deve ter no mínimo 6 caracteres.", 'error');
                     return;
                }

                // Monta o objeto para enviar à API
                const newUser = {
                    nome_completo,
                    email,
                    password,
                    role_nome
                };

                // Chama a API
                const result = await apiPost('usuarios', newUser);

                if (result && result.id) { // Verifica se a API retornou sucesso (com um ID)
                    displayUserMessage(`Usuário '${nome_completo}' criado com sucesso (ID: ${result.id})!`, 'success');
                    addUserForm.reset(); // Limpa o formulário
                } else {
                    if (!addUserMessage || !addUserMessage.textContent) { 
                         displayUserMessage("Erro ao criar usuário. Verifique o console para detalhes.", 'error');
                    }
                }
            });
        }

        // --- (NOVA) Função Helper para exibir mensagens no formulário ---
        function displayUserMessage(message, type = 'info') {
            if (addUserMessage) {
                addUserMessage.textContent = message;
                addUserMessage.className = `user-message ${type}`;
                addUserMessage.style.display = 'block';
            } else {
                 alert(message);
            }
        }

initializeApp();
});