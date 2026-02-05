import { useState } from 'react'
import { supabase } from '../services/supabase'

export default function GradeForm({ onSuccess, onCancel }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        academic_year: new Date().getFullYear().toString()
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.from('grades').insert([
                {
                    name: formData.name,
                    academic_year: formData.academic_year,
                    active: true
                }
            ])

            if (error) throw error
            onSuccess()
        } catch (error) {
            alert('Error creating grade: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Grado</label>
                <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Primer Grado"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año Académico</label>
                <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    value={formData.academic_year}
                    onChange={e => setFormData({ ...formData, academic_year: e.target.value })}
                    placeholder="Ej: 2026"
                />
            </div>

            <div className="flex justify-end gap-3 mt-4">
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
                    {loading ? 'Guardando...' : 'Crear Grado'}
                </button>
            </div>
        </form>
    )
}
