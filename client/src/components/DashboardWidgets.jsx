
import { Headphones, AtSign, Layers, Plus } from 'lucide-react'

export const AnalyticsCard = ({ title, description, count, tag, iconType, color }) => {
    // Icon mapping
    const Icons = {
        headphones: Headphones,
        at: AtSign,
        layers: Layers
    }
    const Icon = Icons[iconType] || Layers

    // Modern Gradient mapping
    const gradients = {
        red: 'var(--gradient-red)',
        blue: 'var(--gradient-blue)',
        green: 'var(--gradient-primary)',
        purple: 'var(--gradient-purple)',
        orange: 'var(--gradient-orange)',
        yellow: 'var(--gradient-orange)'
    }

    const bgStyle = {
        background: gradients[color] || gradients.green
    }

    return (
        <div className="analytics-card" style={bgStyle}>
            <div className="flex justify-between items-start z-10">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <Icon size={24} className="text-white" />
                </div>
                <span className="text-xs font-bold text-white/80 uppercase tracking-wider bg-black/10 px-2 py-1 rounded">{tag}</span>
            </div>

            <div className="z-10 mt-auto">
                <div className="text-3xl font-bold mb-1">{count}</div>
                <h3 className="text-lg font-medium opacity-90 mb-1">{title}</h3>
                <p className="text-sm opacity-70">{description}</p>
            </div>
        </div>
    )
}

export const AddNewCard = () => (
    <div className="add-card group">
        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
            <Plus size={24} />
        </div>
        <span className="mt-3 font-medium text-sm">Crear Reporte</span>
    </div>
)
