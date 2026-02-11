# 🚀 Guia Rápido de Uso

## ✅ Tudo Pronto!

A estrutura de dados locais está 100% configurada e pronta para uso.

## 📦 O que você tem agora:

### 1. **Sistema de Dados** (`src/data/obras/`)
- ✅ 3 obras de exemplo (Solo Leveling, Omniscient Reader, Tower of God)
- ✅ Funções helper para buscar e filtrar obras
- ✅ TypeScript configurado para importar JSON
- ✅ Estrutura escalável e organizada

### 2. **Componente de Teste** (`src/TesteObras.tsx`)
- Interface visual para testar as obras
- Grid responsivo com cards
- Visualização de detalhes e capítulos

## 🎯 Como Usar AGORA

### Teste Rápido (Recomendado)

1. **Abra o `App.tsx`** e adicione esta linha no início:
   ```typescript
   import TesteObras from './TesteObras'
   ```

2. **Adicione uma rota de teste** dentro do componente App:
   ```typescript
   // Procure por onde as rotas são renderizadas e adicione:
   {location.pathname === '/teste' && <TesteObras />}
   ```

3. **Acesse no navegador:**
   ```
   http://localhost:5173/teste
   ```

### Uso em Produção

```typescript
// Importar as funções
import { 
  getObraPorSlug, 
  getCapitulosPorObra,
  listarTodasObras 
} from './data/obras'

// Exemplo 1: Buscar uma obra
const obra = getObraPorSlug('solo-leveling')
console.log(obra?.meta.titulo) // "Solo Leveling"

// Exemplo 2: Listar todas as obras
const todas = listarTodasObras()
console.log(todas.length) // 3

// Exemplo 3: Buscar capítulos
const caps = getCapitulosPorObra('solo-leveling')
console.log(caps.length) // 2
```

## 📝 Adicionar Nova Obra

### Passo a Passo:

1. **Criar pasta:**
   ```bash
   mkdir src/data/obras/minha-obra
   ```

2. **Criar `info.json`:**
   ```json
   {
     "id": "minha-obra",
     "meta": {
       "titulo": "Minha Obra",
       "tituloAlternativo": "My Work",
       "descricao": "Descrição...",
       "ano": 2024,
       "status": "Em Andamento"
     },
     "imagens": {
       "capa": "https://...",
       "banner": "https://..."
     },
     "generos": ["Ação", "Aventura"]
   }
   ```

3. **Criar `capitulos.json`:**
   ```json
   {
     "capitulos": [
       {
         "id": 1,
         "numero": 1,
         "titulo": "Capítulo 1",
         "dataPublicacao": "2024-01-01",
         "imagens": ["https://..."]
       }
     ]
   }
   ```

4. **Atualizar `src/data/obras/index.ts`:**
   ```typescript
   // Adicionar import
   import minhaObraInfo from './minha-obra/info.json'
   import minhaObraCapitulos from './minha-obra/capitulos.json'
   
   // Adicionar ao mapa (linha ~35)
   export const obrasDisponiveis: Record<string, ObraInfo> = {
     'solo-leveling': soloLevelingInfo as ObraInfo,
     'omniscient-reader': omniscientReaderInfo as ObraInfo,
     'tower-of-god': towerOfGodInfo as ObraInfo,
     'minha-obra': minhaObraInfo as ObraInfo  // ← ADICIONAR AQUI
   }
   
   // Adicionar capítulos (linha ~43)
   export const capitulosPorObra: Record<string, CapitulosData> = {
     'solo-leveling': soloLevelingCapitulos as CapitulosData,
     'omniscient-reader': omniscientReaderCapitulos as CapitulosData,
     'tower-of-god': towerOfGodCapitulos as CapitulosData,
     'minha-obra': minhaObraCapitulos as CapitulosData  // ← ADICIONAR AQUI
   }
   ```

5. **Pronto!** A obra já está disponível.

## 🔍 Funções Disponíveis

```typescript
// Buscar obra por slug
getObraPorSlug('solo-leveling')

// Listar todas as obras
listarTodasObras()

// Buscar capítulos de uma obra
getCapitulosPorObra('solo-leveling')

// Buscar capítulo específico
getCapitulo('solo-leveling', 1)

// Filtrar por gênero
buscarObrasPorGenero('Ação')

// Filtrar por status
buscarObrasPorStatus('Completo')
```

## 🎨 Próximo Passo

**Teste agora mesmo!**

1. Execute o projeto:
   ```bash
   npm run dev
   ```

2. Adicione a rota de teste no App.tsx

3. Acesse `/teste` no navegador

4. Veja suas obras funcionando! 🎉

## 📚 Documentação Completa

- `README.md` - Documentação detalhada
- `EXEMPLOS.tsx` - Exemplos de código
- `RESUMO.md` - Visão geral da estrutura

---

**Está tudo pronto! Agora é só usar! 🚀**
