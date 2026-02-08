import { MdArrowBack } from 'react-icons/md'
import './NotFound.css'

function NotFound() {
    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <div className="not-found-code">404</div>
                <h1 className="not-found-title">Página não encontrada!</h1>
                <p className="not-found-description">
                    Ops! A página que você está procurando não existe ou foi movida.
                </p>
                <div className="not-found-actions">
                    <button onClick={() => window.history.back()} className="not-found-btn primary">
                        <MdArrowBack size={20} />
                        Voltar
                    </button>
                </div>
            </div>
            <div className="not-found-decoration">
                <div className="floating-circle circle-1"></div>
                <div className="floating-circle circle-2"></div>
                <div className="floating-circle circle-3"></div>
            </div>
        </div>
    )
}

export default NotFound
