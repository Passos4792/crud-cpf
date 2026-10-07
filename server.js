/*-------------------------------------------------------------------------------------*/

// Importação das bibliotecas
const express = require('express');
const jsonServer = require('json-server');
const path = require('node:path');
const fs = require('node:fs');

/*-------------------------------------------------------------------------------------*/


// Criação do servidor e do banco JSON
function criarApp(arquivo = process.env.DB_PATH || path.join(__dirname, 'db.json')) {
    fs.mkdirSync(path.dirname(path.resolve(arquivo)), { recursive: true });
    if (!fs.existsSync(arquivo)) fs.copyFileSync(path.join(__dirname, 'db.json'), arquivo);
    const app = express();
    const router = jsonServer.router(arquivo);

    /*-------------------------------------------------------------------------------------*/


    // Páginas HTML, CSS e scripts
    app.disable('x-powered-by');
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.json({ limit: '32kb' }));
    app.get('/health', (req, res) => res.json({ status: 'ok' }));

    /*-------------------------------------------------------------------------------------*/


    // Validação dos dados enviados para o JSON Server
    app.use('/pessoas', (req, res, next) => {
        res.set('Cache-Control', 'no-store');
        const item = /^\/[^/]+\/?$/.test(req.path);
        if (!['GET', 'HEAD', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
            return res.status(405).json({ erro: 'Operação não permitida.' });
        }
        if ((req.method === 'POST' && req.path !== '/') ||
            (['PUT', 'DELETE'].includes(req.method) && !item)) {
            return res.status(405).json({ erro: 'Endereço inválido para esta operação.' });
        }
        if (!['POST', 'PUT'].includes(req.method)) return next();
        const campos = ['cpf', 'nome', 'sobrenome', 'email', 'telefone', 'rua', 'bairro', 'cidade', 'estado', 'rg'];
        const dados = {};
        for (const campo of campos) {
            if (typeof req.body?.[campo] !== 'string' || !req.body[campo].trim() || req.body[campo].length > 200) {
                return res.status(400).json({ erro: `Preencha corretamente o campo ${campo}.` });
            }
            dados[campo] = req.body[campo].trim();
        }
        // Aceita CPF didático com 11 dígitos; não consulta a Receita Federal.
        if (!/^[\d.\-\s]+$/.test(dados.cpf)) return res.status(400).json({ erro: 'CPF deve conter 11 números.' });
        dados.cpf = dados.cpf.replace(/\D/g, '');
        dados.estado = dados.estado.toUpperCase();
        dados.idade = req.body.idade;
        if (!/^\d{11}$/.test(dados.cpf)) return res.status(400).json({ erro: 'CPF deve conter 11 números.' });
        if (!Number.isInteger(dados.idade) || dados.idade < 0 || dados.idade > 130) {
            return res.status(400).json({ erro: 'Idade deve ser um número inteiro entre 0 e 130.' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) return res.status(400).json({ erro: 'E-mail inválido.' });
        if (!/^\+?[\d\s().-]+$/.test(dados.telefone) || !/^\d{10,13}$/.test(dados.telefone.replace(/\D/g, ''))) {
            return res.status(400).json({ erro: 'Telefone deve ter entre 10 e 13 números, incluindo o DDD.' });
        }
        const estados = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
        if (!estados.includes(dados.estado)) return res.status(400).json({ erro: 'Selecione uma UF válida.' });
        const id = req.path.split('/')[1];
        const duplicado = router.db.get('pessoas').value().some(pessoa =>
            pessoa.cpf.replace(/\D/g, '') === dados.cpf && (req.method === 'POST' || String(pessoa.id) !== id));
        if (duplicado) return res.status(409).json({ erro: 'Já existe uma pessoa cadastrada com este CPF.' });
        req.body = dados;
        next();
    });

    /*-------------------------------------------------------------------------------------*/


    // Busca por CPF com ou sem pontuação
    app.get('/pessoas', (req, res, next) => {
        if (req.query.cpf === undefined) return next();
        const entrada = String(req.query.cpf);
        const cpf = entrada.replace(/\D/g, '');
        if (!/^[\d.\-\s]+$/.test(entrada) || !/^\d{11}$/.test(cpf)) return res.status(400).json({ erro: 'Informe um CPF com 11 números.' });
        res.json(router.db.get('pessoas').value().filter(pessoa => pessoa.cpf.replace(/\D/g, '') === cpf));
    });

    /*-------------------------------------------------------------------------------------*/


    // Rotas CRUD geradas pelo JSON Server
    app.use((req, res, next) => {
        if (/^\/pessoas(?:\/[^/]+)?\/?$/.test(req.path)) return router(req, res, next);
        res.status(404).json({ erro: 'Página ou recurso não encontrado.' });
    });
    app.use((erro, req, res, next) => {
        const status = erro.status || 500;
        if (status >= 500) console.error(erro);
        res.status(status).json({ erro: status === 400 ? 'JSON inválido.' : 'Não foi possível processar a solicitação.' });
    });
    return app;
}

/*-------------------------------------------------------------------------------------*/


// Inicialização: comando do Render = node server.js
if (require.main === module) {
    const porta = process.env.PORT || 3000;
    criarApp().listen(porta, '0.0.0.0', () => console.log(`CRUD disponível na porta ${porta}`));
}
module.exports = { criarApp };
