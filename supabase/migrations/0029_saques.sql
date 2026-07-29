-- Tabela de solicitações de saque da subconta ValidaPay do clube.
-- Cada saque registra a requisição + resposta da ValidaPay para auditoria.

CREATE TABLE public.saques (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  clube_id        uuid        NOT NULL REFERENCES clubes(id) ON DELETE CASCADE,
  account_number  text        NOT NULL,
  valor           numeric(12,2) NOT NULL CHECK (valor > 0),
  tipo            text        NOT NULL DEFAULT 'pix' CHECK (tipo IN ('pix', 'ted')),
  chave_pix       text,
  banco           text,
  agencia         text,
  conta           text,
  tipo_conta      text        CHECK (tipo_conta IN ('corrente', 'poupanca')),
  status          text        NOT NULL DEFAULT 'pendente'
                              CHECK (status IN ('pendente','processando','concluido','recusado')),
  solicitado_em   timestamptz NOT NULL DEFAULT now(),
  processado_em   timestamptz,
  resposta_vp     jsonb,
  ultimo_erro     text
);

ALTER TABLE public.saques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestor le saques do seu clube"
  ON public.saques FOR SELECT
  USING (
    clube_id IN (
      SELECT clube_id FROM gestores WHERE id = auth.uid() AND ativo = true
    )
  );

CREATE INDEX ix_saques_clube ON public.saques (clube_id, solicitado_em DESC);
