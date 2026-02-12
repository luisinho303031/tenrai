import { useState, useEffect } from 'react'
import { listarTodasObras, getObraPorSlug, getCapitulosPorObra, type ObraInfo, type Capitulo } from './data/obras'
import './TesteObras.css'

/**
 * Componente de teste para visualizar as obras locais
 * 
 * Para usar, adicione no App.tsx:
 * import TesteObras from './TesteObras'
 * 
 * E renderize em algum lugar:
 * <TesteObras />
 */
function TesteObras() {
    const [obras, setObras] = useState<ObraInfo[]>([])
    const [obraSelecionada, setObraSelecionada] = useState<string | null>(null)
    const [capitulos, setCapitulos] = useState<Capitulo[]>([])

    useEffect(() => {
        // Carregar todas as obras
        const todasObras = listarTodasObras()
        setObras(todasObras)
    }, [])

    useEffect(() => {
        if (obraSelecionada) {
            getCapitulosPorObra(obraSelecionada).then(setCapitulos)
        } else {
            setCapitulos([])
        }
    }, [obraSelecionada])

    const handleSelecionarObra = (slug: string) => {
        setObraSelecionada(slug)
    }

    const obraDetalhes = obraSelecionada ? getObraPorSlug(obraSelecionada) : null

    return (
        <div className="teste-obras">
            <h1>🎨 Teste de Obras Locais</h1>

            <div className="obras-grid">
                {obras.map(obra => (
                    <div
                        key={obra.id}
                        className="obra-card"
                        onClick={() => handleSelecionarObra(obra.id)}
                    >
                        <div className="obra-capa">
                            <img src={obra.imagens.capa} alt={obra.meta.titulo} />
                        </div>
                        <div className="obra-info">
                            <h3>{obra.meta.titulo}</h3>
                            <p className="titulo-alt">{obra.meta.tituloAlternativo}</p>
                            <div className="generos">
                                {obra.generos.map(genero => (
                                    <span key={genero} className="genero-tag">{genero}</span>
                                ))}
                            </div>
                            <span className={`status status-${obra.meta.status.toLowerCase().replace(' ', '-')}`}>
                                {obra.meta.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {obraDetalhes && (
                <div className="obra-detalhes">
                    <button onClick={() => setObraSelecionada(null)} className="btn-voltar">
                        ← Voltar
                    </button>

                    <div className="detalhes-header">
                        <img src={obraDetalhes.imagens.banner} alt={obraDetalhes.meta.titulo} className="banner" />
                        <div className="detalhes-content">
                            <h2>{obraDetalhes.meta.titulo}</h2>
                            <p className="titulo-alt">{obraDetalhes.meta.tituloAlternativo}</p>

                            <div className="meta-info">
                                <span>📅 {obraDetalhes.meta.ano}</span>
                                <span>📊 {obraDetalhes.meta.status}</span>
                                {obraDetalhes.meta.autor && <span>✍️ {obraDetalhes.meta.autor}</span>}
                                {obraDetalhes.meta.artista && <span>🎨 {obraDetalhes.meta.artista}</span>}
                            </div>

                            <p className="descricao">{obraDetalhes.meta.descricao}</p>

                            <div className="generos">
                                {obraDetalhes.generos.map(genero => (
                                    <span key={genero} className="genero-tag">{genero}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="capitulos-lista">
                        <h3>📚 Capítulos ({capitulos.length})</h3>
                        {capitulos.map(cap => (
                            <div key={cap.id} className="capitulo-item">
                                <span className="cap-numero">Cap. {cap.numero}</span>
                                <span className="cap-titulo">{cap.titulo}</span>
                                <span className="cap-data">{new Date(cap.dataPublicacao).toLocaleDateString('pt-BR')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default TesteObras
