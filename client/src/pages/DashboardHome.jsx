import { useState, useEffect } from 'react'
import {
    Users,
    CreditCard,
    TrendingUp,
    UserCheck,
    Camera
} from 'lucide-react'
import { supabase } from '../services/supabase'

export default function DashboardHome() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeCarnets: 0,
        pendingPhotos: 0,
        totalParents: 0,
        completionRate: 0
    })

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            // Fetch Counts using robust count queries
            const { count: studentCount, error: err1 } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })

            const { count: photoCount, error: err2 } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .not('photo_url', 'is', null)
                .neq('photo_url', '')

            const { count: parentCount, error: err3 } = await supabase
                .from('parents')
                .select('*', { count: 'exact', head: true })

            if (err1 || err2 || err3) throw new Error('Error fetching stats')

            const total = studentCount || 0
            const active = photoCount || 0
            const pending = total - active
            const parents = parentCount || 0
            const rate = total > 0 ? Math.round((active / total) * 100) : 0

            setStats({
                totalStudents: total,
                activeCarnets: active,
                pendingPhotos: pending,
                totalParents: parents,
                completionRate: rate
            })

        } catch (error) {
            console.error('Error loading dashboard stats:', error)
        }
    }

    return (
        <div className="flex flex-col gap-6">

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Card 1: Students */}
                <div className="widget-card p-6 flex items-center justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[var(--primary-color)] mb-4">
                            <Users size={20} />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-800">{stats.totalStudents}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400 font-medium">Total Estudiantes</span>
                        </div>
                    </div>
                </div>

                {/* Stats Card 2: Parents */}
                <div className="widget-card p-6 flex items-center justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-500 mb-4">
                            <UserCheck size={20} />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-800">{stats.totalParents}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400 font-medium">Padres Registrados</span>
                        </div>
                    </div>
                </div>

                {/* Stats Card 3: Pending Photos */}
                <div className="widget-card p-6 flex items-center justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-4">
                            <Camera size={20} />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-800">{stats.pendingPhotos}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400 font-medium">Fotos Pendientes</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ID Cards Status Widget */}
                <div className="widget-card lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-1 flex flex-col items-center justify-center border-r border-gray-100 pr-4">
                        <h3 className="text-lg font-bold text-gray-800 self-start mb-4">Estado de Carnets</h3>

                        <div className="relative w-40 h-40">
                            <div className="w-full h-full rounded-full"
                                style={{
                                    background: `conic-gradient(#10b981 0% ${stats.completionRate}%, #e2e8f0 ${stats.completionRate}% 100%)`,
                                    maskImage: 'radial-gradient(transparent 60%, black 61%)',
                                    WebkitMaskImage: 'radial-gradient(transparent 60%, black 61%)'
                                }}>
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-gray-800">{stats.completionRate}%</span>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Completado</span>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-2 pl-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-gray-400 uppercase">Resumen de Emisión</h4>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 font-medium">Carnets Activos (Con Foto)</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.completionRate}%` }}></div>
                                    </div>
                                    <span className="font-bold text-gray-800">{stats.activeCarnets}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 font-medium">Pendientes de Foto</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${stats.totalStudents > 0 ? (stats.pendingPhotos / stats.totalStudents) * 100 : 0}%` }}></div>
                                    </div>
                                    <span className="font-bold text-gray-800">{stats.pendingPhotos}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attendance Chart (Kept but simplified layout) */}
                <div className="widget-card">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Actividad Reciente</h3>
                    </div>

                    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                        Gráfico de actividad próximamente
                    </div>
                </div>

            </div>
        </div>
    )
}
