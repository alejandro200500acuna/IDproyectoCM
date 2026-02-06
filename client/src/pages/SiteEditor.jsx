import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Link } from 'react-router-dom'
import { Save, Loader2, Layout } from 'lucide-react'

export default function SiteEditor() {
    const [title, setTitle] = useState('Schooltec')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchSiteSettings()
    }, [])

    const fetchSiteSettings = async () => {
        try {
            setLoading(true)
            // Try to get settings from a 'site_settings' table or similar
            // For now, we'll just simulate it or check if we have a table for this
            // Assuming we might need to create such table in a real migration
            // Since we persist via localStorage/state for the "Sidebar" title right now in DashboardLayout (hardcoded),
            // We need a place to store this. 
            // For this implementation, we will use localStorage first to allow immediate functionality
            // without needing immediate SQL migrations if not strictly requested, 
            // but ideally this goes to DB. Let's start with DB check.

            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .eq('key', 'sidebar_title')
                .single()

            if (data) {
                setTitle(data.value)
            } else if (error && error.code !== 'PGRST116') {
                // Ignore "no rows" error, throw others
                console.error('Error fetching settings target:', error)
            }
        } catch (error) {
            console.error('Error fetching site settings', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            // Check if row exists
            const { data: existing } = await supabase
                .from('site_settings')
                .select('*')
                .eq('key', 'sidebar_title')
                .maybeSingle()

            let result;
            if (existing) {
                result = await supabase
                    .from('site_settings')
                    .update({ value: title, updated_at: new Date() })
                    .eq('key', 'sidebar_title')
            } else {
                result = await supabase
                    .from('site_settings')
                    .insert([{ key: 'sidebar_title', value: title }])
            }

            if (result.error) throw result.error

            // Also save to localStorage for immediate non-async sidebar updates if we implemented a listener
            localStorage.setItem('site_sidebar_title', title)

            // Force reload to see changes if simple implementation
            // window.location.reload() 
            // Better: use a context or event, but let's stick to simple alert first
            alert('Título actualizado correctamente. Refresca la página para ver los cambios.')

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

                <div className="space-y-4">
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

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg shadow-indigo-200"
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
