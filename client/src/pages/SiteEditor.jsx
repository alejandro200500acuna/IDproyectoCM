import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Link } from 'react-router-dom'
import { Save, Loader2, Layout } from 'lucide-react'

export default function SiteEditor() {
    const [title, setTitle] = useState('Schooltec')
    // Defaults matching index.css
    const [colors, setColors] = useState({
        primary: localStorage.getItem('theme_primary') || '#4361ee',
        sidebar: localStorage.getItem('theme_sidebar') || '#4361ee',
        headings: localStorage.getItem('theme_headings') || '#1f2937'
    })
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchSiteSettings()
        // Apply initial colors from storage immediately
        applyColors(colors)
    }, [])

    const applyColors = (cols) => {
        const root = document.documentElement
        root.style.setProperty('--primary-color', cols.primary)
        root.style.setProperty('--sidebar-bg', cols.sidebar)
        root.style.setProperty('--heading-color', cols.headings)
    }

    const handleColorChange = (key, value) => {
        const newColors = { ...colors, [key]: value }
        setColors(newColors)
        applyColors(newColors)
    }

    const fetchSiteSettings = async () => {
        try {
            setLoading(true)
            // Load Sidebar Title
            const { data: titleData } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'sidebar_title')
                .maybeSingle()

            if (titleData) setTitle(titleData.value)

        } catch (error) {
            console.error('Error fetching site settings', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            // 1. Save Title
            const { data: existingTitle } = await supabase
                .from('site_settings')
                .select('*')
                .eq('key', 'sidebar_title')
                .maybeSingle()

            if (existingTitle) {
                await supabase.from('site_settings').update({ value: title, updated_at: new Date() }).eq('key', 'sidebar_title')
            } else {
                await supabase.from('site_settings').insert([{ key: 'sidebar_title', value: title }])
            }

            // 2. Save Colors to LocalStorage (for client-side persistence)
            localStorage.setItem('theme_primary', colors.primary)
            localStorage.setItem('theme_sidebar', colors.sidebar)
            localStorage.setItem('theme_headings', colors.headings)
            localStorage.setItem('site_sidebar_title', title)

            alert('Configuración guardada correctamente.')

        } catch (error) {
            alert('Error al guardar: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                        Editor del Sitio
                    </h1>
                    <p className="text-gray-500 mt-1">Personaliza la apariencia y configuración de la plataforma .</p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl">
                <div className="flex items-center gap-2 mb-6 text-gray-800 font-bold text-lg border-b border-gray-100 pb-4">
                    <Layout className="text-indigo-500" />
                    <h2>Configuración Barra Lateral</h2>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Título de la Plataforma (Barra Lateral)
                        </label>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-700"
                                placeholder="Ej: Schooltec"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Este nombre aparecerá en la parte superior izquierda de la barra lateral.
                        </p>
                    </div>

                    <div className="w-full h-px bg-gray-100 my-4"></div>

                    {/* Color Customization */}
                    <div>
                        <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
                            Paleta de Colores
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Primary Color */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600">Color Botones / Principal</label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <input
                                        type="color"
                                        value={colors.primary}
                                        onChange={(e) => handleColorChange('primary', e.target.value)}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                                    />
                                    <span className="text-sm font-mono text-gray-500 uppercase">{colors.primary}</span>
                                </div>
                            </div>

                            {/* Sidebar Color */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600">Color Barra Lateral</label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <input
                                        type="color"
                                        value={colors.sidebar}
                                        onChange={(e) => handleColorChange('sidebar', e.target.value)}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                                    />
                                    <span className="text-sm font-mono text-gray-500 uppercase">{colors.sidebar}</span>
                                </div>
                            </div>

                            {/* Heading Color */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600">Color de Títulos</label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <input
                                        type="color"
                                        value={colors.headings}
                                        onChange={(e) => handleColorChange('headings', e.target.value)}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                                    />
                                    <span className="text-sm font-mono text-gray-500 uppercase">{colors.headings}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={() => {
                                    handleColorChange('primary', '#4361ee')
                                    handleColorChange('sidebar', '#4361ee')
                                    handleColorChange('headings', '#1f2937')
                                }}
                                className="text-xs text-indigo-500 font-medium hover:underline"
                            >
                                Restaurar valores por defecto
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
                        >
                            {saving ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <Save size={20} />
                            )}
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
