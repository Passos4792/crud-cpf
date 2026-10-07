/*-------------------------------------------------------------------------------------*/

// Cadastro selecionado e limpeza da confirmação
let pessoaSelecionada = null;
const confirmacao = document.getElementById('confirmacao');

function limparSelecao() {
    pessoaSelecionada = null;
    confirmacao.hidden = true;
    document.getElementById('dados-pessoa').replaceChildren();
}

/*-------------------------------------------------------------------------------------*/

// Busca e apresentação dos dados antes da exclusão
document.getElementById('form-busca').addEventListener('submit', event => {
    event.preventDefault();
    limparSelecao();
    executar(async () => {
        pessoaSelecionada = await buscarPessoa();
        const lista = document.getElementById('dados-pessoa');
        campos.forEach((campo, indice) => {
            const grupo = document.createElement('div');
            const titulo = document.createElement('dt');
            const valor = document.createElement('dd');
            titulo.textContent = rotulos[indice];
            valor.textContent = campo === 'cpf' ? formatarCpf(pessoaSelecionada[campo]) : pessoaSelecionada[campo];
            grupo.append(titulo, valor);
            lista.append(grupo);
        });
        confirmacao.hidden = false;
        mensagem('Cadastro encontrado. Confira os dados abaixo.');
    });
});

document.getElementById('cpf-busca').addEventListener('input', () => { limparSelecao(); mensagem(''); });
document.getElementById('cancelar').addEventListener('click', () => { limparSelecao(); mensagem('Exclusão cancelada.'); });

/*-------------------------------------------------------------------------------------*/

// Exclusão do registro selecionado (DELETE)
document.getElementById('excluir').addEventListener('click', () => {
    if (!pessoaSelecionada) return;
    if (!window.confirm(`Excluir ${pessoaSelecionada.nome}, CPF ${formatarCpf(pessoaSelecionada.cpf)}? Esta ação é definitiva.`)) return;
    executar(async () => {
        await requisicao(`/pessoas/${encodeURIComponent(pessoaSelecionada.id)}`, { method: 'DELETE' });
        limparSelecao();
        document.getElementById('form-busca').reset();
        mensagem('Cadastro excluído com sucesso.');
    });
});

prepararBusca();
