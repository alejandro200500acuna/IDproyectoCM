import { useState, useRef, useEffect } from 'react'
import {
    Type,
    Image as ImageIcon,
    Square,
    Move,
    Trash2,
    Save,
    Download,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Bold,
    Italic,
    Pencil,
    FileText,
    ArrowLeft
} from 'lucide-react'
import { supabase } from '../services/supabase'

export default function IDDesigner() {
    const [view, setView] = useState('gallery') // 'gallery' | 'editor'
    const [loading, setLoading] = useState(true)
    const [grades, setGrades] = useState([])
    const [projects, setProjects] = useState([])

    const [assignedGrades, setAssignedGrades] = useState([])

    // Editor State
    const [contextMenu, setContextMenu] = useState(null)
    const [currentProject, setCurrentProject] = useState(null)
    const [elements, setElements] = useState([])
    const [selectedElement, setSelectedElement] = useState(null)
    const [dragInfo, setDragInfo] = useState(null)

    // Close context menu on global click
    useEffect(() => {
        const handleClick = () => setContextMenu(null)
        window.addEventListener('click', handleClick)
        return () => window.removeEventListener('click', handleClick)
    }, [])
    const canvasRef = useRef(null)
    const fileInputRef = useRef(null)
    const [orientation, setOrientation] = useState('horizontal')
    const [uploadType, setUploadType] = useState('element')

    // Initial Fetch
    useEffect(() => {
        fetchProjects()
        fetchGrades()
    }, [])

    const fetchProjects = async () => {
        // We might want to list linked grades names in the gallery, but for now simple select is enough
        const { data } = await supabase.from('id_templates').select('*, grades(name)').order('updated_at', { ascending: false })
        setProjects(data || [])
        setLoading(false)
    }

    const fetchGrades = async () => {
        const { data } = await supabase.from('grades').select('*').order('name')
        setGrades(data || [])
    }

    // --- Actions ---

    const startNewProject = () => {
        setCurrentProject(null)
        setAssignedGrades([])
        setElements([
            { id: 1, type: 'text', content: 'Carmen Lyra School', x: 20, y: 20, fontSize: 18, fontWeight: 'bold', color: '#4f46e5' },
            { id: 2, type: 'placeholder', field: 'photo', x: 20, y: 60, width: 100, height: 120 },
            { id: 3, type: 'placeholder', field: 'full_name', x: 140, y: 70, fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
            { id: 4, type: 'placeholder', field: 'grade', x: 140, y: 100, fontSize: 14, color: '#64748b' },
        ])
        setOrientation('horizontal')
        setView('editor')
    }

    const openProject = async (project) => {
        setCurrentProject(project)
        setElements(project.elements || [])
        setOrientation(project.orientation || 'horizontal')

        // Fetch assigned grades
        const { data } = await supabase
            .from('id_template_grades')
            .select('grade_id')
            .eq('template_id', project.id)

        if (data) {
            setAssignedGrades(data.map(g => g.grade_id))
        } else {
            setAssignedGrades([])
        }

        setView('editor')
    }

    const deleteProject = async (e, projectId) => {
        e.stopPropagation()
        if (confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
            await supabase.from('id_templates').delete().eq('id', projectId)
            fetchProjects()
        }
    }

    const renameProject = async (e, projectId) => {
        e.stopPropagation()
        const project = projects.find(p => p.id === projectId)
        const newName = prompt('Nuevo nombre del proyecto:', project.name)
        if (newName && newName.trim() !== '') {
            await supabase.from('id_templates').update({ name: newName.trim(), updated_at: new Date().toISOString() }).eq('id', projectId)
            fetchProjects()
        }
    }

    const handleSave = async () => {
        let projectName = currentProject ? currentProject.name : ''
        if (!projectName) {
            projectName = `Diseño de Carnet ${new Date().toLocaleDateString()}`
        }

        const inputName = prompt("Nombre del diseño:", projectName)
        if (inputName === null) return
        if (inputName.trim() !== '') projectName = inputName.trim()

        const templateData = {
            name: projectName,
            orientation: orientation,
            elements: elements,
            updated_at: new Date().toISOString(),
        }

        try {
            let savedProjectId = currentProject?.id

            if (savedProjectId) {
                // Update
                const { error } = await supabase
                    .from('id_templates')
                    .update(templateData)
                    .eq('id', savedProjectId)
                if (error) throw error
            } else {
                // Insert
                const { data, error } = await supabase
                    .from('id_templates')
                    .insert([templateData])
                    .select()
                    .single()
                if (error) throw error
                savedProjectId = data.id
                setCurrentProject(data)
            }

            // Process Assigned Grades
            // 1. Delete existing links
            await supabase.from('id_template_grades').delete().eq('template_id', savedProjectId)

            // 2. Insert new links
            if (assignedGrades.length > 0) {
                const gradesToInsert = assignedGrades.map(gid => ({
                    template_id: savedProjectId,
                    grade_id: gid
                }))
                const { error: gradeError } = await supabase.from('id_template_grades').insert(gradesToInsert)
                if (gradeError) throw gradeError
            }

            fetchProjects()
            alert('¡Diseño guardado correctamente!')
        } catch (error) {
            alert('Error al guardar: ' + error.message)
        }
    }

    // --- Editor Helpers ---

    const triggerDesignUpload = () => {
        setUploadType('bg')
        setTimeout(() => fileInputRef.current?.click(), 0)
    }

    const triggerImageUpload = () => {
        setUploadType('element')
        setTimeout(() => fileInputRef.current?.click(), 0)
    }

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (event) => {
            const img = new Image()
            img.src = event.target.result
            img.onload = () => {
                const aspectRatio = img.width / img.height
                let targetWidth, targetHeight, startX, startY

                if (uploadType === 'bg') {
                    if (orientation === 'horizontal') {
                        targetWidth = 512
                        targetHeight = 325
                    } else {
                        targetWidth = 325
                        targetHeight = 512
                    }
                    startX = 0; startY = 0
                } else {
                    targetWidth = 100
                    targetHeight = targetWidth / aspectRatio
                    startX = 50; startY = 50
                }

                const newEl = {
                    id: Date.now(),
                    type: 'image',
                    src: event.target.result,
                    x: startX,
                    y: startY,
                    width: Math.round(targetWidth),
                    height: Math.round(targetHeight),
                    keepRatio: true,
                    isBackground: uploadType === 'bg'
                }
                const newElements = uploadType === 'bg' ? [newEl, ...elements] : [...elements, newEl]
                setElements(newElements)
                setSelectedElement(newEl.id)
            }
            e.target.value = ''
        }
        reader.readAsDataURL(file)
    }

    const addText = () => {
        const newEl = { id: Date.now(), type: 'text', content: 'Texto...', x: 50, y: 50, fontSize: 14, color: '#1e293b', fontWeight: 'normal' }
        setElements([...elements, newEl])
        setSelectedElement(newEl.id)
    }

    const addPlaceholder = (field) => {
        const newEl = { id: Date.now(), type: 'placeholder', field, x: 50, y: 50, fontSize: 14, color: '#1e293b', width: field === 'photo' ? 120 : undefined, height: field === 'photo' ? 120 : undefined }
        setElements([...elements, newEl])
        setSelectedElement(newEl.id)
    }

    const handleMouseDown = (e, id) => {
        e.stopPropagation()
        const elem = elements.find(el => el.id === id)
        setSelectedElement(id)

        // Prevent moving background elements
        if (elem.isBackground) return

        setDragInfo({ id, startX: e.clientX, startY: e.clientY, initialElemX: elem.x, initialElemY: elem.y })
    }

    const handleContextMenu = (e, id) => {
        e.preventDefault()
        e.stopPropagation()
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            id
        })
    }

    const deleteFromContextMenu = () => {
        if (!contextMenu) return
        setElements(prev => prev.filter(el => el.id !== contextMenu.id))
        if (selectedElement === contextMenu.id) setSelectedElement(null)
        setContextMenu(null)
    }

    const handleMouseMove = (e) => {
        if (!dragInfo) return
        const deltaX = e.clientX - dragInfo.startX
        const deltaY = e.clientY - dragInfo.startY
        setElements(prev => prev.map(el => el.id === dragInfo.id ? { ...el, x: dragInfo.initialElemX + deltaX, y: dragInfo.initialElemY + deltaY } : el))
    }

    const handleMouseUp = () => setDragInfo(null)

    const updateProperty = (key, value) => {
        if (!selectedElement) return
        setElements(prev => prev.map(el => el.id === selectedElement ? { ...el, [key]: value } : el))
    }

    const deleteElement = () => {
        if (!selectedElement) return
        setElements(prev => prev.filter(el => el.id !== selectedElement))
        setSelectedElement(null)
    }

    const getSelectedEl = () => elements.find(el => el.id === selectedElement)


    // --- Render ---

    if (view === 'gallery') {
        return (
            <div className="p-8 h-full overflow-y-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mis Diseños</h1>
                        <p className="text-gray-500">Gestiona los carnets de tu institución</p>
                    </div>
                    <button onClick={startNewProject} className="btn-primary flex items-center gap-2">
                        <div className="bg-white/20 p-1 rounded-lg"><Square size={20} className="text-white" /></div>
                        Nuevo Diseño
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-400">Cargando diseños...</div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-dashed border-gray-300 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6"><ImageIcon size={40} className="text-gray-300" /></div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay diseños aún</h3>
                        <button onClick={startNewProject} className="text-[var(--primary-color)] font-semibold hover:text-indigo-700">Crear mi primer diseño &rarr;</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {projects.map(project => (
                            <div key={project.id} onClick={() => openProject(project)} className="widget-card hover:shadow-lg transition-all cursor-pointer group overflow-hidden flex flex-col p-0 border border-gray-100">
                                <div className="h-40 bg-gray-50 border-b border-gray-100 flex items-center justify-center relative p-4">
                                    <div className="relative bg-white shadow-sm border border-gray-200 overflow-hidden"
                                        style={{
                                            width: project.orientation === 'horizontal' ? '512px' : '325px',
                                            height: project.orientation === 'horizontal' ? '325px' : '512px',
                                            borderRadius: '12px',
                                            transform: 'scale(0.24)', // Scales 512 -> ~123px
                                            transformOrigin: 'center center',
                                            flexShrink: 0
                                        }}>
                                        {/* Background pattern */}
                                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                                        {/* Elements */}
                                        {project.elements && project.elements.map(el => (
                                            <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, zIndex: el.isBackground ? 0 : 10 }}>
                                                {el.type === 'text' && (
                                                    <div style={{ fontSize: el.fontSize, fontWeight: el.fontWeight, fontStyle: el.fontStyle, color: el.color, textAlign: el.textAlign || 'left', whiteSpace: 'nowrap' }}>
                                                        {el.content}
                                                    </div>
                                                )}
                                                {el.type === 'image' && (
                                                    <img src={el.src} alt="" className="w-full h-full object-contain pointer-events-none" />
                                                )}
                                                {el.type === 'placeholder' && (
                                                    <div className="w-full h-full border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                                                        <span className="text-[12px] font-bold text-gray-400 uppercase">{`{${el.field}}`}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); openProject(project) }} className="p-2 bg-white text-indigo-500 rounded-lg shadow-sm hover:bg-indigo-50"><Pencil size={16} /></button>
                                        <button onClick={(e) => renameProject(e, project.id)} className="p-2 bg-white text-gray-500 rounded-lg shadow-sm hover:bg-gray-50"><FileText size={16} /></button>
                                        <button onClick={(e) => deleteProject(e, project.id)} className="p-2 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-800 mb-1 truncate">{project.name}</h3>
                                    <p className="text-xs text-gray-400">Actualizado: {new Date(project.updated_at || project.updatedAt).toLocaleDateString()}</p>
                                    {project.grades && <div className="mt-2 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded inline-block">{project.grades.name}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex h-full gap-6 select-none relative" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />

            {/* Sidebar */}
            <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                    <button onClick={() => setView('gallery')} className="p-1 hover:bg-gray-200 rounded text-gray-500"><Move size={16} className="rotate-180" /></button>
                    <h2 className="font-semibold text-gray-700">Herramientas</h2>
                </div>
                <div className="p-4 flex flex-col gap-3 overflow-y-auto">
                    <button onClick={() => setView('gallery')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 px-1"><ArrowLeft size={18} /><span className="font-medium">Regresar</span></button>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Básicos</div>
                    <button onClick={triggerDesignUpload} className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors text-left shadow-sm mb-2">
                        <div className="w-8 h-8 rounded-full bg-white text-[var(--primary-color)] flex items-center justify-center shadow-sm"><ImageIcon size={18} /></div><span className="text-sm font-bold">Subir Diseño</span>
                    </button>
                    <button onClick={addText} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors text-left group">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-100 transition-colors"><Type size={18} /></div><span className="text-sm font-medium text-gray-700">Texto</span>
                    </button>
                    <button onClick={triggerImageUpload} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors text-left group">
                        <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center group-hover:bg-purple-100 transition-colors"><ImageIcon size={18} /></div><span className="text-sm font-medium text-gray-700">Imagen / Logo</span>
                    </button>
                    <div className="h-px bg-gray-100 my-2"></div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Datos Dinámicos</div>
                    <button onClick={() => addPlaceholder('full_name')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors text-left group">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-[var(--primary-color)] flex items-center justify-center group-hover:bg-indigo-100 transition-colors"><span className="font-bold text-xs">ABC</span></div><span className="text-sm font-medium text-gray-700">Nombre Estudiante</span>
                    </button>
                    <button onClick={() => addPlaceholder('cedula')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors text-left group">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-[var(--primary-color)] flex items-center justify-center group-hover:bg-indigo-100 transition-colors"><span className="font-bold text-xs">ID</span></div><span className="text-sm font-medium text-gray-700">Cédula Estudiante</span>
                    </button>
                    <button onClick={() => addPlaceholder('photo')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors text-left group">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-[var(--primary-color)] flex items-center justify-center group-hover:bg-indigo-100 transition-colors"><ImageIcon size={18} /></div><span className="text-sm font-medium text-gray-700">Foto Estudiante</span>
                    </button>
                    <button onClick={() => addPlaceholder('grade')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors text-left group">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-[var(--primary-color)] flex items-center justify-center group-hover:bg-indigo-100 transition-colors"><span className="font-bold text-xs">GR</span></div><span className="text-sm font-medium text-gray-700">Grado / Sección</span>
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 bg-gray-100 rounded-xl border border-gray-200 flex flex-col relative overflow-hidden">
                <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10 transition-all">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col"><h1 className="font-bold text-gray-800 text-lg">Lienzo</h1>{currentProject && <span className="text-xs text-gray-400">{currentProject.name}</span>}</div>
                        <div className="flex items-center gap-4 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                            <button onClick={() => setOrientation('horizontal')} className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all ${orientation === 'horizontal' ? 'bg-white text-[var(--primary-color)] shadow-sm ring-1 ring-black/5 scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}`}><Square size={16} className="rotate-90" />Horizontal</button>
                            <button onClick={() => setOrientation('vertical')} className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all ${orientation === 'vertical' ? 'bg-white text-[var(--primary-color)] shadow-sm ring-1 ring-black/5 scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}`}><Square size={16} />Vertical</button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="btn-secondary text-sm py-1.5 px-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg flex items-center gap-2"><Save size={16} /> Guardar</button>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-8 overflow-auto relative">
                    <div ref={canvasRef} className="bg-white shadow-2xl relative overflow-hidden transition-all duration-300" style={{ width: orientation === 'horizontal' ? '512px' : '325px', height: orientation === 'horizontal' ? '325px' : '512px', borderRadius: '12px' }}>
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        {elements.map(el => (
                            <div key={el.id} onMouseDown={(e) => handleMouseDown(e, el.id)} onContextMenu={(e) => handleContextMenu(e, el.id)} className={`absolute cursor-move group hover:outline hover:outline-1 hover:outline-indigo-300 ${selectedElement === el.id ? 'outline outline-2 outline-indigo-500 z-50' : 'z-10'}`} style={{ left: el.x, top: el.y, width: el.width, height: el.height }}>
                                {el.type === 'text' && <div style={{ fontSize: el.fontSize, fontWeight: el.fontWeight, fontStyle: el.fontStyle, color: el.color, textAlign: el.textAlign || 'left', whiteSpace: 'nowrap' }}>{el.content}</div>}
                                {el.type === 'image' && <div className="w-full h-full pointer-events-none"><img src={el.src} alt="" className="w-full h-full object-contain pointer-events-none select-none" /></div>}
                                {el.type === 'placeholder' && <div className={`w-full h-full flex items-center justify-center border-2 border-dashed ${selectedElement === el.id ? 'border-indigo-300 bg-indigo-50/50' : 'border-gray-200 bg-gray-50/50'}`}><span className="text-xs font-bold text-gray-400 uppercase pointer-events-none select-none">{selectedElement === el.id ? el.field : `{${el.field}}`}</span></div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Properties */}
            <div className="w-72 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-gray-50"><h2 className="font-semibold text-gray-700">Propiedades</h2></div>
                {selectedElement ? (
                    <div className="p-4 flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs text-gray-500 mb-1 block">X</label><input type="number" value={Math.round(getSelectedEl().x)} className="w-full text-sm p-2 border rounded" onChange={(e) => updateProperty('x', parseInt(e.target.value))} /></div>
                            <div><label className="text-xs text-gray-500 mb-1 block">Y</label><input type="number" value={Math.round(getSelectedEl().y)} className="w-full text-sm p-2 border rounded" onChange={(e) => updateProperty('y', parseInt(e.target.value))} /></div>
                        </div>
                        {/* More properties would go here, simplified for now */}
                        {(getSelectedEl().type === 'text' || getSelectedEl().type === 'placeholder') && (
                            <div><label className="text-xs text-gray-500 mb-1 block">Texto</label><input type="text" value={getSelectedEl().type === 'text' ? getSelectedEl().content : getSelectedEl().field} disabled={getSelectedEl().type === 'placeholder'} className="w-full text-sm p-2 border rounded" onChange={(e) => updateProperty('content', e.target.value)} /></div>
                        )}
                        {(getSelectedEl().type === 'text' || (getSelectedEl().type === 'placeholder' && getSelectedEl().field !== 'photo')) && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs text-gray-500 mb-1 block">Tamaño (px)</label><input type="number" value={getSelectedEl().fontSize || 14} className="w-full text-sm p-2 border rounded" onChange={(e) => updateProperty('fontSize', parseInt(e.target.value))} /></div>
                                    <div><label className="text-xs text-gray-500 mb-1 block">Color</label><input type="color" value={getSelectedEl().color || '#000000'} className="w-full p-1 border rounded h-[38px] cursor-pointer" onChange={(e) => updateProperty('color', e.target.value)} /></div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Estilo y Alineación</label>
                                    <div className="flex gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                                        <button
                                            onClick={() => updateProperty('fontWeight', getSelectedEl().fontWeight === 'bold' ? 'normal' : 'bold')}
                                            className={`flex-1 p-1.5 rounded flex items-center justify-center transition-all ${getSelectedEl().fontWeight === 'bold' ? 'bg-white shadow text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                                            title="Negrita"
                                        >
                                            <Bold size={16} />
                                        </button>
                                        <button
                                            onClick={() => updateProperty('fontStyle', getSelectedEl().fontStyle === 'italic' ? 'normal' : 'italic')}
                                            className={`flex-1 p-1.5 rounded flex items-center justify-center transition-all ${getSelectedEl().fontStyle === 'italic' ? 'bg-white shadow text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                                            title="Cursiva"
                                        >
                                            <Italic size={16} />
                                        </button>
                                        <div className="w-px bg-gray-200 mx-1"></div>
                                        <button
                                            onClick={() => updateProperty('textAlign', 'left')}
                                            className={`flex-1 p-1.5 rounded flex items-center justify-center transition-all ${(!getSelectedEl().textAlign || getSelectedEl().textAlign === 'left') ? 'bg-white shadow text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                                            title="Izquierda"
                                        >
                                            <AlignLeft size={16} />
                                        </button>
                                        <button
                                            onClick={() => updateProperty('textAlign', 'center')}
                                            className={`flex-1 p-1.5 rounded flex items-center justify-center transition-all ${getSelectedEl().textAlign === 'center' ? 'bg-white shadow text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                                            title="Centro"
                                        >
                                            <AlignCenter size={16} />
                                        </button>
                                        <button
                                            onClick={() => updateProperty('textAlign', 'right')}
                                            className={`flex-1 p-1.5 rounded flex items-center justify-center transition-all ${getSelectedEl().textAlign === 'right' ? 'bg-white shadow text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                                            title="Derecha"
                                        >
                                            <AlignRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                        {(getSelectedEl().type === 'image' || getSelectedEl().type === 'placeholder') && (
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs text-gray-500 mb-1 block">W</label><input type="number" value={getSelectedEl().width} className="w-full text-sm p-2 border rounded" onChange={(e) => updateProperty('width', parseInt(e.target.value))} /></div>
                                <div><label className="text-xs text-gray-500 mb-1 block">H</label><input type="number" value={getSelectedEl().height} className="w-full text-sm p-2 border rounded" onChange={(e) => updateProperty('height', parseInt(e.target.value))} /></div>
                            </div>
                        )}
                        <div className="mt-auto pt-6"><button onClick={deleteElement} className="w-full py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"><Trash2 size={16} /> Eliminar</button></div>
                    </div>
                ) : (
                    <div className="p-4 flex flex-col h-full">
                        <div className="flex flex-col items-center justify-center py-6 text-gray-400 gap-2 border-b border-gray-100 mb-4">
                            <Move size={24} className="opacity-20" />
                            <p className="text-xs">Selecciona un elemento para editar</p>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <h3 className="font-semibold text-gray-700 mb-3 text-sm flex items-center gap-2">
                                <span className="w-1 h-4 bg-[var(--primary-color)] rounded-full"></span>
                                Asignar a Grados
                            </h3>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                Selecciona los grados que usarán este diseño de carnet.
                            </p>

                            <div className="space-y-2">
                                {grades.map(grade => (
                                    <label key={grade.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${assignedGrades.includes(grade.id) ? 'bg-[var(--primary-color)] border-[var(--primary-color)]' : 'border-gray-300 bg-white'}`}>
                                            {assignedGrades.includes(grade.id) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={assignedGrades.includes(grade.id)}
                                            onChange={() => setAssignedGrades(prev => prev.includes(grade.id) ? prev.filter(g => g !== grade.id) : [...prev, grade.id])}
                                        />
                                        <span className={`text-sm ${assignedGrades.includes(grade.id) ? 'font-medium text-gray-800' : 'text-gray-600'}`}>{grade.name}</span>
                                    </label>
                                ))}
                                {grades.length === 0 && <div className="text-xs text-gray-400 italic p-2">No hay grados registrados</div>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {contextMenu && (
                <div className="fixed bg-white shadow-xl rounded-lg py-1 border border-gray-200 z-[100] animate-in fade-in zoom-in-95 duration-100" style={{ left: contextMenu.x, top: contextMenu.y }}>
                    <button onClick={deleteFromContextMenu} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2">
                        <Trash2 size={14} /> Eliminar
                    </button>
                </div>
            )}
        </div>
    )
}
