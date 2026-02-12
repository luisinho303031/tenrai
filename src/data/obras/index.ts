// Tipos para as obras
export interface ObraInfo {
    id: string
    meta: {
        titulo: string
        tituloAlternativo: string
        descricao: string
        ano: number
        status: string
        autor?: string
        artista?: string
    }
    imagens: {
        capa: string
        banner: string
    }
    generos: string[]
}

export interface Capitulo {
    id: number
    numero: number
    titulo: string
    dataPublicacao: string
    imagens: string[]
}

export interface CapitulosData {
    capitulos: Capitulo[]
}

// Interface simplificada para a listagem
export interface ObraResumo {
    id: string
    titulo: string
    tituloAlternativo: string
    status: string
    capa: string
}

// Importar registro centralizado
import todasObrasRaw from './todasobras.json'
const todasObrasResumo = todasObrasRaw as ObraResumo[]

// Carregar todos os arquivos de informação e capítulos dinamicamente
// Carregar todos os arquivos de informação dinamicamente (eager para info básica)
const infoFiles = import.meta.glob('./**/info.json', { eager: true })

// Carregar arquivos de capítulos sob demanda (lazy)
const capitulosFiles = import.meta.glob('./**/capitulos.json')
const individualChapterFiles = import.meta.glob('./**/capitulos/*.json')

// Função helper para buscar obra completa por slug
export const getObraPorSlug = (slug: string): ObraInfo | null => {
    for (const path in infoFiles) {
        if (path.includes(`/${slug}/info.json`)) {
            return infoFiles[path] as ObraInfo
        }
    }
    return null
}

// Função helper para buscar capítulos de uma obra (agora assíncrona)
export const getCapitulosPorObra = async (slug: string): Promise<Capitulo[]> => {
    for (const path in capitulosFiles) {
        if (path.includes(`/${slug}/capitulos.json`)) {
            const module = await capitulosFiles[path]() as CapitulosData
            return module.capitulos || []
        }
    }
    // Fallback: tentar ver se existem arquivos individuais se o capitulos.json nao existir
    // (Opcional, mas mantemos o comportamento original focando no capitulos.json para listas)
    return []
}

// Função helper para buscar capítulo específico (agora assíncrona e usando arquivos individuais)
export const getCapitulo = async (obraSlug: string, capituloId: number): Promise<Capitulo | null> => {
    // Tentar carregar o arquivo individual do capítulo
    const key = `./${obraSlug}/capitulos/${capituloId}.json`
    if (key in individualChapterFiles) {
        const module = await individualChapterFiles[key]() as any
        return module.default || module
    }

    // Fallback para o arquivo de todos os capítulos
    const capitulos = await getCapitulosPorObra(obraSlug)
    return capitulos.find(cap => cap.id === capituloId) || null
}

// Função para listar todas as obras (retorna a info completa para compatibilidade com o App.tsx)
export const listarTodasObras = (): ObraInfo[] => {
    return [...todasObrasResumo].reverse().map(resumo => getObraPorSlug(resumo.id)).filter(o => o !== null) as ObraInfo[]
}

// Função para buscar obras por gênero
export const buscarObrasPorGenero = (genero: string): ObraInfo[] => {
    return listarTodasObras().filter(obra =>
        obra.generos.some(g => g.toLowerCase() === genero.toLowerCase())
    )
}

// Função para buscar obras por status
export const buscarObrasPorStatus = (status: string): ObraResumo[] => {
    return todasObrasResumo.filter(obra =>
        obra.status.toLowerCase() === status.toLowerCase()
    )
}
