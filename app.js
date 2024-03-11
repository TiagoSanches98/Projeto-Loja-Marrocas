const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql2');
const PORTA = 8080;
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const dbConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'loja_marrocas',
});

dbConnection.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conexão bem sucedida com o banco de dados');
});

const router = express.Router();
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// rota para criar novo usuário
router.post('/api/novoUsuario', async (req, res) => {
    const { usuario, senha } = req.body;
    const query = 'INSERT INTO Usuario (usuario, senha) VALUES (?, ?)';
    try {
        await dbConnection.promise().execute(query, [usuario, senha]);
        res.status(201).json({ mensagem: 'Usuário criado com sucesso' });
    } catch (error) {
        console.error('Erro ao criar novo usuário', error);
        res.status(500).json({ error: 'Erro ao criar novo usuário' });
    }
});

// rota para autenticar usuário (login)
router.post('/api/login', async (req, res) => {
    const { usuario, senha } = req.body;
    const query = 'SELECT * FROM Usuario WHERE usuario = ? AND senha = ?';
    try {
        const [rows] = await dbConnection.promise().query(query, [usuario, senha]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Credenciais Inválidas' });
        }
        res.status(200).json({ mensagem: 'Login bem sucedido', usuario: rows[0] });
    } catch (error) {
        console.error('Erro na autenticação do usuário', error);
        res.status(500).json({ error: 'Erro na autenticação do usuário' });
    }
});

// rota para criar novo fornecedor
router.post('/api/novoFornecedor', async (req, res) => {
    const { fornecedor, email, telefone } = req.body;
    const query = 'INSERT INTO Fornecedores (fornecedor, email, telefone) VALUES (?, ?, ?)';
    try {
        await dbConnection.promise().execute(query, [fornecedor, email, telefone]);
        res.status(201).json({ mensagem: 'Fornecedor criado com sucesso' });
    } catch (error) {
        console.error('Erro ao cadastrar novo Fornecedor: ', error);
        res.status(500).send({ error: 'Erro ao cadastrar novo Fornecedor' });
    }
});

// rotas para listar todos os fornecedores
router.get('/api/fornecedores', async (req, res) => {
    const query = 'SELECT * FROM Fornecedores';
    try {
        const [rows] = await dbConnection.promise().query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Falha ao listar fornecedores', error);
        res.status(500).json({ error: 'Falha ao listar fornecedores' });
    }
});

// rota para consultar um fornecedor pelo ID
router.get('/api/fornecedores/:id', async (req, res) => {
    const query = 'SELECT * FROM Fornecedores WHERE codigo = ?';
    try {
        const [rows] = await dbConnection.promise().query(query, [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Falha ao consultar fornecedores', error);
        res.status(500).json({ error: 'Falha ao consultar fornecedores' });
    }
});

// rota para deletar um fornecedor pelo ID
router.delete('/api/fornecedores/:id', async (req, res) => {
    const query = 'DELETE FROM Fornecedores WHERE codigo = ?';
    try {
        const [result] = await dbConnection.promise().query(query, [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }
        res.status(200).json({ mensagem: 'Fornecedor deletado com sucesso' });
    } catch (error) {
        console.error('Falha ao deletar fornecedores', error);
        res.status(500).json({ error: 'Falha ao deletar fornecedores' });
    }
});

// rota para atualização do fornecedor
router.put('/api/fornecedores/:id', async (req, res) => {
    const { fornecedor, email, telefone } = req.body;
    const query = 'UPDATE Fornecedores SET fornecedor = ?, email = ?, telefone = ? WHERE codigo = ?';
    try {
        const [result] = await dbConnection.promise().query(query, [fornecedor, email, telefone, req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }
        res.status(200).json({ mensagem: 'Fornecedor atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar fornecedor', error);
        res.status(500).json({ error: 'Falha ao atualizar fornecedor' });
    }
});

// Rota para criar um novo produto
router.post('/api/novoProduto', upload.single('imagem'), async (req, res) => {
    const { codigo, produto, quantidade, preco, id_fornecedor } = req.body;
    const imagem = req.file ? Buffer.from(req.file.buffer) : null;
    const query = 'INSERT INTO Produtos (codigo, produto, quantidade, preco, id_fornecedor, imagem) VALUES (?, ?, ?, ?, ?, ?)';
    try {
        await dbConnection.promise().execute(query, [codigo, produto, quantidade, preco, id_fornecedor, imagem]);
        res.status(201).json({ mensagem: 'Produto criado com sucesso' });
    } catch (error) {
        console.error('Erro ao cadastrar novo produto', error);
        res.status(500).json({ error: 'Erro ao cadastrar novo produto' });
    }
});

// Rota para listar todos os produtos
router.get('/api/produtos', async (req, res) => {
    const query = 'SELECT * FROM Produtos';
    try {
        const [rows] = await dbConnection.promise().query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao listar produtos', error);
        res.status(500).json({ error: 'Erro ao listar produtos' });
    }
});

// Rota para buscar um produto pelo ID
router.get('/api/produtos/:id', async (req, res) => {
    const query = 'SELECT * FROM Produtos WHERE codigo = ?';
    try {
        const [rows] = await dbConnection.promise().query(query, [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ mensagem: 'Produto não encontrado' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao consultar produto', error);
        res.status(500).json({ error: 'Erro ao consultar produto' });
    }
});

// Rota para deletar um produto pelo ID
router.delete('/api/produtos/:id', async (req, res) => {
    const query = 'DELETE FROM Produtos WHERE codigo = ?';
    try {
        const [result] = await dbConnection.promise().query(query, [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: 'Produto não encontrado' });
        }
        res.status(200).json({ mensagem: 'Produto deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar produto', error);
        res.status(500).json({ error: 'Erro ao deletar produto' });
    }
});

// Rota para atualizar um produto pelo ID
router.put('/api/produtos/:id', async (req, res) => {
    const { produto, quantidade, preco, id_fornecedor } = req.body;
    const query = 'UPDATE Produtos SET produto = ?, quantidade = ?, preco = ?, id_fornecedor = ? WHERE codigo = ?';
    try {
        const [result] = await dbConnection.promise().query(query, [produto, quantidade, preco, id_fornecedor, req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: 'Produto não encontrado' });
        }
        res.status(200).json({ mensagem: 'Produto atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar produto', error);
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
});

app.use(router);

app.listen(PORTA, () => {
    console.log(`Servidor rodando na porta ${PORTA}`);
});
