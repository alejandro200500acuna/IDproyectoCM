import { Outlet, Link, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    GraduationCap,
    Users,
    Shield,
    CreditCard,
    Settings,
    LogOut,
    Search,
    Bell,
    HelpCircle,
    ChevronDown,
    Menu,
    IdCard
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import { useState, useEffect } from 'react'

export default function DashboardLayout() {
    const { signOut, user } = useAuth()
    const location = useLocation()
    const [title, setTitle] = useState('Schooltec')

    useEffect(() => {
        // Load from localStorage first to prevent flickering
        const savedTitle = localStorage.getItem('site_sidebar_title')
        if (savedTitle) setTitle(savedTitle)

        // Then fetch fresh data
        fetchTitle()
    }, [])

    const fetchTitle = async () => {
        try {
            const { data } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'sidebar_title')
                .maybeSingle()

            if (data?.value) {
                setTitle(data.value)
                localStorage.setItem('site_sidebar_title', data.value)
            }
        } catch (error) {
            console.error('Error fetching title:', error)
        }
    }

    const isActive = (path) => {
        return location.pathname === path ? 'active' : ''
    }

    return (
        <div className="min-h-screen bg-[#f1f5f9] font-sans">
            {/* FLOATING SIDEBAR */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white backdrop-blur-sm">
                            <GraduationCap size={20} />
                        </div>
                        <h2 className="text-white font-bold text-xl tracking-tight">{title}</h2>
                    </div>
                </div>

                <nav className="nav-section custom-scrollbar mt-4">
                    <Link to="/" className={`nav-item ${isActive('/')}`}>
                        <LayoutDashboard size={20} />
                        <span>Inicio</span>
                    </Link>
                    <Link to="/students" className={`nav-item ${isActive('/students')}`}>
                        <Users size={20} />
                        <span>Estudiantes</span>
                    </Link>
                    <Link to="/parents" className={`nav-item ${isActive('/parents')}`}>
                        <Users size={20} />
                        <span>Padres</span>
                    </Link>
                    <Link to="/courses" className={`nav-item ${isActive('/courses')}`}>
                        <GraduationCap size={20} />
                        <span>Cursos</span>
                    </Link>
                    <Link to="/teachers" className={`nav-item ${isActive('/teachers')}`}>
                        <Shield size={20} />
                        <span>Profesores</span>
                    </Link>
                    <Link to="/attendance" className={`nav-item ${isActive('/attendance')}`}>
                        <Users size={20} />
                        <span>Asistencia</span>
                    </Link>
                    <Link to="/site-editor" className={`nav-item ${isActive('/site-editor')}`}>
                        <LayoutDashboard size={20} />
                        <span>Editor Sitio</span>
                    </Link>
                    <Link to="/designer" className={`nav-item ${isActive('/designer')}`}>
                        <IdCard size={20} />
                        <span>Diseñador de Carnet</span>
                    </Link>
                    <Link to="/settings" className={`nav-item ${isActive('/settings')}`}>
                        <Settings size={20} />
                        <span>Ajustes</span>
                    </Link>
                    <Link to="/profile" className={`nav-item ${isActive('/profile')}`}>
                        <Users size={20} />
                        <span>Ajustes de Perfil</span>
                    </Link>
                </nav>

                <div className="px-4 pb-4">
                    <button
                        onClick={signOut}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-rose-600 font-bold rounded-full shadow-lg hover:bg-rose-500 hover:text-white transition-all duration-200 transform hover:scale-[1.02]"
                    >
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>

                {/* UPGRADE CARD / REQUEST ADMIN */}
                <div className="sidebar-premium-card mx-4 mb-6 !mt-2">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 text-white backdrop-blur-md">
                        <Shield size={20} />
                    </div>
                    <h4 className="text-white font-bold text-sm mb-1">Solicitar Acceso</h4>
                    <button className="bg-white text-[var(--primary-color)] text-xs font-bold px-4 py-2 rounded-full mt-2 w-full shadow-lg hover:shadow-xl transition-all">
                        Ser Admin &rarr;
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT WRAPPER */}
            <div className="main-wrapper">
                {/* Header */}
                <header className="flex items-center justify-between mb-8 pt-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {(() => {
                                const path = location.pathname.substring(1)
                                const validPaths = {
                                    '': 'Inicio',
                                    'students': 'Estudiantes',
                                    'parents': 'Padres',
                                    'courses': 'Cursos',
                                    'teachers': 'Profesores',
                                    'attendance': 'Asistencia',
                                    'designer': 'Diseñador de Carnet',
                                    'settings': 'Ajustes',
                                    'profile': 'Ajustes de Perfil'
                                }
                                return validPaths[path] || 'Inicio'
                            })()}
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Search Bar */}
                        <div className="relative hidden md:block group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar estudiantes/profesores..."
                                className="pl-10 pr-4 py-2 bg-white rounded-full w-64 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm text-gray-600"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="relative p-2 rounded-full bg-white text-gray-400 hover:text-[var(--primary-color)] transition-all shadow-sm">
                                <Bell size={20} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                            </button>

                            <div className="flex items-center gap-3 pl-2">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="fade-in">
                    <Outlet />
                </div>
            </div>
        </div >
    )
}
