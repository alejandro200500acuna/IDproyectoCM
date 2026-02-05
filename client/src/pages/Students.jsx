import { useState, useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { Plus, Search, Filter, MoreHorizontal, User, Edit2, Trash2, Upload, FileText, Download, Phone, Eye } from 'lucide-react'
import Modal from '../components/Modal'
import StudentForm from '../components/StudentForm'

export default function Students() {
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingStudent, setEditingStudent] = useState(null)
    const [importing, setImporting] = useState(false)
    const fileInputRef = useRef(null)
    const [selectedStudents, setSelectedStudents] = useState([])
    const [availableGrades, setAvailableGrades] = useState([])
    const [selectedGrade, setSelectedGrade] = useState('all')

    // ... existing ...

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedStudents(filteredStudents.map(s => s.id))
        } else {
            setSelectedStudents([])
        }
    }

    const toggleSelectStudent = (id) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(prev => prev.filter(studentId => studentId !== id))
        } else {
            setSelectedStudents(prev => [...prev, id])
        }
    }

    const handleBulkDelete = async () => {
        if (selectedStudents.length === 0) return

        if (!confirm(`¿Estás SEGURO de eliminar ${selectedStudents.length} estudiantes? Esta acción es irreversible y eliminará todos sus datos asociados.`)) {
            return
        }

        try {
            setLoading(true)
            const { error } = await supabase
                .from('students')
                .delete()
                .in('id', selectedStudents)

            if (error) throw error

            setStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)))
            setSelectedStudents([])
            alert('Estudiantes eliminados correctamente.')
        } catch (error) {
            console.error('Error deleting students:', error)
            alert('Error al eliminar: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStudents()
        fetchGrades()
    }, [])

    const fetchGrades = async () => {
        try {
            const { data, error } = await supabase.from('grades').select('*').order('name')
            if (error) throw error
            setAvailableGrades(data || [])
        } catch (error) {
            console.error('Error fetching grades:', error)
        }
    }

    const fetchStudents = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('students')
                .select(`
          *,
          grades (
            name
          )
        `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setStudents(data || [])
        } catch (error) {
            console.error('Error fetching students:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (student) => {
        setEditingStudent(student)
        setIsModalOpen(true)
    }

    const handleDelete = async (studentId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este estudiante? Esta acción no se puede deshacer.')) return

        try {
            const { error } = await supabase.from('students').delete().eq('id', studentId)
            if (error) throw error
            fetchStudents()
        } catch (error) {
            alert('Error eliminando estudiante: ' + error.message)
        }
    }

    const handleDownloadTemplate = () => {
        const headers = ['Nombre Completo', 'Cedula', 'Contraseña', 'Grado', 'Año']
        const exampleRow = ['Juan Perez', '101110111', 'estudiante123', '7-A', '2024']
        const csvContent = [
            headers.join(','),
            exampleRow.join(',')
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', 'plantilla_estudiantes.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleImportCSV = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            setImporting(true)
            const text = await file.text()
            const lines = text.split('\n')

            const normalizeHeader = (h) => {
                h = h.toLowerCase().trim()
                if (h === 'nombre completo') return 'nombre'
                if (h === 'contraseña' || h === 'contrasena') return 'password'
                if (h === 'año' || h === 'anio') return 'academic_year'
                return h
            }

            const headers = lines[0].split(',').map(normalizeHeader)

            // Expected headers: nombre, cedula
            if (!headers.includes('nombre') || !headers.includes('cedula')) {
                throw new Error('El formato del CSV es incorrecto. Debe tener columnas: Nombre Completo, Cedula, Contraseña, Grado, Año')
            }

            // Fetch grades to map names
            const { data: gradesData } = await supabase.from('grades').select('id, name')
            const gradesMap = new Map(gradesData?.map(g => [g.name.toLowerCase().trim(), g.id]))

            const studentsToInsert = []

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue

                const values = lines[i].split(',').map(v => v.trim())
                const row = {}
                headers.forEach((h, index) => row[h] = values[index])

                if (!row.nombre || !row.cedula) continue

                let gradeId = null
                if (row.grado) {
                    gradeId = gradesMap.get(row.grado.toLowerCase())
                }

                studentsToInsert.push({
                    full_name: row.nombre,
                    cedula: row.cedula,
                    grade_id: gradeId,
                    email: row.email || null,
                    password: row.password || '123456',
                    academic_year: row.academic_year || new Date().getFullYear()
                })
            }

            if (studentsToInsert.length > 0) {
                const { error } = await supabase.from('students').insert(studentsToInsert)
                if (error) throw error

                alert(`Se importaron ${studentsToInsert.length} estudiantes correctamente.`)
                fetchStudents()
            } else {
                alert('No se encontraron datos válidos para importar.')
            }

        } catch (error) {
            console.error('Error importing CSV:', error)
            alert('Error importando CSV: ' + error.message)
        } finally {
            setImporting(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const filteredStudents = students.filter(student => {
        // Filter by Grade
        if (selectedGrade !== 'all') {
            // Use loose comparison to handle potential string/number mismatches (e.g. "1" vs 1)
            if (student.grade_id != selectedGrade) return false
        }

        // Filter by Search Term
        const searchLower = searchTerm.toLowerCase()
        const nameMatch = student.full_name?.toLowerCase().includes(searchLower) || false
        const cedulaMatch = student.cedula?.toString().includes(searchTerm) || false

        return nameMatch || cedulaMatch
    })

    return (
        <div className="flex flex-col gap-6">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportCSV}
                accept=".csv"
                style={{ display: 'none' }}
            />

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-[2rem] shadow-sm mb-2">

                {/* Search & Filters */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--primary-color)] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar estudiantes..."
                            className="w-full pl-12 pr-6 py-3 bg-[#f8fafc] border-none rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/20 text-sm font-medium text-gray-600 transition-all placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Grade Filter Dropdown */}
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                        <select
                            value={selectedGrade}
                            onChange={(e) => setSelectedGrade(e.target.value)}
                            className="appearance-none pl-11 pr-10 py-3 bg-[#f8fafc] border-none rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/20 text-sm font-semibold text-gray-600 cursor-pointer min-w-[200px]"
                        >
                            <option value="all">Todos los Grados</option>
                            {availableGrades.map(grade => (
                                <option key={grade.id} value={grade.id}>{grade.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 1L5 5L9 1" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    {selectedStudents.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="px-5 py-3 rounded-full bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-all flex items-center gap-2 animate-in fade-in zoom-in duration-200"
                        >
                            <Trash2 size={18} />
                            Eliminar ({selectedStudents.length})
                        </button>
                    )}

                    <button
                        onClick={handleDownloadTemplate}
                        className="px-5 py-3 rounded-full bg-white border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all flex items-center gap-2"
                    >
                        <Download size={18} />
                        Plantilla CSV
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        className="px-5 py-3 rounded-full bg-indigo-50 text-[var(--primary-color)] font-bold text-sm hover:bg-indigo-100 transition-all flex items-center gap-2"
                    >
                        <Upload size={18} />
                        {importing ? 'Importando...' : 'Importar CSV'}
                    </button>

                    <button
                        onClick={() => {
                            setEditingStudent(null)
                            setIsModalOpen(true)
                        }}
                        className="btn-primary flex items-center gap-2 px-6 py-3 rounded-full shadow-lg shadow-blue-500/30"
                    >
                        <Plus size={20} />
                        Agregar Estudiante
                    </button>
                </div>
            </div>

            {/* Modern Table */}
            <div className="modern-table-container">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Cargando datos...</div>
                ) : filteredStudents.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-gray-400 gap-4">
                        <User size={48} strokeWidth={1} />
                        <p>No se encontraron estudiantes</p>
                    </div>
                ) : (
                    <table className="modern-table w-full">
                        <thead>
                            <tr>
                                <th className="col-checkbox pl-6">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] cursor-pointer w-4 h-4"
                                        onChange={toggleSelectAll}
                                        checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                                    />
                                </th>
                                <th className="text-left">Nombre</th>
                                <th className="text-center">Cédula</th>
                                <th className="text-center">Grado</th>
                                <th className="text-center">Estado</th>
                                <th className="text-right pr-6">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className={`group hover:bg-white transition-all border-b border-transparent hover:shadow-sm ${selectedStudents.includes(student.id) ? 'bg-blue-50/30' : ''}`}>
                                    <td className="col-checkbox pl-6">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] cursor-pointer w-4 h-4"
                                            checked={selectedStudents.includes(student.id)}
                                            onChange={() => toggleSelectStudent(student.id)}
                                        />
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[var(--primary-color)] font-bold text-sm shadow-sm ring-2 ring-white">
                                                {student.photo_url ? (
                                                    <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    student.full_name?.charAt(0) || 'S'
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-800 text-sm group-hover:text-[var(--primary-color)] transition-colors">{student.full_name}</span>
                                                <span className="text-xs text-gray-400">{student.email || 'Sin Email'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <span className="font-bold text-gray-600 text-sm bg-gray-50 px-3 py-1 rounded-full">
                                            #{student.cedula}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#f3f0ff] text-[#7b2cbf]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#7b2cbf]"></span>
                                            {student.grades?.name || 'Sin Asignar'}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ecfdf5] text-[#10b981]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                                            Activo
                                        </span>
                                    </td>
                                    <td className="text-right pr-6">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-gray-400 hover:text-[var(--primary-color)] hover:bg-blue-50 rounded-full transition-colors" title="View Details">
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(student)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(student.id)}
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
                <span>Mostrando 01 - {filteredStudents.length} de {students.length} resultados</span>
                <div className="flex gap-2">
                    <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">Anterior</button>
                    <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">Siguiente</button>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingStudent ? "Editar Estudiante" : "Agregar Nuevo Estudiante"}
            >
                <StudentForm
                    initialData={editingStudent}
                    onSuccess={() => {
                        setIsModalOpen(false)
                        fetchStudents()
                    }}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    )
}
