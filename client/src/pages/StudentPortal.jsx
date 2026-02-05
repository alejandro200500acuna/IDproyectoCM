import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import IDCardRenderer from '../components/IDCardRenderer'
import { LogOut, User, Download } from 'lucide-react'

export default function StudentPortal() {
    const navigate = useNavigate()
    const [student, setStudent] = useState(null)
    const [template, setTemplate] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkSession = async () => {
            const stored = localStorage.getItem('student_user')
            if (!stored) {
                navigate('/login')
                return
            }

            const studentData = JSON.parse(stored)
            setStudent(studentData)

            // Fetch Template linked to Grade
            // 1. Check junction table for specific assignment
            let templateToUse = null;

            if (studentData.grade_id) {
                // Determine ID of grade if stored object is full object or just ID. 
                // In Login.jsx we saw: grades: { name: ... } and flat data. 
                // But `studentData.grade_id` comes from the flat student record returned by RPC. Check Login.jsx again? 
                // Yes, rpc returns `s.id`... and `grade_id` column exists in students table?
                // Wait. `student_login` RPC returns: `id, full_name, cedula, grade_name, photo_url`. 
                // IT DOES NOT RETURN `grade_id`.
                // I need to fetch `grade_id` or update the RPC. 
                // Quick fix: Update RPC in next step? Or fetch student details here?
                // Actually, I should update the RPC to return grade_id too.
                // But since I can't do that within this single `replace_file` tool call easily without context switch...
                // I have `studentData.grade_name`. I could search grade by name?
                // Or I can re-fetch student details here using existing ID.
                // Let's re-fetch student details to be safe and get `grade_id`.

                // Oops, wait. I should check if I really have grade_id.
                // The RPC `student_login` defined in Step 261:
                // returns table (id, full_name, cedula, grade_name, photo_url).
                // NO `grade_id` column returned.
                // I MUST update proper student fetching here.

                // Let's modify the flow to fetch full student record first.
            }

            // Refetch student to get grade_id
            const { data: fullStudent } = await supabase
                .from('students')
                .select('grade_id')
                .eq('id', studentData.id)
                .single()

            const gradeId = fullStudent?.grade_id;

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

            // 2. Fallback: If no specific assignment, get the latest general template
            if (!templateToUse) {
                const { data: latestTemplate } = await supabase
                    .from('id_templates')
                    .select('*')
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()
                templateToUse = latestTemplate
            }

            if (templateToUse) {
                setTemplate(templateToUse)
            } else {
                console.log("No available template found.")
            }
            setLoading(false)
        }

        checkSession()
    }, [navigate])

    const handleLogout = () => {
        localStorage.removeItem('student_user')
        navigate('/login')
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-[var(--primary-color)]">Cargando portal...</div>

    return (
        <div className="min-h-screen bg-[#f1f5f9] font-sans text-gray-800">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[var(--primary-color)] shadow-sm border border-indigo-100">
                            <User size={20} />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-gray-800">Portal Estudiantil</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 text-sm font-semibold"
                    >
                        <LogOut size={18} />
                        <span className="hidden sm:block">Cerrar Sesión</span>
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-12">
                {/* Welcome Section */}
                <div className="text-center mb-16 animate-fade-in-up">
                    <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 mb-4 tracking-tight">
                        ¡Bienvenido, {student?.full_name?.split(' ')[0]}!
                    </h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto font-medium">
                        Tu identidad digital, segura y siempre contigo.
                    </p>
                </div>

                {/* ID Card Display */}
                <div className="flex flex-col items-center gap-10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>

                    {/* Card Container with Glow */}
                    <div className="relative group w-full max-w-2xl transform hover:scale-[1.01] transition-all duration-500">
                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative" id="card-wrapper">
                            <IDCardRenderer template={template} student={student} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                if (window.confirm('¿Desea descargar su Carnet Digital?')) {
                                    const canvas = document.querySelector('#card-wrapper canvas')
                                    if (canvas) {
                                        const link = document.createElement('a')
                                        link.download = `Carnet_${student.cedula || 'Estudiante'}.png`
                                        link.href = canvas.toDataURL('image/png')
                                        link.click()
                                    }
                                }
                            }}
                            className="btn-primary shadow-lg shadow-indigo-500/30 flex items-center gap-2 px-8 py-3 text-lg rounded-2xl hover:scale-105 transition-transform"
                        >
                            <Download size={20} />
                            Descargar Carnet
                        </button>
                    </div>

                    {/* Info Grid (Widgets) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-4xl mt-8">
                        <div className="widget-card text-center group hover:bg-indigo-50 border-indigo-50">
                            <div className="text-xs text-indigo-400 uppercase font-bold mb-2 tracking-wider">Grado Actual</div>
                            <div className="text-xl font-bold text-gray-800">{student?.grades?.name || 'N/A'}</div>
                        </div>
                        <div className="widget-card text-center group hover:bg-indigo-50 border-indigo-50">
                            <div className="text-xs text-indigo-400 uppercase font-bold mb-2 tracking-wider">Identificación</div>
                            <div className="font-mono text-lg font-bold text-gray-800">{student?.cedula}</div>
                        </div>
                        <div className="widget-card text-center group hover:bg-indigo-50 border-indigo-50">
                            <div className="text-xs text-indigo-400 uppercase font-bold mb-2 tracking-wider">Año Lectivo</div>
                            <div className="text-xl font-bold text-gray-800">{student?.academic_year}</div>
                        </div>
                        <div className="widget-card text-center group hover:bg-green-50 border-green-50">
                            <div className="text-xs text-green-500 uppercase font-bold mb-2 tracking-wider">Estado</div>
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
                                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                Activo
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
