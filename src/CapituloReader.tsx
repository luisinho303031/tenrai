import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MdArrowBack, MdArrowForward, MdKeyboardArrowDown } from 'react-icons/md'
import { Drawer } from 'vaul'
import { supabase } from './lib/supabase'
import { getObraPorSlug, getCapitulo, getCapitulosPorObra } from './data/obras'
import NotFoundContent from './NotFoundContent'

interface CapituloReaderProps {
    user: any
}

const CapituloReader = ({ user }: CapituloReaderProps) => {
    const location = useLocation()
    const navigate = useNavigate()
    const [currentCapitulo, setCurrentCapitulo] = useState<any>(null)
    const [loadingCapitulo, setLoadingCapitulo] = useState(false)
    const [is404, setIs404] = useState(false)
    const [prevCapId, setPrevCapId] = useState<number | null>(null)
    const [nextCapId, setNextCapId] = useState<number | null>(null)
    const [showChapterList, setShowChapterList] = useState(false)
    const [chapters, setChapters] = useState<any[]>([])
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Fetch Chapter Data
    useEffect(() => {
        // Assumindo URL: /capitulo/solo-leveling/1
        const pathParts = location.pathname.split('/capitulo/')[1]?.split('/')
        const obraSlug = pathParts?.[0]
        const capId = pathParts?.[1] ? parseInt(pathParts[1]) : null

        if (obraSlug && capId) {
            setLoadingCapitulo(true)
            setIs404(false)
            setPrevCapId(null)
            setNextCapId(null)

            const obra = getObraPorSlug(obraSlug)
            getCapitulo(obraSlug, capId).then(capitulo => {
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

                    // Determine prev/next chapters
                    getCapitulosPorObra(obraSlug).then(allCaps => {
                        const sortedCaps = allCaps.sort((a, b) => a.numero - b.numero)
                        const currentIndex = sortedCaps.findIndex(c => c.id === capId)

                        if (currentIndex > 0) {
                            setPrevCapId(sortedCaps[currentIndex - 1].id)
                        }
                        if (currentIndex < sortedCaps.length - 1) {
                            setNextCapId(sortedCaps[currentIndex + 1].id)
                        }
                        setChapters(sortedCaps)
                    })

                } else {
                    setIs404(true)
                }
                setLoadingCapitulo(false)
            })
        }
    }, [location.pathname])

    // Save read history
    useEffect(() => {
        const saveToHistory = async () => {
            if (currentCapitulo && user) {
                try {
                    const obraId = currentCapitulo.obr_id

                    if (obraId) {
                        const { error } = await supabase
                            .from('user_reads')
                            .upsert({
                                user_id: user.id,
                                obra_id: obraId,
                                capitulo_id: currentCapitulo.cap_id,
                                capitulo_numero: currentCapitulo.cap_numero,
                                cap_nome: currentCapitulo.cap_nome,
                                obra_nome: currentCapitulo.obr_nome,
                                obr_slug: currentCapitulo.obr_slug,
                                obr_imagem: currentCapitulo.obr_imagem,
                                lido_em: new Date().toISOString()
                            }, { onConflict: 'user_id, capitulo_id' })

                        if (error) console.error('Error saving history:', error)
                    }
                } catch (err) {
                    console.error('Error processing history:', err)
                }
            }
        }

        saveToHistory()
    }, [currentCapitulo, user])

    if (is404) {
        return <NotFoundContent />
    }

    return (
        <div className="section capitulo-section" style={{ padding: 0, background: '#000', minHeight: '100vh' }}>
            {loadingCapitulo && (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#fff' }}>
                    Carregando capítulo...
                </div>
            )}

            {!loadingCapitulo && currentCapitulo && (
                <div
                    className="capitulo-reader"
                    style={{
                        width: '100%',
                        height: '100vh',
                        position: 'relative',
                        backgroundColor: '#000',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}
                >
                    {/* Reader Header Overlay (Absolute Top) */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            zIndex: 10,
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                            pointerEvents: 'none',
                            alignItems: 'center'
                        }}
                    >
                        <div style={{ width: '100%', maxWidth: '600px', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <button
                                onClick={() => navigate(`/obra/${currentCapitulo.obr_slug}`)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                    pointerEvents: 'auto',
                                    width: 'fit-content'
                                }}
                            >
                                <MdArrowBack size={24} />
                                <div style={{ textAlign: 'left' }}>
                                    <h2 style={{ fontSize: '1rem', margin: 0, color: '#fff', fontWeight: 600 }}>
                                        {currentCapitulo.cap_nome}
                                    </h2>
                                    <p style={{ fontSize: '0.8rem', margin: 0, color: 'rgba(255,255,255,0.9)', fontWeight: 400 }}>
                                        {currentCapitulo.obr_nome}
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Chapter Images Area */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            paddingTop: '80px',
                            paddingBottom: '80px',
                            scrollbarWidth: 'none', // Opcional: esconder scrollbar para visual mais limpo
                            msOverflowStyle: 'none',
                            alignItems: 'center'
                        }}
                    >
                        <div style={{ width: '100%', maxWidth: '600px' }}>
                            {/* Suporte para dados locais (array de strings) */}
                            {currentCapitulo.imagens && currentCapitulo.imagens.map((img: string, index: number) => (
                                <img
                                    key={`page-local-${index}`}
                                    src={img}
                                    alt={`Página ${index + 1}`}
                                    style={{ width: '100%', display: 'block' }}
                                    loading="lazy"
                                />
                            ))}

                            {/* Fallback para dados legados da API */}
                            {!currentCapitulo.imagens && currentCapitulo.cap_paginas &&
                                currentCapitulo.cap_paginas.map((pagina: any, index: number) => {
                                    const src = `https://cdn.verdinha.wtf${pagina.path.startsWith('/') ? '' : '/'
                                        }${pagina.path.endsWith(pagina.src)
                                            ? pagina.path
                                            : `${pagina.path}/${pagina.src}`
                                        }`
                                    return (
                                        <img
                                            key={`page-legacy-${index}`}
                                            src={src}
                                            alt={`Página ${pagina.numero}`}
                                            style={{ width: '100%', display: 'block' }}
                                        />
                                    )
                                })}
                        </div>
                    </div>

                    {/* Chapter List Dropdown (Desktop Only) */}
                    {!isMobile && showChapterList && (
                        <>
                            <div
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    zIndex: 19
                                }}
                                onClick={() => setShowChapterList(false)}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '85px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '200px',
                                    maxHeight: '50vh',
                                    backgroundColor: '#000',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '2px',
                                    overflowY: 'auto',
                                    zIndex: 20,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '1rem',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                                }}
                            >
                                <div className="tags-dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600, color: '#fff' }}>Capítulos</span>
                                    <button
                                        className="clear-tags-btn"
                                        onClick={() => setShowChapterList(false)}
                                    >
                                        Fechar
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
                                    {chapters.map((cap) => (
                                        <button
                                            key={cap.id}
                                            onClick={() => {
                                                navigate(`/capitulo/${currentCapitulo.obr_slug}/${cap.id}`)
                                                setShowChapterList(false)
                                            }}
                                            className={`tag-filter-btn ${currentCapitulo.cap_id === cap.id ? 'active' : ''}`}
                                            style={{ justifyContent: 'center', minWidth: 'unset', padding: '0.6rem 0.2rem' }}
                                        >
                                            {cap.numero}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Bottom Navigation Bar (Absolute Bottom) */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            zIndex: 10,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
                            display: 'flex',
                            alignItems: 'center', // Center vertically
                            justifyContent: 'center', // Center inner box
                            paddingBottom: '10px',
                            pointerEvents: 'none',
                            height: '80px',
                            /* paddingLeft: '1rem', */ /* Removed from outer div */
                            /* paddingRight: '1rem' */ /* Removed from outer div */
                        }}
                    >
                        <div style={{ width: '100%', maxWidth: '600px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '1rem', paddingRight: '1rem' }}>                   {/* Previous Button */}
                            <button
                                onClick={() => prevCapId && navigate(`/capitulo/${currentCapitulo.obr_slug}/${prevCapId}`)}
                                disabled={!prevCapId}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: prevCapId ? '#fff' : 'rgba(255,255,255,0.3)',
                                    cursor: prevCapId ? 'pointer' : 'default',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '1rem',
                                    pointerEvents: 'auto'
                                }}
                            >
                                <MdArrowBack size={28} />
                            </button>

                            {/* Chapter Selector */}
                            <button
                                onClick={() => setShowChapterList(!showChapterList)}
                                style={{
                                    background: 'rgba(0,0,0,0.88)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '3px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.85rem',
                                    pointerEvents: 'auto',
                                    backdropFilter: 'blur(4px)'
                                }}
                            >
                                <span style={{ fontWeight: 600 }}>Cap. {currentCapitulo.cap_numero}</span>
                                {showChapterList ? <MdKeyboardArrowDown size={20} style={{ transform: 'rotate(180deg)' }} /> : <MdKeyboardArrowDown size={20} />}
                            </button>

                            {/* Next Button */}
                            <button
                                onClick={() => nextCapId && navigate(`/capitulo/${currentCapitulo.obr_slug}/${nextCapId}`)}
                                disabled={!nextCapId}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: nextCapId ? '#fff' : 'rgba(255,255,255,0.3)',
                                    cursor: nextCapId ? 'pointer' : 'default',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '1rem',
                                    pointerEvents: 'auto'
                                }}
                            >
                                <MdArrowForward size={28} />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Chapter Drawer */}
                    {isMobile && (
                        <Drawer.Root open={showChapterList} onOpenChange={setShowChapterList}>
                            <Drawer.Portal>
                                <Drawer.Overlay className="drawer-overlay" />
                                <Drawer.Content className="drawer-content">
                                    <div className="drawer-handle-wrapper">
                                        <div className="drawer-handle" />
                                    </div>
                                    <div className="drawer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h2>Selecionar Capítulo</h2>
                                        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Total: {chapters.length}</span>
                                    </div>

                                    <div className="drawer-body">
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                            {chapters.map((cap) => (
                                                <button
                                                    key={cap.id}
                                                    onClick={() => {
                                                        navigate(`/capitulo/${currentCapitulo.obr_slug}/${cap.id}`)
                                                        setShowChapterList(false)
                                                    }}
                                                    className={`tag-filter-btn ${currentCapitulo.cap_id === cap.id ? 'active' : ''}`}
                                                    style={{
                                                        justifyContent: 'center',
                                                        minWidth: 'unset',
                                                        padding: '0.8rem 0.2rem'
                                                    }}
                                                >
                                                    {cap.numero}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </Drawer.Content>
                            </Drawer.Portal>
                        </Drawer.Root>
                    )}
                </div>
            )
            }
        </div >
    )
}

export default CapituloReader
