import { useState, useEffect, useRef, useCallback } from 'react'
import { MdHome, MdLibraryBooks, MdLogin, MdClose, MdArrowForward, MdSearch, MdLocalOffer, MdCheckCircle, MdArrowDownward, MdLogout, MdMenuBook, MdCancel, MdStarBorder, MdFavoriteBorder, MdContentCopy, MdCheck, MdPlayArrow, MdArrowBack, MdFavorite, MdArrowUpward, MdStar } from 'react-icons/md'
import { FcGoogle } from 'react-icons/fc'
import { Link, useLocation } from 'react-router-dom'
import './App.css'

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 0) return 'agora'
  if (diffInSeconds < 60) return `${diffInSeconds}s`

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}m`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    if (diffInDays === 1) return '1 dia'
    return `${diffInDays} dias`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    if (diffInWeeks === 1) return '1 semana'
    return `${diffInWeeks} semanas`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    if (diffInMonths === 1) return '1 mês'
    return `${diffInMonths} meses`
  }

  const diffInYears = Math.floor(diffInDays / 365)
  if (diffInYears === 1) return '1 ano'
  return `${diffInYears} anos`
}

import { supabase } from './lib/supabase'
import { Drawer } from 'vaul'
import NotFoundContent from './NotFoundContent'

interface Obra {
  obr_id: number
  obr_nome: string
  obr_slug: string
  obr_imagem: string
  obr_vip: boolean
  scan_id: number
  genero: {
    gen_id: number
    gen_nome: string
    gen_slug: string
    gen_color: string
  }
  tags: Array<{
    tag_id: number
    tag_nome: string
  }>
  total_capitulos: number
  obr_data_ultimo_capitulo: string
  ultimo_capitulo: {
    cap_id: number
    cap_nome: string
    cap_numero: number
    cap_criado_em: string
  }
  capitulos: Array<{
    cap_id: number
    cap_nome: string
    cap_numero: number
    cap_criado_em: string
  }>
  formato?: {
    formt_id: number
    formt_nome: string
  }
}

interface Tag {
  tag_id: number
  tag_nome: string
}

interface Status {
  stt_id: number
  stt_nome: string
}

interface ObraDetalhada extends Obra {
  obr_descricao: string
}

interface ApiResponse {
  obras: Obra[]
  total?: number
}

const API_TOKEN = 'Bearer 093259483aecaf3e4eb19f29bb97a89b789fa48ccdc2f1ef22f35759f518e48a8a57c476b74f3025eca4edcfd68d01545604159e2af02d64f4b803f2fd2e3115'
const RECOMMENDED_SLUGS = ['o-lamento-da-sereia', 'o-deus-demonio-cssmtz', 'eu-me-tornei-a-serva-do-tirano', 'minhas-discipulas-sao-todas-futuras-mestras-celestiais']
const TRENDING_SLUGS = ['o-ponto-de-vista-do-leitor-oniscienteee', 'me-escolhe', 'serei-a-matriarca-nessa-vida', 'o-domador-genio-da-academia']

function App() {
  const [activeSection, setActiveSection] = useState('inicio')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showMobileDrawer, setShowMobileDrawer] = useState(false)
  const [user, setUser] = useState<any>(null)
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [is404, setIs404] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const validPaths = ['/', '/obras', '/entrar', '/perfil']
    const isObraPath = location.pathname.startsWith('/obra/')

    if (validPaths.includes(location.pathname) || isObraPath) {
      setIs404(false)
      if (location.pathname === '/') {
        setActiveSection('inicio')
      } else if (location.pathname === '/obras') {
        setActiveSection('todas-obras')
      } else if (location.pathname === '/entrar') {
        setActiveSection('entrar')
      } else if (isObraPath) {
        setActiveSection('obra-detalhe')
      } else if (location.pathname === '/perfil') {
        // handle profile section if added later
      }
    } else {
      console.log('Detectada rota invalida:', location.pathname)
      setIs404(true)
      setActiveSection('')
    }
  }, [location])

  const [currentObra, setCurrentObra] = useState<any>(null)
  const [loadingObra, setLoadingObra] = useState(false)
  const [obraTab, setObraTab] = useState<'info' | 'chapters'>('info')
  const [linkCopied, setLinkCopied] = useState(false)
  const [showObraTitleInTopbar, setShowObraTitleInTopbar] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [chaptersOrder, setChaptersOrder] = useState<'asc' | 'desc'>('desc')
  const [userRating, setUserRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [showRatingDropdown, setShowRatingDropdown] = useState(false)
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [totalRatings, setTotalRatings] = useState(0)
  const [ratingUpdateTrigger, setRatingUpdateTrigger] = useState(0)
  const [worksRatings, setWorksRatings] = useState<Record<number, { average: number, total: number }>>({})
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
  const [obraRatingsList, setObraRatingsList] = useState<any[]>([])

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
            setIs404(true) // Se der erro, provavelmente a obra não existe
          })
      }
    }
  }, [activeSection, location.pathname])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        if (window.name === 'TenraiLogin') {
          window.close()
          return
        }
        setShowLoginModal(false) // Close modal on successful login
        setShowMobileDrawer(false) // Close drawer on successful login
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (user) {
      // If already logged in, maybe show profile or logout option?
      // For now, let's just log out for testing or do nothing
      // const { error } = await supabase.auth.signOut()
      console.log('User is logged in:', user)
    } else {
      if (isMobile) {
        setShowMobileDrawer(true)
      } else {
        setShowLoginModal(true)
      }
    }
  }

  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleGoogleLogin = async () => {
    if (!isMobile) {
      setIsLoggingIn(true)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true
        }
      })

      if (error) {
        console.error('Error logging in:', error.message)
        setIsLoggingIn(false)
        return
      }

      if (data?.url) {
        const width = 500
        const height = 600
        const left = window.screen.width / 2 - width / 2
        const top = window.screen.height / 2 - height / 2
        const popup = window.open(
          data.url,
          'TenraiLogin',
          `popup=true, width=${width}, height=${height}, left=${left}, top=${top}`
        )

        const interval = setInterval(() => {
          if (popup?.closed) {
            clearInterval(interval)
            setIsLoggingIn(false)
          }
        }, 1000)
      }
    } else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) console.error('Error logging in:', error.message)
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Error logging out:', error.message)
  }
  const [obras, setObras] = useState<Obra[]>(() => {
    const savedGenre = localStorage.getItem('lancamentos_genre')
    const genre = savedGenre ? parseInt(savedGenre, 10) : 1
    const savedObras = localStorage.getItem(`tenrai_obras_${isNaN(genre) ? 1 : genre}`)
    try {
      return savedObras ? JSON.parse(savedObras) : []
    } catch {
      return []
    }
  })
  const [recommendedObras, setRecommendedObras] = useState<ObraDetalhada[]>(() => {
    const saved = localStorage.getItem('tenrai_recommended')
    try {
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [trendingObras, setTrendingObras] = useState<ObraDetalhada[]>(() => {
    const saved = localStorage.getItem('tenrai_trending')
    try {
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(true)
  const [loadingRecommended, setLoadingRecommended] = useState(true)
  const [loadingTrending, setLoadingTrending] = useState(true)
  const [selectedGenre, setSelectedGenre] = useState(() => {
    const saved = localStorage.getItem('lancamentos_genre')
    const parsed = saved ? parseInt(saved, 10) : 1
    return isNaN(parsed) ? 1 : parsed
  }) // 1 = Webtoon, 4 = Shoujo

  const [allWorks, setAllWorks] = useState<Obra[]>([])
  const [loadingAllWorks, setLoadingAllWorks] = useState(false)
  const [allWorksPage, setAllWorksPage] = useState(1)
  const [allWorksHasMore, setAllWorksHasMore] = useState(true)
  const [allWorksGenre, setAllWorksGenre] = useState(() => {
    const saved = localStorage.getItem('allworks_genre')
    const parsed = saved ? parseInt(saved, 10) : 1
    return isNaN(parsed) ? 1 : parsed
  }) // 1 = Webtoon, 4 = Shoujo
  const [allWorksTotal, setAllWorksTotal] = useState<number>(0)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [showTagsDropdown, setShowTagsDropdown] = useState(false)
  const [showTagsDrawer, setShowTagsDrawer] = useState(false)
  const [availableStatuses, setAvailableStatuses] = useState<Status[]>([])
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showStatusDrawer, setShowStatusDrawer] = useState(false)
  const [showSearchDrawer, setShowSearchDrawer] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const allWorksObserver = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    setAllWorks([])
    setAllWorksPage(1)
    setAllWorksHasMore(true)
  }, [debouncedSearch])

  const lastAllWorkRef = useCallback((node: HTMLElement | null) => {
    if (loadingAllWorks) return
    if (allWorksObserver.current) allWorksObserver.current.disconnect()
    allWorksObserver.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && allWorksHasMore) {
        setAllWorksPage(prevPage => prevPage + 1)
      }
    })
    if (node) allWorksObserver.current.observe(node)
  }, [loadingAllWorks, allWorksHasMore])

  useEffect(() => {
    const fetchAllWorks = async () => {
      if (!allWorksHasMore && allWorksPage !== 1) return

      try {
        setLoadingAllWorks(true)
        const tagParams = selectedTags.length > 0 ? `&tag_ids=${selectedTags.join(',')}` : ''
        const statusParams = selectedStatus !== null ? `&stt_id=${selectedStatus}` : ''
        const searchParams = debouncedSearch ? `&obr_nome=${encodeURIComponent(debouncedSearch)}` : ''
        const response = await fetch(`/api/obras/search?pagina=${allWorksPage}&limite=24&gen_id=${allWorksGenre}&todos_generos=0&orderBy=rating&orderDirection=DESC${tagParams}${statusParams}${searchParams}`, {
          headers: { 'Authorization': API_TOKEN }
        })
        const data: ApiResponse = await response.json()

        if (data.total !== undefined) {
          setAllWorksTotal(data.total)
        }

        setAllWorks(prev => {
          if (allWorksPage === 1) return data.obras || []
          // Avoid potential duplicates and nulls
          if (!data.obras) return prev
          const newObras = data.obras.filter(n => !prev.some(p => p.obr_id === n.obr_id))
          return [...prev, ...newObras]
        })

        if (!data.obras || data.obras.length === 0 || data.obras.length < 24) {
          setAllWorksHasMore(false)
        }
      } catch (error) {
        console.error('Erro ao buscar todas as obras:', error)
      } finally {
        setLoadingAllWorks(false)
      }
    }

    if (activeSection === 'todas-obras') {
      fetchAllWorks()
    }
  }, [activeSection, allWorksPage, allWorksGenre, selectedTags, selectedStatus, debouncedSearch])

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/obras/filtros', {
          headers: { 'Authorization': API_TOKEN }
        })
        const data = await response.json()
        if (data.tags) {
          // Filter to show only specific tags
          const allowedTagIds = [1, 2, 3, 4, 5, 6, 7, 8, 21, 22, 38, 52]
          const filteredTags = data.tags.filter((tag: Tag) => allowedTagIds.includes(tag.tag_id))
          setAvailableTags(filteredTags)
        }
        if (data.status) {
          setAvailableStatuses(data.status)
        }
      } catch (error) {
        console.error('Erro ao buscar tags:', error)
      }
    }

    if (activeSection === 'todas-obras' && availableTags.length === 0) {
      fetchTags()
    }
  }, [activeSection])

  // Close dropdowns on click outside or scroll
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.tags-dropdown-wrapper')) {
        setShowTagsDropdown(false)
        setShowStatusDropdown(false)
      }
    }

    const handleScroll = () => {
      setShowTagsDropdown(false)
      setShowStatusDropdown(false)
    }

    if (showTagsDropdown || showStatusDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('scroll', handleScroll, true)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [showTagsDropdown, showStatusDropdown])

  useEffect(() => {
    localStorage.setItem('lancamentos_genre', selectedGenre.toString())
  }, [selectedGenre])

  useEffect(() => {
    localStorage.setItem('allworks_genre', allWorksGenre.toString())
  }, [allWorksGenre])

  // Save recommended to cache
  useEffect(() => {
    if (recommendedObras.length > 0) {
      localStorage.setItem('tenrai_recommended', JSON.stringify(recommendedObras))
    }
  }, [recommendedObras])

  // Save trending to cache
  useEffect(() => {
    if (trendingObras.length > 0) {
      localStorage.setItem('tenrai_trending', JSON.stringify(trendingObras))
    }
  }, [trendingObras])

  // Save obras to cache
  useEffect(() => {
    if (obras.length > 0) {
      localStorage.setItem(`tenrai_obras_${selectedGenre}`, JSON.stringify(obras))
    }
  }, [obras, selectedGenre])

  const [sliderIndex, setSliderIndex] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef<IntersectionObserver | null>(null)
  const mainContentRef = useRef<HTMLElement>(null)

  const lastObraRef = useCallback((node: HTMLElement | null) => {
    if (loading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1)
      }
    })
    if (node) observer.current.observe(node)
  }, [loading, hasMore])

  // Scroll to top when activeSection changes
  useEffect(() => {
    window.scrollTo(0, 0)
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo(0, 0)
    }
  }, [activeSection])

  // Detect scroll to show/hide obra title in topbar
  useEffect(() => {
    if (activeSection !== 'obra-detalhe' || !isMobile) {
      setShowObraTitleInTopbar(false)
      return
    }

    const handleScroll = () => {
      const obraTitleElement = document.querySelector('.obra-title-main')
      if (obraTitleElement) {
        const rect = obraTitleElement.getBoundingClientRect()
        // Show title in topbar when the main title scrolls out of view
        setShowObraTitleInTopbar(rect.bottom < 60)
      }
    }

    window.addEventListener('scroll', handleScroll)
    if (mainContentRef.current) {
      mainContentRef.current.addEventListener('scroll', handleScroll)
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (mainContentRef.current) {
        mainContentRef.current.removeEventListener('scroll', handleScroll)
      }
    }
  }, [activeSection, isMobile])

  useEffect(() => {
    const fetchObras = async () => {
      if (!hasMore && page !== 1) return

      try {
        setLoading(true)

        const response = await fetch(`/api/obras/atualizacoes?pagina=${page}&limite=24&gen_id=${selectedGenre}`, {
          headers: {
            'Authorization': API_TOKEN
          }
        })
        const data: ApiResponse = await response.json()

        setObras(prev => {
          if (page === 1) return data.obras
          // Avoid duplicates
          const newObras = data.obras.filter(n => !prev.some(p => p.obr_id === n.obr_id))
          return [...prev, ...newObras]
        })

        if (data.obras.length === 0 || data.obras.length < 24) {
          setHasMore(false)
        }
      } catch (error) {
        console.error('Erro ao buscar obras:', error)
      } finally {
        setLoading(false)
      }
    }

    if (activeSection === 'inicio') {
      fetchObras()
    }
  }, [activeSection, selectedGenre, page])

  // Fetch Recommended - Stale While Revalidate
  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        if (recommendedObras.length === 0) {
          setLoadingRecommended(true)
        }

        const promises = RECOMMENDED_SLUGS.map(async (slug) => {
          const response = await fetch(`/api/obras/${slug}`, {
            headers: { 'Authorization': API_TOKEN }
          })
          if (!response.ok) return null
          return await response.json()
        })

        const results = await Promise.all(promises)
        const validResults = results.filter(item => item !== null) as ObraDetalhada[]

        // Only update if data changed to avoid unnecessary re-renders
        if (JSON.stringify(validResults) !== JSON.stringify(recommendedObras)) {
          setRecommendedObras(validResults)
        }
      } catch (error) {
        console.error('Erro ao buscar recomendadas:', error)
      } finally {
        setLoadingRecommended(false)
      }
    }

    if (activeSection === 'inicio') {
      fetchRecommended()
    }
  }, [activeSection])

  // Fetch Trending - Stale While Revalidate
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        if (trendingObras.length === 0) {
          setLoadingTrending(true)
        }

        const promises = TRENDING_SLUGS.map(async (slug) => {
          const response = await fetch(`/api/obras/${slug}`, {
            headers: { 'Authorization': API_TOKEN }
          })
          if (!response.ok) return null
          return await response.json()
        })

        const results = await Promise.all(promises)
        const validResults = results.filter(item => item !== null) as ObraDetalhada[]

        if (JSON.stringify(validResults) !== JSON.stringify(trendingObras)) {
          setTrendingObras(validResults)
        }
      } catch (error) {
        console.error('Erro ao buscar em alta:', error)
      } finally {
        setLoadingTrending(false)
      }
    }

    if (activeSection === 'todas-obras') {
      fetchTrending()
    }
  }, [activeSection])

  // Auto slide
  useEffect(() => {
    if (recommendedObras.length === 0) return

    const interval = setInterval(() => {
      setSliderIndex((prev) => (prev + 1) % Math.ceil(recommendedObras.length / 2))
    }, 10000)

    return () => clearInterval(interval)
  }, [recommendedObras, sliderIndex])

  const handleManualSlide = (index: number) => {
    setSliderIndex(index)
  }

  const getImageUrl = (obra: Obra | ObraDetalhada) => {
    if (!obra.obr_imagem) return ''
    if (obra.obr_imagem.startsWith('wp-content')) {
      return `/api/cdn/${obra.obr_imagem}`
    }
    return `/api/cdn/scans/${obra.scan_id}/obras/${obra.obr_id}/${obra.obr_imagem}`
  }

  const toggleFavorite = async () => {
    if (!currentObra) return

    if (!user) {
      if (isMobile) {
        setShowMobileDrawer(true)
      } else {
        setShowLoginModal(true)
      }
      return
    }

    // Optimistic UI update
    const previousState = isFavorited
    setIsFavorited(!previousState)

    if (previousState) {
      // Remove
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('obra_id', currentObra.obr_id)

      if (error) {
        console.error('Erro ao remover favorito:', error)
        setIsFavorited(previousState)
      }
    } else {
      // Add
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          obra_id: currentObra.obr_id,
          obra_nome: currentObra.obr_nome,
          obra_imagem: getImageUrl(currentObra)
        })

      if (error) {
        console.error('Erro ao adicionar favorito:', error)
        setIsFavorited(previousState)
      }
    }
  }

  // Check if favorite
  useEffect(() => {
    if (user && currentObra) {
      const checkFavorite = async () => {
        const { data } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('obra_id', currentObra.obr_id)
          .single()

        setIsFavorited(!!data)
      }
      checkFavorite()
    } else {
      setIsFavorited(false)
    }
  }, [user, currentObra])

  const handleRate = async (rating: number) => {
    if (!currentObra) return

    if (!user) {
      if (isMobile) {
        setShowMobileDrawer(true)
      } else {
        setShowLoginModal(true)
      }
      return
    }

    // Optimistic UI update
    setUserRating(rating)
    setShowRatingDropdown(false)

    // Save to Supabase
    const { error } = await supabase
      .from('ratings')
      .upsert({
        user_id: user.id,
        obra_id: currentObra.obr_id,
        rating: rating,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, obra_id' })

    if (error) {
      console.error('Erro ao avaliar:', error)
    } else {
      setRatingUpdateTrigger(prev => prev + 1)
    }
  }

  // Check user rating
  useEffect(() => {
    if (user && currentObra) {
      const checkRating = async () => {
        const { data } = await supabase
          .from('ratings')
          .select('rating')
          .eq('user_id', user.id)
          .eq('obra_id', currentObra.obr_id)
          .maybeSingle()

        if (data) setUserRating(data.rating)
        else setUserRating(null)
      }
      checkRating()
    } else {
      setUserRating(null)
    }
  }, [user, currentObra])

  // Calculate average rating
  useEffect(() => {
    if (currentObra) {
      const fetchAverage = async () => {
        // Agora fazemos o JOIN com a tabela profiles que criamos no SQL
        const { data, error } = await supabase
          .from('ratings')
          .select('*, profiles(full_name, avatar_url)')
          .eq('obra_id', currentObra.obr_id)
          .order('updated_at', { ascending: false })

        if (error) {
          console.error('Erro ao buscar avaliações:', error)
          return
        }

        if (data && data.length > 0) {
          const total = data.length
          const sum = data.reduce((acc, curr) => acc + (curr.rating || 0), 0)
          setAverageRating(sum / total)
          setTotalRatings(total)
          setObraRatingsList(data)

          // Distribuição das barras
          const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          data.forEach(item => {
            if (dist[item.rating] !== undefined) {
              dist[item.rating]++
            }
          })
          setRatingDistribution(dist)
        } else {
          setAverageRating(null)
          setTotalRatings(0)
          setObraRatingsList([])
          setRatingDistribution({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
        }
      }
      fetchAverage()
    }
  }, [currentObra, ratingUpdateTrigger])



  const handleGenreChange = (genreId: number) => {
    if (selectedGenre === genreId) return
    setSelectedGenre(genreId)

    // Load cache for the new genre immediately
    const savedObras = localStorage.getItem(`tenrai_obras_${genreId}`)
    try {
      setObras(savedObras ? JSON.parse(savedObras) : [])
    } catch {
      setObras([])
    }

    setPage(1)
    setHasMore(true)
    setLoading(true)
  }

  const handleAllWorksGenreChange = (genreId: number) => {
    if (allWorksGenre === genreId) return
    setAllWorksGenre(genreId)
    setAllWorks([])
    setAllWorksPage(1)
    setAllWorksHasMore(true)
    setLoadingAllWorks(true)
  }

  const handleTagToggle = (tagId: number) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId)
      } else {
        return [...prev, tagId]
      }
    })
    setAllWorks([])
    setAllWorksPage(1)
    setAllWorksHasMore(true)
  }

  const handleStatusSelect = (statusId: number | null) => {
    setSelectedStatus(prev => prev === statusId ? null : statusId)
    setAllWorks([])
    setAllWorksPage(1)
    setAllWorksHasMore(true)
    setShowStatusDropdown(false)
  }
  const displayedChapters = currentObra?.capitulos
    ? [...currentObra.capitulos].sort((a: any, b: any) => chaptersOrder === 'asc' ? a.cap_numero - b.cap_numero : b.cap_numero - a.cap_numero)
    : []

  // Load ratings for recommended works, updated works, trending and all works
  useEffect(() => {
    const allWorksToFetch = [...recommendedObras, ...obras, ...trendingObras, ...allWorks]
    if (allWorksToFetch.length > 0) {
      const fetchRatings = async () => {
        const ids = [...new Set(allWorksToFetch.map(o => o.obr_id))]
        if (ids.length === 0) return

        const { data } = await supabase
          .from('ratings')
          .select('obra_id, rating')
          .in('obra_id', ids)

        if (data) {
          const sums: Record<number, number> = {}
          const counts: Record<number, number> = {}

          data.forEach(item => {
            sums[item.obra_id] = (sums[item.obra_id] || 0) + item.rating
            counts[item.obra_id] = (counts[item.obra_id] || 0) + 1
          })

          const newRatings: Record<number, { average: number, total: number }> = {}
          Object.keys(sums).forEach(key => {
            const id = Number(key)
            newRatings[id] = {
              average: sums[id] / counts[id],
              total: counts[id]
            }
          })

          setWorksRatings(prev => ({ ...prev, ...newRatings }))
        }
      }
      fetchRatings()
    }
  }, [recommendedObras, obras, trendingObras, allWorks, activeSection, ratingUpdateTrigger])

  return (
    <div className="app-container">
      <aside className="sidebar">
        <Link to="/" className="sidebar-header" style={{ cursor: 'pointer', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="tenrai-logo">
            <h1 className="tenrai-title">TENRAI</h1>
          </div>
        </Link>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <Link
                to="/"
                className={activeSection === 'inicio' ? 'active' : ''}
              >
                <MdHome size={24} />
                Início
              </Link>
            </li>
            <li>
              <Link
                to="/obras"
                className={activeSection === 'todas-obras' ? 'active' : ''}
              >
                <MdLibraryBooks size={24} />
                Todas as obras
              </Link>
            </li>
            {!user && (
              <li>
                <button
                  className={`sidebar-nav-btn ${activeSection === 'entrar' ? 'active' : ''}`}
                  onClick={handleLoginClick}
                >
                  <MdLogin size={24} />
                  Entrar
                </button>
              </li>
            )}
            {user && (
              <li>
                <button
                  className="sidebar-nav-btn"
                  onClick={handleLogout}
                >
                  <MdLogout size={24} />
                  Sair
                </button>
              </li>
            )}
          </ul>
        </nav>
        {user && (
          <div className="sidebar-user">
            <img
              src={user.user_metadata?.avatar_url || 'https://via.placeholder.com/40'}
              alt={user.user_metadata?.full_name || 'User'}
              className="user-avatar"
            />
            <div className="user-info">
              <span className="user-name">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
            </div>
          </div>
        )}
      </aside>

      <main className="main-content" ref={mainContentRef}>
        {/* Mobile Topbar for Obra Detail */}
        {activeSection === 'obra-detalhe' && isMobile && !loadingObra && currentObra && (
          <div className="mobile-obra-topbar">
            <Link to="/obras" className="topbar-back-btn">
              <MdArrowBack size={24} />
            </Link>
            <h2 className={`topbar-title ${showObraTitleInTopbar ? 'visible' : ''}`}>
              {currentObra.obr_nome}
            </h2>
          </div>
        )}

        <div className="content-wrapper">
          {activeSection === 'inicio' && !is404 && (
            <div className="section home-section">
              {/* Hero Banner */}
              <div className="hero-banner-custom">
                <div className="hero-content">
                  <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    Junte-se a comunidade no discord!
                    <MdArrowForward size={22} />
                  </h2>
                </div>
              </div>

              {/* Recommended Slider Section */}
              {(loadingRecommended || recommendedObras.length > 0) && (
                <div className="recommended-section">
                  <div className="section-header-title">
                    <h2>Recomendadas</h2>
                  </div>

                  {loadingRecommended ? (
                    <div className="slider-container">
                      <div className="slider-track" style={{ transform: 'translateX(0)' }}>
                        <div className="slide-group">
                          <div className="recommended-card skeleton-card">
                            <div className="rec-cover skeleton"></div>
                            <div className="rec-info">
                              <div className="skeleton skeleton-title" style={{ marginBottom: '0.5rem' }}></div>
                              <div className="skeleton skeleton-desc"></div>
                              <div className="skeleton skeleton-desc" style={{ width: '60%' }}></div>
                              <div className="skeleton skeleton-tag-row"></div>
                            </div>
                          </div>
                          <div className="recommended-card skeleton-card">
                            <div className="rec-cover skeleton"></div>
                            <div className="rec-info">
                              <div className="skeleton skeleton-title" style={{ marginBottom: '0.5rem' }}></div>
                              <div className="skeleton skeleton-desc"></div>
                              <div className="skeleton skeleton-desc" style={{ width: '60%' }}></div>
                              <div className="skeleton skeleton-tag-row"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="slider-container">
                      <div
                        className="slider-track"
                        style={{ transform: `translateX(-${sliderIndex * 100}%)` }}
                      >
                        {Array.from({ length: Math.ceil(recommendedObras.length / 2) }).map((_, slideIdx) => {
                          const first = recommendedObras[slideIdx * 2]
                          const second = recommendedObras[slideIdx * 2 + 1]

                          const getSlug = (obra: any) => obra.obr_slug || obra.slug || obra.obr_nome.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

                          return (
                            <div key={slideIdx} className="slide-group">
                              <Link to={`/obra/${getSlug(first)}`} className="recommended-card" style={{ textDecoration: 'none' }}>
                                <img src={getImageUrl(first)} alt={first.obr_nome} className="rec-cover" />
                                <div className="rec-info">
                                  {worksRatings[first.obr_id] && worksRatings[first.obr_id].average > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FFD700', fontSize: '0.75rem', marginBottom: '6px' }}>
                                      <MdStar size={14} />
                                      <span style={{ fontWeight: 600 }}>{worksRatings[first.obr_id].average.toFixed(1)}</span>
                                    </div>
                                  )}
                                  <h3>{first.obr_nome}</h3>
                                  <p className="rec-desc">{first.obr_descricao}</p>
                                  <div className="rec-tags">
                                    {(first.tags || []).slice(0, 3).map(tag => (
                                      <span key={tag.tag_id} className="tag-badge">{tag.tag_nome}</span>
                                    ))}
                                  </div>
                                </div>
                              </Link>

                              {second && (
                                <Link to={`/obra/${getSlug(second)}`} className="recommended-card" style={{ textDecoration: 'none' }}>
                                  <img src={getImageUrl(second)} alt={second.obr_nome} className="rec-cover" />
                                  <div className="rec-info">
                                    {worksRatings[second.obr_id] && worksRatings[second.obr_id].average > 0 && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FFD700', fontSize: '0.75rem', marginBottom: '6px' }}>
                                        <MdStar size={14} />
                                        <span style={{ fontWeight: 600 }}>{worksRatings[second.obr_id].average.toFixed(1)}</span>
                                      </div>
                                    )}
                                    <h3>{second.obr_nome}</h3>
                                    <p className="rec-desc">{second.obr_descricao}</p>
                                    <div className="rec-tags">
                                      {(second.tags || []).slice(0, 3).map(tag => (
                                        <span key={tag.tag_id} className="tag-badge">{tag.tag_nome}</span>
                                      ))}
                                    </div>
                                  </div>
                                </Link>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      <div className="slider-dots">
                        {Array.from({ length: Math.ceil(recommendedObras.length / 2) }).map((_, idx) => (
                          <button
                            key={idx}
                            className={`slider-dot ${idx === sliderIndex ? 'active' : ''}`}
                            onClick={() => handleManualSlide(idx)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="section-header-title">
                <h2>Atualizadas</h2>
              </div>

              <div className="genre-buttons">
                <button
                  className={`genre-btn ${selectedGenre === 1 ? 'active' : ''}`}
                  onClick={() => handleGenreChange(1)}
                >
                  Webtoon
                </button>
                <button
                  className={`genre-btn ${selectedGenre === 4 ? 'active' : ''}`}
                  onClick={() => handleGenreChange(4)}
                >
                  Shoujo
                </button>
              </div>

              <div className="releases-grid">
                {obras.map((obra, index) => {
                  const cardContent = (
                    <>
                      <div className="release-cover-wrapper">
                        <img
                          src={getImageUrl(obra)}
                          alt={obra.obr_nome}
                          className="release-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="release-info">
                        {worksRatings[obra.obr_id] && worksRatings[obra.obr_id].average > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FFD700', fontSize: '0.75rem', marginBottom: '6px' }}>
                            <MdStar size={14} />
                            <span style={{ fontWeight: 600 }}>{worksRatings[obra.obr_id].average.toFixed(1)}</span>
                          </div>
                        )}
                        <h3>{obra.obr_nome}</h3>
                      </div>
                    </>
                  )

                  if (obras.length === index + 1) {
                    return (
                      <a
                        href={`/obra/${obra.obr_slug}`}
                        ref={lastObraRef}
                        key={obra.obr_id}
                        className="release-card"
                      >
                        {cardContent}
                      </a>
                    )
                  } else {
                    return (
                      <a
                        href={`/obra/${obra.obr_slug}`}
                        key={obra.obr_id}
                        className="release-card"
                      >
                        {cardContent}
                      </a>
                    )
                  }
                })}

                {/* Skeletons for initial loading or loading more */}
                {loading && (
                  <>
                    {Array.from({ length: page === 1 ? 12 : 6 }).map((_, idx) => (
                      <div key={`skel-${idx}`} className="release-card skeleton-card">
                        <div className="release-cover-wrapper skeleton"></div>
                        <div className="release-info">
                          <div className="skeleton" style={{ height: '1rem', width: '80%', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {activeSection === 'todas-obras' && (
            <div className="section works-section">
              {/* Hero Banner */}
              <div className="hero-banner-custom">
                <div className="hero-content">
                  <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    {loadingAllWorks && allWorksTotal === 0 ? '...' : allWorksTotal} obras no catálogo
                    <MdArrowDownward size={22} />
                  </h2>
                </div>
              </div>


              {/* Recommended Slider Section */}
              {(loadingTrending || trendingObras.length > 0) && (
                <div className="recommended-section trending-section">
                  <div className="section-header-title">
                    <h2>Em Alta</h2>
                  </div>

                  {loadingTrending ? (
                    <div className="slider-container">
                      <div className="slider-track" style={{ transform: 'translateX(0)' }}>
                        <div className="slide-group">
                          <div className="recommended-card skeleton-card">
                            <div className="rec-cover skeleton"></div>
                            <div className="rec-info">
                              <div className="skeleton skeleton-title" style={{ marginBottom: '0.5rem' }}></div>
                              <div className="skeleton skeleton-desc"></div>
                              <div className="skeleton skeleton-desc" style={{ width: '60%' }}></div>
                              <div className="skeleton skeleton-tag-row"></div>
                            </div>
                          </div>
                          <div className="recommended-card skeleton-card">
                            <div className="rec-cover skeleton"></div>
                            <div className="rec-info">
                              <div className="skeleton skeleton-title" style={{ marginBottom: '0.5rem' }}></div>
                              <div className="skeleton skeleton-desc"></div>
                              <div className="skeleton skeleton-desc" style={{ width: '60%' }}></div>
                              <div className="skeleton skeleton-tag-row"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="slider-container">
                      <div
                        className="slider-track"
                        style={{ transform: `translateX(-${sliderIndex * 100}%)` }}
                      >
                        {Array.from({ length: Math.ceil(trendingObras.length / 2) }).map((_, slideIdx) => {
                          const first = trendingObras[slideIdx * 2]
                          const second = trendingObras[slideIdx * 2 + 1]

                          const getSlug = (obra: any) => obra.obr_slug || obra.slug || obra.obr_nome.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

                          return (
                            <div key={slideIdx} className="slide-group">
                              <Link to={`/obra/${getSlug(first)}`} className="recommended-card" style={{ textDecoration: 'none' }}>
                                <img src={getImageUrl(first)} alt={first.obr_nome} className="rec-cover" />
                                <div className="rec-info">
                                  {worksRatings[first.obr_id] && worksRatings[first.obr_id].average > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FFD700', fontSize: '0.75rem', marginBottom: '6px' }}>
                                      <MdStar size={14} />
                                      <span style={{ fontWeight: 600 }}>{worksRatings[first.obr_id].average.toFixed(1)}</span>
                                    </div>
                                  )}
                                  <h3>{first.obr_nome}</h3>
                                  <p className="rec-desc">{first.obr_descricao}</p>
                                  <div className="rec-tags">
                                    {(first.tags || []).slice(0, 3).map(tag => (
                                      <span key={tag.tag_id} className="tag-badge">{tag.tag_nome}</span>
                                    ))}
                                  </div>
                                </div>
                              </Link>

                              {second && (
                                <Link to={`/obra/${getSlug(second)}`} className="recommended-card" style={{ textDecoration: 'none' }}>
                                  <img src={getImageUrl(second)} alt={second.obr_nome} className="rec-cover" />
                                  <div className="rec-info">
                                    {worksRatings[second.obr_id] && worksRatings[second.obr_id].average > 0 && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FFD700', fontSize: '0.75rem', marginBottom: '6px' }}>
                                        <MdStar size={14} />
                                        <span style={{ fontWeight: 600 }}>{worksRatings[second.obr_id].average.toFixed(1)}</span>
                                      </div>
                                    )}
                                    <h3>{second.obr_nome}</h3>
                                    <p className="rec-desc">{second.obr_descricao}</p>
                                    <div className="rec-tags">
                                      {(second.tags || []).slice(0, 3).map(tag => (
                                        <span key={tag.tag_id} className="tag-badge">{tag.tag_nome}</span>
                                      ))}
                                    </div>
                                  </div>
                                </Link>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      <div className="slider-dots">
                        {Array.from({ length: Math.ceil(trendingObras.length / 2) }).map((_, idx) => (
                          <button
                            key={idx}
                            className={`slider-dot ${idx === sliderIndex ? 'active' : ''}`}
                            onClick={() => handleManualSlide(idx)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="genre-buttons">
                <button
                  className={`genre-btn ${allWorksGenre === 1 ? 'active' : ''}`}
                  onClick={() => handleAllWorksGenreChange(1)}
                >
                  Webtoon
                </button>
                <button
                  className={`genre-btn ${allWorksGenre === 4 ? 'active' : ''}`}
                  onClick={() => handleAllWorksGenreChange(4)}
                >
                  Shoujo
                </button>

                {/* Filter Dropdowns Container */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center', flex: isMobile && showSearchDrawer ? 1 : 'unset' }}>
                  {isMobile && showSearchDrawer ? (
                    <div className="mobile-search-expand">
                      <MdSearch size={22} style={{ color: 'rgba(255,255,255,0.7)', marginRight: '0.5rem' }} />
                      <input
                        type="text"
                        placeholder="Pesquisar..."
                        className="mobile-search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                      />
                      <button onClick={() => {
                        setShowSearchDrawer(false)
                        setSearchTerm('')
                      }} className="mobile-search-close">
                        <MdClose size={22} />
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Search Button */}
                      {isMobile && (
                        <button
                          className="tags-dropdown-trigger"
                          onClick={() => setShowSearchDrawer(true)}
                        >
                          <MdSearch size={20} />
                        </button>
                      )}

                      {/* Tags Dropdown */}
                      <div className="tags-dropdown-wrapper" style={{ position: 'relative' }}>
                        <button
                          className={`tags-dropdown-trigger ${showTagsDropdown ? 'open' : ''}`}
                          onClick={() => {
                            if (isMobile) {
                              setShowTagsDrawer(true)
                            } else {
                              setShowTagsDropdown(!showTagsDropdown)
                              setShowStatusDropdown(false)
                            }
                          }}
                        >
                          <MdLocalOffer size={20} />
                          {selectedTags.length > 0 && (
                            <span className="tag-count">{selectedTags.length}</span>
                          )}
                        </button>

                        {showTagsDropdown && (
                          <div className="tags-dropdown">
                            <div className="tags-dropdown-header">
                              <span>Filtrar por tags</span>
                              {selectedTags.length > 0 && (
                                <button
                                  className="clear-tags-btn"
                                  onClick={() => {
                                    setSelectedTags([])
                                    setAllWorks([])
                                    setAllWorksPage(1)
                                    setAllWorksHasMore(true)
                                  }}
                                >
                                  Limpar
                                </button>
                              )}
                            </div>
                            <div className="tags-dropdown-content">
                              {availableTags.map(tag => (
                                <button
                                  key={tag.tag_id}
                                  onClick={() => handleTagToggle(tag.tag_id)}
                                  className={`tag-filter-btn ${selectedTags.includes(tag.tag_id) ? 'active' : ''}`}
                                >
                                  {tag.tag_nome}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status Dropdown */}
                      <div className="tags-dropdown-wrapper" style={{ position: 'relative' }}>
                        <button
                          className={`tags-dropdown-trigger ${showStatusDropdown ? 'open' : ''}`}
                          onClick={() => {
                            if (isMobile) {
                              setShowStatusDrawer(true)
                            } else {
                              setShowStatusDropdown(!showStatusDropdown)
                              setShowTagsDropdown(false)
                            }
                          }}
                        >
                          <MdCheckCircle size={20} />
                          {selectedStatus !== null && (
                            <span className="tag-count">1</span>
                          )}
                        </button>

                        {showStatusDropdown && (
                          <div className="tags-dropdown">
                            <div className="tags-dropdown-header">
                              <span>Filtrar por situação</span>
                              {selectedStatus !== null && (
                                <button
                                  className="clear-tags-btn"
                                  onClick={() => handleStatusSelect(null)}
                                >
                                  Limpar
                                </button>
                              )}
                            </div>
                            <div className="tags-dropdown-content">
                              {availableStatuses.map(status => (
                                <button
                                  key={status.stt_id}
                                  onClick={() => handleStatusSelect(status.stt_id)}
                                  className={`tag-filter-btn ${selectedStatus === status.stt_id ? 'active' : ''}`}
                                >
                                  {status.stt_nome}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {!isMobile && (
                  <div className="search-input-wrapper">
                    <MdSearch size={20} style={{ color: 'rgba(255,255,255,0.5)' }} />
                    <input
                      type="text"
                      placeholder="Pesquisar obras..."
                      className="search-input"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="releases-grid">
                {allWorks.length > 0 ? (
                  allWorks.map((obra, index) => {
                    const isLast = allWorks.length === index + 1
                    return (
                      <a
                        href={`/obra/${obra.obr_slug}`}
                        key={obra.obr_id}
                        className="release-card"
                        ref={isLast ? lastAllWorkRef : null}
                      >
                        <div className="release-cover-wrapper">
                          <img
                            src={getImageUrl(obra)}
                            alt={obra.obr_nome}
                            className="release-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="release-info">
                          {worksRatings[obra.obr_id] && worksRatings[obra.obr_id].average > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FFD700', fontSize: '0.75rem', marginBottom: '6px' }}>
                              <MdStar size={14} />
                              <span style={{ fontWeight: 600 }}>{worksRatings[obra.obr_id].average.toFixed(1)}</span>
                            </div>
                          )}
                          <h3>{obra.obr_nome}</h3>
                        </div>
                      </a>
                    )
                  })
                ) : (
                  !loadingAllWorks && (
                    <div className="no-works-found">
                      <div className="no-works-icon-wrapper">
                        <MdMenuBook size={48} style={{ opacity: 0.5 }} />
                        <MdCancel size={24} color="#e53e3e" style={{ position: 'absolute', bottom: -5, right: -5, backgroundColor: '#000', borderRadius: '50%' }} />
                      </div>
                      <p className="no-works-text">Nenhuma obra foi encontrada!</p>
                    </div>
                  )
                )}

                {loadingAllWorks && (
                  <>
                    {Array.from({ length: allWorksPage === 1 ? 12 : 6 }).map((_, idx) => (
                      <div key={`skel-all-${idx}`} className="release-card skeleton-card">
                        <div className="release-cover-wrapper skeleton"></div>
                        <div className="release-info">
                          <div className="skeleton" style={{ height: '1rem', width: '80%', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}


          {activeSection === 'obra-detalhe' && !is404 && (
            <div className="section obra-detalhe-section">
              {loadingObra && (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#fff' }}>
                  Carregando obra...
                </div>
              )}

              {!loadingObra && currentObra && (
                <div className="obra-container" style={{ maxWidth: '600px', margin: '0 auto' }}>

                  {/* Conteudo Principal */}

                  {/* Header: Capa (Esq) e Info (Dir) */}
                  <div className="obra-header" style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

                    {/* Capa */}
                    <img
                      src={getImageUrl(currentObra)}
                      alt={currentObra.obr_nome}
                      className="obra-cover"
                      style={{
                        width: '100%',
                        borderRadius: '2px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                        aspectRatio: '2/3',
                        objectFit: 'cover'
                      }}
                    />

                    {/* Info */}
                    <div className="obra-info-col" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h1 className="obra-title-main" style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', lineHeight: 1.2 }}>{currentObra.obr_nome}</h1>

                      <div className="obra-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                        {averageRating !== null && (
                          <span style={{ color: '#ffd700', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                            {averageRating.toFixed(1)} <MdStar size={14} />
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400, marginLeft: '4px', fontSize: '0.75rem', }}>
                              {totalRatings} {totalRatings === 1 ? 'avaliação' : 'avaliações'}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  {user && (
                    <div className="obra-actions-bar" style={{ display: 'flex', width: '100%', marginBottom: '2rem', justifyContent: 'space-between' }}>
                      <button
                        className="sidebar-nav-btn"
                        title="Ler Agora"
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', padding: '0', background: 'none', border: 'none', height: 'auto', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                      >
                        <MdPlayArrow size={18} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Iniciar</span>
                      </button>

                      {/* Botão Avaliar com Dropdown */}
                      <div style={{ flex: 1, position: 'relative' }}>
                        <button
                          className="sidebar-nav-btn"
                          title="Avaliar"
                          onClick={() => setShowRatingDropdown(!showRatingDropdown)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0',
                            background: 'none',
                            border: 'none',
                            height: 'auto',
                            color: userRating ? '#FFD700' : 'rgba(255,255,255,0.7)',
                            cursor: 'pointer'
                          }}
                        >
                          {userRating ? <MdStar size={18} /> : <MdStarBorder size={18} />}
                          <span style={{ fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{userRating ? `${userRating}/5` : 'Avaliar'}</span>
                        </button>

                        {showRatingDropdown && (
                          <>
                            <div
                              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
                              onClick={() => setShowRatingDropdown(false)}
                            />
                            <div style={{
                              position: 'absolute',
                              bottom: '100%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              marginBottom: '10px',
                              background: '#000',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '0px',
                              padding: '0.5rem 0.8rem',
                              display: 'flex',
                              gap: '0.2rem',
                              zIndex: 20,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                              whiteSpace: 'nowrap'
                            }}
                              onMouseLeave={() => setHoverRating(null)}
                            >
                              {[1, 2, 3, 4, 5].map((star) => (
                                <MdStar
                                  key={star}
                                  size={20}
                                  style={{
                                    cursor: 'pointer',
                                    color: (hoverRating ? star <= hoverRating : (userRating && star <= userRating)) ? '#FFD700' : 'rgba(255,255,255,0.2)',
                                    transition: 'color 0.1s, transform 0.1s',
                                    transform: hoverRating === star ? 'scale(1.1)' : 'scale(1)'
                                  }}
                                  onClick={() => handleRate(star)}
                                  onMouseEnter={() => setHoverRating(star)}
                                />
                              ))}
                            </div>

                            {/* Seta do Dropdown */}
                            <div style={{
                              position: 'absolute',
                              bottom: '100%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              marginBottom: '4px',
                              width: 0,
                              height: 0,
                              borderLeft: '6px solid transparent',
                              borderRight: '6px solid transparent',
                              borderTop: '6px solid #1a1a1a',
                              zIndex: 20
                            }} />
                          </>
                        )}
                      </div>

                      <button
                        className="sidebar-nav-btn"
                        title="Favoritar"
                        onClick={toggleFavorite}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', padding: '0', background: 'none', border: 'none', height: 'auto', color: isFavorited ? 'rgba(255, 255, 255, 0.6);' : 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                      >
                        {isFavorited ? <MdFavorite size={18} /> : <MdFavoriteBorder size={18} />}
                        <span style={{ fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{isFavorited ? 'Favoritada' : 'Favoritar'}</span>
                      </button>

                      <button
                        className="sidebar-nav-btn"
                        title="Copiar Link"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href)
                          setLinkCopied(true)
                          setTimeout(() => setLinkCopied(false), 2000)
                        }}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', padding: '0', background: 'none', border: 'none', height: 'auto', color: linkCopied ? '#4CAF50' : 'rgba(255,255,255,0.7)', transition: 'all 0.2s', cursor: 'pointer' }}
                      >
                        {linkCopied ? <MdCheck size={18} /> : <MdContentCopy size={18} />}
                        <span style={{ fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{linkCopied ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  )}

                  {/* Tabs Navigation */}
                  <div className="obra-tabs" style={{ display: 'flex', gap: '0rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
                    <button
                      onClick={() => setObraTab('info')}
                      style={{ padding: '0.8rem 1.5rem', background: 'none', border: 'none', outline: 'none', color: obraTab === 'info' ? '#fff' : 'rgba(255,255,255,0.5)', borderBottom: obraTab === 'info' ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 400, borderRadius: '0px', transition: 'all 0.2s', letterSpacing: '0.5px' }}
                    >
                      Informações
                    </button>
                    <button
                      onClick={() => setObraTab('chapters')}
                      style={{ padding: '0.8rem 1.5rem', background: 'none', border: 'none', outline: 'none', color: obraTab === 'chapters' ? '#fff' : 'rgba(255,255,255,0.5)', borderBottom: obraTab === 'chapters' ? '2px solid #fff' : '1px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 400, borderRadius: '0px', transition: 'all 0.2s', letterSpacing: '0.5px' }}
                    >
                      Capítulos
                      <span style={{
                        marginLeft: '8px',
                        background: 'rgba(255,255,255,0.1)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.9)'
                      }}>
                        {currentObra.capitulos?.length || 0}
                      </span>
                    </button>
                  </div>

                  {/* Tab Info */}
                  {obraTab === 'info' && (
                    <div className="obra-desc-box" style={{ animation: 'fadeIn 0.3s ease' }}>
                      <p className="obra-desc" style={{ lineHeight: '1.8', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 400, whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>{currentObra.obr_descricao?.trim()}</p>

                      {/* Tags */}
                      {currentObra.tags && currentObra.tags.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tags</h3>
                          <div className="obra-tags-container">
                            {currentObra.tags.map((tag: any) => (
                              <span
                                key={tag.tag_id}
                                className="tag-badge"
                                style={{
                                  background: 'rgba(255,255,255,0.0)',
                                  color: 'rgba(255,255,255,0.8)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '1px',
                                  fontSize: '0.75rem',
                                  fontWeight: 400,
                                }}
                              >
                                {tag.tag_nome}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Estatísticas */}
                      <div className="obra-stats-section" style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estatísticas</h3>

                        <div className="stats-summary-container" style={{
                          display: 'flex',
                          gap: '2.5rem',
                          marginBottom: '2rem',
                          alignItems: 'center',
                          flexWrap: 'wrap'
                        }}>
                          {/* Left Side: Summary */}
                          <div style={{ textAlign: 'center', minWidth: '100px' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 400, color: '#fff', lineHeight: 1, marginBottom: '0.5rem' }}>
                              {averageRating ? averageRating.toFixed(1).replace('.', ',') : '0,0'}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', color: 'rgb(255, 215, 0)', marginBottom: '0.5rem' }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <MdStar key={star} size={16} style={{ color: averageRating && star <= Math.round(averageRating) ? 'rgb(255, 215, 0)' : 'rgba(255,255,255,0.1)' }} />
                              ))}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                              {totalRatings.toLocaleString('pt-BR')} {totalRatings === 1 ? 'avaliação' : 'avaliações'}
                            </div>
                          </div>

                          {/* Right Side: Bars */}
                          <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {[5, 4, 3, 2, 1].map((star) => {
                              const count = ratingDistribution[star] || 0
                              const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0
                              return (
                                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', width: '10px' }}>{star}</span>
                                  <div style={{
                                    flex: 1,
                                    height: '6px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '1px',
                                    overflow: 'hidden'
                                  }}>
                                    <div style={{
                                      width: `${percentage}%`,
                                      height: '100%',
                                      background: 'rgb(255, 215, 0)',
                                      borderRadius: '1px',
                                      transition: 'width 0.5s ease-in-out'
                                    }} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Lista de Avaliações */}
                        <div className="ratings-list-container" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avaliações dos leitores</h3>

                          {obraRatingsList.length > 0 ? (
                            obraRatingsList.map((rate, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '0.5rem 0',
                                borderBottom: idx === obraRatingsList.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)'
                              }}>
                                <img
                                  src={rate.profiles?.avatar_url || 'https://via.placeholder.com/40'}
                                  alt={rate.profiles?.full_name || 'Usuário'}
                                  style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 400 }}>
                                    {rate.profiles?.full_name || `Leitor #${rate.user_id?.slice(0, 5)}`}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'rgb(255, 215, 0)', marginTop: '2px' }}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <MdStar key={s} size={12} style={{ color: s <= rate.rating ? 'rgb(255, 215, 0)' : 'rgba(255,255,255,0.1)' }} />
                                    ))}
                                  </div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textTransform: 'lowercase' }}>
                                  {formatRelativeTime(rate.updated_at || rate.created_at)}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="no-works-found" style={{ padding: '2rem 1rem' }}>
                              <div className="no-works-icon-wrapper" style={{ marginBottom: '0.8rem' }}>
                                <MdStarBorder size={48} style={{ opacity: 0.5 }} />
                                <MdCancel size={24} color="#e53e3e" style={{ position: 'absolute', bottom: -5, right: -5, backgroundColor: '#000', borderRadius: '50%' }} />
                              </div>
                              <p className="no-works-text" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Ainda não há avaliações para esta obra.</p>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Tab Chapters */}
                  {obraTab === 'chapters' && (
                    <div className="capitulos-list" style={{ animation: 'fadeIn 0.3s ease' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <button
                          onClick={() => setChaptersOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                          style={{
                            background: 'none',
                            border: 'none',
                            outline: 'none',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'rgba(255,255,255,0.8)',
                            cursor: 'pointer',
                            transition: 'color 0.2s'
                          }}
                          title={chaptersOrder === 'asc' ? 'Menor para maior' : 'Maior para menor'}
                        >
                          {chaptersOrder === 'asc' ? <MdArrowDownward size={24} /> : <MdArrowUpward size={24} />}
                        </button>
                      </div>

                      <div className="chapters-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {displayedChapters.map((cap: any) => (
                          <a href="#" key={cap.cap_id} className="chapter-item" style={{
                            background: 'none',
                            padding: '0.8rem 0',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '0.2rem',
                            textDecoration: 'none',
                            color: '#fff',
                            transition: 'opacity 0.2s',
                          }}>
                            <span className="chapter-num" style={{ fontWeight: 400, fontSize: '0.9rem' }}>Capítulo {cap.cap_numero}</span>
                            <span className="chapter-date" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'lowercase' }}>{formatRelativeTime(cap.cap_criado_em)}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {activeSection === 'entrar' && (
            <div className="section login-section">
              <div className="login-container">
                <h1>Entrar</h1>
                <p>Bem-vindo de volta!</p>
                <form className="login-form" onSubmit={(e) => e.preventDefault()}>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" placeholder="seu@email.com" />
                  </div>
                  <div className="form-group">
                    <label>Senha</label>
                    <input type="password" placeholder="********" />
                  </div>
                  <button type="submit" className="cta-button full-width">Entrar</button>
                </form>
              </div>
            </div>
          )}

          {is404 && (
            <NotFoundContent />
          )}
        </div>
      </main >

      {activeSection !== 'obra-detalhe' && (
        <nav className="mobile-bottom-nav">
          <Link
            to="/"
            className={activeSection === 'inicio' ? 'active' : ''}
          >
            <MdHome size={24} />
            <span>Início</span>
          </Link>
          <Link
            to="/obras"
            className={activeSection === 'todas-obras' ? 'active' : ''}
          >
            <MdLibraryBooks size={24} />
            <span>Todas</span>
          </Link>
          {!user ? (
            <button
              className={activeSection === 'entrar' ? 'active' : ''}
              onClick={handleLoginClick}
            >
              <MdLogin size={24} />
              <span>Entrar</span>
            </button>
          ) : (
            <Link
              to="/perfil"
              className={activeSection === 'perfil' ? 'active' : ''}
              onClick={() => { /* Optional: Prevent or handle if no route yet */ }}
            >
              <img
                src={user.user_metadata?.avatar_url || 'https://via.placeholder.com/24'}
                alt="Você"
                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <span>Você</span>
            </Link>
          )}
        </nav>
      )}

      {/* Login Modal */}
      {
        showLoginModal && (
          <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowLoginModal(false)}>
                <MdClose size={24} />
              </button>
              <div className="modal-header">
                <h2>Bem-vindo!</h2>
                <p>Escolha um dos provedores abaixo para entrar!</p>
              </div>
              <div className="modal-body">
                <button className="social-login-btn google-btn" onClick={handleGoogleLogin} disabled={isLoggingIn}>
                  <FcGoogle size={24} />
                  <span>{isLoggingIn ? 'Conectando...' : 'Continuar com Google'}</span>
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Mobile Login Drawer */}
      <Drawer.Root open={showMobileDrawer} onOpenChange={setShowMobileDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="drawer-overlay" />
          <Drawer.Content className="drawer-content">
            <div className="drawer-handle-wrapper">
              <div className="drawer-handle" />
            </div>
            <div className="drawer-header">
              <h2>Bem-vindo!</h2>
              <p>Escolha um dos provedores abaixo para entrar!</p>
            </div>
            <div className="drawer-body">
              <button className="social-login-btn google-btn" onClick={handleGoogleLogin}>
                <FcGoogle size={24} />
                <span>Continuar com Google</span>
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Tags Filter Drawer */}
      <Drawer.Root open={showTagsDrawer} onOpenChange={setShowTagsDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="drawer-overlay" />
          <Drawer.Content className="drawer-content">
            <div className="drawer-handle-wrapper">
              <div className="drawer-handle" />
            </div>
            <div className="drawer-header">
              <h2>Filtrar por Tags</h2>

            </div>
            <div className="drawer-body">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {availableTags.map(tag => (
                  <button
                    key={tag.tag_id}
                    onClick={() => handleTagToggle(tag.tag_id)}
                    className={`tag-filter-btn ${selectedTags.includes(tag.tag_id) ? 'active' : ''}`}
                  >
                    {tag.tag_nome}
                  </button>
                ))}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Status Filter Drawer */}
      <Drawer.Root open={showStatusDrawer} onOpenChange={setShowStatusDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="drawer-overlay" />
          <Drawer.Content className="drawer-content">
            <div className="drawer-handle-wrapper">
              <div className="drawer-handle" />
            </div>
            <div className="drawer-header">
              <h2>Filtrar por Situação</h2>
              {selectedStatus !== null && (
                <button
                  className="clear-tags-btn"
                  onClick={() => handleStatusSelect(null)}
                  style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
                >
                  Limpar seleção
                </button>
              )}
            </div>
            <div className="drawer-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {availableStatuses.map(status => (
                  <button
                    key={status.stt_id}
                    onClick={() => {
                      handleStatusSelect(status.stt_id)
                      setShowStatusDrawer(false)
                    }}
                    className={`tag-filter-btn ${selectedStatus === status.stt_id ? 'active' : ''}`}
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    {status.stt_nome}
                  </button>
                ))}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>


    </div >
  )
}

export default App
