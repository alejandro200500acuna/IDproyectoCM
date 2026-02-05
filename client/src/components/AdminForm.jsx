import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export default function AdminForm({ onSuccess, onCancel, initialData = null }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        role: 'admin'
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                full_name: initialData.full_name || '',
                email: initialData.email || '',
                role: initialData.role || 'admin'
            })
        }
    }, [initialData])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (initialData) {
                // Update Admin
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        full_name: formData.full_name,
                        role: formData.role
                    })
                    .eq('id', initialData.id)

                if (error) throw error
            } else {
                // Create Admin
                // Note: This creates a profile. Ideally, this should be linked to an Auth user.
                const { error } = await supabase
                    .from('profiles')
                    .insert([{
                        full_name: formData.full_name,
                        email: formData.email,
                        role: 'admin'
                    }])

                if (error) throw error
            }

            onSuccess()
        } catch (error) {
            alert('Error saving admin: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        value={formData.full_name}
                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Nombre del Administrador"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                    <input
                        type="email"
                        required
                        disabled={!!initialData}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="admin@ejemplo.com"
                    />
                    {initialData && <p className="text-xs text-gray-500 mt-1">El correo no se puede modificar.</p>}
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        initialData ? 'Actualizar' : 'Crear Admin'
                    )}
                </button>
            </div>
        </form>
    )
}
