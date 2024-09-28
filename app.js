const express = require('express');
const boryParser = require('body-parser');
const app = express();
const Sequelize = require('sequelize');
const PORTA = 8080;
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({storage: storage});

const sequelize = new Sequelize('loja_marrocas', 'root', 'root', {
    host: 'localhost', //onde o banco de dados está executando
    dialect: 'mariadb', //tipo do banco que estamos usando
    port: 3307
});

const router = express.Router();
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(boryParser.urlencoded({extended: true}));
app.use(boryParser.json());




//model de fornecedor
const Fornecedores = sequelize.define('Fornecedores', {
    codigo: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fornecedor: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: Sequelize.DataTypes.STRING(50),
        allowNull: false
    },
    telefone: {
        type: Sequelize.DataTypes.STRING(15),
        allowNull: false
    }
});


//model de produtos
const Produtos = sequelize.define('Produtos', {
    codigo: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
    },
    produto: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
    },
    quantidade: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
    },
    preco: {
        type: Sequelize.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    id_fornecedor: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Fornecedores,
            key: 'codigo'
        }
    },
    imagem: {
        type: Sequelize.DataTypes.BLOB('long'),
        allowNull: true
    }
});

//model de usuario
const Usuario = sequelize.define('Usuario', {
    codigo:{
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    usuario: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
    },
    senha: {
        type: Sequelize.DataTypes.STRING(20),
        allowNull: false
    }
});

//rota para criar novo usuário
router.post('/api/novoUsuario', async (req, res) => {
    try {
        const novoUsuario = await Usuario.create({
            usuario: req.body.usuario,
            senha: req.body.senha,
        });
        res.status(201).json(novoUsuario);
    } catch (error) {
        console.error('Erro ao criar novo usuário', error);
        res.status(500).json({error: 'Erro ao criar novo usuário'});
    }
});

//rota para autenticar usuário(login)
router.post('/api/login', async (req, res) => {
    const {usuario, senha} = req.body;
    try {
        const usuarioAutenticado  = await Usuario.findOne({
            where: {
                usuario: usuario,
                senha: senha
            }
        });

        if(!usuarioAutenticado){
           return res.status(404).json({error: 'Credenciais Inválidas'});
        }
        res.status(201).json({mensagem: 'Login bem sucedido', usuario: usuarioAutenticado});
    } catch (error) {
        console.error('Erro na autenticação do usuário', error);
        res.status(500).json({error: 'Erro na autenticação do usuário'});
    }
});
//rota para criar novo fornecedor
router.post('/api/novoFornecedor', async (req, res) => {
    try {
        const novoFornecedor = await Fornecedores.create({
            fornecedor: req.body.fornecedor,
            email: req.body.email,
            telefone: req.body.telefone,
        });
        res.status(201).json(novoFornecedor);
    } catch (error) {
        console.error('Erro ao cadastrar novo Fornecedor: ', error);
        res.status(500).send({error: 'Erro ao cadastrar novo Fornecedor'});
    }
});

//rotas para listar todos os fornecedores
router.get('/api/fornecedores', async (req, res) => {
    try {
        const fornecedores = await Fornecedores.findAll();
        res.status(200).json(fornecedores);
    } catch (error) {
        console.error('Falha o listar fornecedores', error);
        res.status(500).json({error: 'Falha o listar fornecedores'});
    }
});

//rota para consultar um fornecedor pelo ID
router.get('/api/fornecedores/:id', async (req, res) => {
    try {
        const fornecedor = await Fornecedores.findByPk(req.params.id);

        if(!fornecedor){
            return res.status(404).json({error: 'Fornecedor não encontrado'});
        }
        res.status(200).json(fornecedor);
    } catch (error) {
        console.error('Falha o consultar fornecedores', error);
        res.status(500).json({error: 'Falha o consultar fornecedores'});
    }
});

//rota para deletar um fornecedor pelo ID
router.delete('/api/fornecedores/:id', async (req, res) => {
    try {
        const fornecedor = await Fornecedores.findByPk(req.params.id);

        if(!fornecedor){
            res.status(404).json({error: 'Fornecedor não encontrado'});
        }
        await fornecedor.destroy();
        res.status(200).json({mensagem: 'Fornecedor deletado com sucesso'});
    } catch (error) {
        console.error('Falha ao deletar fornecedores', error);
        res.status(500).json({error: 'Falha ao deletar fornecedores'});
    }
});

//rota para atualização do fornecedor
router.put('/api/fornecedores/:id', async (req, res) => {
    const {fornecedor, email, telefone} = req.body; //usando desestruturação
    try {
        await Fornecedores.update(
            {fornecedor, email, telefone},
            {
                where: {codigo: req.params.id},
                returning: true
            }
        );
        res.status(200).json({mensagem: 'Fornecedor atualizado com sucesso'});
    } catch (error) {
        console.error('Erro ao atualizar fornecedor', error);
        res.status(500).json({error: 'Falha ao atualizar fornecedor'});
    }
});

//rota para criar um novo produto
router.post('/api/novoProduto', upload.single('imagem'), async (req, res) => {
    try {
        const novoProduto = await Produtos.create({
            codigo: req.body.codigo,
            produto: req.body.produto,
            quantidade: req.body.quantidade,
            preco: req.body.preco,
            id_fornecedor: req.body.id_fornecedor,
            imagem: Buffer.from(req.file.buffer), //salva a imagem como um buffer
        });
        res.status(201).json(novoProduto);
    } catch (error) {
        console.error('Erro ao cadastrar novo produto', error);
        res.status(500).json({error: 'Erro ao cadastrar novo produto'});
    }
});

//rota para listar todos os produtos
router.get('/api/produtos', async (req, res) => {
    try {
        const produto = await Produtos.findAll();
        res.status(200).json(produto);
    } catch (error) {
        console.error('Erro ao listar produtos', error);
        res.status(500).json({error: 'Erro ao listar produtos'});
    }
});

//rota para listar produtos buscar produtos pelo ID
router.get('/api/produtos/:id', async (req, res) => {
    try {
        const produto = await Produtos.findByPk(req.params.id);
        if(!produto){
            res.status(404).json({mensagem: 'Produto não cadastrado'});
        }
        res.status(200).json(produto);
    } catch (error) {
        console.error('Erro ao consultar produto', error);
        res.status(500).json({error: 'Erro ao consultar produto'});
    }
});

//rota para deletar um produto
router.delete('/api/produtos/:id', async (req, res) => {
    try {
        const produto = await Produtos.findByPk(req.params.id);

    if(!produto){
        res.status(404).json({mensagem: 'Produto não cadastrado'});
    }

    await produto.destroy();
    res.status(200).json(produto);
    } catch (error) {
        console.error('Erro ao deletar produto', error);
        res.status(500).json({error: 'Erro ao deletar produto'});
    }
    
});

//rota de atualização do produto
router.put('/api/produtos/:id', upload.single('imagem'), async (req, res) => {
    try {
        if(!req.file){
            return res.status(400).json({error: 'Nenhum arquivo de imagem enviado'});
        }
        if(!req.buffer){
            return res.status(400).json({error: 'O arquivo de imagem esta vazio'});
        }

        await Produtos.update(
            {
                produto: req.body.produto,
                quantidade: req.body.quantidade,
                preco: req.body.preco,
                id_fornecedor: req.body.id_fornecedor,
                imagem: Buffer.from(req.file.buffer)
            },
            {
                where: {codigo: req.params.id},
                returning: true
            }
        )
        res.status(200).json({mensagem: 'Produto Atualizado com Sucesso!'})
    } catch (error) {
        console.error('Erro ao atualizar produto', error);
        res.status(500).json({error: 'Erro ao atualizar produto'});
    }

    
});

app.use(router);

//sequelize.sync({ force: true}); //sincronizando as tabelas criadas
//Produtos.sync({ force: true });
//Usuario.sync();
app.listen(PORTA, () => {
    console.log(`Servidor rodando na porta ${PORTA}`);
});

