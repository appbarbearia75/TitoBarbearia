"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Image from "next/image" // Keeping for potential future use or if other parts need it, though currently unused in snippet
import { ImageCropper } from "@/components/ImageCropper"

interface ImageUploadProps {
    label: string
    bucket: string
    currentUrl?: string | null
    onUpload: (url: string) => void
    aspectRatio?: "square" | "video" // square for avatar, video for cover
    className?: string
}

export function ImageUpload({
    label,
    bucket,
    currentUrl,
    onUpload,
    aspectRatio = "square",
    className
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState(currentUrl)
    const [isCropperOpen, setIsCropperOpen] = useState(false)
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            const reader = new FileReader()
            reader.onload = () => {
                setSelectedImageSrc(reader.result as string)
                setIsCropperOpen(true)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleCropComplete = async (croppedImageBlob: Blob) => {
        setUploading(true)
        try {
            const fileName = `${Math.random().toString(36).substring(2)}.jpg`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, croppedImageBlob)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath)

            onUpload(publicUrl)
            setPreview(publicUrl)
        } catch (error) {
            console.error("Error uploading image:", error)
            alert("Erro ao fazer upload da imagem.")
        } finally {
            setUploading(false)
            setSelectedImageSrc(null)
        }
    }

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                </label>
            </div>

            <div
                className={`
                    relative group border-2 border-dashed border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors bg-zinc-900 overflow-hidden
                    ${aspectRatio === 'square' ? 'h-32 w-32' : 'h-48 w-full'}
                `}
            >
                {preview ? (
                    <>
                        <div className="relative w-full h-full">
                            <img
                                src={preview}
                                alt={label}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => document.getElementById(`file-input-${label}`)?.click()}
                            >
                                <Upload className="w-3 h-3 mr-2" />
                                Alterar
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onUpload("")
                                    setPreview(null)
                                }}
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 hover:text-zinc-300">
                        <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs hover:bg-zinc-800"
                            onClick={() => document.getElementById(`file-input-${label}`)?.click()}
                        >
                            Selecionar
                        </Button>
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 transition-opacity">
                        <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
                    </div>
                )}
            </div>

            <input
                id={`file-input-${label}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                onClick={(e) => (e.target as any).value = null}
            />

            {selectedImageSrc && (
                <ImageCropper
                    isOpen={isCropperOpen}
                    onOpenChange={setIsCropperOpen}
                    imageSrc={selectedImageSrc}
                    onCropComplete={handleCropComplete}
                />
            )}
        </div>
    )
}
