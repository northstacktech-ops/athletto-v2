# 04 — Modelo de Dados

## Entidades e Relações

```
Clube
 ├── Gestores (1:N)
 ├── Atletas (1:N)
 │    └── Turmas (N:N via atleta_turma)
 ├── Turmas (1:N)
 │    └── Frequências (1:N)
 ├── Planejamentos (1:N)
 │    └── Caixinhas (1:1 quando ativo)
 │         └── Cobranças (1:N — uma por atleta vinculado)
 └── Transações (1:N — dashboard financeiro)
```

---

## Tabelas

### `clubes`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
nome            VARCHAR(255) NOT NULL
slug            VARCHAR(100) UNIQUE NOT NULL  -- usado na URL do portal
modalidade      VARCHAR(100)
cnpj            VARCHAR(18)
telefone        VARCHAR(20)
email           VARCHAR(255)
logo_url        TEXT
plano           ENUM('basico', 'intermediario', 'profissional') DEFAULT 'basico'
plano_ativo     BOOLEAN DEFAULT true
criado_em       TIMESTAMP DEFAULT NOW()
atualizado_em   TIMESTAMP DEFAULT NOW()
```

### `gestores`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
clube_id        UUID NOT NULL REFERENCES clubes(id) ON DELETE CASCADE
nome            VARCHAR(255) NOT NULL
cpf             VARCHAR(14) UNIQUE NOT NULL
email           VARCHAR(255) UNIQUE NOT NULL
email_verificado BOOLEAN DEFAULT false
senha_hash      TEXT NOT NULL
foto_url        TEXT
telefone        VARCHAR(20)
role            ENUM('principal', 'adicional') DEFAULT 'adicional'
permissoes      JSONB DEFAULT '{}'  -- módulos permitidos para gestores adicionais
ativo           BOOLEAN DEFAULT true
criado_em       TIMESTAMP DEFAULT NOW()
atualizado_em   TIMESTAMP DEFAULT NOW()
```

### `atletas`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
clube_id        UUID NOT NULL REFERENCES clubes(id) ON DELETE CASCADE
nome            VARCHAR(255) NOT NULL
apelido         VARCHAR(100)
cpf             VARCHAR(14) UNIQUE NOT NULL
data_nascimento DATE
telefone        VARCHAR(20)
telefone_responsavel VARCHAR(20)
email           VARCHAR(255)
foto_url        TEXT
numero_camisa   VARCHAR(10)
posicao         VARCHAR(100)
status          ENUM('titular', 'novato', 'selecionado', 'afastado') DEFAULT 'novato'
saude           ENUM('saudavel', 'lesionado', 'em_recuperacao') DEFAULT 'saudavel'
tipo_sanguineo  VARCHAR(5)
historico_lesoes JSONB DEFAULT '[]'  -- [{descricao, data}]
observacoes_medicas TEXT
data_entrada    DATE DEFAULT CURRENT_DATE
ativo           BOOLEAN DEFAULT true
-- Acesso ao app
senha_app_hash  TEXT  -- null até o primeiro acesso
app_primeiro_acesso BOOLEAN DEFAULT true
criado_em       TIMESTAMP DEFAULT NOW()
atualizado_em   TIMESTAMP DEFAULT NOW()
```

### `turmas`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
clube_id        UUID NOT NULL REFERENCES clubes(id) ON DELETE CASCADE
nome            VARCHAR(255) NOT NULL
descricao       TEXT
dias_semana     INTEGER[]  -- [0=Dom, 1=Seg, ..., 6=Sab]
horario_inicio  TIME NOT NULL
horario_fim     TIME NOT NULL
local           VARCHAR(255)
ativo           BOOLEAN DEFAULT true
criado_em       TIMESTAMP DEFAULT NOW()
atualizado_em   TIMESTAMP DEFAULT NOW()
```

### `atleta_turma` (N:N)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
atleta_id       UUID NOT NULL REFERENCES atletas(id) ON DELETE CASCADE
turma_id        UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE
data_vinculo    DATE DEFAULT CURRENT_DATE
ativo           BOOLEAN DEFAULT true
UNIQUE(atleta_id, turma_id)
```

### `frequencias`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
clube_id        UUID NOT NULL REFERENCES clubes(id)
turma_id        UUID NOT NULL REFERENCES turmas(id)
atleta_id       UUID NOT NULL REFERENCES atletas(id)
data            DATE NOT NULL
presente        BOOLEAN NOT NULL
registrado_por  UUID REFERENCES gestores(id)
criado_em       TIMESTAMP DEFAULT NOW()
UNIQUE(turma_id, atleta_id, data)
```

### `alertas_evasao`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
clube_id        UUID NOT NULL REFERENCES clubes(id)
atleta_id       UUID NOT NULL REFERENCES atletas(id)
turma_id        UUID NOT NULL REFERENCES turmas(id)
faltas_consecutivas INTEGER NOT NULL
data_deteccao   DATE DEFAULT CURRENT_DATE
dispensado      BOOLEAN DEFAULT false
dispensado_por  UUID REFERENCES gestores(id)
dispensado_em   TIMESTAMP
criado_em       TIMESTAMP DEFAULT NOW()
```

### `eventos_calendario`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
clube_id        UUID NOT NULL REFERENCES clubes(id)
titulo          VARCHAR(255) NOT NULL
descricao       TEXT
tipo            ENUM('treino', 'evento') DEFAULT 'evento'
data_inicio     TIMESTAMP NOT NULL
data_fim        TIMESTAMP
turma_id        UUID REFERENCES turmas(id)  -- para eventos de treino
criado_por      UUID REFERENCES gestores(id)
criado_em       TIMESTAMP DEFAULT NOW()
```

### `planejamentos`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
clube_id        UUID NOT NULL REFERENCES clubes(id)
nome            VARCHAR(255) NOT NULL  -- ex: "Mensalidade Junho", "Uniforme 2026"
descricao       TEXT
tipo            ENUM('recorrente', 'unico') NOT NULL
valor           DECIMAL(10,2) NOT NULL
periodicidade   ENUM('mensal', 'bimestral', 'trimestral', 'semestral', 'anual') 
                -- null se tipo = 'unico'
dia_vencimento  INTEGER  -- dia do mês para cobranças recorrentes (ex: 5, 10, 15)
data_vencimento DATE     -- data específica para cobranças únicas
status          ENUM('inativo', 'ativo', 'encerrado') DEFAULT 'inativo'
ativado_em      TIMESTAMP
ativado_por     UUID REFERENCES gestores(id)
encerrado_em    TIMESTAMP
criado_por      UUID NOT NULL REFERENCES gestores(id)
criado_em       TIMESTAMP DEFAULT NOW()
atualizado_em   TIMESTAMP DEFAULT NOW()
```

### `planejamento_atletas` (atletas vinculados a um planejamento)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
planejamento_id UUID NOT NULL REFERENCES planejamentos(id) ON DELETE CASCADE
atleta_id       UUID NOT NULL REFERENCES atletas(id) ON DELETE CASCADE
adicionado_em   TIMESTAMP DEFAULT NOW()
UNIQUE(planejamento_id, atleta_id)
```

### `caixinhas`
```sql
-- Gerada automaticamente ao ativar um planejamento (1:1 com planejamento ativo)
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
clube_id        UUID NOT NULL REFERENCES clubes(id)
planejamento_id UUID NOT NULL UNIQUE REFERENCES planejamentos(id)
nome            VARCHAR(255) NOT NULL  -- copiado do planejamento
saldo_arrecadado DECIMAL(10,2) DEFAULT 0.00
total_previsto  DECIMAL(10,2) DEFAULT 0.00  -- valor × nº atletas vinculados
total_pendente  DECIMAL(10,2) DEFAULT 0.00
total_pago      DECIMAL(10,2) DEFAULT 0.00
criada_em       TIMESTAMP DEFAULT NOW()
```

### `cobranças`
```sql
-- Uma linha por atleta × caixinha
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
clube_id        UUID NOT NULL REFERENCES clubes(id)
caixinha_id     UUID NOT NULL REFERENCES caixinhas(id)
atleta_id       UUID NOT NULL REFERENCES atletas(id)
valor           DECIMAL(10,2) NOT NULL
status          ENUM('pendente', 'pago', 'isento', 'cancelado') DEFAULT 'pendente'
data_vencimento DATE NOT NULL
data_pagamento  TIMESTAMP
-- AbacatePay
abacatepay_payment_id VARCHAR(255)  -- ID retornado pela API
abacatepay_link TEXT                -- link Pix para pagamento
abacatepay_qrcode TEXT             -- QR code base64 (opcional)
-- Controle
gerado_em       TIMESTAMP DEFAULT NOW()
atualizado_em   TIMESTAMP DEFAULT NOW()
UNIQUE(caixinha_id, atleta_id)
```

### `transacoes`
```sql
-- Dashboard financeiro — entradas e saídas manuais
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
clube_id        UUID NOT NULL REFERENCES clubes(id)
tipo            ENUM('entrada', 'saida') NOT NULL
valor           DECIMAL(10,2) NOT NULL
descricao       TEXT
categoria       VARCHAR(100)  -- para saídas: 'aluguel', 'material', 'arbitro', etc.
data            DATE NOT NULL DEFAULT CURRENT_DATE
-- Vínculos opcionais (para entradas)
cobranca_id     UUID REFERENCES cobranças(id)  -- se entrada veio de uma cobrança
caixinha_id     UUID REFERENCES caixinhas(id)  -- caixinha vinculada
atleta_id       UUID REFERENCES atletas(id)    -- atleta que pagou
-- Origem da transação
origem          ENUM('manual', 'webhook') DEFAULT 'manual'
registrado_por  UUID REFERENCES gestores(id)   -- null se origem = webhook
criado_em       TIMESTAMP DEFAULT NOW()
```

### `webhook_logs`
```sql
-- Registro de todos os webhooks recebidos (auditoria)
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
provider        VARCHAR(50) DEFAULT 'abacatepay'
evento          VARCHAR(100)  -- ex: 'payment.confirmed'
payload         JSONB
cobranca_id     UUID REFERENCES cobranças(id)
processado      BOOLEAN DEFAULT false
erro            TEXT
recebido_em     TIMESTAMP DEFAULT NOW()
processado_em   TIMESTAMP
```

---

## Índices Recomendados

```sql
-- Performance em queries frequentes
CREATE INDEX idx_atletas_clube ON atletas(clube_id);
CREATE INDEX idx_atletas_cpf ON atletas(cpf);
CREATE INDEX idx_frequencias_atleta_data ON frequencias(atleta_id, data);
CREATE INDEX idx_frequencias_turma_data ON frequencias(turma_id, data);
CREATE INDEX idx_cobranças_caixinha ON cobranças(caixinha_id);
CREATE INDEX idx_cobranças_atleta ON cobranças(atleta_id);
CREATE INDEX idx_cobranças_status ON cobranças(status);
CREATE INDEX idx_transacoes_clube_data ON transacoes(clube_id, data);
CREATE INDEX idx_planejamentos_clube ON planejamentos(clube_id, status);
```

---

## Notas de Implementação

### Multi-tenancy
- **Todo dado tem `clube_id`** — sem exceção
- Middleware de autenticação injeta `clube_id` do token em todas as queries
- Nunca fazer query sem filtrar por `clube_id`

### Soft delete
- Atletas e turmas usam `ativo = false` em vez de DELETE físico
- Preserva histórico de frequência e cobranças

### Campos monetários
- Sempre `DECIMAL(10,2)` — nunca `FLOAT`
- Cálculos financeiros sempre no backend, nunca no frontend

### CPF
- Armazenado sem formatação (apenas dígitos): `02692380266`
- Exibido mascarado na interface: `***.923.802-66`
- Validado antes de salvar (algoritmo de validação de CPF)
