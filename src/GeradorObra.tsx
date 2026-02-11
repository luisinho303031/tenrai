import { useState, useEffect } from 'react'
import { MdCloudUpload, MdCheckCircle, MdError, MdArrowBack, MdDelete, MdLibraryBooks, MdEdit, MdAddCircle, MdClose } from 'react-icons/md'
import { Link } from 'react-router-dom'
import './GeradorObra.css'

export default function GeradorObra() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [obrasExistentes, setObrasExistentes] = useState<any[]>([])

    // Estados para Edição e Capítulos
    const [isEditing, setIsEditing] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [showChapterForm, setShowChapterForm] = useState(false)
    const [selectedObraForChapter, setSelectedObraForChapter] = useState<{ id: string, titulo: string } | null>(null)

    const [formData, setFormData] = useState({
        titulo: '',
        tituloAlternativo: '',
        descricao: '',
        capa: '',
        banner: '',
        generos: '',
        status: 'Em Andamento',
        ano: new Date().getFullYear().toString(),
        autor: '',
        artista: ''
    })

    const [chapterData, setChapterData] = useState({
        numero: '',
        titulo: '',
        imagensUrl: ''
    })

    // Carregar obras ao entrar
    const carregarObras = async () => {
        try {
            const response = await fetch('/src/data/obras/todasobras.json')
            const data = await response.json()
            setObrasExistentes(data)
        } catch (err) {
            console.error('Erro ao carregar obras:', err)
        }
    }

    useEffect(() => {
        carregarObras()
    }, [])

    // Gerar ID (slug) automático a partir do título
    const generateId = (titulo: string) => {
        return titulo
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '')
    }

    const handleEdit = async (id: string) => {
        try {
            setLoading(true)
            const response = await fetch(`/src/data/obras/${id}/info.json`)
            const data = await response.json()

            setFormData({
                titulo: data.meta.titulo,
                tituloAlternativo: data.meta.tituloAlternativo || '',
                descricao: data.meta.descricao,
                capa: data.imagens.capa,
                banner: data.imagens.banner || '',
                generos: data.generos.join(', '),
                status: data.meta.status,
                ano: data.meta.ano.toString(),
                autor: data.meta.autor || '',
                artista: data.meta.artista || ''
            })

            setIsEditing(true)
            setEditingId(id)
            setSuccess(null)
            setError(null)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (err) {
            setError('Erro ao carregar dados da obra')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, titulo: string) => {
        if (!window.confirm(`Tem certeza que deseja excluir "${titulo}" permanentemente?`)) return

        try {
            const response = await fetch(`/api/local/gerar-obra/${id}`, {
                method: 'DELETE'
            })
            const result = await response.json()
            if (result.success) {
                setSuccess(`Obra "${titulo}" removida!`)
                carregarObras()
            } else {
                setError(result.error)
            }
        } catch (err) {
            setError('Erro ao excluir obra')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(null)
        setError(null)

        const id = isEditing && editingId ? editingId : generateId(formData.titulo)
        const data = {
            id,
            meta: {
                titulo: formData.titulo,
                tituloAlternativo: formData.tituloAlternativo,
                descricao: formData.descricao,
                ano: parseInt(formData.ano),
                status: formData.status,
                autor: formData.autor,
                artista: formData.artista
            },
            imagens: {
                capa: formData.capa,
                banner: formData.banner
            },
            generos: formData.generos.split(',').map(g => g.trim()).filter(g => g)
        }

        try {
            const response = await fetch('/api/local/gerar-obra', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            const result = await response.json()

            if (result.success) {
                setSuccess(`Obra "${formData.titulo}" ${isEditing ? 'atualizada' : 'criada'} com sucesso!`)
                carregarObras()
                if (!isEditing) {
                    setFormData({
                        titulo: '',
                        tituloAlternativo: '',
                        descricao: '',
                        capa: '',
                        banner: '',
                        generos: '',
                        status: 'Em Andamento',
                        ano: new Date().getFullYear().toString(),
                        autor: '',
                        artista: ''
                    })
                }
            } else {
                setError(result.error || 'Erro ao processar obra')
            }
        } catch (err: any) {
            setError('Erro de conexão com o servidor local')
        } finally {
            setLoading(false)
        }
    }

    const handleAddChapterSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedObraForChapter) return

        setLoading(true)
        setSuccess(null)
        setError(null)

        const imagens = chapterData.imagensUrl.split('\n').map(url => url.trim()).filter(url => url)

        const data = {
            id: selectedObraForChapter.id,
            numero: chapterData.numero,
            titulo: chapterData.titulo,
            imagens
        }

        try {
            const response = await fetch('/api/local/adicionar-capitulo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            const result = await response.json()
            if (result.success) {
                setSuccess(`Capítulo ${chapterData.numero} da obra "${selectedObraForChapter.titulo}" adicionado!`)
                setChapterData({ numero: '', titulo: '', imagensUrl: '' })
                setShowChapterForm(false)
            } else {
                setError(result.error)
            }
        } catch (err) {
            setError('Erro ao adicionar capítulo')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="gerador-container">
            <div className="gerador-header">
                <Link to="/" className="btn-voltar">
                    <MdArrowBack size={20} /> Voltar
                </Link>
                <h1>💎 Painel de Obras</h1>
                <p>Gerencie seu acervo local</p>
            </div>

            <div className="gerador-layout">
                <aside className="lista-obras-section">
                    <h2><MdLibraryBooks size={22} /> Obras Atuais ({obrasExistentes.length})</h2>
                    <div className="obras-lista-scroll">
                        {obrasExistentes.map(obra => (
                            <div key={obra.id} className="obra-item-mini">
                                <img src={obra.capa} alt={obra.titulo} />
                                <div className="obra-item-info">
                                    <span className="obra-nome">{obra.titulo}</span>
                                    <span className="obra-status">{obra.status}</span>
                                </div>
                                <div className="obra-item-actions">
                                    <button
                                        className="btn-action-mini add"
                                        onClick={() => {
                                            setSelectedObraForChapter({ id: obra.id, titulo: obra.titulo })
                                            setShowChapterForm(true)
                                            setIsEditing(false)
                                            setSuccess(null)
                                            setError(null)
                                        }}
                                        title="Adicionar Capítulo"
                                    >
                                        <MdAddCircle size={18} />
                                    </button>
                                    <button
                                        className="btn-action-mini edit"
                                        onClick={() => handleEdit(obra.id)}
                                        title="Editar Obra"
                                    >
                                        <MdEdit size={18} />
                                    </button>
                                    <button
                                        className="btn-action-mini delete"
                                        onClick={() => handleDelete(obra.id, obra.titulo)}
                                        title="Excluir Obra"
                                    >
                                        <MdDelete size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                <main className="form-section">
                    {showChapterForm ? (
                        <div className="chapter-form-container">
                            <div className="form-header">
                                <h2>🚀 Adicionar Capítulo em: {selectedObraForChapter?.titulo}</h2>
                                <button className="btn-close" onClick={() => setShowChapterForm(false)}>
                                    <MdClose size={24} />
                                </button>
                            </div>
                            <form className="gerador-form" onSubmit={handleAddChapterSubmit}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Número do Capítulo</label>
                                        <input
                                            type="number"
                                            required
                                            placeholder="Ex: 1"
                                            value={chapterData.numero}
                                            onChange={e => setChapterData({ ...chapterData, numero: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Título (Opcional)</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: O Despertar"
                                            value={chapterData.titulo}
                                            onChange={e => setChapterData({ ...chapterData, titulo: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group full">
                                        <label>URLs das Imagens (uma por linha)</label>
                                        <textarea
                                            rows={12}
                                            required
                                            placeholder="https://imagem1.jpg\nhttps://imagem2.jpg..."
                                            value={chapterData.imagensUrl}
                                            onChange={e => setChapterData({ ...chapterData, imagensUrl: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                                <button type="submit" className="btn-gerar" disabled={loading}>
                                    {loading ? 'Salvando...' : <><MdCloudUpload size={20} /> Salvar Capítulo</>}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <div className="form-header">
                                <h2>{isEditing ? `📝 Editando: ${editingId}` : '✨ Nova Obra'}</h2>
                                {isEditing && (
                                    <button className="btn-cancel-edit" onClick={() => {
                                        setIsEditing(false)
                                        setEditingId(null)
                                        setFormData({
                                            titulo: '', tituloAlternativo: '', descricao: '', capa: '', banner: '',
                                            generos: '', status: 'Em Andamento', ano: new Date().getFullYear().toString(),
                                            autor: '', artista: ''
                                        })
                                    }}>
                                        Cancelar Edição
                                    </button>
                                )}
                            </div>
                            <form className="gerador-form" onSubmit={handleSubmit}>
                                <div className="form-grid">
                                    <div className="form-group full">
                                        <label>Título da Obra</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ex: Solo Leveling"
                                            value={formData.titulo}
                                            onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                            disabled={isEditing}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Título Alternativo</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: 나 혼자만 レベルアップ"
                                            value={formData.tituloAlternativo}
                                            onChange={e => setFormData({ ...formData, tituloAlternativo: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Ano</label>
                                        <input
                                            type="number"
                                            value={formData.ano}
                                            onChange={e => setFormData({ ...formData, ano: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option>Em Andamento</option>
                                            <option>Completo</option>
                                            <option>Hiato</option>
                                            <option>Cancelado</option>
                                        </select>
                                    </div>

                                    <div className="form-group full">
                                        <label>Gêneros</label>
                                        <div className="generos-selecionador">
                                            {[
                                                'Ação', 'Aventura', 'Artes Marciais', 'Murim', 'Shounen',
                                                'Fantasia', 'Drama', 'Mistério', 'Romance', 'Sci-fi', 'Comédia'
                                            ].map(gen => {
                                                const isSelected = formData.generos.split(',').map(g => g.trim()).includes(gen)
                                                return (
                                                    <button
                                                        key={gen}
                                                        type="button"
                                                        className={`gen-tag-btn ${isSelected ? 'active' : ''}`}
                                                        onClick={() => {
                                                            let gens = formData.generos.split(',').map(g => g.trim()).filter(g => g)
                                                            if (gens.includes(gen)) {
                                                                gens = gens.filter(g => g !== gen)
                                                            } else {
                                                                gens.push(gen)
                                                            }
                                                            setFormData({ ...formData, generos: gens.join(', ') })
                                                        }}
                                                    >
                                                        {gen}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Ou digite outros separados por vírgula"
                                            value={formData.generos}
                                            onChange={e => setFormData({ ...formData, generos: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Autor</label>
                                        <input
                                            type="text"
                                            placeholder="Nome do Autor"
                                            value={formData.autor}
                                            onChange={e => setFormData({ ...formData, autor: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Artista</label>
                                        <input
                                            type="text"
                                            placeholder="Nome do Artista"
                                            value={formData.artista}
                                            onChange={e => setFormData({ ...formData, artista: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group full">
                                        <label>URL da Capa</label>
                                        <input
                                            type="url"
                                            required
                                            placeholder="Link da imagem..."
                                            value={formData.capa}
                                            onChange={e => setFormData({ ...formData, capa: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group full">
                                        <label>URL do Banner</label>
                                        <input
                                            type="url"
                                            placeholder="https://link-do-banner.jpg"
                                            value={formData.banner}
                                            onChange={e => setFormData({ ...formData, banner: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group full">
                                        <label>Descrição</label>
                                        <textarea
                                            rows={4}
                                            required
                                            placeholder="Sinopse..."
                                            value={formData.descricao}
                                            onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>

                                {success && <div className="msg success"><MdCheckCircle size={20} /> {success}</div>}
                                {error && <div className="msg error"><MdError size={20} /> {error}</div>}

                                <button type="submit" className="btn-gerar" disabled={loading}>
                                    {loading ? 'Processando...' : <><MdCloudUpload size={20} /> {isEditing ? 'Atualizar Obra' : 'Criar Obra'}</>}
                                </button>
                            </form>
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}
