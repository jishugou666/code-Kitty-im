import { useState, useEffect, useRef } from 'react';

interface ImageWithLazyLoadProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function ImageWithLazyLoad({
  src,
  alt,
  className = '',
  fallbackClassName = 'bg-gray-200 dark:bg-gray-700 animate-pulse',
  onClick,
  style
}: ImageWithLazyLoadProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = imgRef.current;
    if (!element || !src) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.onload = () => setLoaded(true);
          img.onerror = () => setError(true);
          img.src = src.includes('?') ? `${src}&_t=${Date.now()}` : `${src}?_t=${Date.now()}`;
          
          observerRef.current?.unobserve(element);
        }
      },
      { rootMargin: '50px' }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src]);

  if (!src) {
    return (
      <div 
        ref={imgRef as any} 
        className={`inline-block ${fallbackClassName}`}
        style={style}
      />
    );
  }

  if (error) {
    return (
      <div 
        ref={imgRef as any}
        className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 ${className}`}
        style={{ width: style?.width || '40px', height: style?.height || '40px', ...style }}
        onClick={onClick}
      >
        <span className="text-white text-xs font-bold">
          {(alt || '?').charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div 
          ref={imgRef as any}
          className={`${fallbackClassName} ${className}`}
          style={style}
        />
      )}
      <img
        ref={loaded ? undefined : (imgRef as any)}
        src={loaded ? (src.includes('?') ? `${src}&_t=${Date.now()}` : `${src}?_t=${Date.now()}`) : undefined}
        alt={alt}
        className={`${className} ${!loaded ? 'absolute opacity-0' : ''}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        onClick={onClick}
        style={style}
      />
    </>
  );
}