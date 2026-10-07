/*-------------------------------------------------------------------------------------*/

// Montagem da tabela usando texto, sem interpretar HTML dos cadastros
function mostrarPessoas(pessoas) {
    const tabela = document.getElementById('tabela-corpo');
    tabela.replaceChildren();
    for (const pessoa of pessoas) {
        const linha = document.createElement('tr');
        for (const campo of ['id', ...campos]) {
            const celula = document.createElement('td');
            celula.textContent = campo === 'cpf' ? formatarCpf(pessoa[campo]) : pessoa[campo];
            linha.append(celula);
        }
        const acoes = document.createElement('td');
        acoes.className = 'acoes-tabela';
        for (const [operacao, titulo] of [['put', 'Editar'], ['delete', 'Excluir']]) {
            const link = document.createElement('a');
            link.href = `/${operacao}/${operacao}.html?cpf=${encodeURIComponent(pessoa.cpf)}`;
            link.textContent = titulo;
            link.setAttribute('aria-label', `${titulo} cadastro de ${pessoa.nome}`);
            acoes.append(link);
        }
        linha.append(acoes);
        tabela.append(linha);
    }
    document.getElementById('contagem').textContent = `${pessoas.length} registro(s)`;
    document.getElementById('lista-vazia').hidden = pessoas.length !== 0;
    document.getElementById('tabela-container').hidden = pessoas.length === 0;
}

/*-------------------------------------------------------------------------------------*/

// Listagem e filtro por CPF (GET)
function carregar(cpf = '') {
    return executar(async () => {
        try {
            const pessoas = await requisicao(`/pessoas${cpf ? `?cpf=${encodeURIComponent(cpf)}` : ''}`);
            mostrarPessoas(pessoas);
            mensagem(cpf && !pessoas.length ? 'Nenhuma pessoa encontrada com este CPF.' : 'Consulta atualizada.');
        } catch (erro) {
            mostrarPessoas([]);
            document.getElementById('lista-vazia').hidden = true;
            document.getElementById('contagem').textContent = 'Consulta indisponível';
            throw erro;
        }
    });
}

document.getElementById('form-busca').addEventListener('submit', event => {
    event.preventDefault();
    try { carregar(validarBusca()); } catch (erro) { mensagem(erro.message, true); }
});

document.getElementById('listar-todos').addEventListener('click', () => {
    document.getElementById('form-busca').reset();
    carregar();
});

carregar();
