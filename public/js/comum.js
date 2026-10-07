/*-------------------------------------------------------------------------------------*/

// Campos compartilhados pelas páginas
const campos = ['cpf', 'nome', 'sobrenome', 'email', 'idade', 'telefone', 'rg', 'rua', 'bairro', 'cidade', 'estado'];
const rotulos = ['CPF', 'Nome', 'Sobrenome', 'E-mail', 'Idade', 'Telefone', 'RG', 'Rua', 'Bairro', 'Cidade', 'Estado'];

/*-------------------------------------------------------------------------------------*/

// Comunicação com o servidor na mesma origem do site
async function requisicao(caminho, opcoes = {}) {
    let resposta;
    try {
        resposta = await fetch(caminho, {
            ...opcoes,
            headers: { 'Content-Type': 'application/json', ...opcoes.headers }
        });
    } catch {
        throw new Error('Não foi possível conectar. Verifique sua conexão e tente novamente.');
    }
    const dados = await resposta.json().catch(() => null);
    if (!resposta.ok) {
        throw new Error(dados?.erro || (resposta.status === 404 ? 'Cadastro não encontrado. Faça uma nova busca.' : 'Não foi possível concluir a operação.'));
    }
    return dados;
}

/*-------------------------------------------------------------------------------------*/

// Mensagens de sucesso e erro
function mensagem(texto, erro = false) {
    const elemento = document.getElementById('mensagem');
    elemento.textContent = texto;
    elemento.classList.toggle('erro', erro);
    elemento.hidden = !texto;
}

/*-------------------------------------------------------------------------------------*/

// Leitura e apresentação dos dados
function lerFormulario(formulario) {
    const dados = Object.fromEntries(campos.map(campo => [campo, formulario.elements[campo].value.trim()]));
    dados.idade = Number(dados.idade);
    return dados;
}

function formatarCpf(cpf) {
    return String(cpf).replace(/\D/g, '').replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

function validarBusca() {
    const entrada = document.getElementById('cpf-busca').value.trim();
    const cpf = entrada.replace(/\D/g, '');
    if (!/^[\d.\-\s]+$/.test(entrada) || !/^\d{11}$/.test(cpf)) throw new Error('Informe um CPF com 11 números.');
    return cpf;
}

async function buscarPessoa() {
    const pessoas = await requisicao(`/pessoas?cpf=${encodeURIComponent(validarBusca())}`);
    if (!pessoas.length) throw new Error('Nenhuma pessoa encontrada com este CPF.');
    return pessoas[0];
}

/*-------------------------------------------------------------------------------------*/

// Bloqueio temporário dos controles durante as requisições
async function executar(acao) {
    const controles = [...document.querySelectorAll('button, input, select')];
    const anteriores = controles.map(controle => controle.disabled);
    controles.forEach(controle => { controle.disabled = true; });
    document.querySelector('main').setAttribute('aria-busy', 'true');
    mensagem('Aguarde…');
    try {
        await acao();
    } catch (erro) {
        mensagem(erro.message, true);
    } finally {
        controles.forEach((controle, indice) => { controle.disabled = anteriores[indice]; });
        document.querySelector('main').removeAttribute('aria-busy');
    }
}

/*-------------------------------------------------------------------------------------*/

// CPF recebido pelos atalhos da tabela
function prepararBusca() {
    const cpf = new URLSearchParams(location.search).get('cpf');
    if (cpf) {
        document.getElementById('cpf-busca').value = formatarCpf(cpf);
        document.getElementById('form-busca').requestSubmit();
    }
}
