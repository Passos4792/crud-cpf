/*-------------------------------------------------------------------------------------*/

// Bibliotecas e banco temporário isolado
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { criarApp } = require('../server');

test('CRUD completo, busca por CPF, validação e persistência', async t => {
    const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'crud-cpf-teste-'));
    const arquivo = path.join(pasta, 'db.json');
    fs.writeFileSync(arquivo, JSON.stringify({ pessoas: [] }));
    let servidor;
    let base;
    async function iniciar() {
        servidor = criarApp(arquivo).listen(0, '127.0.0.1');
        await new Promise(resolve => servidor.once('listening', resolve));
        base = `http://127.0.0.1:${servidor.address().port}`;
    }
    async function fechar() { await new Promise(resolve => servidor.close(resolve)); }
    t.after(async () => { if (servidor.listening) await fechar(); fs.rmSync(pasta, { recursive: true, force: true }); });
    await iniciar();
    const pessoa = {
        cpf: '123.456.789-00', nome: 'Pessoa', sobrenome: 'Exemplo', email: 'exemplo@example.com',
        idade: 25, telefone: '(11) 99999-0000', rua: 'Rua de Exemplo', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', rg: '00.000.000-X'
    };
    async function enviar(url, method, body) {
        return fetch(base + url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    }

    /*-------------------------------------------------------------------------------------*/


    // Páginas e arquivos públicos
    for (const url of ['/', '/post/post.html', '/get/get.html', '/put/put.html', '/delete/delete.html', '/css/style.css', '/js/comum.js', '/health']) {
        assert.equal((await fetch(base + url)).status, 200, url);
    }
    assert.equal((await fetch(base + '/server.js')).status, 404);
    assert.equal((await fetch(base + '/db.json')).status, 404);

    /*-------------------------------------------------------------------------------------*/


    // POST e proteção contra CPF duplicado
    const criacao = await enviar('/pessoas', 'POST', pessoa);
    assert.equal(criacao.status, 201);
    const cadastrado = await criacao.json();
    assert.equal(cadastrado.cpf, '12345678900');
    assert.equal((await enviar('/pessoas', 'POST', { ...pessoa, cpf: '12345678900' })).status, 409);
    assert.equal((await enviar('/pessoas', 'POST', { ...pessoa, nome: ' ' })).status, 400);
    assert.equal((await enviar('/pessoas', 'POST', { ...pessoa, idade: -1 })).status, 400);
    assert.equal((await enviar('/pessoas', 'POST', { ...pessoa, idade: 2.5 })).status, 400);
    assert.equal((await enviar('/pessoas', 'POST', { ...pessoa, cpf: 'abc12345678900' })).status, 400);
    assert.equal((await enviar('/pessoas', 'POST', { ...pessoa, email: 'errado' })).status, 400);
    assert.equal((await enviar('/pessoas', 'POST', { ...pessoa, estado: 'XX' })).status, 400);
    assert.equal((await enviar('/pessoas', 'POST', { ...pessoa, telefone: '123' })).status, 400);

    /*-------------------------------------------------------------------------------------*/


    // GET com e sem pontuação
    for (const cpf of ['12345678900', '123.456.789-00']) {
        const encontrados = await (await fetch(base + '/pessoas?cpf=' + encodeURIComponent(cpf))).json();
        assert.equal(encontrados.length, 1);
        assert.equal(encontrados[0].id, cadastrado.id);
    }
    assert.deepEqual(await (await fetch(base + '/pessoas?cpf=00000000000')).json(), []);
    assert.equal((await fetch(base + '/pessoas?cpf=123')).status, 400);

    /*-------------------------------------------------------------------------------------*/


    // PUT, duplicidade na edição e inexistência
    const segundo = await (await enviar('/pessoas', 'POST', { ...pessoa, cpf: '11122233344' })).json();
    assert.equal((await enviar(`/pessoas/${segundo.id}`, 'PUT', pessoa)).status, 409);
    assert.equal((await enviar(`/pessoas/${cadastrado.id}`, 'PUT', { ...pessoa, nome: 'Atualizada', idade: 30 })).status, 200);
    assert.equal((await enviar('/pessoas/99999', 'PUT', { ...pessoa, cpf: '99988877766' })).status, 404);
    assert.equal((await enviar(`/pessoas/${cadastrado.id}`, 'PATCH', { nome: 'Incompleta' })).status, 405);

    /*-------------------------------------------------------------------------------------*/


    // Persistência após reiniciar o servidor
    await fechar();
    await iniciar();
    const salvo = await (await fetch(base + `/pessoas/${cadastrado.id}`)).json();
    assert.equal(salvo.nome, 'Atualizada');
    assert.equal(salvo.idade, 30);
    for (const campo of Object.keys(pessoa)) assert.ok(campo in salvo);

    /*-------------------------------------------------------------------------------------*/


    // DELETE e confirmação no arquivo
    assert.equal((await enviar(`/pessoas/${cadastrado.id}`, 'DELETE')).status, 200);
    assert.equal((await enviar(`/pessoas/${cadastrado.id}`, 'DELETE')).status, 404);
    assert.equal((await enviar(`/pessoas/${segundo.id}`, 'DELETE')).status, 200);
    assert.deepEqual(await (await fetch(base + '/pessoas')).json(), []);
    assert.deepEqual(JSON.parse(fs.readFileSync(arquivo, 'utf8')), { pessoas: [] });
});
