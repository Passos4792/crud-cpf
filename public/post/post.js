/*-------------------------------------------------------------------------------------*/

// Formulário de criação (POST)
const formulario = document.getElementById('formulario');

formulario.addEventListener('submit', event => {
    event.preventDefault();
    const dados = lerFormulario(formulario);
    executar(async () => {
        await requisicao('/pessoas', { method: 'POST', body: JSON.stringify(dados) });
        formulario.reset();
        mensagem('Pessoa cadastrada com sucesso. O registro já está disponível em Consultar.');
    });
});

/*-------------------------------------------------------------------------------------*/

// Limpeza das mensagens
formulario.addEventListener('reset', () => mensagem(''));
