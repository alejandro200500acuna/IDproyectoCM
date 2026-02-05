import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import {
    Settings as SettingsIcon,
    Plus,
    Trash2,
    Shield,
    Check,
    X,
    User,
    Mail,
    Lock,
    LayoutDashboard,
    Users,
    Baby,
    GraduationCap,
    BookOpen,
    Palette,
    Pencil
} from 'lucide-react'
import Modal from '../components/Modal'

const MODULES = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Estudiantes', icon: Users },
    { id: 'parents', label: 'Padres', icon: Baby },
    { id: 'teachers', label: 'Profesores (Admins)', icon: GraduationCap },
    { id: 'courses', label: 'Cursos', icon: BookOpen },
    { id: 'designer', label: 'Diseñador ID', icon: Palette },
    { id: 'settings', label: 'Ajustes', icon: SettingsIcon }
]

export default function Settings() {
    const [admins, setAdmins] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [editingId, setEditingId] = useState(null)

    // Form State
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        permissions: MODULES.reduce((acc, m) => ({ ...acc, [m.id]: true }), {})
    })

    useEffect(() => {
        fetchAdmins()
    }, [])

    const fetchAdmins = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'admin')
                .order('created_at', { ascending: false })

            if (error) throw error
            setAdmins(data || [])
        } catch (error) {
            console.error('Error fetching admins:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleModuleToggle = (moduleId) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [moduleId]: !prev.permissions[moduleId]
            }
        }))
    }

    const handleEdit = (admin) => {
        setEditingId(admin.id)
        setFormData({
            full_name: admin.full_name,
            email: admin.email || '',
            password: '',
            permissions: (admin.permissions && typeof admin.permissions === 'object')
                ? { ...MODULES.reduce((acc, m) => ({ ...acc, [m.id]: false }), {}), ...admin.permissions }
                : MODULES.reduce((acc, m) => ({ ...acc, [m.id]: true }), {})
        })
        setShowModal(true)
    }

    const handleDelete = async (id, name) => {
        if (!window.confirm(`¿Está seguro que desea eliminar al administrador "${name}"? Esta acción no se puede deshacer.`)) {
            return
        }

        try {
            const { error } = await supabase.rpc('delete_admin', { p_id: id })
            if (error) throw error
            fetchAdmins()
        } catch (error) {
            console.error('Error deleting admin:', error)
            alert('Error al eliminar: ' + error.message)
        }
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingId(null)
        setFormData({
            full_name: '',
            email: '',
            password: '',
            permissions: MODULES.reduce((acc, m) => ({ ...acc, [m.id]: true }), {})
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            if (editingId) {
                // Update
                const { error } = await supabase.rpc('update_admin', {
                    p_id: editingId,
                    p_email: formData.email,
                    p_password: formData.password,
                    p_full_name: formData.full_name,
                    p_modules: formData.permissions
                })
                if (error) throw error
            } else {
                // Create
                const { error } = await supabase.rpc('create_new_admin', {
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.full_name,
                    modules: formData.permissions
                })
                if (error) throw error
            }

            closeModal()
            fetchAdmins()
        } catch (error) {
            alert('Error: ' + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                        Ajustes del Sistema
                    </h1>
                    <p className="text-gray-500 mt-1">Gestión de administradores y permisos de acceso</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-2 shadow-lg shadow-indigo-200"
                >
                    <Plus size={20} />
                    Nuevo Administrador
                </button>
            </div>

            {/* Content Info */}
            <div className="space-y-6">
                {/* Admin Users List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Shield className="text-indigo-500" />
                        Administradores Activos
                    </h2>

                    {loading ? (
                        <div className="text-center py-10 text-gray-400">Cargando...</div>
                    ) : (
                        <div className="grid gap-4">
                            {admins.map(admin => (
                                <div key={admin.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                            {admin.full_name?.charAt(0) || 'A'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{admin.full_name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <User size={14} />
                                                <span>{admin.email || 'Sin usuario'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 self-end md:self-auto">
                                        <div className="flex flex-wrap gap-2 text-sm">
                                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200">
                                                Activo
                                            </span>
                                            <div className="hidden md:flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                <SettingsIcon size={12} />
                                                {(admin.permissions && typeof admin.permissions === 'object')
                                                    ? `${Object.values(admin.permissions).filter(Boolean).length} Módulos`
                                                    : 'Todos'}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 pl-4 border-l border-gray-100">
                                            <button
                                                onClick={() => handleEdit(admin)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                title="Editar"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(admin.id, admin.full_name)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {admins.length === 0 && (
                                <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    No hay administradores adicionales.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Admin Modal */}
            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title={editingId ? 'Editar Administrador' : 'Nuevo Administrador'}
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-1 block">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-16 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                                    placeholder="Ej: María González"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-1 block">Usuario / Correo</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-16 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                                    placeholder="admin@school.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-1 block">
                                {editingId ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    required={!editingId}
                                    minLength={6}
                                    className="w-full pl-16 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                                    placeholder={editingId ? "Dejar en blanco para mantener actual" : "Mínimo 6 caracteres"}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Permissions */}
                    <div className="pt-4 border-t border-gray-100">
                        <label className="text-sm font-semibold text-gray-700 mb-3 block">Módulos Permitidos</label>
                        <div className="grid grid-cols-2 gap-3">
                            {MODULES.map(module => {
                                const Icon = module.icon
                                const isChecked = formData.permissions[module.id]
                                return (
                                    <label
                                        key={module.id}
                                        className={`
                                            flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                                            ${isChecked
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}
                                        `}
                                    >
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={isChecked}
                                            onChange={() => handleModuleToggle(module.id)}
                                        />
                                        <div className={`
                                            w-5 h-5 rounded flex items-center justify-center border transition-colors
                                            ${isChecked ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-gray-300'}
                                        `}>
                                            {isChecked && <Check size={12} className="text-white" />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Icon size={16} />
                                            <span className="text-sm font-medium">{module.label}</span>
                                        </div>
                                    </label>
                                )
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary"
                        >
                            {submitting ? 'Guardando...' : (editingId ? 'Actualizar Administrador' : 'Crear Administrador')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
