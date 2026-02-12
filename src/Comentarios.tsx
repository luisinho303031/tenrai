import { useState, useEffect } from 'react'
import { MdSend } from 'react-icons/md'
import { supabase } from './lib/supabase'

interface ComentariosProps {
    user: any
    obraId: string | number
}

const Comentarios = ({ user, obraId }: ComentariosProps) => {
    const [comentario, setComentario] = useState('')
    const [comentarios, setComentarios] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [enviando, setEnviando] = useState(false)

    // Buscar comentários ao carregar
    useEffect(() => {
        fetchComentarios()
    }, [obraId])

    const fetchComentarios = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('comentarios')
                .select(`
                    com_id,
                    com_texto,
                    created_at,
                    user_id,
                    users:user_id (
                        email,
                        raw_user_meta_data
                    )
                `)
                .eq('obr_id', obraId)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Formatar comentários
            const formattedComentarios = data?.map((com: any) => ({
                id: com.com_id,
                user_id: com.user_id,
                user_name: com.users?.raw_user_meta_data?.full_name || com.users?.email?.split('@')[0] || 'Usuário',
                user_avatar: com.users?.raw_user_meta_data?.avatar_url || 'https://via.placeholder.com/40',
                texto: com.com_texto,
                created_at: com.created_at
            })) || []

            setComentarios(formattedComentarios)
        } catch (error) {
            console.error('Erro ao buscar comentários:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEnviarComentario = async () => {
        if (!comentario.trim() || !user || enviando) return

        // Validar obraId
        if (!obraId) {
            console.error('obraId está undefined ou null:', obraId)
            alert('Erro: ID da obra não encontrado')
            return
        }

        try {
            setEnviando(true)

            console.log('Enviando comentário:', { obraId, user_id: user.id, texto: comentario.trim() })

            const { error } = await supabase
                .from('comentarios')
                .insert({
                    obr_id: obraId,
                    user_id: user.id,
                    com_texto: comentario.trim()
                })

            if (error) throw error

            // Limpar input e recarregar comentários
            setComentario('')
            await fetchComentarios()
        } catch (error) {
            console.error('Erro ao enviar comentário:', error)
            alert('Erro ao enviar comentário. Tente novamente.')
        } finally {
            setEnviando(false)
        }
    }

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) return 'agora'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }

    const isMobile = window.innerWidth <= 768

    return (
        <div className="comentarios-container" style={{
            animation: 'fadeIn 0.3s ease',
            paddingBottom: isMobile ? '80px' : '0'
        }}>
            {/* Input de Comentário - Desktop */}
            {!isMobile && user && (
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <img
                        src={user.user_metadata?.avatar_url || 'https://via.placeholder.com/40'}
                        alt="Seu avatar"
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0
                        }}
                    />
                    <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="Escreva um comentário..."
                            value={comentario}
                            onChange={(e) => setComentario(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEnviarComentario()
                            }}
                            style={{
                                flex: 1,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                padding: '0.8rem',
                                color: '#fff',
                                fontSize: '0.9rem',
                                outline: 'none'
                            }}
                        />
                        <button
                            onClick={handleEnviarComentario}
                            disabled={!comentario.trim()}
                            style={{
                                background: comentario.trim() ? '#667eea' : 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0.8rem 1.5rem',
                                color: '#fff',
                                cursor: comentario.trim() ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                transition: 'all 0.2s',
                                opacity: comentario.trim() ? 1 : 0.5
                            }}
                        >
                            <MdSend size={18} />
                            Enviar
                        </button>
                    </div>
                </div>
            )}

            {/* Lista de Comentários */}
            <div className="comentarios-lista" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                {loading ? (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        padding: '2rem',
                        color: 'rgba(255,255,255,0.5)'
                    }}>
                        Carregando comentários...
                    </div>
                ) : comentarios.length > 0 ? (
                    comentarios.map((com) => (
                        <div key={com.id} style={{
                            display: 'flex',
                            gap: '1rem',
                            padding: '1rem',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <img
                                src={com.user_avatar}
                                alt={com.user_name}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    flexShrink: 0
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.5rem'
                                }}>
                                    <span style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        color: '#fff'
                                    }}>{com.user_name}</span>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: 'rgba(255,255,255,0.4)'
                                    }}>{formatRelativeTime(com.created_at)}</span>
                                </div>
                                <p style={{
                                    fontSize: '0.9rem',
                                    color: 'rgba(255,255,255,0.8)',
                                    lineHeight: 1.6,
                                    margin: 0
                                }}>{com.texto}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '4rem 2rem',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.6)'
                    }}>
                        <p style={{ fontSize: '0.9rem' }}>
                            Seja o primeiro a comentar sobre esta obra!
                        </p>
                    </div>
                )}
            </div>

            {/* Bottom Bar - Mobile */}
            {isMobile && user && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: '#000',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    padding: '0.8rem 1rem',
                    display: 'flex',
                    gap: '0.8rem',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <img
                        src={user.user_metadata?.avatar_url || 'https://via.placeholder.com/40'}
                        alt="Seu avatar"
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Escreva um comentário..."
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEnviarComentario()
                        }}
                        className="comentario-input-mobile"
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '0',
                            padding: '0.7rem 0',
                            color: '#fff',
                            fontSize: '0.9rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                    />
                    <button
                        onClick={handleEnviarComentario}
                        disabled={!comentario.trim()}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: comentario.trim() ? '#667eea' : 'rgba(255,255,255,0.3)',
                            cursor: comentario.trim() ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <MdSend size={24} />
                    </button>
                </div>
            )}

            {/* Mensagem para usuários não logados */}
            {!user && (
                <div style={{
                    padding: '1.5rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.6)'
                }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        Faça login para comentar
                    </p>
                </div>
            )}
        </div>
    )
}

export default Comentarios
