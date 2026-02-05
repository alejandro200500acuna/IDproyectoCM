import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Plus, Search, Filter, User, Phone, Mail, Edit2, Trash2, Eye } from 'lucide-react'
import Modal from '../components/Modal'
import ParentForm from '../components/ParentForm'

export default function Parents() {
    const [parents, setParents] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingParent, setEditingParent] = useState(null)

    useEffect(() => {
        fetchParents()
    }, [])

    const fetchParents = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('parents')
                .select(`
                    *,
                    parent_students (
                        student_id,
                        students (
                            full_name
                        )
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setParents(data || [])
        } catch (error) {
            console.error('Error fetching parents:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (parent) => {
        setEditingParent(parent)
        setIsModalOpen(true)
    }

    const handleDelete = async (parentId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este padre? Esta acción no se puede deshacer.')) return

        try {
            const { error } = await supabase.from('parents').delete().eq('id', parentId)
            if (error) throw error
            fetchParents()
        } catch (error) {
            alert('Error eliminando padre: ' + error.message)
        }
    }

    const filteredParents = parents.filter(parent =>
        parent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.cedula.includes(searchTerm) ||
        parent.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6">
            {/* Action Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-[2rem] shadow-sm mb-2">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--primary-color)] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar padres..."
                            className="w-full pl-12 pr-6 py-3 bg-[#f8fafc] border-none rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/20 text-sm font-medium text-gray-600 transition-all placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <button
                        onClick={() => {
                            setEditingParent(null)
                            setIsModalOpen(true)
                        }}
                        className="btn-primary flex items-center gap-2 px-6 py-3 rounded-full shadow-lg shadow-blue-500/30"
                    >
                        <Plus size={20} />
                        Agregar Padre
                    </button>
                </div>
            </div>

            {/* Modern Table */}
            <div className="modern-table-container">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Cargando padres...</div>
                ) : filteredParents.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-gray-400 gap-4">
                        <User size={48} strokeWidth={1} />
                        <p>No se encontraron padres</p>
                    </div>
                ) : (
                    <table className="modern-table w-full">
                        <thead>
                            <tr>
                                <th className="col-checkbox pl-6">
                                    <input type="checkbox" className="rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                                </th>
                                <th className="text-left">Nombre del Padre</th>
                                <th className="text-left">Contacto</th>
                                <th className="text-center">Cédula</th>
                                <th className="text-center">Estudiantes Asignados</th>
                                <th className="text-right pr-6">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredParents.map((parent) => (
                                <tr key={parent.id} className="group hover:bg-white transition-all border-b border-transparent hover:shadow-sm">
                                    <td className="col-checkbox pl-6">
                                        <input type="checkbox" className="rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                                    </td>
                                    <td>
                                        <div className="cell-profile">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-[var(--primary-color)] font-bold text-sm">
                                                {parent.full_name.charAt(0)}
                                            </div>
                                            <div className="info">
                                                <span className="font-bold text-gray-800 text-sm group-hover:text-[var(--primary-color)] transition-colors">{parent.full_name}</span>
                                                <span className="text-xs text-gray-400">{parent.is_association_member ? 'Miembro Asociación' : 'Padre/Madre'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Mail size={12} className="text-[var(--primary-color)]" />
                                                {parent.email}
                                            </div>
                                            {parent.phone && (
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Phone size={12} className="text-green-500" />
                                                    {parent.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <span className="font-mono text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">{parent.cedula}</span>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex flex-wrap gap-1 justify-center">
                                            {parent.parent_students && parent.parent_students.length > 0 ? (
                                                parent.parent_students.map((ps, idx) => (
                                                    <span key={idx} className="bg-blue-50 text-[var(--primary-color)] text-[10px] px-2 py-1 rounded-full font-bold">
                                                        {ps.students?.full_name || 'Estudiante'}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-gray-300 italic">Sin Asignar</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="text-right pr-6">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(parent)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(parent.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                title="Delete"
                                            >
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

            <div className="flex justify-between items-center text-sm text-gray-500 px-2">
                <span>Mostrando {filteredParents.length} registro(s)</span>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingParent ? "Editar Padre" : "Agregar Nuevo Padre"}
            >
                <ParentForm
                    initialData={editingParent}
                    onSuccess={() => {
                        setIsModalOpen(false)
                        fetchParents()
                    }}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    )
}

