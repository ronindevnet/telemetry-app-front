/*
  --------------------------------------------------------------------------------------
  Telemetria de Jogo - front-end (HTML/CSS/JS puros)

  A lista é orientada por partida: cada partida (identificada pelo jogador) pode
  ser expandida (foldout) para mostrar as armas utilizadas e suas estatísticas.
  --------------------------------------------------------------------------------------
*/
const API = 'http://127.0.0.1:5000';

// catálogo de armas mantido em memória para preencher os selects
let weaponCatalog = [];

// ícone de lixeira (Bootstrap Icons) usado no botão de remoção de partida
const TRASH_ICON = '<i class="bi bi-trash-fill"></i>';

// formatador de moeda em Reais brasileiros (R$)
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/*
  --------------------------------------------------------------------------------------
  Formata a duração (em segundos, inteiro) como HH:mm:ss
  --------------------------------------------------------------------------------------
*/
const formatDuration = (totalSeconds) => {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return pad(hh) + ':' + pad(mm) + ':' + pad(ss);
}

/*
  --------------------------------------------------------------------------------------
  Formata o valor gasto (em reais inteiros) como moeda brasileira (R$)
  --------------------------------------------------------------------------------------
*/
const formatMoney = (reais) => {
  return brl.format(Number(reais) || 0);
}

/*
  --------------------------------------------------------------------------------------
  Formata a data de registro da partida (ISO 8601 vindo da API) como dd/mm/aaaa hh:mm
  --------------------------------------------------------------------------------------
*/
const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const formatDate = (isoDate) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return isNaN(date) ? '' : dateFormat.format(date);
}

/*
  --------------------------------------------------------------------------------------
  Abre a documentação da API (GET /, que redireciona para a tela do Swagger/Redoc/RapiDoc)
  --------------------------------------------------------------------------------------
*/
const openDocs = () => {
  window.open(API + '/', '_blank');
}

/*
  --------------------------------------------------------------------------------------
  Modo debug: mostra/esconde os formulários de inserção manual de dados
  (adicionar partida e adicionar arma). Desligado por padrão.
  --------------------------------------------------------------------------------------
*/
const DEBUG_KEY = 'telemetry.debug';

const applyDebug = (on) => {
  document.body.classList.toggle('debug', on);
  const toggle = document.getElementById('debugToggle');
  if (toggle) toggle.checked = on;
}

const initDebug = () => {
  let on = false;
  try { on = localStorage.getItem(DEBUG_KEY) === '1'; } catch (error) { /* ignora */ }
  applyDebug(on);

  const toggle = document.getElementById('debugToggle');
  toggle.addEventListener('change', () => {
    applyDebug(toggle.checked);
    try { localStorage.setItem(DEBUG_KEY, toggle.checked ? '1' : '0'); } catch (error) { /* ignora */ }
  });
}

/*
  --------------------------------------------------------------------------------------
  Verifica se a API está disponível (GET /health)
  --------------------------------------------------------------------------------------
*/
const checkHealth = async () => {
  try {
    const response = await fetch(API + '/health', { method: 'get' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/*
  --------------------------------------------------------------------------------------
  Alterna entre o conteúdo normal e o aviso de servidor offline e, se online,
  carrega os dados.
  --------------------------------------------------------------------------------------
*/
const refresh = async () => {
  const online = await checkHealth();
  document.body.classList.toggle('offline', !online);
  if (online) {
    await loadCatalog();
    loadMatches();
  }
}

// chamado pelo botão "Tentar novamente" do aviso de offline
const retryConnection = () => {
  refresh();
}

/*
  --------------------------------------------------------------------------------------
  Carregamento inicial: modo debug + verificação do servidor + dados
  --------------------------------------------------------------------------------------
*/
const init = async () => {
  initDebug();
  await refresh();
}

/*
  --------------------------------------------------------------------------------------
  Busca o catálogo de armas (GET /weapons)
  --------------------------------------------------------------------------------------
*/
const loadCatalog = async () => {
  try {
    const response = await fetch(API + '/weapons');
    const data = await response.json();
    weaponCatalog = data.weapons || [];
  } catch (error) {
    console.error('Error:', error);
    weaponCatalog = [];
  }
}

/*
  --------------------------------------------------------------------------------------
  Busca a lista de partidas (GET /matches) e a renderiza
  --------------------------------------------------------------------------------------
*/
const loadMatches = () => {
  fetch(API + '/matches', { method: 'get' })
    .then((response) => response.json())
    .then((data) => renderMatches(data.matches || []))
    .catch((error) => console.error('Error:', error));
}

/*
  --------------------------------------------------------------------------------------
  Renderiza todas as partidas na lista
  --------------------------------------------------------------------------------------
*/
const renderMatches = (matches) => {
  const list = document.getElementById('matchList');
  list.replaceChildren();
  if (!matches.length) {
    const empty = document.createElement('p');
    empty.className = 'emptyMsg';
    empty.textContent = 'Nenhuma partida registrada ainda.';
    list.appendChild(empty);
    return;
  }
  matches.forEach((match) => list.appendChild(createMatchCard(match)));
}

/*
  --------------------------------------------------------------------------------------
  Cria o cartão de uma partida (cabeçalho clicável + corpo foldout)
  --------------------------------------------------------------------------------------
*/
const createMatchCard = (match) => {
  const card = document.createElement('div');
  card.className = 'match-card';
  card.dataset.id = match.id;

  // cabeçalho clicável
  const header = document.createElement('button');
  header.type = 'button';
  header.className = 'match-header';

  const toggle = document.createElement('span');
  toggle.className = 'toggle';
  toggle.textContent = '▸'; // ▸

  const player = document.createElement('span');
  player.className = 'match-player';
  player.textContent = match.player;

  const id = document.createElement('span');
  id.className = 'match-id';
  id.textContent = '#' + match.id;

  const meta = document.createElement('span');
  meta.className = 'match-meta';
  meta.textContent = 'Duração: ' + formatDuration(match.duration) + ' · Gasto: ' + formatMoney(match.money_spent);

  const date = document.createElement('span');
  date.className = 'match-date';
  date.textContent = formatDate(match.insertion_date);

  const arms = document.createElement('span');
  arms.className = 'match-arms';
  arms.textContent = match.total_weapons + (match.total_weapons === 1 ? ' arma' : ' armas');

  header.append(toggle, id, player, meta, date, arms);

  // botão de remoção da partida (visível apenas em modo de edição)
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'delete-match';
  del.title = 'Remover partida';
  del.setAttribute('aria-label', 'Remover partida');
  del.innerHTML = TRASH_ICON;
  del.onclick = (event) => {
    event.stopPropagation();
    if (confirm('Remover a partida #' + match.id + '?')) {
      deleteMatch(match.id);
    }
  };

  // corpo (foldout) - carregado sob demanda ao expandir
  const body = document.createElement('div');
  body.className = 'match-body hidden';

  header.onclick = () => toggleCard(card, match);

  // agrupa cabeçalho + botão de remoção para posicionar a lixeira apenas
  // em relação ao cabeçalho (e não ao cartão inteiro quando expandido)
  const headerRow = document.createElement('div');
  headerRow.className = 'match-header-row';
  headerRow.append(header, del);

  card.append(headerRow, body);
  return card;
}

/*
  --------------------------------------------------------------------------------------
  Expande/recolhe o cartão; ao expandir pela 1ª vez, busca os detalhes
  --------------------------------------------------------------------------------------
*/
const toggleCard = async (card, match) => {
  const body = card.querySelector('.match-body');
  const toggle = card.querySelector('.toggle');
  const isHidden = body.classList.contains('hidden');

  if (isHidden) {
    body.classList.remove('hidden');
    toggle.textContent = '▾'; // ▾
    // (re)carrega os detalhes da partida ao abrir
    const detail = await fetchMatch(match.id);
    if (detail) renderBody(card, detail);
  } else {
    body.classList.add('hidden');
    toggle.textContent = '▸'; // ▸
  }
}

/*
  --------------------------------------------------------------------------------------
  Busca uma partida com suas armas (GET /match?id=)
  --------------------------------------------------------------------------------------
*/
const fetchMatch = async (id) => {
  try {
    const response = await fetch(API + '/match?id=' + id);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

/*
  --------------------------------------------------------------------------------------
  Renderiza o corpo do cartão: lista de armas + formulário para adicionar arma
  --------------------------------------------------------------------------------------
*/
const renderBody = (card, match) => {
  const body = card.querySelector('.match-body');
  body.replaceChildren();

  // atualiza a contagem de armas no cabeçalho
  const arms = card.querySelector('.match-arms');
  arms.textContent = match.total_weapons + (match.total_weapons === 1 ? ' arma' : ' armas');

  // lista de armas utilizadas
  const usages = document.createElement('div');
  usages.className = 'weapon-usages';
  if (!match.weapons.length) {
    const none = document.createElement('p');
    none.className = 'emptyMsg';
    none.textContent = 'Nenhuma arma registrada nesta partida.';
    usages.appendChild(none);
  } else {
    match.weapons.forEach((usage) => usages.appendChild(createUsageRow(usage)));
  }

  // formulário para adicionar uma arma à partida
  const form = createAddWeaponForm(card, match.id);

  body.append(usages, form);
}

/*
  --------------------------------------------------------------------------------------
  Cria a linha de uma arma utilizada (foldout)
  --------------------------------------------------------------------------------------
*/
const createUsageRow = (usage) => {
  const row = document.createElement('div');
  row.className = 'weapon-usage';

  const name = document.createElement('strong');
  name.className = 'weapon-name';
  name.textContent = usage.name;

  const accuracy = document.createElement('span');
  accuracy.textContent = 'Precisão: ' + Math.round(usage.accuracy * 100) + '%';

  const shots = document.createElement('span');
  shots.textContent = 'Tiros: ' + usage.shots_fired;

  const reloads = document.createElement('span');
  reloads.textContent = 'Recargas: ' + usage.reloads;

  row.append(name, accuracy, shots, reloads);
  return row;
}

/*
  --------------------------------------------------------------------------------------
  Cria o formulário de adição de arma (select do catálogo + estatísticas)
  --------------------------------------------------------------------------------------
*/
const createAddWeaponForm = (card, matchId) => {
  const form = document.createElement('div');
  form.className = 'add-weapon';

  if (!weaponCatalog.length) {
    const warn = document.createElement('p');
    warn.className = 'emptyMsg';
    warn.textContent = 'Catálogo de armas vazio. Cadastre armas na base primeiro.';
    form.appendChild(warn);
    return form;
  }

  const select = document.createElement('select');
  select.className = 'weapon-select';
  weaponCatalog.forEach((weapon) => {
    const option = document.createElement('option');
    option.value = weapon.id;
    option.textContent = weapon.name;
    select.appendChild(option);
  });

  const shots = document.createElement('input');
  shots.type = 'text';
  shots.className = 'usage-shots';
  shots.placeholder = 'Tiros:';

  const accuracy = document.createElement('input');
  accuracy.type = 'text';
  accuracy.className = 'usage-accuracy';
  accuracy.placeholder = 'Precisão (0-1):';

  const reloads = document.createElement('input');
  reloads.type = 'text';
  reloads.className = 'usage-reloads';
  reloads.placeholder = 'Recargas:';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'addBtn small';
  button.textContent = 'Adicionar arma';
  button.onclick = () => addUsage(card, matchId, select.value, shots.value, accuracy.value, reloads.value);

  form.append(select, shots, accuracy, reloads, button);
  return form;
}

/*
  --------------------------------------------------------------------------------------
  Adiciona uma nova partida (POST /match)
  --------------------------------------------------------------------------------------
*/
const newItem = () => {
  const inputPlayer = document.getElementById('newPlayer').value;
  const inputDuration = document.getElementById('newDuration').value;
  const inputMoneySpent = document.getElementById('newSpent').value;

  if (inputPlayer === '') {
    alert('Escreva o nome de um jogador!');
    return;
  }
  if (isNaN(inputDuration) || isNaN(inputMoneySpent)) {
    alert('Duração e gasto precisam ser números!');
    return;
  }

  const formData = new FormData();
  formData.append('player', inputPlayer);
  formData.append('duration', inputDuration);
  formData.append('money_spent', inputMoneySpent);

  fetch(API + '/match', { method: 'post', body: formData })
    .then((response) => response.json())
    .then(() => {
      document.getElementById('newPlayer').value = '';
      document.getElementById('newDuration').value = '';
      document.getElementById('newSpent').value = '';
      loadMatches();
      alert('Partida adicionada!');
    })
    .catch((error) => console.error('Error:', error));
}

/*
  --------------------------------------------------------------------------------------
  Adiciona um uso de arma a uma partida (POST /usage)
  --------------------------------------------------------------------------------------
*/
const addUsage = (card, matchId, weaponId, shots, accuracy, reloads) => {
  if (isNaN(shots) || isNaN(accuracy) || isNaN(reloads) || shots === '' || accuracy === '' || reloads === '') {
    alert('Tiros, precisão e recargas precisam ser números!');
    return;
  }

  const formData = new FormData();
  formData.append('match_id', matchId);
  formData.append('weapon_id', weaponId);
  formData.append('shots_fired', shots);
  formData.append('accuracy', accuracy);
  formData.append('reloads', reloads);

  fetch(API + '/usage', { method: 'post', body: formData })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Não foi possível adicionar a arma.');
        return;
      }
      // re-renderiza o corpo com a arma recém-adicionada
      renderBody(card, data);
    })
    .catch((error) => console.error('Error:', error));
}

/*
  --------------------------------------------------------------------------------------
  Simula o envio de uma sessão completa pela Unity (POST /session, JSON)

  Gera um jogador, duração, gasto e de 1 a 3 armas aleatórias. As armas vêm do
  catálogo; se ele estiver vazio, usa nomes padrão, que a API cadastra sob demanda.
  --------------------------------------------------------------------------------------
*/
const SAMPLE_PLAYERS = ['ana', 'bruno', 'carla', 'diego', 'elisa', 'fabio'];
const SAMPLE_WEAPONS = ['Escopeta', 'Rifle', 'Carabina', 'Pistola', 'Besta'];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const buildRandomSession = () => {
  const names = weaponCatalog.length ? weaponCatalog.map((w) => w.name) : SAMPLE_WEAPONS;
  // embaralha e pega de 1 a 3 armas distintas
  const shuffled = [...names].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, randomInt(1, Math.min(3, shuffled.length)));

  return {
    player: SAMPLE_PLAYERS[randomInt(0, SAMPLE_PLAYERS.length - 1)],
    duration: randomInt(120, 3600),
    money_spent: randomInt(0, 50),
    weapons: picked.map((name) => ({
      weapon: name,
      shots_fired: randomInt(5, 200),
      accuracy: Math.round(Math.random() * 100) / 100,
      reloads: randomInt(0, 12),
    })),
  };
}

const simulateSession = () => {
  const payload = buildRandomSession();

  fetch(API + '/session', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Não foi possível simular a sessão.');
        return;
      }
      // a sessão pode ter cadastrado armas novas no catalogo
      await loadCatalog();
      loadMatches();
      alert('Sessão simulada: partida #' + data.id + ' de ' + data.player +
            ' com ' + data.total_weapons + (data.total_weapons === 1 ? ' arma.' : ' armas.'));
    })
    .catch((error) => console.error('Error:', error));
}

/*
  --------------------------------------------------------------------------------------
  Remove TODAS as partidas (e seus usos de arma) - DELETE /matches
  --------------------------------------------------------------------------------------
*/
const clearList = () => {
  if (!confirm('Remover TODAS as partidas cadastradas?')) return;
  fetch(API + '/matches', { method: 'delete' })
    .then((response) => response.json())
    .then(() => loadMatches())
    .catch((error) => console.error('Error:', error));
}

/*
  --------------------------------------------------------------------------------------
  Limpa o catálogo de armas e os usos de arma de todas as partidas - DELETE /weapons
  --------------------------------------------------------------------------------------
*/
const clearWeapons = () => {
  if (!confirm('Limpar o catálogo de armas e remover as armas de todas as partidas?')) return;
  fetch(API + '/weapons', { method: 'delete' })
    .then((response) => response.json())
    .then(async () => {
      await loadCatalog();
      loadMatches();
    })
    .catch((error) => console.error('Error:', error));
}

/*
  --------------------------------------------------------------------------------------
  Remove uma partida (DELETE /match?id=)
  --------------------------------------------------------------------------------------
*/
const deleteMatch = (id) => {
  fetch(API + '/match?id=' + id, { method: 'delete' })
    .then((response) => response.json())
    .then(() => loadMatches())
    .catch((error) => console.error('Error:', error));
}

// carregamento inicial
init();
