// ============================================
// EXEMPLO DE USO NO APP.TSX
// ============================================

import {
    getObraPorSlug,
    getCapitulosPorObra,
    getCapitulo,
    listarTodasObras,
    buscarObrasPorGenero,
    buscarObrasPorStatus
} from './data/obras'

// ============================================
// 1. SUBSTITUIR FETCH DE OBRA INDIVIDUAL
// ============================================

// ❌ ANTES (com API):
/*
useEffect(() => {
    if (activeSection === 'obra-detalhe') {
        const slug = location.pathname.split('/obra/')[1]
        if (slug) {
            setLoadingObra(true)
            fetch(`/api/obras/${slug}`, {
                headers: { 'Authorization': API_TOKEN }
            })
                .then(res => res.json())
                .then(data => {
                    setCurrentObra(data)
                    setLoadingObra(false)
                })
                .catch(err => {
                    console.error('Erro ao buscar obra:', err)
                    setLoadingObra(false)
                    setIs404(true)
                })
        }
    }
}, [activeSection, location.pathname])
*/

// ✅ DEPOIS (com dados locais):
/*
useEffect(() => {
    if (activeSection === 'obra-detalhe') {
        const slug = location.pathname.split('/obra/')[1]
        if (slug) {
            setLoadingObra(true)

            // Buscar obra local
            const obra = getObraPorSlug(slug)

            if (obra) {
                // Buscar capítulos da obra
                const capitulos = getCapitulosPorObra(slug)

                // Montar objeto compatível com a estrutura antiga
                setCurrentObra({
                    obr_id: obra.id,
                    obr_nome: obra.meta.titulo,
                    obr_slug: obra.id,
                    obr_imagem: obra.imagens.capa,
                    obr_descricao: obra.meta.descricao,
                    generos: obra.generos,
                    status: obra.meta.status,
                    capitulos: capitulos.map(cap => ({
                        cap_id: cap.id,
                        cap_nome: cap.titulo,
                        cap_numero: cap.numero,
                        cap_criado_em: cap.dataPublicacao
                    }))
                })
                setLoadingObra(false)
            } else {
                setIs404(true)
                setLoadingObra(false)
            }
        }
    }
}, [activeSection, location.pathname])
*/

// ============================================
// 2. SUBSTITUIR FETCH DE CAPÍTULO
// ============================================

// ❌ ANTES (com API):
/*
useEffect(() => {
    if (activeSection === 'capitulo') {
        const capId = location.pathname.split('/capitulo/')[1]
        if (capId) {
            setLoadingCapitulo(true)
            fetch(`/api/capitulos/${capId}`, {
                headers: { 'Authorization': API_TOKEN }
            })
                .then(res => res.json())
                .then(data => {
                    setCurrentCapitulo(data)
                    setLoadingCapitulo(false)
                })
                .catch(err => {
                    console.error('Erro ao buscar capítulo:', err)
                    setLoadingCapitulo(false)
                    setIs404(true)
                })
        }
    }
}, [activeSection, location.pathname])
*/

// ✅ DEPOIS (com dados locais):
/*
useEffect(() => {
    if (activeSection === 'capitulo') {
        // Assumindo URL: /capitulo/solo-leveling/1
        const pathParts = location.pathname.split('/capitulo/')[1]?.split('/')
        const obraSlug = pathParts?.[0]
        const capId = pathParts?.[1] ? parseInt(pathParts[1]) : null

        if (obraSlug && capId) {
            setLoadingCapitulo(true)

            const obra = getObraPorSlug(obraSlug)
            const capitulo = getCapitulo(obraSlug, capId)

            if (obra && capitulo) {
                setCurrentCapitulo({
                    cap_id: capitulo.id,
                    cap_nome: capitulo.titulo,
                    cap_numero: capitulo.numero,
                    cap_criado_em: capitulo.dataPublicacao,
                    imagens: capitulo.imagens,
                    obr_id: obra.id,
                    obr_nome: obra.meta.titulo,
                    obr_slug: obra.id,
                    obr_imagem: obra.imagens.capa
                })
                setLoadingCapitulo(false)
            } else {
                setIs404(true)
                setLoadingCapitulo(false)
            }
        }
    }
}, [activeSection, location.pathname])
*/

// ============================================
// 3. LISTAR TODAS AS OBRAS
// ============================================

// ❌ ANTES (com API):
/*
const fetchAllWorks = async () => {
    try {
        setLoadingAllWorks(true)
        const response = await fetch(`/api/obras/search?pagina=${page}...`, {
            headers: { 'Authorization': API_TOKEN }
        })
        const data = await response.json()
        setAllWorks(data.obras)
    } catch (error) {
        console.error('Erro:', error)
    } finally {
        setLoadingAllWorks(false)
    }
}
*/

// ✅ DEPOIS (com dados locais):
/*
const fetchAllWorks = () => {
    setLoadingAllWorks(true)

    let obras = listarTodasObras()

    // Aplicar filtros
    if (selectedGenre) {
        obras = obras.filter(obra =>
            obra.generos.includes(selectedGenre)
        )
    }

    if (selectedStatus) {
        obras = buscarObrasPorStatus(selectedStatus)
    }

    if (searchTerm) {
        obras = obras.filter(obra =>
            obra.meta.titulo.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }

    // Converter para formato compatível
    const obrasFormatadas = obras.map(obra => ({
        obr_id: obra.id,
        obr_nome: obra.meta.titulo,
        obr_slug: obra.id,
        obr_imagem: obra.imagens.capa,
        generos: obra.generos,
        status: obra.meta.status
    }))

    setAllWorks(obrasFormatadas)
    setLoadingAllWorks(false)
}
*/

// ============================================
// 4. HELPER PARA CONVERTER FORMATO
// ============================================

// Função helper para converter ObraInfo para o formato antigo
/*
const converterObraParaFormatoAntigo = (obra: ObraInfo) => ({
    obr_id: obra.id,
    obr_nome: obra.meta.titulo,
    obr_slug: obra.id,
    obr_imagem: obra.imagens.capa,
    obr_descricao: obra.meta.descricao,
    generos: obra.generos,
    status: obra.meta.status,
    ano: obra.meta.ano,
    autor: obra.meta.autor,
    artista: obra.meta.artista
})
*/

// ============================================
// 5. EXEMPLO COMPLETO DE COMPONENTE
// ============================================

/*
function ObraCard({ slug }: { slug: string }) {
    const obra = getObraPorSlug(slug)

    if (!obra) return null

    return (
        <div className="obra-card">
            <img src={obra.imagens.capa} alt={obra.meta.titulo} />
            <h3>{obra.meta.titulo}</h3>
            <p>{obra.meta.descricao}</p>
            <div className="generos">
                {obra.generos.map(genero => (
                    <span key={genero}>{genero}</span>
                ))}
            </div>
            <span className="status">{obra.meta.status}</span>
        </div>
    )
}

export default ObraCard
*/
