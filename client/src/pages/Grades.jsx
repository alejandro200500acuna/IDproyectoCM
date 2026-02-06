import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Plus, Search, Filter, GraduationCap, MoreHorizontal, Eraser, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import GradeForm from '../components/GradeForm'

export default function Grades() {
    const [grades, setGrades] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)

    const [selectedIds, setSelectedIds] = useState([])

    useEffect(() => {
        fetchGrades()
    }, [])

    const fetchGrades = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('grades')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setGrades(data || [])
            setSelectedIds([]) // Reset selection on fetch
        } catch (error) {
            console.error('Error fetching grades:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredGrades = grades.filter(grade =>
        grade.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredGrades.map(g => g.id))
        } else {
            setSelectedIds([])
        }
    }

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
        } else {
            setSelectedIds([...selectedIds, id])
        }
    }

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return

        if (!window.confirm('¿Está seguro que desea eliminar todo el registro? SI o NO')) {
            return
        }

        try {
            const { error } = await supabase
                .from('grades')
                .delete()
                .in('id', selectedIds)

            if (error) throw error

            fetchGrades()
        } catch (error) {
            alert('Error al eliminar: ' + error.message)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Action Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-[2rem] shadow-sm mb-2">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--primary-color)] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar cursos..."
                            className="w-full pl-12 pr-6 py-3 bg-[#f8fafc] border-none rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/20 text-sm font-medium text-gray-600 transition-all placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-colors animate-fade-in"
                        >
                            <Trash2 size={20} />
                            Eliminar ({selectedIds.length})
                        </button>
                    )}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center gap-2 px-6 py-3 rounded-full shadow-lg shadow-blue-500/30"
                    >
                        <Plus size={20} />
                        Agregar Curso
                    </button>
                </div>
            </div>

            {/* Modern Table */}
            <div className="modern-table-container">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Cargando cursos...</div>
                ) : filteredGrades.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-gray-400 gap-4">
                        <GraduationCap size={48} strokeWidth={1} />
                        <p>No se encontraron cursos</p>
                    </div>
                ) : (
                    <table className="modern-table w-full">
                        <thead>
                            <tr>
                                <th className="col-checkbox pl-6">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                                        checked={selectedIds.length === filteredGrades.length && filteredGrades.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="text-left">Nombre del Curso</th>
                                <th className="text-center">Año Académico</th>
                                <th className="text-center">Estado</th>
                                <th className="text-right pr-6">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGrades.map((grade) => (
                                <tr key={grade.id} className={`group hover:bg-white transition-all border-b border-transparent hover:shadow-sm ${selectedIds.includes(grade.id) ? 'bg-blue-50/50' : ''}`}>
                                    <td className="col-checkbox pl-6">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                                            checked={selectedIds.includes(grade.id)}
                                            onChange={() => handleSelectOne(grade.id)}
                                        />
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 font-bold shadow-sm ring-2 ring-white">
                                                {grade.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-gray-800 text-sm group-hover:text-[var(--primary-color)] transition-colors">{grade.name}</span>
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <span className="font-bold text-gray-600 text-sm bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                            {grade.academic_year}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${grade.active ? 'bg-[#ecfdf5] text-[#10b981]' : 'bg-gray-100 text-gray-500'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${grade.active ? 'bg-[#10b981]' : 'bg-gray-400'}`}></span>
                                            {grade.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="text-right pr-6">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-gray-400 hover:text-[var(--primary-color)] hover:bg-blue-50 rounded-full transition-colors" title="Edit">
                                                <MoreHorizontal size={18} />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Crear Nuevo Curso"
            >
                <GradeForm
                    onSuccess={() => {
                        setIsModalOpen(false)
                        fetchGrades()
                    }}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    )
}
