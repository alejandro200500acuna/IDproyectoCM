import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Search, Filter, Shield, Plus, Trash2, Mail } from 'lucide-react'
import Modal from '../components/Modal'
import AdminForm from '../components/AdminForm'

export default function Admins() {
    const [admins, setAdmins] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        fetchAdmins()
    }, [])

    const fetchAdmins = async () => {
        try {
            setLoading(true)
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

    const handleDelete = async (adminId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este administrador? Perderá todos los privilegios de acceso.')) return

        try {
            const { error } = await supabase.from('profiles').delete().eq('id', adminId)
            if (error) throw error
            fetchAdmins()
        } catch (error) {
            alert('Error eliminando administrador: ' + error.message)
        }
    }

    const filteredAdmins = admins.filter(admin =>
        admin.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
                            placeholder="Buscar profesores..."
                            className="w-full pl-12 pr-6 py-3 bg-[#f8fafc] border-none rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/20 text-sm font-medium text-gray-600 transition-all placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center gap-2 px-6 py-3 rounded-full shadow-lg shadow-blue-500/30"
                    >
                        <Plus size={20} />
                        Agregar Profesor
                    </button>
                </div>
            </div>

            {/* Modern Table */}
            <div className="modern-table-container">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Cargando profesores...</div>
                ) : filteredAdmins.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-gray-400 gap-4">
                        <Shield size={48} strokeWidth={1} />
                        <p>No se encontraron profesores</p>
                    </div>
                ) : (
                    <table className="modern-table w-full">
                        <thead>
                            <tr>
                                <th className="col-checkbox pl-6">
                                    <input type="checkbox" className="rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                                </th>
                                <th className="text-left">Nombre</th>
                                <th className="text-center">Materia</th>
                                <th className="text-center">Estado</th>
                                <th className="text-right pr-6">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAdmins.map((admin) => (
                                <tr key={admin.id} className="group hover:bg-white transition-all border-b border-transparent hover:shadow-sm">
                                    <td className="col-checkbox pl-6">
                                        <input type="checkbox" className="rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-[var(--primary-color)] font-bold text-sm shadow-sm ring-2 ring-white">
                                                {admin.full_name?.charAt(0) || 'T'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-800 text-sm group-hover:text-[var(--primary-color)] transition-colors">{admin.full_name || 'Sin Nombre'}</span>
                                                <span className="text-xs text-gray-400">{admin.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">Matemáticas</span>
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ecfdf5] text-[#10b981]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                                            Activo
                                        </span>
                                    </td>
                                    <td className="text-right pr-6">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-gray-400 hover:text-[var(--primary-color)] hover:bg-blue-50 rounded-full transition-colors" title="Message">
                                                <Mail size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(admin.id)}
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

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Agregar Nuevo Profesor"
            >
                <AdminForm
                    onSuccess={() => {
                        setIsModalOpen(false)
                        fetchAdmins()
                    }}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    )
}
