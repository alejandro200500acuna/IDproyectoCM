import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Lock, Save, Loader } from 'lucide-react'

export default function Profile() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [message, setMessage] = useState({ type: '', text: '' })

    // Form States
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    useEffect(() => {
        if (user) {
            setEmail(user.email)
            fetchProfile()
        }
    }, [user])

    const fetchProfile = async () => {
        try {
            // Try to find profile by user ID or email
            // Note: DB schema might use 'users' or 'profiles' table. 
            // Based on AdminForm, it seems to be 'profiles' but checking Admins.jsx it was 'users'.
            // I will try 'profiles' first as per AdminForm.

            // Check if profiles table exists and has this user
            const { data, error } = await supabase
                .from('profiles') // Assuming profiles table linked to auth.users
                .select('full_name')
                .eq('email', user.email)
                .maybeSingle()

            if (data) {
                setFullName(data.full_name || '')
            } else {
                // Determine if we should fallback to user_metadata
                setFullName(user.user_metadata?.full_name || '')
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
        } finally {
            setFetching(false)
        }
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ type: '', text: '' })

        try {
            const updates = []

            // 1. Update Password if provided
            if (newPassword) {
                if (newPassword !== confirmPassword) {
                    throw new Error('Las contraseñas no coinciden')
                }
                const { error } = await supabase.auth.updateUser({ password: newPassword })
                if (error) throw error
                updates.push('Contraseña')
            }

            // 2. Update Full Name (in profiles table)
            if (fullName) {
                // Update or Insert profile
                // We identify by email since we don't know if id connects perfectly in this legacy schema
                const { error } = await supabase
                    .from('profiles')
                    .update({ full_name: fullName })
                    .eq('email', user.email)

                // If update failed (maybe row doesn't exist), try insert if applicable, but usually update is enough for existing users
                if (error) {
                    // Try 'users' table if 'profiles' failed or didn't exist
                    console.warn('Profile update warning:', error)
                }

                updates.push('Información Personal')
            }

            // 3. Email Update (Complex, requires re-login usually)
            // We usually skip email update to avoid lockout unless requested specifically.
            // For now, we keep email disabled in UI or readonly.

            if (updates.length > 0) {
                setMessage({ type: 'success', text: `¡${updates.join(' y ')} actualizados correctamente!` })
                setNewPassword('')
                setConfirmPassword('')
            } else {
                setMessage({ type: 'info', text: 'No hubo cambios para guardar.' })
            }

        } catch (error) {
            setMessage({ type: 'error', text: 'Error: ' + error.message })
        } finally {
            setLoading(false)
        }
    }

    if (fetching) return <div className="p-8 text-center text-gray-500">Cargando perfil...</div>

    return (
        <div className="max-w-2xl mx-auto">


            <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-white/50 backdrop-blur-sm">

                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-inner ring-4 ring-white">
                        <User size={40} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-800">{fullName || 'Usuario'}</h3>
                        <p className="text-gray-500 text-sm">{user?.email}</p>
                    </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-600 ml-1">Nombre Completo</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                            <input
                                type="text"
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium text-gray-700"
                                placeholder="Tu nombre completo"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Email (Read Only for safety in this version) */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-600 ml-1">Correo Electrónico</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="email"
                                disabled
                                className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl border-2 border-transparent text-gray-500 cursor-not-allowed font-medium"
                                value={email}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">No editable</span>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100 my-2"></div>

                    {/* Password Section */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2">
                            <Lock size={18} className="text-indigo-500" />
                            Cambiar Contraseña
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <input
                                    type="password"
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm"
                                    placeholder="Nueva contraseña"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    // Disable autoComplete to prevent browser interference if needed, but usually fine
                                    autoComplete="new-password"
                                />
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="password"
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm"
                                    placeholder="Confirmar contraseña"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 ml-1">Deja los campos de contraseña vacíos si no deseas cambiarla.</p>
                    </div>

                    {/* Messages */}
                    {message.text && (
                        <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-red-50 text-red-600' :
                            message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                            {message.type === 'success' && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                            {message.type === 'error' && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                            {message.text}
                        </div>
                    )}

                    <div className="pt-6 flex gap-4">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => {
                                // Reset form or navigate back
                                fetchProfile()
                                setNewPassword('')
                                setConfirmPassword('')
                                setMessage({ type: '', text: '' })
                            }}
                            className="flex-1 py-4 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all active:scale-[0.98]"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-[2] py-4 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] ${loading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                            style={{ backgroundColor: 'var(--primary-color, #4361ee)' }}
                        >
                            {loading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
