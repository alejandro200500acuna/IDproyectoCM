import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Upload } from 'lucide-react'

export default function StudentForm({ onSuccess, onCancel, initialData }) {
    const [loading, setLoading] = useState(false)
    const [grades, setGrades] = useState([])
    const [uploading, setUploading] = useState(false)
    const [photoPreview, setPhotoPreview] = useState(null)
    const [formData, setFormData] = useState({
        full_name: '',
        cedula: '',
        password: '',
        grade_id: '',
        academic_year: new Date().getFullYear().toString(),
        photo_url: ''
    })

    useEffect(() => {
        fetchGrades()
        if (initialData) {
            setFormData({
                full_name: initialData.full_name || '',
                cedula: initialData.cedula || '',
                password: initialData.password || '',
                grade_id: initialData.grade_id || '',
                academic_year: initialData.academic_year || new Date().getFullYear().toString(),
                photo_url: initialData.photo_url || ''
            })
            if (initialData.photo_url) {
                setPhotoPreview(initialData.photo_url)
            }
        }
    }, [initialData])

    const fetchGrades = async () => {
        try {
            const { data, error } = await supabase
                .from('grades')
                .select('*')
                .order('name')

            if (error) throw error
            setGrades(data || [])
        } catch (error) {
            console.error('Error fetching grades:', error)
        }
    }

    const handlePhotoUpload = async (e) => {
        try {
            setUploading(true)
            const file = e.target.files[0]
            if (!file) return

            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('student-photos')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage
                .from('student-photos')
                .getPublicUrl(filePath)

            setFormData(prev => ({ ...prev, photo_url: data.publicUrl }))
            setPhotoPreview(data.publicUrl)
        } catch (error) {
            console.error('Error uploading:', error)
            alert('Error al subir imagen. Asegúrate de que el bucket "student-photos" exista.')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (initialData) {
                // Update
                const { error } = await supabase
                    .from('students')
                    .update({
                        full_name: formData.full_name,
                        cedula: formData.cedula,
                        password: formData.password,
                        grade_id: formData.grade_id,
                        academic_year: formData.academic_year,
                        photo_url: formData.photo_url
                    })
                    .eq('id', initialData.id)

                if (error) throw error
            } else {
                // Insert
                const { error } = await supabase.from('students').insert([
                    {
                        full_name: formData.full_name,
                        cedula: formData.cedula,
                        password: formData.password || '123456', // Default if empty, though required
                        grade_id: formData.grade_id,
                        academic_year: formData.academic_year,
                        photo_url: formData.photo_url
                    }
                ])

                if (error) throw error
            }
            onSuccess()
        } catch (error) {
            alert('Error creating/updating student: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Photo Upload */}
            <div className="flex justify-center mb-4">
                <div className="relative group" style={{ width: '100px', height: '100px' }}>
                    <div
                        className="rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 hover:border-indigo-500 transition-colors"
                        style={{ width: '100%', height: '100%', borderRadius: '50%', position: 'relative' }}
                    >
                        {photoPreview ? (
                            <img
                                src={photoPreview}
                                alt="Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <Upload className="text-gray-400 group-hover:text-indigo-500 transition-colors" size={32} />
                        )}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center" style={{ borderRadius: '50%' }}>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading}
                        style={{ cursor: 'pointer' }}
                    />
                    <p className="text-xs text-center mt-2 text-gray-500 font-medium" style={{ width: '100%', position: 'absolute', bottom: '-25px' }}>
                        {photoPreview ? 'Cambiar' : 'Subir Foto'}
                    </p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Ej: Juan Perez"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    value={formData.cedula}
                    onChange={e => setFormData({ ...formData, cedula: e.target.value })}
                    placeholder="Ej: 1-1234-5678"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Contraseña de acceso"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grado</label>
                    <select
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white"
                        value={formData.grade_id}
                        onChange={e => setFormData({ ...formData, grade_id: e.target.value })}
                    >
                        <option value="">Seleccionar Grado</option>
                        {grades.map(grade => (
                            <option key={grade.id} value={grade.id}>{grade.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Año Académico</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        value={formData.academic_year}
                        onChange={e => setFormData({ ...formData, academic_year: e.target.value })}
                    />
                </div>
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
                    {loading ? 'Guardando...' : 'Guardar Estudiante'}
                </button>
            </div>
        </form>
    )
}
