# 📚 Sistema de Dados de Obras - Tenrai

## 🎯 Estrutura

Cada obra possui sua própria pasta dentro de `src/data/obras/` com dois arquivos JSON:

```
src/data/obras/
  ├── solo-leveling/
  │   ├── info.json          # Informações da obra
  │   └── capitulos.json     # Lista de capítulos
  ├── omniscient-reader/
  │   ├── info.json
  │   └── capitulos.json
  └── tower-of-god/
      ├── info.json
      └── capitulos.json
```

## 📄 Formato dos Arquivos

### `info.json`
```json
{
  "id": "slug-da-obra",
  "meta": {
    "titulo": "Título da Obra",
    "tituloAlternativo": "Título Original",
    "descricao": "Descrição completa...",
    "ano": 2018,
    "status": "Completo | Em Andamento | Hiato",
    "autor": "Nome do Autor",
    "artista": "Nome do Artista"
  },
  "imagens": {
    "capa": "https://cdn.tenrai.site/obra/capa.webp",
    "banner": "https://cdn.tenrai.site/obra/banner.webp"
  },
  "generos": ["Ação", "Fantasia", "Aventura"]
}
```

### `capitulos.json`
```json
{
  "capitulos": [
    {
      "id": 1,
      "numero": 1,
      "titulo": "Título do Capítulo",
      "dataPublicacao": "2018-03-04",
      "imagens": [
        "https://cdn.tenrai.site/obra/cap-1/01.webp",
        "https://cdn.tenrai.site/obra/cap-1/02.webp"
      ]
    }
  ]
}
```

## 🚀 Como Usar no React

### Importar uma obra específica
```typescript
import { getObraPorSlug, getCapitulosPorObra } from '@/data/obras'

// Buscar informações da obra
const obra = getObraPorSlug('solo-leveling')
console.log(obra?.meta.titulo) // "Solo Leveling"

// Buscar capítulos
const capitulos = getCapitulosPorObra('solo-leveling')
console.log(capitulos.length) // 2
```

### Listar todas as obras
```typescript
import { listarTodasObras } from '@/data/obras'

const todasObras = listarTodasObras()
// Retorna array com todas as obras disponíveis
```

### Filtrar por gênero
```typescript
import { buscarObrasPorGenero } from '@/data/obras'

const obrasDeAcao = buscarObrasPorGenero('Ação')
// Retorna todas as obras que contêm o gênero "Ação"
```

### Filtrar por status
```typescript
import { buscarObrasPorStatus } from '@/data/obras'

const obrasCompletas = buscarObrasPorStatus('Completo')
// Retorna todas as obras com status "Completo"
```

### Buscar capítulo específico
```typescript
import { getCapitulo } from '@/data/obras'

const cap = getCapitulo('solo-leveling', 1)
console.log(cap?.titulo) // "Eu Sou o Mais Fraco"
console.log(cap?.imagens) // Array de URLs das imagens
```

## ➕ Adicionar Nova Obra

1. **Criar pasta da obra:**
   ```bash
   mkdir src/data/obras/nome-da-obra
   ```

2. **Criar `info.json`** com as informações da obra

3. **Criar `capitulos.json`** com os capítulos

4. **Atualizar `src/data/obras/index.ts`:**
   ```typescript
   // Adicionar imports
   import novaObraInfo from './nome-da-obra/info.json'
   import novaObraCapitulos from './nome-da-obra/capitulos.json'
   
   // Adicionar ao mapa de obras
   export const obrasDisponiveis: Record<string, ObraInfo> = {
     // ... obras existentes
     'nome-da-obra': novaObraInfo as ObraInfo
   }
   
   // Adicionar ao mapa de capítulos
   export const capitulosPorObra: Record<string, CapitulosData> = {
     // ... capítulos existentes
     'nome-da-obra': novaObraCapitulos as CapitulosData
   }
   ```

## ✅ Vantagens

✅ **Sem dependência de API externa** - Tudo local e rápido  
✅ **TypeScript** - Tipos seguros e autocomplete  
✅ **Escalável** - Fácil adicionar novas obras  
✅ **SEO-friendly** - Dados estáticos para melhor indexação  
✅ **Organizado** - Cada obra em sua própria pasta  
✅ **Flexível** - Fácil adicionar novos campos no futuro  

## 🎨 Próximos Passos

- [ ] Adicionar mais obras
- [ ] Criar script para gerar automaticamente a estrutura
- [ ] Adicionar campo de rating/avaliação
- [ ] Adicionar tags personalizadas por obra
- [ ] Criar sistema de busca/filtro avançado
