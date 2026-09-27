# Front de Telemetria

Interface web (SPA) feita apenas com HTML, CSS e JavaScript puros, sem frameworks,
para a [API de Telemetria](https://github.com/ronindevnet/telemetry-app-api). Exibe as partidas de
jogo registradas pela Unity, com as armas utilizadas em cada uma e suas
estatísticas.

A estrutura segue o material didático da disciplina **Desenvolvimento Full Stack
Básico**.

---
## Como executar

1. Coloque a API de telemetria em execução em `http://127.0.0.1:5000`
   (consulte o README da API; no Windows, basta um duplo-clique no `run.bat`).
2. Abra o arquivo `index.html` diretamente no navegador.

Não é necessário instalar dependências nem subir servidor para o front-end. Os
ícones ([Bootstrap Icons](https://icons.getbootstrap.com/)) são carregados via
CDN.

> Se a API não estiver no ar, a página exibe o aviso **Servidor está offline**
> com as instruções para iniciá-la e um botão **Tentar novamente**.

---
## Funcionalidades

### Uso normal

- **Lista de partidas** em cartões, com jogador, duração (`HH:mm:ss`), valor
  gasto (`R$`), data de registro e quantidade de armas.
- **Detalhes da partida**: clique em um cartão para expandi-lo (foldout) e ver as
  armas utilizadas, com precisão, tiros e recargas.
- **Documentação da API**: link no rodapé que abre o Swagger/Redoc/RapiDoc.

### Modo Debug

Algumas funcionalidades ficam escondidas por padrão, porque na operação normal os
dados chegam da Unity. Para acessá-las, marque a caixa **Modo Debug** no rodapé da
página (a escolha fica salva no navegador).

Com o Modo Debug ligado, aparecem:

- **Adicionar partida**: formulário para criar uma partida manualmente.
- **Adicionar arma**: dentro de cada cartão expandido, formulário para registrar
  o uso de uma arma do catálogo na partida.
- **Remover partida**: ícone de lixeira em cada cartão.
- **Simular sessão da Unity**: envia uma sessão aleatória completa (partida +
  armas), como a Unity faria ao final de uma gameplay.
- **Limpar Lista**: remove todas as partidas.
- **Limpar Armas**: limpa o catálogo de armas e as armas de todas as partidas.

---
## Rotas da API utilizadas

| Ação no front-end | Rota |
|---|---|
| Verificação de servidor online/offline | `GET /health` |
| Carregar a lista de partidas | `GET /matches` |
| Expandir um cartão (detalhes da partida) | `GET /match?id=` |
| Carregar o catálogo de armas (select de *Adicionar arma*) | `GET /weapons` |
| Adicionar partida | `POST /match` |
| Adicionar arma à partida | `POST /usage` |
| Simular sessão da Unity | `POST /session` |
| Remover partida | `DELETE /match?id=` |
| Limpar Lista | `DELETE /matches` |
| Limpar Armas | `DELETE /weapons` |
| Link *Documentação da API* | `GET /` |
