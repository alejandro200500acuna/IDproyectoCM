import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Search, X, Check, Plus } from 'lucide-react'

export default function ParentForm({ onSuccess, onCancel, initialData = null }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        cedula: '',
        password: '',
        email: '',
        phone: ''
    })

    // Student Selection State
    const [students, setStudents] = useState([])
    const [selectedStudents, setSelectedStudents] = useState([]) // Array of student objects
    const [studentSearch, setStudentSearch] = useState('')
    const [loadingStudents, setLoadingStudents] = useState(true)

    useEffect(() => {
        if (initialData) {
            setFormData({
                full_name: initialData.full_name || '',
                cedula: initialData.cedula || '',
                password: initialData.password || '',
                email: initialData.email || '',
                phone: initialData.phone || ''
            })
            fetchLinkedStudents(initialData.id)
        }
        fetchStudents()
    }, [initialData])

    const fetchStudents = async () => {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('id, full_name, cedula')
                .order('full_name')

            if (error) throw error
            setStudents(data || [])
        } catch (error) {
            console.error('Error fetching students:', error)
        } finally {
            setLoadingStudents(false)
        }
    }

    const fetchLinkedStudents = async (parentId) => {
        try {
            const { data, error } = await supabase
                .from('parent_students')
                .select('student_id, students(id, full_name, cedula)')
                .eq('parent_id', parentId)

            if (error) throw error

            // Format data to match student objects
            if (data) {
                const linked = data.map(item => item.students).filter(Boolean)
                setSelectedStudents(linked)
            }
        } catch (error) {
            console.error('Error fetching linked students:', error)
        }
    }

    const toggleStudent = (student) => {
        if (selectedStudents.find(s => s.id === student.id)) {
            setSelectedStudents(selectedStudents.filter(s => s.id !== student.id))
        } else {
            setSelectedStudents([...selectedStudents, student])
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {


            let parentId = initialData?.id

            // Use RPC to ensure secure password handling and bypass cache
            const { data: id, error } = await supabase.rpc('upsert_parent_v2', {
                p_id: parentId || null,
                p_full_name: formData.full_name,
                p_cedula: formData.cedula,
                p_email: formData.email,
                p_phone: formData.phone,
                p_password: formData.password || (initialData ? undefined : '123456')
            })

            if (error) throw error
            parentId = id

            // Handle Student Links (Delete all and re-insert for simplicity)
            // 1. Delete existing links
            if (initialData) {
                const { error: deleteError } = await supabase
                    .from('parent_students')
                    .delete()
                    .eq('parent_id', parentId)
                if (deleteError) throw deleteError
            }

            // 2. Insert new links
            if (selectedStudents.length > 0) {
                const links = selectedStudents.map(student => ({
                    parent_id: parentId,
                    student_id: student.id
                }))

                const { error: linkError } = await supabase
                    .from('parent_students')
                    .insert(links)

                if (linkError) throw linkError
            }

            onSuccess()
        } catch (error) {
            alert('Error creating/updating parent: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto pr-2">
            <div className="flex flex-col gap-4">
                <h3 className="text-center font-bold text-lg text-gray-800 border-b pb-2 mb-4">Información del Padre</h3>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        value={formData.full_name}
                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Nombre del Padre"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Cédula</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            value={formData.cedula}
                            onChange={e => setFormData({ ...formData, cedula: e.target.value })}
                            placeholder="Número de Cédula"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
                        <input
                            type="tel"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Opcional"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
                    <input
                        type="email"
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="correo@ejemplo.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Contraseña de acceso"
                    />
                </div>
            </div>

            {/* Student Linking Section */}
            <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                    <h3 className="font-bold text-gray-800">Asignar Hijos</h3>
                    <p className="text-xs text-gray-500">Busca y selecciona los estudiantes a cargo de este padre.</p>
                </div>

                {/* Selected Students Chips */}
                {selectedStudents.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {selectedStudents.map(student => (
                            <div key={student.id} className="bg-white text-gray-700 pl-3 pr-1 py-1.5 rounded-full text-sm flex items-center gap-2 border border-gray-200 shadow-sm">
                                <span className="font-medium">{student.full_name}</span>
                                <button
                                    type="button"
                                    onClick={() => toggleStudent(student)}
                                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar estudiante por nombre o cédula..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                    />
                </div>

                {/* Student List - Only shown when searching */}
                {studentSearch.trim().length > 0 && (
                    <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto bg-white shadow-sm mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        {loadingStudents ? (
                            <div className="p-4 text-center text-sm text-gray-500">Cargando estudiantes...</div>
                        ) : (
                            (() => {
                                // Filter out already selected students from the list
                                const availableStudents = students.filter(student => {
                                    const isSelected = selectedStudents.some(s => s.id === student.id)
                                    const matchesSearch =
                                        student.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                                        student.cedula.includes(studentSearch)

                                    return !isSelected && matchesSearch
                                })

                                if (availableStudents.length === 0) {
                                    return (
                                        <div className="p-6 text-center text-sm text-gray-500">
                                            No se encontraron estudiantes para "{studentSearch}"
                                        </div>
                                    )
                                }

                                return availableStudents.map(student => (
                                    <button
                                        key={student.id}
                                        type="button"
                                        onClick={() => {
                                            toggleStudent(student)
                                            setStudentSearch('') // Clear search after selection
                                        }}
                                        className="w-full text-left p-3 text-sm flex items-center justify-between hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0"
                                    >
                                        <div>
                                            <div className="font-medium text-gray-800">{student.full_name}</div>
                                            <div className="text-xs text-gray-500 font-mono">{student.cedula}</div>
                                        </div>
                                        <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-transparent hover:text-indigo-500 hover:border-indigo-500">
                                            <Plus size={14} />
                                        </div>
                                    </button>
                                ))
                            })()
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
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
                    {loading ? 'Guardando...' : (initialData ? 'Actualizar Padre' : 'Crear Padre')}
                </button>
            </div>
        </form>
    )
}
