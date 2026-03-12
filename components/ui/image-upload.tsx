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
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0])
        }
    }

    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) return
        const reader = new FileReader()
        reader.onload = () => {
            setSelectedImageSrc(reader.result as string)
            setIsCropperOpen(true)
        }
        reader.readAsDataURL(file)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0])
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
        <div className={`${label ? 'space-y-4' : ''} ${className}`}>
            {label && (
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {label}
                    </label>
                </div>
            )}

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative group border-2 border-dashed rounded-xl transition-all duration-200 overflow-hidden cursor-pointer w-full
                    ${isDragging ? 'border-[#DBC278] bg-[#DBC278]/5' : 'border-zinc-800 bg-[#1c1c1c] hover:border-zinc-700 hover:bg-zinc-900'}
                    ${aspectRatio === 'square' ? 'aspect-square h-full' : 'h-48'}
                `}
                onClick={() => !preview && fileInputRef.current?.click()}
            >
                {preview ? (
                    <div
                        className="relative w-full h-full group cursor-pointer"
                        onClick={() => document.getElementById(`file-input-${label}`)?.click()}
                    >
                        <img
                            src={preview || ""}
                            alt={label}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-2.5 flex justify-center items-center border-t border-white/10 z-10">
                            <p className="text-white text-xs font-bold tracking-wide flex items-center gap-2">
                                <Upload className="w-3.5 h-3.5" />
                                CARREGAR NOVA FOTO
                            </p>
                        </div>

                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
                            onClick={(e) => {
                                e.stopPropagation()
                                onUpload("")
                                setPreview(null)
                            }}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 group-hover:text-zinc-300 w-full p-2 text-center">
                        <ImageIcon className={`w-8 h-8 mb-2 transition-all ${isDragging ? 'text-[#DBC278] scale-110' : 'opacity-40'}`} />
                        <span className="text-[10px] font-medium text-zinc-400 group-hover:text-zinc-300">
                            {isDragging ? 'Solte a imagem aqui' : 'Clique ou arraste'}
                        </span>
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
                ref={fileInputRef}
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
                    imageSrc={selectedImageSrc as string}
                    onCropComplete={handleCropComplete}
                />
            )}
        </div>
    )
}
