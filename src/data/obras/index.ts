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
const infoFiles = import.meta.glob('./**/info.json', { eager: true })
const capitulosFiles = import.meta.glob('./**/capitulos.json', { eager: true })

// Função helper para buscar obra completa por slug
export const getObraPorSlug = (slug: string): ObraInfo | null => {
    for (const path in infoFiles) {
        if (path.includes(`/${slug}/info.json`)) {
            return infoFiles[path] as ObraInfo
        }
    }
    return null
}

// Função helper para buscar capítulos de uma obra
export const getCapitulosPorObra = (slug: string): Capitulo[] => {
    for (const path in capitulosFiles) {
        if (path.includes(`/${slug}/capitulos.json`)) {
            return (capitulosFiles[path] as CapitulosData).capitulos || []
        }
    }
    return []
}

// Função helper para buscar capítulo específico
export const getCapitulo = (obraSlug: string, capituloId: number): Capitulo | null => {
    const capitulos = getCapitulosPorObra(obraSlug)
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
