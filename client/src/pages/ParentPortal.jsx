import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext' // Keep if needed for other things, but actually we removed usage. 
// Wait, I should just remove it.
import { LogOut, User, Download, ArrowLeft } from 'lucide-react'
import IDCardRenderer from '../components/IDCardRenderer'

export default function ParentPortal() {
    const navigate = useNavigate()
    const [children, setChildren] = useState([])
    const [selectedChild, setSelectedChild] = useState(null)
    const [loading, setLoading] = useState(true)
    const [template, setTemplate] = useState(null)
    const [parentName, setParentName] = useState('')
    const [parentSession, setParentSession] = useState(null)

    useEffect(() => {
        const stored = localStorage.getItem('parent_user')
        if (!stored) {
            navigate('/login')
            return
        }

        const parentData = JSON.parse(stored)
        setParentSession(parentData)
        setParentName(parentData.full_name)
        fetchChildren(parentData.id)
    }, [navigate])

    const fetchChildren = async (parentId) => {
        try {
            // Get Children via RPC to bypass RLS
            const { data: childrenData, error: childError } = await supabase
                .rpc('get_parent_children', { p_parent_id: parentId })

            if (childError) throw childError

            // Map flat RPC result to the nested structure UI expects
            const students = (childrenData || []).map(c => ({
                id: c.student_id,
                full_name: c.full_name,
                cedula: c.cedula,
                photo_url: c.photo_url,
                academic_year: c.academic_year,
                grades: {
                    id: c.grade_id,
                    name: c.grade_name
                },
                grade_id: c.grade_id
            }))

            setChildren(students)

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectChild = async (child) => {
        setSelectedChild(child)
        // Fetch template for this child
        await fetchTemplate(child)
    }

    const fetchTemplate = async (student) => {
        try {
            let templateToUse = null;
            const gradeId = student.grades?.id || student.grade_id;

            if (gradeId) {
                const { data: assignments } = await supabase
                    .from('id_template_grades')
                    .select('template_id')
                    .eq('grade_id', gradeId)
                    .maybeSingle()

                if (assignments) {
                    const { data: specificTemplate } = await supabase
                        .from('id_templates')
                        .select('*')
                        .eq('id', assignments.template_id)
                        .single()
                    templateToUse = specificTemplate
                }
            }

            if (!templateToUse) {
                const { data: latestTemplate } = await supabase
                    .from('id_templates')
                    .select('*')
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()
                templateToUse = latestTemplate
            }

            setTemplate(templateToUse)
        } catch (e) {
            console.error(e)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('parent_user')
        navigate('/login')
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-indigo-600">Cargando familia...</div>

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-800 relative overflow-hidden">
            {/* Background Splashes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
                <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] bg-gradient-to-tr from-blue-200/20 to-teal-200/20 rounded-full blur-3xl"></div>
            </div>

            <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-indigo-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <User size={20} />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-gray-900">Portal de Padres</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm font-semibold"
                    >
                        <LogOut size={18} />
                        <span className="hidden sm:block">Salir</span>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10 min-h-[calc(100vh-5rem)] flex flex-col">
                {!selectedChild ? (
                    // Selection View
                    <div className="flex flex-col w-full flex-grow animate-fade-in-up">
                        <div className="text-center mt-12 mb-8">
                            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-6 tracking-tight">
                                ¡Bienvenido, {parentName.split(' ')[0]}!
                            </h1>
                            <p className="text-xl text-gray-500 font-medium">
                                Seleccione el carnet del hijo que quiere ver
                            </p>
                        </div>

                        {/* Children Grid */}
                        <div className="flex-grow flex items-center justify-center">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 max-w-5xl">
                                {children.length > 0 ? (
                                    children.map((child) => (
                                        <button
                                            key={child.id}
                                            onClick={() => handleSelectChild(child)}
                                            className="group flex flex-col items-center gap-6 p-8 bg-white rounded-[2.5rem] shadow-xl shadow-indigo-100 hover:shadow-2xl hover:shadow-indigo-200/50 transition-all duration-500 hover:-translate-y-2 border border-white hover:border-indigo-100 ring-1 ring-black/5"
                                        >
                                            <div className="relative">
                                                <div className="w-40 h-40 rounded-full p-1.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 group-hover:scale-105 transition-transform duration-500 shadow-lg group-hover:shadow-indigo-500/30">
                                                    <div className="w-full h-full rounded-full overflow-hidden bg-white relative">
                                                        {child.photo_url ? (
                                                            <img
                                                                src={child.photo_url}
                                                                alt={child.full_name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-300">
                                                                <User size={64} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Status Indicator */}
                                                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                                            </div>

                                            <div className="text-center">
                                                <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors">
                                                    {child.full_name}
                                                </h3>
                                                <span className="text-sm font-semibold text-indigo-400 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full">
                                                    {child.grades?.name || 'Estudiante'}
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="col-span-full py-12 text-center text-gray-400">
                                        <User size={48} className="mx-auto mb-4 opacity-30" />
                                        <p>No se encontraron estudiantes asociados.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // ID Card View
                    <div className="animate-fade-in-up">


                        <div className="flex flex-col xl:flex-row items-center xl:items-start justify-center gap-12">
                            {/* Card Display */}
                            <div className="w-full max-w-xl flex flex-col items-center gap-8">
                                <div className="relative group w-full transform transition-all duration-500 hover:scale-[1.01]">
                                    <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                                    <div id="card-wrapper" className="relative shadow-2xl rounded-xl overflow-hidden bg-white">
                                        <IDCardRenderer template={template} student={selectedChild} />
                                    </div>
                                </div>

                                <div className="flex gap-4 w-full max-w-sm">
                                    <button
                                        onClick={() => setSelectedChild(null)}
                                        className="flex-1 bg-white border border-gray-200 text-gray-700 shadow-md flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all hover:-translate-y-1"
                                    >
                                        <ArrowLeft size={20} />
                                        Volver
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('¿Desea descargar este Carnet?')) {
                                                const canvas = document.querySelector('#card-wrapper canvas')
                                                if (canvas) {
                                                    const link = document.createElement('a')
                                                    link.download = `Carnet_${selectedChild.cedula || 'Estudiante'}.png`
                                                    link.href = canvas.toDataURL('image/png')
                                                    link.click()
                                                }
                                            }
                                        }}
                                        className="flex-[2] btn-primary shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-3 px-6 py-4 text-lg rounded-2xl hover:-translate-y-1 transition-all"
                                    >
                                        <Download size={24} />
                                        Descargar Carnet
                                    </button>
                                </div>
                            </div>

                            {/* Details Sidebar */}
                            <div className="w-full max-w-md space-y-6">
                                <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-indigo-100/50 border border-white">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-100">
                                            {selectedChild.photo_url ? (
                                                <img src={selectedChild.photo_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-300">
                                                    <User size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800 leading-tight">{selectedChild.full_name}</h2>
                                            <p className="text-gray-500">{selectedChild.cedula}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex justify-between items-center group hover:bg-indigo-50 hover:border-indigo-100 transition-colors">
                                            <span className="text-gray-500 font-medium">Grado</span>
                                            <span className="font-bold text-gray-800">{selectedChild.grades?.name || 'N/A'}</span>
                                        </div>
                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex justify-between items-center group hover:bg-indigo-50 hover:border-indigo-100 transition-colors">
                                            <span className="text-gray-500 font-medium">Año Lectivo</span>
                                            <span className="font-bold text-gray-800">{selectedChild.academic_year || new Date().getFullYear()}</span>
                                        </div>
                                        <div className="p-4 rounded-xl bg-green-50 border border-green-100 flex justify-between items-center">
                                            <span className="text-green-600 font-medium">Estado</span>
                                            <span className="font-bold text-green-700 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                Activo
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
