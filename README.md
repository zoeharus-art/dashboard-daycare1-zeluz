# 🐾 Zêluz® — Monitor DayCare
### Dashboard de Monitoramento em Tempo Real

---

## 📁 O que tem nessa pasta

```
dashboard-zeluz/
├── index.html          ← O DASHBOARD COMPLETO (arquivo principal)
├── logo.png            ← Wordmark Zêluz 24 (dourado, fundo transparente)
├── manifest.json       ← Configuração do app (PWA — instalar no celular)
├── icon.svg            ← Ícone do app (Z dourado fundo azul)
├── README.md           ← Este guia de documentação
└── tests/
    └── dashboard-regression.js  ← Teste local de regressão do dashboard
```

> **Para usar:** basta abrir o `index.html` em qualquer navegador (Chrome, Edge, Firefox).
> Não precisa de servidor, não precisa instalar nada.

---

## 🔗 Planilha Google Sheets (fonte dos dados)

| Item | Valor |
|------|-------|
| **Nome da Planilha** | `Daycare Geral - IC - ∞` |
| **ID da Planilha** | `1sYJfssdMiUGkyeUX2EUUVpSjpE80kETDT6Gktnqd9kA` |
| **Link direto** | https://docs.google.com/spreadsheets/d/1sYJfssdMiUGkyeUX2EUUVpSjpE80kETDT6Gktnqd9kA |
| **Nome das abas** | Preferencialmente `2026 DayCare Janeiro`, `2026 DayCare Fevereiro`, etc. |
| **Formato aceito** | O dashboard agora tenta localizar automaticamente a aba correta do mês, mesmo com pequenas variações no nome |

> **Nota de nomenclatura:** o identificador interno da planilha ainda pode conter `IC`. Isso nao afeta o funcionamento do dashboard.

### ⚠️ Requisito obrigatório
A planilha **deve ser pública**:
> Arquivo → Compartilhar → Qualquer pessoa com o link → **Visualizador**

---

## 📋 Estrutura da Planilha (Colunas-base)

A planilha deve ter **uma aba por mês**. Fevereiro de 2026 foi tratado como referencia de funcionamento e o dashboard agora aceita variacoes pequenas de acento, espaco, caixa e grafia nas colunas.

| Coluna | O que contém | Exemplo |
|--------|-------------|---------|
| `Data` | Data no formato DD/MM/AAAA | `23/02/2026` |
| `Aulunos` | Nome do peludinho | `Thor` |
| `Banho` | Nome do peludinho que tomará banho | `Thor` |
| `Hora Banho` | Horário do banho | `10h30` ou `10:30` |
| `Veterinário` | Nome do peludinho com consulta vet | `Mel` |
| `Hora Veterinário` | Horário da consulta | `14h00` |
| `Cliente Novo` | `1` ou `Sim` ou nome direto | `1` |
| `Vermifugo` | `1` se precisar vermífugo | `1` |
| `Carrapaticida` | `1` se precisar carrapaticida | `1` |
| `Troca de Coleira` | `1` se trocar coleira | `1` |
| `Adaptação` | `1` se em adaptação | `1` |
| `Peludinho que sairá cedo` | Nome do peludinho | `Luna` |
| `AUniversariante` | Nome do aniversariante | `Bolinha` |
| `Avulso` | `1` ou nome | `1` |
| `Hidratação patinha e Focinho` | `1` se precisar | `1` |
| `Avaliação` | `1` se tiver avaliação | `1` |
| `Reposição` | `1` se for reposição | `1` |
| `Faltas Avisadas` | `1` ou descrição | `Viagem` |
| `Hóspedes com Restrições` | Descrição da restrição | `kako banana` |
| `Outros` | Texto livre | `Qualquer observação` |
| `Outros 2` | Texto livre | `Segunda observação` |

### Compatibilidade automatica de colunas

O dashboard agora:

- reconhece variacoes como `Veterinario` / `Veterinário`, `Horario` / `Horário`, `Avaliacao` / `Avaliação`, `Obs 2` / `Outros 2`
- aceita datas como `15/03/2026`, `15/03/26` e `15-03-2026 00:00`
- trata a coluna imediatamente anterior a `Data` como possivel coluna-base do nome do peludinho quando a planilha usa cabecalhos como `Nomes`, `Matriculados`, `para te da`, vazio ou quebrado
- usa o nome principal do peludinho quando a coluna vem com flag como `1`, `Sim`, `True`, `X` ou `OK`
- cria automaticamente blocos extras para qualquer coluna preenchida que nao esteja mapeada no dashboard

---

## ⚙️ Como configurar para outro projeto (replicar)

### Passo 1 — Copie a pasta inteira
Copie a pasta `dashboard-zeluz` e renomeie para o novo projeto.

### Passo 2 — Troque o logo
Substitua o arquivo `logo.png` pelo logo da nova empresa (mesmo nome de arquivo).

> **Dica (logo com fundo transparente e espaço em branco):** se o logo tiver muito espaço transparente ao redor, use o CSS abaixo para recortar:
> ```css
> .logo-wrap { overflow: hidden; height: 178px; }
> .logo-img  { height: 380px; margin-top: -95px; }
> ```
> Ajuste `height` do `.logo-wrap` e `margin-top` do `.logo-img` conforme a margem que desejar.

### Passo 3 — Abra o `index.html` e altere as configurações no topo do `<script>`:

```javascript
// ══ MUDE AQUI ══
const SHEET_ID = 'COLE_O_ID_DA_NOVA_PLANILHA_AQUI';

// O dashboard tenta localizar as abas reais automaticamente.
// Se quiser trocar a origem, normalmente basta mudar apenas o SHEET_ID.
```

### Passo 4 — Ajuste cores (opcional)

No CSS, na seção `:root`, troque as variáveis de cor:
```css
:root {
  --amarelo: #C9971C;   /* cor principal do header */
  --azul:    #234D67;   /* cor secundária / textos */
}
```

O header usa gradiente escuro (azul profundo) para o logo dourado se destacar:
```css
.header {
  background: linear-gradient(160deg, #1B3A52 0%, #234D67 60%, #1B3A52 100%);
}
```

### Passo 5 — Ajuste os blocos (colunas da planilha)

No JavaScript, a variável `BASE_BLOCKS` define os cards principais do dashboard.
Para adicionar, remover ou renomear, edite o array:

```javascript
const BASE_BLOCKS = [
  {
    id:     'banho',           // identificador único (sem espaço)
    title:  'Banho',           // nome que aparece no card
    icon:   '🛁',             // emoji do card
    color:  'banho',           // paleta: banho | vet | adapt | alerta | amarelo | verde | rosa
    cols: ['Banho'],
    timeCols: ['Hora Banho', 'Horario Banho']
  },
  // ... outros blocos
];
```

> Mesmo sem editar `BASE_BLOCKS`, qualquer coluna preenchida e nao mapeada passa a aparecer automaticamente como bloco extra.

---

## 🎨 Paleta de Cores por Tipo de Cuidado

| Cor CSS | Uso | Hexadecimal |
|---------|-----|-------------|
| `banho` | Banho e Hidratação | `#2A8FAF` (azul água) |
| `vet` | Veterinário, Vermífugo, Carrapaticida, **Troca de Coleira** | `#3C9B6B` (verde saúde) |
| `adapt` | Adaptação | `#8B6FC4` (lilás bem-estar) |
| `alerta` | **Hóspedes com Restrições** — efeito especial animado | `#D4711A` (laranja vibrante) |
| `amarelo` | Avulso, Avaliação, Outros | `#B88B0A` (dourado) |
| `verde` | Cliente Novo | `#1E7D4B` (verde escuro) |
| `rosa` | Aniversariante | `#C2185B` (rosa) |
| `futuro` | Em Breve (blocos futuros) | cinza/neutro |

### 🔥 Efeito especial — Hóspedes com Restrições

O bloco `alerta` tem animação exclusiva:
- **Header**: listras diagonais animadas (laranja + marrom)
- **Borda**: brilho pulsante (glow laranja/vermelho)

```css
@keyframes alertaGlow {
  0%,100% { box-shadow: 0 0 0 2px #FF4500, 0 4px 18px rgba(255,69,0,.3); }
  50%      { box-shadow: 0 0 0 3px #FF6A00, 0 6px 28px rgba(255,106,0,.55); }
}
@keyframes alertaHeader {
  0%,100% { background-position: 0 0; }
  100%    { background-position: 28px 0; }
}
```

---

## 📐 Grade de Blocos (Layout 4 colunas)

Os blocos são organizados em **4 colunas por linha**, na seguinte ordem:

| Linha | Col 1 | Col 2 | Col 3 | Col 4 |
|-------|-------|-------|-------|-------|
| **1ª** | 🏠⚠️ Hóspedes c/ Restrições | ⭐ Cliente Novo | 🌟 Adaptação | 🎂 Aniversariante |
| **2ª** | 🛁 Banho | 🩺 Veterinário | 💊 Vermífugo | 🔬 Carrapaticida |
| **3ª** | 🏷️ Troca de Coleira | 💧 Hidratação Patinha | 🐾 Avulso | 📋 Avaliação |
| **4ª+** | 🚗 Saindo Cedo | 🔄 Reposição | 📵 Faltas Avisadas | 📝 Outros |
| | 📝 Outros 2 | 🔜 Em Breve | | |

Para alterar o número de colunas:
```css
.blocks-grid { grid-template-columns: repeat(4, 1fr); }
/*                                             ↑ mude para 3, 5, etc. */
```

---

## ✨ Frase do Dia

- Exibida centralizada abaixo do header
- Fonte **20px**, itálico, cor dourada (`#F0C840`)
- Efeito de brilho pulsante (`fraseGlow`)
- Textos usam vocabulário Zêluz: **FILHOts**, **peludinhos**, **peludos**

Para mudar o tamanho:
```css
.frase-texto { font-size: 20px; }
```

---

## ⏰ Sistema de Alarme (Banho)

O dashboard dispara automaticamente um **alarme sonoro + visual** **5 minutos antes** do horário de banho agendado.

- O alarme verifica a cada 10 segundos
- Cada alarme toca apenas uma vez por sessão (não repete se atualizar a página do dia)
- Mensagem exibida: **"🐾 Prepare para o banho das HH:MM"**
- Para mudar o tempo antes do alarme, no `index.html` procure:
  ```javascript
  let alarmMin = hora.min - 5;  // ← mude o 5 para outro número de minutos
  ```

### 🧪 Botão de Teste do Alarme

Na barra de ações existe o botão **⏰ Testar Alarme** — clique para disparar um alarme de exemplo e ver como ele aparece na tela antes do horário real chegar.

```javascript
function testarAlarme() {
  triggerAlarm('🐾 Doguinho Teste', '14:30');
}
```

> **Dica:** o navegador pode bloquear áudio automático. Clique em qualquer parte da página primeiro para liberar o som.

---

## 🔄 Atualização automática dos dados e cache

| Configuração | Valor padrão |
|-------------|--------------|
| Atualização automática (sucesso) | 2 minutos |
| Tentativa após erro | 30 segundos |
| Cache offline | 24 horas |

Para mudar os intervalos, no `index.html`:
```javascript
const REFRESH_OK = 120;  // segundos — quando tem internet
const REFRESH_ER = 30;   // segundos — quando está sem conexão
```

Quando houver mudanca estrutural na planilha, use o botao `🔄 Atualizar` para forcar releitura das abas e das colunas.

O dashboard prioriza nomes de abas no formato `ANO DayCare Mês`, mas tambem tenta variações conhecidas como:

- abas com espaco extra no inicio
- abas antigas sem ano no nome
- grafias `DayCare`, `Daycare` e `Day Care`

---

## 🧪 Testes locais e validacao

O projeto agora possui um teste local de regressao para o motor do dashboard:

```powershell
node tests/dashboard-regression.js
```

Esse teste valida localmente:

- normalizacao de datas
- aliases de colunas principais
- fallback da coluna-base de nome antes de `Data`
- fallback de nome quando a planilha usa flag (`1`, `Sim`, `OK`, etc.)
- criacao automatica de blocos para colunas nao mapeadas
- resolucao automatica de nomes de abas mensais
- leitura de horarios com formatos como `13;30`

> O teste nao acessa a internet. Ele verifica a logica interna do `index.html` com cenarios simulados.

---

## 📅 Google Apps Script — Criar abas automaticamente

Para criar as abas mensais na planilha automaticamente, use este script no Google Sheets:

> **Como acessar:** Planilha → Extensões → Apps Script

### Script 1 — Criar estrutura de abas (por ano)

```javascript
// Cole na planilha e execute a função do ano desejado
function criarAbas2026() { _criarAbas(2026); }
function criarAbas2027() { _criarAbas(2027); }
function criarAbas2028() { _criarAbas(2028); }
function criarAbas2029() { _criarAbas(2029); }

function _criarAbas(ano) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                 'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  // Pega o cabeçalho da aba de referência (Fevereiro ou primeira que existir)
  let refSheet = ss.getSheetByName(`${ano} DayCare Fevereiro`)
               || ss.getSheetByName(`2026 DayCare Fevereiro`);
  const cabecalho = refSheet ? refSheet.getRange(1, 1, 1, refSheet.getLastColumn()).getValues()[0] : ['Data'];

  for (let m = 0; m < 12; m++) {
    const nomAba = `${ano} DayCare ${MESES[m]}`;
    if (ss.getSheetByName(nomAba)) continue; // já existe, pula

    const novaAba = ss.insertSheet(nomAba);
    // Coloca só o cabeçalho
    novaAba.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]);
    Utilities.sleep(200);
  }
  SpreadsheetApp.getUi().alert(`Abas de ${ano} criadas com sucesso!`);
}
```

### Script 2 — Preencher datas nas abas

```javascript
// Preenche as datas de cada dia do mês (linhas em branco, só coluna Data preenchida)
function preencherPeriodo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                 'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  // Configuração: quais anos/meses preencher
  const anoInicio = 2026;
  const anoFim    = 2029;
  const LINHAS_POR_DIA = 10; // quantas linhas por dia (ajuste conforme sua planilha)

  for (let ano = anoInicio; ano <= anoFim; ano++) {
    for (let mes = 0; mes < 12; mes++) {
      const nomAba = `${ano} DayCare ${MESES[mes]}`;
      const aba = ss.getSheetByName(nomAba);
      if (!aba) continue;

      // Descobre quantas colunas tem
      const numCols = aba.getLastColumn() || 20;
      const dataCol = 0; // índice da coluna Data (0 = primeira coluna)

      // Quantos dias tem o mês
      const diasNoMes = new Date(ano, mes + 1, 0).getDate();

      // Prepara as linhas de dados (ignora linha 1 = cabeçalho)
      const dados = [];
      for (let dia = 1; dia <= diasNoMes; dia++) {
        const ds = `${String(dia).padStart(2,'0')}/${String(mes+1).padStart(2,'0')}/${ano}`;
        for (let i = 0; i < LINHAS_POR_DIA; i++) {
          const nr = new Array(numCols).fill('');
          nr[dataCol] = ds;
          dados.push(nr);
        }
      }

      // Limpa conteúdo antigo (mantém cabeçalho) e insere dados
      if (aba.getLastRow() > 1) {
        aba.getRange(2, 1, aba.getLastRow() - 1, numCols).clearContent();
      }
      if (dados.length > 0) {
        aba.getRange(2, 1, dados.length, numCols).setValues(dados);
      }
      Utilities.sleep(300);
    }
  }
  SpreadsheetApp.getUi().alert('Datas preenchidas com sucesso!');
}
```

---

## 🖥️ Tecnologias utilizadas

| Tecnologia | Para que serve |
|-----------|---------------|
| HTML/CSS/JavaScript puro | Sem dependências externas |
| Google Sheets gviz API (JSONP) | Lê a planilha sem precisar de servidor (bypassa CORS) |
| Web Audio API | Toca o som do alarme no navegador |
| localStorage | Salva cache dos dados (funciona offline por 24h) |
| Heurística de nomes de abas | Tenta localizar a aba correta mesmo com pequenas variacoes de nome |
| Heurística de nomes de abas | Tenta localizar a aba correta mesmo com pequenas variacoes de nome |
| sessionStorage | Controla quais alarmes já tocaram na sessão |
| Intl.DateTimeFormat | Mantém horário de Brasília correto em qualquer computador |
| Google Fonts (Poppins) | Tipografia (precisa de internet) |

---

## 🔍 Funcionalidades do dashboard

| Função | Como usar |
|--------|-----------|
| **Marcar como feito** | Clique em qualquer nome na lista |
| **Navegar por datas** | Botões ← Anterior / Próximo → na barra azul |
| **Voltar para hoje** | Botão "Hoje" na barra azul |
| **Atualizar dados** | Botão verde "🔄 Atualizar" |
| **Diagnóstico** | Botão "🔍 Diagnóstico" — mostra o que foi encontrado na planilha |
| **Testar alarme** | Botão "⏰ Testar Alarme" — dispara um alarme de exemplo |
| **Duas abas de visualização** | 📊 Visão Geral (números) · 🐾 Rotinas Amigos (nomes) |
| **Blocos automaticos** | Qualquer coluna preenchida e nao mapeada vira um bloco extra automaticamente |
| **Resolucao de abas** | O dashboard tenta encontrar a aba do mes mesmo com pequenas variacoes no nome |
| **Nome-base do peludinho** | Quando necessario, o dashboard usa a coluna imediatamente anterior a `Data` como fonte principal do nome |
| **Carregamento resiliente** | O dashboard abre pelo mes selecionado primeiro, usa cache imediato quando existir e deixa os meses vizinhos para segundo plano |

---

## 🚨 Resolução de problemas comuns

| Problema | Causa provável | Solução |
|----------|---------------|---------|
| Dashboard não carrega dados | Planilha não está pública | Arquivo → Compartilhar → Qualquer pessoa com link |
| Bloco aparece vazio | A coluna veio com nome muito diferente ou sem dados | Use o botão "🔍 Diagnóstico"; se a coluna nao estiver mapeada, ela deve aparecer como bloco automatico |
| Alarme não toca | Navegador bloqueou áudio automático | Clique em qualquer parte da página antes do horário do alarme |
| Datas não encontradas | Formato extremo ou valor invalido | Prefira `DD/MM/AAAA`; o dashboard tambem aceita `DD/MM/AA` e `DD-MM-AAAA HH:MM` |
| Acento na coluna não reconhecido | Encoding | O dashboard trata acentos, espacos extras e variacoes comuns automaticamente |
| Mes nao abre | Nome da aba mudou | Clique em `🔄 Atualizar`; o dashboard tenta os nomes candidatos conhecidos para a aba |
| Fica preso em `Carregando...` | Mes inexistente, internet instavel ou tentativa lenta em abas vizinhas | O dashboard agora prioriza o mes atual, usa cache imediato e limita o tempo de cada tentativa de aba |
| Bloco mostra `1` no lugar do nome | A planilha usou flag em vez do nome e o nome-base veio em outra coluna | O dashboard agora tenta usar a coluna-base anterior a `Data` ou colunas como `Nomes`/`Matriculados` |
| Logo com muito espaço em branco | PNG com padding transparente | Ajuste `height` do `.logo-wrap` e `margin-top` do `.logo-img` |

---

## 💾 Salvamento e backup

Regra operacional deste projeto:

1. A cada atualizacao grande, salvar imediatamente os arquivos alterados.
2. A cada atualizacao grande concluida, criar uma copia datada da pasta `dashboard-zeluz`.
3. Antes de mudancas estruturais na planilha ou no `index.html`, manter pelo menos uma copia funcional anterior.

Sugestao pratica:

- duplicar a pasta com data no nome, por exemplo `dashboard-zeluz-2026-03-01`
- ou compactar a pasta inteira em `.zip` apos cada bloco importante de alteracoes

Objetivo: evitar perda de trabalho em caso de falta de luz, queda de internet, travamento do navegador ou erro humano.

---

## 🏷️ Nomenclatura e marca

- A assinatura visual atual do projeto e do dashboard e `Kairós® — By Adriana Duarte .'.`
- A troca de `Inteligência Criativa` para `Kairós` estava presente no rodape e nos creditos, mas nao estava registrada claramente no historico tecnico.
- A partir desta documentacao, a mudanca passa a ficar oficialmente registrada neste `README.md`.
- Em 01/03/2026 foi feita uma varredura tecnica da primeira ate a ultima aba da planilha publica para confirmar compatibilidade do dashboard com a estrutura real dos meses.

---

## 🏷️ Créditos

```
Kairós® — By Adriana Duarte .'.
Zêluz® Pet DayCare — Belo Horizonte · zeluz.com.br
Desenvolvido com Claude Code (Anthropic)
```

---

## 📌 Versão e histórico

| Data | Versão | O que mudou |
|------|--------|-------------|
| Fev/2026 | v1 | Dashboard inicial — leitura de planilha via JSONP |
| Fev/2026 | v2 | Duas abas (Visão Geral + Rotinas), alarme, cache offline |
| Fev/2026 | v3 | Redesign premium — cores por cuidado, animações, logo maior, slogan full-width, frase de destaque, alarme 5 min antes, footer ∞ |
| Fev/2026 | v4 | **Novo logo** Wordmark 24 (dourado, fundo transparente) · **Header azul profundo** · **Grade 4 colunas** · **Nova ordem dos blocos** · Troca de Coleira → cor verde (vet) · **Hóspedes com Restrições**: listras diagonais animadas + brilho pulsante · **Frase do dia** 20px centralizada com glow dourado · Vocabulário Zêluz nas frases (FILHOts, peludinhos) · Alarme dispara **5 min antes** com mensagem atualizada · **Botão ⏰ Testar Alarme** · Tabs com espaçamento mínimo |
| 28/02/2026 | v5 | Correcao estrutural da leitura da planilha: ampliacao dos nomes candidatos das abas mensais, normalizacao ampliada de datas, suporte a aliases de colunas, fallback para flags (`1`, `Sim`, `OK`, etc.), criacao automatica de blocos para colunas nao mapeadas, diagnostico atualizado, teste local `tests/dashboard-regression.js` e documentacao consolidada |
| 01/03/2026 | v6 | Varredura tecnica da primeira ate a ultima aba da planilha publica; ajuste do nome-base do peludinho pela coluna anterior a `Data`; exclusao dessa coluna dos blocos dinamicos; suporte a horarios com `;`; ampliacao do fallback para abas antigas sem ano ou com espaco inicial; regressao atualizada com casos reais da planilha |
| 01/03/2026 | v7 | Correcao do carregamento do dashboard publicado: leitura prioriza o mes atual, exibe cache imediatamente quando existir, deixa meses vizinhos em segundo plano, limita timeout por aba e paraleliza a busca pelos nomes candidatos para evitar travamento prolongado em `Carregando...` |
| 01/03/2026 | docs | Documentada oficialmente a troca da assinatura/branding de `Inteligência Criativa` para `Kairós`, a varredura completa das abas reais e a regra operacional de salvar/gerar backup a cada atualizacao grande |
