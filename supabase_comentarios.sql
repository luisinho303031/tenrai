-- Tabela de comentários
CREATE TABLE IF NOT EXISTS comentarios (
    com_id BIGSERIAL PRIMARY KEY,
    obr_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    com_texto TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_comentarios_obr_id ON comentarios(obr_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_user_id ON comentarios(user_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_created_at ON comentarios(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler comentários
CREATE POLICY "Comentarios são públicos para leitura"
    ON comentarios
    FOR SELECT
    USING (true);

-- Política: Usuários autenticados podem criar comentários
CREATE POLICY "Usuários autenticados podem criar comentários"
    ON comentarios
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar seus próprios comentários
CREATE POLICY "Usuários podem deletar seus próprios comentários"
    ON comentarios
    FOR DELETE
    USING (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios comentários
CREATE POLICY "Usuários podem atualizar seus próprios comentários"
    ON comentarios
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_comentarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER comentarios_updated_at
    BEFORE UPDATE ON comentarios
    FOR EACH ROW
    EXECUTE FUNCTION update_comentarios_updated_at();
