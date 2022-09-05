const express = require('express');
const usuarios = require('./controladores/usuarios');
const pokemons = require('./controladores/pokemons');

const rotas = express();

rotas.post('/usuarios', usuarios.cadastrarUsuarios);
rotas.post('/login', usuarios.login);

rotas.post('/pokemons', pokemons.cadastrarPokemon);
rotas.put('/pokemons/:id', pokemons.atualizarPokemon);
rotas.get('/pokemons', pokemons.listarPokemons);
rotas.get('/pokemons/:id', pokemons.obterPokemon);
rotas.delete('/pokemons/:id', pokemons.excluirPokemon);

module.exports = rotas;