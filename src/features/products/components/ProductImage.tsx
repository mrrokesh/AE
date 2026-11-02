import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Product photo from the live site, with a neutral fallback if it fails to load. */
export function ProductImage({
  src,
  alt,
  className,
}: {
  src?: string
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={cn('flex items-center justify-center overflow-hidden bg-white', className)}>
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="size-full object-contain p-1.5"
        />
      ) : (
        <ImageOff className="size-6 text-fg-subtle" aria-hidden />
      )}
    </div>
  )
}
