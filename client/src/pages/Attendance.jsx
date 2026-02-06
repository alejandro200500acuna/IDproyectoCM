import { Shield, Clock, Calendar } from 'lucide-react'

export default function Attendance() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800 font-display">Control de Asistencia</h2>
            </div>

            <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-6">
                    <Clock size={48} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Módulo en Desarrollo</h3>
                <p className="text-gray-500 max-w-md">
                    Pronto podrás gestionar la asistencia de estudiantes y profesores desde este panel.
                </p>
            </div>
        </div>
    )
}
