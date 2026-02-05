import { ArrowRight } from 'lucide-react'

export default function DashboardGradientWidget({
    title,
    value,
    subtitle,
    icon: Icon,
    gradient = 'bg-gradient-to-br from-green-400 to-emerald-600',
    delay = 0
}) {
    return (
        <div
            className={`analytics-card ${gradient} group`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="dotPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1" fill="currentColor" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#dotPattern)" />
                </svg>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-sm">
                        <Icon size={24} className="text-white" />
                    </div>
                    <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm border border-white/10">
                        {subtitle}
                    </span>
                </div>

                <div>
                    <h3 className="text-4xl font-bold mb-1 tracking-tight">{value}</h3>
                    <p className="text-sm font-medium text-white/80">{title}</p>
                </div>
            </div>

            {/* Hover Decoration */}
            <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 text-white/50">
                <ArrowRight size={20} />
            </div>

            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        </div>
    )
}
