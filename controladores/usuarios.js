const conexao = require('../conexao');
const securePassword = require('secure-password');
const jwt = require('jsonwebtoken');
const jwtSecret = require('../jwt_secret');

const pwd = securePassword();

async function cadastrarUsuarios(req, res) {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json('É preciso preencher todos os campos (nome, email e senha)!');
  }

  try {
    const usuario = await conexao.query('select * from usuarios where email = $1', [email]);

    if (usuario.rowCount > 0) {
      return res.status(400).json('Este email já está cadastrado');
    }
  } catch (error) {
    return res.status(400).json(error.message);
  }

  try {
    const hash = (await pwd.hash(Buffer.from(senha))).toString('hex');
    const query = 'insert into usuarios (nome, email, senha) values ($1, $2, $3)';
    const usuario = await conexao.query(query, [nome, email, hash]);

    if (usuario.rowCount === 0) {
      return res.status(400).json('Não foi possível cadastrar o usuário');
    }

    return res.json('Usuário cadastrado com sucesso');
  } catch (error) {
    return res.status(400).json(error.message);
  }
}

async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json('É preciso preencher todos os campos (nome, email e senha)!');
  }

  try {
    const usuario = await conexao.query('select * from usuarios where email = $1', [email]);

    if (usuario.rowCount === 0) {
      return res.status(400).json('Email ou senha incorretos');
    }

    const usuarioEncontrado = usuario.rows[0];
    const result = await pwd.verify(Buffer.from(senha), Buffer.from(usuarioEncontrado.senha, 'hex'));

    switch (result) {
      case securePassword.INVALID_UNRECOGNIZED_HASH:
      case securePassword.INVALID:
        return res.status(400).json('Email ou senha incorretos');
      case securePassword.VALID:
        break;
      case securePassword.VALID_NEEDS_REHASH:
        try {
          const hash = (await pwd.hash(Buffer.from(senha))).toString('hex');
          const query = 'update usuarios set senha = $1 where email = $2';
          await conexao.query(query, [hash, email]);
        } catch (err) {
        }
        break;
    }

    const token = jwt.sign({
      id: usuarioEncontrado.id,
      nome: usuarioEncontrado.nome,
      email: usuarioEncontrado.email
    }, jwtSecret);

    return res.json(token);
  } catch (error) {
    return res.status(400).json(error.message);
  }
}

module.exports = { cadastrarUsuarios, login };