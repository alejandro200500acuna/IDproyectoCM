import { useRef, useEffect } from 'react'
import { Hexagon } from 'lucide-react'

export default function IDCardRenderer({ template, student }) {
    const canvasRef = useRef(null)

    useEffect(() => {
        if (!canvasRef.current || !template) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        // Base dimensions from Designer (512x325)
        const isPortrait = template.orientation === 'vertical'
        const baseWidth = isPortrait ? 325 : 512
        const baseHeight = isPortrait ? 512 : 325
        const scale = 3 // Increase resolution for display

        canvas.width = baseWidth * scale
        canvas.height = baseHeight * scale

        // Clear and set scale
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.scale(scale, scale)

        // Draw Background (White fill first)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, baseWidth, baseHeight)

        const draw = async () => {
            // Sort elements (backgrounds first if any, though array order is usually correct from designer)
            // But Designer stores order in current array.
            const elements = template.elements || []

            for (const el of elements) {
                ctx.save()

                if (el.type === 'image') {
                    if (el.src) {
                        try {
                            await drawImage(ctx, el.src, el.x, el.y, el.width, el.height)
                        } catch (e) {
                            console.error("Failed to load image", el)
                        }
                    }
                } else if (el.type === 'text') {
                    // Static Text
                    ctx.font = `${el.fontStyle || ''} ${el.fontWeight || 'normal'} ${el.fontSize}px 'Outfit', sans-serif`
                    ctx.fillStyle = el.color
                    ctx.textAlign = el.textAlign || 'left'

                    // Vertical alignment approximation
                    ctx.textBaseline = 'top'
                    ctx.fillText(el.content, el.x, el.y)

                } else if (el.type === 'placeholder') {
                    // Dynamic Data
                    let content = ''
                    let isPhoto = false

                    if (el.field === 'full_name') content = student?.full_name || 'Nombre Estudiante'
                    else if (el.field === 'grade') content = student?.grades?.name || 'Grado'
                    else if (el.field === 'photo') isPhoto = true
                    // Add other fields if needed

                    if (isPhoto) {
                        const photoUrl = student?.photo_url || null
                        if (photoUrl) {
                            try {
                                // Draw photo
                                await drawImage(ctx, photoUrl, el.x, el.y, el.width, el.height, true)
                            } catch (e) {
                                // Fallback placeholder
                                drawPlaceholderRect(ctx, el)
                            }
                        } else {
                            drawPlaceholderRect(ctx, el)
                        }
                    } else {
                        // Draw Dynamic Text
                        ctx.font = `${el.fontWeight || 'normal'} ${el.fontSize}px 'Outfit', sans-serif`
                        ctx.fillStyle = el.color
                        ctx.textAlign = 'left' // Placeholders usually left aligned in this designer
                        ctx.textBaseline = 'top'
                        ctx.fillText(content.toUpperCase(), el.x, el.y)
                    }
                }

                ctx.restore()
            }
        }

        draw()

    }, [template, student])

    // Helper to draw image
    const drawImage = (ctx, src, x, y, w, h, objectFit = false) => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.src = src
            img.onload = () => {
                if (objectFit) {
                    // Simulate object-cover behavior
                    // Calculate ratios
                    const imgRatio = img.width / img.height
                    const targetRatio = w / h
                    let renderW, renderH, offsetX, offsetY

                    if (imgRatio > targetRatio) {
                        // Image is wider than container
                        renderH = h
                        renderW = h * imgRatio
                        offsetX = (w - renderW) / 2
                        offsetY = 0
                    } else {
                        // Image is taller
                        renderW = w
                        renderH = w / imgRatio
                        offsetX = 0
                        offsetY = (h - renderH) / 2
                    }

                    ctx.save()
                    ctx.beginPath()
                    ctx.rect(x, y, w, h)
                    ctx.clip()
                    ctx.drawImage(img, x + offsetX, y + offsetY, renderW, renderH)
                    ctx.restore()
                } else {
                    ctx.drawImage(img, x, y, w, h)
                }
                resolve()
            }
            img.onerror = reject
        })
    }

    const drawPlaceholderRect = (ctx, el) => {
        ctx.fillStyle = '#f1f5f9'
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.fillRect(el.x, el.y, el.width, el.height)
        ctx.strokeRect(el.x, el.y, el.width, el.height)
        ctx.setLineDash([])
    }

    if (!template) return (
        <div className="w-full aspect-[1.58] bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-400">
                <Hexagon size={48} className="mx-auto mb-2 opacity-50" />
                <p>No card template assigned</p>
            </div>
        </div>
    )

    return (
        <div className="w-full max-w-2xl mx-auto shadow-2xl rounded-xl overflow-hidden bg-white">
            <canvas
                ref={canvasRef}
                className="w-full h-auto block"
            />
        </div>
    )
}
