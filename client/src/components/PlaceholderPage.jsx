import { Construction } from 'lucide-react'

export default function PlaceholderPage({ title, icon: Icon = Construction, message = "Esta función estará disponible próximamente." }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-indigo-100">
                <Icon size={48} className="text-[var(--primary-color)]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">{title}</h1>
            <p className="text-gray-500 max-w-md mx-auto text-lg leading-relaxed">
                {message}
            </p>
            <button className="mt-8 btn-secondary" onClick={() => window.history.back()}>
                Regresar
            </button>
        </div>
    )
}
