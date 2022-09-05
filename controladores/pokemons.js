const conexao = require('../conexao');
const jwt = require('jsonwebtoken');
const jwtSecret = require('../jwt_secret');

async function cadastrarPokemon(req, res) {
  const { nome, habilidades, imagem, apelido, token } = req.body;
  let usuario_id;

  if (!nome || !habilidades || !token) {
    return res.status(400).json('Os campos nome, habilidades e token são obrigatórios!');
  }

  if (habilidades !== String(habilidades)) {
    return res.status(400).json('O campo habilidades deve ser preenchido apenas com texto, listando as habilidades separadas por vírgula!');
  }

  try {
    const usuario = jwt.verify(token, jwtSecret);
    usuario_id = usuario.id;
  } catch (error) {
    return res.status(400).json('O token é inválido!');
  }

  try {
    const query = 'insert into pokemons (usuario_id, nome, habilidades, imagem, apelido) values ($1, $2, $3, $4, $5)';
    const pokemon = await conexao.query(query, [usuario_id, nome, habilidades, imagem, apelido]);

    if (pokemon.rowCount === 0) {
      return res.status(400).json('Não foi possível cadastrar o pokemon');
    }

    return res.json('Pokemon cadastrado com sucesso');
  } catch (error) {
    return res.status(400).json(error.message);
  }
}

async function atualizarPokemon(req, res) {
  const { id } = req.params;
  const { apelido, token } = req.body;

  if (!apelido || !token) {
    return res.status(400).json('Os campos apelido e token são obrigatórios! Não é possível atualizar outras informações além do apelido!');
  }

  try {
    const usuario = jwt.verify(token, jwtSecret);
  } catch (error) {
    return res.status(400).json('O token é inválido!');
  }

  try {
    const pokemon = await conexao.query('select * from pokemons where id = $1', [id]);

    if (pokemon.rowCount === 0) {
      return res.status(404).json('Pokemon não encontrado!');
    }

    const query = 'update pokemons set apelido = $1 where id = $2';
    const pokemonAtualizado = await conexao.query(query, [apelido, id]);

    if (pokemonAtualizado.rowCount === 0) {
      return res.status(400).json('Não foi possível atualizar o pokemon');
    }

    return res.json('Pokemon atualizado com sucesso!');
  } catch (error) {
    return res.status(400).json(error.message);
  }
}

async function listarPokemons(req, res) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json('O campo token é obrigatório!');
  }

  try {
    const usuario = jwt.verify(token, jwtSecret);
  } catch (error) {
    return res.status(400).json('O token é inválido!');
  }

  try {
    const query = `select p.id, u.nome as usuario, p.nome, p.apelido, p.habilidades, p.imagem from pokemons p
    left join usuarios u on p.usuario_id = u.id
    order by id`
    const { rows: pokemons } = await conexao.query(query);

    for (const pokemon of pokemons) {
      pokemon.habilidades = pokemon.habilidades.split(',');
    }

    return res.json(pokemons);
  } catch (error) {
    return res.status(400).json(error.message);
  }
}

async function obterPokemon(req, res) {
  const { id } = req.params;
  const { token } = req.body;

  if (!token) {
    return res.status(400).json('O campo token é obrigatório!');
  }

  try {
    const usuario = jwt.verify(token, jwtSecret);
  } catch (error) {
    return res.status(400).json('O token é inválido!');
  }

  try {
    const query = `select p.id, u.nome as usuario, p.nome, p.apelido, p.habilidades, p.imagem from pokemons p
    left join usuarios u on p.usuario_id = u.id
    where p.id = $1`
    const pokemon = await conexao.query(query, [id]);

    if (pokemon.rowCount === 0) {
      return res.status(404).json('Pokemon não encontrado!');
    }

    pokemon.rows[0].habilidades = pokemon.rows[0].habilidades.split(',');

    return res.json(pokemon.rows[0]);
  } catch (error) {
    return res.status(400).json(error.message);
  }
}

async function excluirPokemon(req, res) {
  const { id } = req.params;
  const { token } = req.body;
  let usuario_id;

  if (!token) {
    return res.status(400).json('O campo token é obrigatório!');
  }

  try {
    const usuario = jwt.verify(token, jwtSecret);
    usuario_id = usuario.id;
  } catch (error) {
    return res.status(400).json('O token é inválido!');
  }

  try {
    const pokemon = await conexao.query('select * from pokemons where id = $1', [id]);

    if (pokemon.rowCount === 0) {
      return res.status(404).json('Pokemon não encontrado!');
    }

    if (pokemon.rows[0].usuario_id === usuario_id) {
      const pokemonExcluido = await conexao.query('delete from pokemons where id = $1', [id]);

      if (pokemonExcluido.rowCount === 0) {
        return res.status(400).json('Não foi possível excluir o Pokemon!');
      }
    } else {
      return res.status(400).json('Somente o dono pode excluir o Pokemon selecionado');
    }

    return res.json('Pokemon excluído com sucesso');
  } catch (error) {
    return res.status(400).json(error.message);
  }
}

module.exports = {
  cadastrarPokemon,
  atualizarPokemon,
  listarPokemons,
  obterPokemon,
  excluirPokemon
};