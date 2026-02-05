import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import { User, Lock, Eye, EyeOff, Shield, Users, GraduationCap, Fingerprint } from 'lucide-react'

export default function Login() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [role, setRole] = useState('admin') // admin, parent, student
    const [showPassword, setShowPassword] = useState(false)

    const { signIn } = useAuth()
    const navigate = useNavigate()

    const [rememberMe, setRememberMe] = useState(false)

    useEffect(() => {
        const rememberedEmail = localStorage.getItem('remembered_email')
        if (rememberedEmail) {
            setEmail(rememberedEmail)
            setRememberMe(true)
        }
    }, [])

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (rememberMe) {
                localStorage.setItem('remembered_email', email)
            } else {
                localStorage.removeItem('remembered_email')
            }

            if (role === 'student') {
                // Student Login Implementation via RPC
                const { data, error } = await supabase
                    .rpc('student_login', {
                        p_cedula: email,
                        p_password: password
                    })
                    .single()

                if (error || !data) throw new Error('Credenciales inválidas')

                const studentData = {
                    ...data,
                    grades: { name: data.grade_name }
                }

                localStorage.setItem('student_user', JSON.stringify(studentData))
                navigate('/student-portal')

            } else if (role === 'parent') {
                // Parent Login Implementation via RPC (Cedula + Password stored in DB)
                const { data, error } = await supabase
                    .rpc('parent_login', {
                        p_cedula: email,
                        p_password: password
                    })
                    .single()

                if (error || !data) throw new Error('Credenciales inválidas o padre no encontrado')

                // Manually store parent session
                localStorage.setItem('parent_user', JSON.stringify(data))
                navigate('/parent-portal')

            } else {
                // Admin Login via Supabase Auth
                const { error } = await signIn({ email, password })
                if (error) throw error
                navigate('/')
            }
        } catch (error) {
            console.error(error)
            setError(error.message || 'Error al iniciar sesión')
        } finally {
            setLoading(false)
        }
    }

    const getRoleIcon = () => {
        switch (role) {
            case 'admin': return <Shield size={32} />
            case 'parent': return <Users size={32} />
            case 'student': return <GraduationCap size={32} />
            default: return <User size={32} />
        }
    }

    const getRoleTitle = () => {
        switch (role) {
            case 'admin': return 'Administrador'
            case 'parent': return 'Padre de Familia'
            case 'student': return 'Estudiante'
            default: return 'Login'
        }
    }

    return (
        <div className="login-container">
            {/* Organic Background Blobs */}
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>

            {/* School Logo - Watermark/Relief Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none select-none opacity-25 mix-blend-multiply transform scale-150">
                <img src="/school-logo.png" alt="Carmen Lyra School" className="w-[500px] md:w-[700px] object-contain drop-shadow-2xl grayscale-[0.3]" />
            </div>

            {/* Glassmorphism Card */}
            <div className="glass-card">
                {/* Hexagon / Icon Container */}
                <div className="hex-wrapper">
                    <div className="hex-bg">
                        <div className="hex-icon">
                            {getRoleIcon()}
                        </div>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Bienvenido</h2>
                    <p className="text-gray-600 font-medium">{getRoleTitle()}</p>
                </div>

                {/* Role Selector */}
                <div className="flex justify-center gap-4 mb-8">
                    <button
                        onClick={() => setRole('admin')}
                        className={`role-btn admin ${role === 'admin' ? 'active' : ''}`}
                        title="Administrador"
                    >
                        <Shield size={24} />
                    </button>
                    <button
                        onClick={() => setRole('parent')}
                        className={`role-btn parent ${role === 'parent' ? 'active' : ''}`}
                        title="Padre"
                    >
                        <Users size={24} />
                    </button>
                    <button
                        onClick={() => setRole('student')}
                        className={`role-btn student ${role === 'student' ? 'active' : ''}`}
                        title="Estudiante"
                    >
                        <GraduationCap size={24} />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-3 rounded-2xl mb-6 text-sm text-center font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="flex flex-col">
                    <div className="login-input-group">
                        <User className="login-icon" size={20} />
                        <input
                            type={role === 'admin' ? 'email' : 'text'}
                            className="login-input"
                            placeholder={role === 'admin' ? 'Correo Electrónico' : 'Número de Cédula'}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="login-input-group">
                        <Lock className="login-icon" size={20} />
                        <input
                            type={showPassword ? "text" : "password"}
                            className="login-input"
                            placeholder="Contraseña"
                            style={{ paddingRight: '3rem' }} // Extra padding for eye icon
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div className="flex items-center justify-between text-sm px-2 mb-2">
                        <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                style={{ accentColor: '#10b981' }}
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <span>Recordarme</span>
                        </label>

                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="login-btn-gradient"
                    >
                        {loading ? 'Ingresando...' : 'INICIAR SESIÓN'}
                    </button>
                </form>

                <div className="mt-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex gap-3 text-left">
                    <div className="text-indigo-500 mt-0.5">
                        <Fingerprint size={20} />
                    </div>
                    <div className="text-xs text-indigo-800">
                        <strong>¿Quieres usar huella digital?</strong>
                        <p className="mt-1 text-indigo-600">Al iniciar sesión, permite que el navegador guarde tu contraseña. La próxima vez podrás entrar usando tu biométrico.</p>
                    </div>
                </div>

                <p className="text-center text-gray-500 mt-8 text-sm font-medium">
                    Carmen Lyra School - Sistema de Gestión
                </p>
            </div>
        </div>
    )
}
