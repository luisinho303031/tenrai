import { useState, useEffect } from 'react'
import { MdFavorite, MdHistory, MdStar, MdEdit, MdCheck, MdClose } from 'react-icons/md'
import { Link } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { listarTodasObras } from './data/obras'
import './App.css' // Reusing main styles for consistency

interface ProfileProps {
    user: any
    profileHandle?: string
}

const Profile = ({ user, profileHandle }: ProfileProps) => {
    const [activeTab, setActiveTab] = useState<'favoritos' | 'historico' | 'estatisticas' | 'avaliacoes'>('favoritos')
    const [favorites, setFavorites] = useState<any[]>([])
    const [userReviews, setUserReviews] = useState<any[]>([])
    const [loadingFavorites, setLoadingFavorites] = useState(false)
    const [loadingReviews, setLoadingReviews] = useState(false)
    const [workRatings, setWorkRatings] = useState<Record<string, number>>({})
    const [targetUser, setTargetUser] = useState<any>(null)
    const [loadingProfile, setLoadingProfile] = useState(false)
    const [isEditingName, setIsEditingName] = useState(false)
    const [editNameValue, setEditNameValue] = useState('')
    const [savingName, setSavingName] = useState(false)
    const [isInputFocused, setIsInputFocused] = useState(false)

    // Derived state for the user we are viewing
    const isOwnProfile = user && (!profileHandle || user.email?.split('@')[0].toLowerCase() === profileHandle)
    const activeUser = isOwnProfile ? user : targetUser
    const activeUserId = activeUser?.id

    useEffect(() => {
        const fetchTargetUser = async () => {
            if (isOwnProfile || !profileHandle) return
            setLoadingProfile(true)
            try {
                // Try to fetch user from 'profiles' table if it exists
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('username', profileHandle)
                    .single()

                if (data) {
                    setTargetUser(data)
                } else {
                    // Fallback: If strict profile lookup fails, assume handle is valid for display purposes
                    console.log("Profile not found in profiles table, using fallback")

                    // Check if handle looks like a UUID
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileHandle || '')

                    setTargetUser({
                        id: isUuid ? profileHandle : null,
                        user_metadata: {
                            full_name: profileHandle,
                            avatar_url: 'https://via.placeholder.com/150'
                        },
                        email: `${profileHandle}@placeholder`
                    })
                }
            } catch (error) {
                console.error('Error fetching target profile:', error)
                // Fallback on error too
                setTargetUser({
                    id: null,
                    user_metadata: {
                        full_name: profileHandle,
                        avatar_url: 'https://via.placeholder.com/150'
                    },
                    email: `${profileHandle}@placeholder`
                })
            } finally {
                setLoadingProfile(false)
            }
        }

        fetchTargetUser()
    }, [profileHandle, isOwnProfile])

    useEffect(() => {
        const fetchFavorites = async () => {
            if (!activeUserId) return
            setLoadingFavorites(true)
            try {
                const { data: favData } = await supabase
                    .from('favorites')
                    .select('obra_id')
                    .eq('user_id', activeUserId)

                const favoriteIds = favData?.map(f => f.obra_id) || []

                // Fetch local works and filter by favorite IDs
                const allWorks = listarTodasObras()
                const userFavorites = allWorks.filter(work => favoriteIds.includes(work.id))

                setFavorites(userFavorites)

                // Fetch ratings for these works
                if (favoriteIds.length > 0) {
                    const { data: ratingsData } = await supabase
                        .from('ratings')
                        .select('obra_id, rating')
                        .in('obra_id', favoriteIds)

                    if (ratingsData) {
                        const ratingsMap: Record<string, number> = {}
                        const grouped = ratingsData.reduce((acc: any, curr: any) => {
                            if (!acc[curr.obra_id]) acc[curr.obra_id] = []
                            acc[curr.obra_id].push(curr.rating)
                            return acc
                        }, {})

                        Object.keys(grouped).forEach(slug => {
                            const ratings = grouped[slug]
                            const avg = ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
                            ratingsMap[slug] = parseFloat(avg.toFixed(1))
                        })
                        setWorkRatings(ratingsMap)
                    }
                }

            } catch (error) {
                console.error('Error fetching favorites:', error)
            } finally {
                setLoadingFavorites(false)
            }
        }

        const fetchReviews = async () => {
            if (!activeUserId) return
            setLoadingReviews(true)
            try {
                const { data: reviewsData } = await supabase
                    .from('ratings')
                    .select('obra_id, rating, created_at')
                    .eq('user_id', activeUserId)

                if (reviewsData && reviewsData.length > 0) {
                    const allWorks = listarTodasObras()
                    const reviewsWithWork = reviewsData.map(review => {
                        const work = allWorks.find(w => w.id === review.obra_id)
                        if (work) {
                            return { ...work, userRating: review.rating, reviewDate: review.created_at }
                        }
                        return null
                    }).filter(item => item !== null)

                    setUserReviews(reviewsWithWork)
                } else {
                    setUserReviews([])
                }

            } catch (error) {
                console.error('Error fetching reviews:', error)
            } finally {
                setLoadingReviews(false)
            }
        }

        if (activeTab === 'favoritos') {
            fetchFavorites()
        } else if (activeTab === 'avaliacoes') {
            fetchReviews()
        }
    }, [activeUserId, activeTab])

    // Skeleton component for profile header
    const ProfileSkeleton = () => (
        <div className="section profile-section" style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
            <div className="hero-banner-custom" style={{ marginBottom: '0' }}>
                <div className="hero-content"></div>
            </div>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: '-50px',
                marginBottom: '2rem',
                position: 'relative',
                zIndex: 2
            }}>
                <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    border: '4px solid #000',
                    marginBottom: '0.5rem',
                    backgroundColor: '#333'
                }} className="skeleton-pulse"></div>
                <div style={{ width: '150px', height: '24px', backgroundColor: '#333', marginBottom: '0.5rem', borderRadius: '4px' }} className="skeleton-pulse"></div>
                <div style={{ width: '100px', height: '16px', backgroundColor: '#333', borderRadius: '4px' }} className="skeleton-pulse"></div>
            </div>
            <div className="profile-tabs" style={{
                display: 'flex',
                gap: '2rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '1rem',
                paddingBottom: '1rem' // Add padding to match the skeletons
            }}>
                <div style={{ width: '80px', height: '24px', backgroundColor: '#333', borderRadius: '4px' }} className="skeleton-pulse"></div>
                <div style={{ width: '80px', height: '24px', backgroundColor: '#333', borderRadius: '4px' }} className="skeleton-pulse"></div>
                <div style={{ width: '80px', height: '24px', backgroundColor: '#333', borderRadius: '4px' }} className="skeleton-pulse"></div>
            </div>
        </div>
    )

    // Skeleton for list items (favorites, reviews)
    const ListSkeleton = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="recommended-card" style={{ display: 'flex', gap: '1rem', padding: '0', background: 'transparent', marginBottom: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '140px', height: '200px', backgroundColor: '#333', borderRadius: '4px', flexShrink: 0 }} className="skeleton-pulse"></div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingTop: '0.5rem' }}>
                        <div style={{ width: '80%', height: '24px', backgroundColor: '#333', borderRadius: '4px', marginBottom: '0.5rem' }} className="skeleton-pulse"></div>
                        <div style={{ width: '90%', height: '14px', backgroundColor: '#333', borderRadius: '4px' }} className="skeleton-pulse"></div>
                        <div style={{ width: '95%', height: '14px', backgroundColor: '#333', borderRadius: '4px' }} className="skeleton-pulse"></div>
                        <div style={{ width: '60%', height: '14px', backgroundColor: '#333', borderRadius: '4px', marginBottom: 'auto' }} className="skeleton-pulse"></div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                            <div style={{ width: '60px', height: '20px', backgroundColor: '#333', borderRadius: '2px' }} className="skeleton-pulse"></div>
                            <div style={{ width: '60px', height: '20px', backgroundColor: '#333', borderRadius: '2px' }} className="skeleton-pulse"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )

    if (loadingProfile) {
        return <ProfileSkeleton />
    }

    const handleSaveName = async () => {
        if (!editNameValue.trim() || !user) return

        setSavingName(true)
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: editNameValue }
            })

            if (error) {
                console.error('Error updating name:', error)
                alert('Erro ao atualizar nome. Tente novamente.')
            } else {
                setIsEditingName(false)
                // Force reload to sync all components if needed, or rely on auth state change
                // For now, let's reload to be safe and simple for the user to see changes everywhere
                window.location.reload()
            }
        } catch (err) {
            console.error('Error:', err)
        } finally {
            setSavingName(false)
        }
    }

    if (!user && !profileHandle) {
        return (
            <div className="section profile-section" style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.4s ease', padding: '2rem', textAlign: 'center', color: '#fff' }}>
                <h2>Você não está conectado.</h2>
                <Link to="/entrar" style={{ color: '#667eea', textDecoration: 'none', marginTop: '1rem', display: 'inline-block' }}>Fazer login</Link>
            </div>
        )
    }

    const displayUser = activeUser

    if (!displayUser && !loadingProfile) {
        return (
            <div className="section profile-section" style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.4s ease', padding: '2rem', textAlign: 'center', color: '#fff' }}>
                <h2>Usuário não encontrado.</h2>
            </div>
        )
    }

    const avatarUrl = displayUser?.user_metadata?.avatar_url || displayUser?.avatar_url || 'https://via.placeholder.com/150'
    const userName = displayUser?.user_metadata?.full_name || displayUser?.full_name || displayUser?.email?.split('@')[0] || profileHandle || 'Usuário'
    const userHandle = `@${profileHandle || displayUser?.email?.split('@')[0].toLowerCase() || 'usuario'}`

    return (
        <div className="section profile-section" style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
            {/* Banner */}
            <div className="hero-banner-custom" style={{ marginBottom: '0' }}>
                <div className="hero-content">
                </div>
            </div>

            {/* Profile Info (Overlapping) */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: '-50px',
                marginBottom: '2rem',
                position: 'relative',
                zIndex: 2
            }}>
                <img
                    src={avatarUrl}
                    alt={userName}
                    style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '4px solid #000',
                        marginBottom: '0.5rem'
                    }}
                />
                <div
                    style={{ position: 'relative', display: 'flex', alignItems: 'center', flexDirection: 'column' }}
                >
                    {isEditingName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.2rem' }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    value={editNameValue}
                                    onChange={(e) => {
                                        if (e.target.value.length <= 14) {
                                            setEditNameValue(e.target.value)
                                        }
                                    }}
                                    onFocus={() => setIsInputFocused(true)}
                                    onBlur={() => setIsInputFocused(false)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: isInputFocused ? '1px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '0',
                                        padding: '4px 35px 4px 0px', // Adjusted padding
                                        color: '#fff',
                                        fontSize: '1.5rem',
                                        fontWeight: 700,
                                        width: `${Math.max(editNameValue.length, 6) * 1.5}ch`, // Dynamic width based on char count
                                        minWidth: '150px',
                                        textAlign: 'left', // Align text to start
                                        outline: 'none',
                                        transition: 'border-color 0.3s'
                                    }}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveName()
                                        if (e.key === 'Escape') setIsEditingName(false)
                                    }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    fontSize: '0.7rem',
                                    color: 'rgba(255,255,255,0.5)',
                                    pointerEvents: 'none'
                                }}>
                                    {editNameValue.length}/14
                                </span>
                            </div>
                            <button
                                onClick={handleSaveName}
                                disabled={savingName || editNameValue === userName}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: (savingName || editNameValue === userName) ? 'rgba(255,255,255,0.2)' : '#4CAF50',
                                    cursor: (savingName || editNameValue === userName) ? 'default' : 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'color 0.2s',
                                    outline: 'none'
                                }}
                            >
                                <MdCheck size={24} />
                            </button>
                            <button
                                onClick={() => setIsEditingName(false)}
                                disabled={savingName}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#f44336',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'color 0.2s',
                                    outline: 'none'
                                }}
                            >
                                <MdClose size={20} />
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%' }}>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: '0 0 0.2rem 0', lineHeight: 1.2 }}>{userName}</h1>
                            {isOwnProfile && (
                                <button
                                    onClick={() => {
                                        setEditNameValue(userName)
                                        setIsEditingName(true)
                                    }}
                                    className="edit-profile-btn"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: 'none',
                                        borderRadius: '2px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '0.75rem',
                                        position: 'absolute',
                                        left: '100%',
                                        marginLeft: '10px',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <MdEdit size={14} />
                                    Editar
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <span style={{ color: '#aaa', fontSize: '0.85rem' }}>{userHandle}</span>
            </div>

            {/* Tabs Navigation */}
            <div className="profile-tabs" style={{
                display: 'flex',
                gap: '2rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '1rem'
            }}>
                {[
                    { id: 'favoritos', label: 'Favoritas' },
                    { id: 'historico', label: 'Histórico' },
                    { id: 'avaliacoes', label: 'Avaliações' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderRadius: '0',
                            outline: 'none',
                            color: activeTab === tab.id ? '#fff' : '#aaa',
                            borderBottom: activeTab === tab.id ? '2px solid #fff' : '2px solid transparent',
                            padding: '0.8rem 0',
                            fontSize: '0.9rem',
                            fontWeight: 400,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            marginBottom: '-1px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {tab.label}
                        {tab.id === 'favoritos' && favorites.length > 0 && (
                            <span style={{
                                backgroundColor: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.15)',
                                color: activeTab === tab.id ? '#000' : '#aaa',
                                padding: '1px 6px',
                                borderRadius: '10px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                lineHeight: 1
                            }}>
                                {favorites.length}
                            </span>
                        )}
                        {tab.id === 'avaliacoes' && userReviews.length > 0 && (
                            <span style={{
                                backgroundColor: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.15)',
                                color: activeTab === tab.id ? '#000' : '#aaa',
                                padding: '1px 6px',
                                borderRadius: '10px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                lineHeight: 1
                            }}>
                                {userReviews.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="profile-content">
                {activeTab === 'favoritos' && (
                    <div className="tab-pane">
                        {loadingFavorites ? (
                            <ListSkeleton />
                        ) : favorites.length > 0 ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0rem',
                                paddingBottom: '2rem'
                            }}>
                                {favorites.map((work) => (
                                    <Link
                                        to={`/obra/${work.id}`}
                                        key={work.id}
                                        className="recommended-card"
                                        style={{ textDecoration: 'none', marginBottom: '0.8rem' }}
                                    >
                                        <img
                                            src={work.imagens?.capa}
                                            alt={work.meta?.titulo}
                                            className="rec-cover"
                                        />
                                        <div className="rec-info">
                                            {/* Rating */}
                                            {/* Rating */}
                                            {(workRatings[work.id] || work.meta?.avaliacao) && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FFD700', fontSize: '0.75rem', marginBottom: '6px' }}>
                                                    <MdStar size={14} />
                                                    <span style={{ fontWeight: 600 }}>{workRatings[work.id] || work.meta?.avaliacao}</span>
                                                </div>
                                            )}

                                            {/* Title */}
                                            <h3>{work.meta?.titulo}</h3>

                                            {/* Description */}
                                            <p className="rec-desc">{work.meta?.descricao}</p>

                                            {/* Tags */}
                                            <div className="rec-tags">
                                                {(work.generos || []).slice(0, 3).map((tag: string, index: number) => (
                                                    <span key={index} className="tag-badge">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', color: '#666' }}>
                                <MdFavorite size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <p>Seus favoritos aparecerão aqui.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'historico' && (
                    <div className="tab-pane">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', color: '#666' }}>
                            <MdHistory size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>Seu histórico de leitura aparecerá aqui.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'estatisticas' && (
                    <div className="tab-pane">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', color: '#666' }}>
                            <MdHistory size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>Suas estatísticas de leitura aparecerão aqui.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'avaliacoes' && (
                    <div className="tab-pane">
                        {loadingReviews ? (
                            <ListSkeleton />
                        ) : userReviews.length > 0 ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0rem',
                                paddingBottom: '2rem'
                            }}>
                                {userReviews.map((work) => (
                                    <Link
                                        to={`/obra/${work.id}`}
                                        key={work.id}
                                        className="recommended-card"
                                        style={{ textDecoration: 'none', marginBottom: '0.8rem' }}
                                    >
                                        <img
                                            src={work.imagens?.capa}
                                            alt={work.meta?.titulo}
                                            className="rec-cover"
                                        />
                                        <div className="rec-info">
                                            {/* User Rating */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FFD700', fontSize: '0.75rem', marginBottom: '6px' }}>
                                                <MdStar size={14} />
                                                <span style={{ fontWeight: 600 }}>Sua avaliação: {work.userRating}</span>
                                            </div>

                                            {/* Title */}
                                            <h3>{work.meta?.titulo}</h3>

                                            {/* Description */}
                                            <p className="rec-desc">{work.meta?.descricao}</p>

                                            {/* Tags */}
                                            <div className="rec-tags">
                                                {(work.generos || []).slice(0, 3).map((tag: string, index: number) => (
                                                    <span key={index} className="tag-badge">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', color: '#666' }}>
                                <MdStar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <p>Suas avaliações aparecerão aqui.</p>
                            </div>
                        )}
                    </div>
                )}


            </div>
        </div>
    )
}

export default Profile
