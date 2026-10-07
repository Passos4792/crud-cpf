/*-------------------------------------------------------------------------------------*/

// Elementos e registro selecionado para edição
const formulario = document.getElementById('formulario');
let idSelecionado = null;

function limparEdicao() {
    idSelecionado = null;
    formulario.reset();
    formulario.hidden = true;
}

/*-------------------------------------------------------------------------------------*/

// Busca do cadastro pelo CPF
document.getElementById('form-busca').addEventListener('submit', event => {
    event.preventDefault();
    limparEdicao();
    executar(async () => {
        const pessoa = await buscarPessoa();
        idSelecionado = pessoa.id;
        for (const campo of campos) formulario.elements[campo].value = pessoa[campo];
        document.getElementById('id-registro').textContent = pessoa.id;
        formulario.hidden = false;
        mensagem('Cadastro encontrado. Edite os campos e salve as alterações.');
    });
});

document.getElementById('cpf-busca').addEventListener('input', () => { limparEdicao(); mensagem(''); });
document.getElementById('cancelar').addEventListener('click', () => { limparEdicao(); mensagem('Edição cancelada.'); });

/*-------------------------------------------------------------------------------------*/

// Atualização completa do cadastro (PUT)
formulario.addEventListener('submit', event => {
    event.preventDefault();
    if (idSelecionado === null) return mensagem('Busque uma pessoa antes de editar.', true);
    const dados = lerFormulario(formulario);
    executar(async () => {
        await requisicao(`/pessoas/${encodeURIComponent(idSelecionado)}`, { method: 'PUT', body: JSON.stringify(dados) });
        limparEdicao();
        document.getElementById('form-busca').reset();
        mensagem('Cadastro atualizado com sucesso.');
    });
});

prepararBusca();
