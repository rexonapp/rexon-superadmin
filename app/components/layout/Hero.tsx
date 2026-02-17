'use client'
import { useState, useEffect, useRef } from 'react';
import { Home, Building2, Users, ChevronRight, Sparkles, ChevronDown } from 'lucide-react';
import PropertySearch from '../search/propertysearch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&q=80&auto=format&fit=crop'
];

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=20&q=10&auto=format&fit=crop&blur=10',
  'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=20&q=10&auto=format&fit=crop&blur=10',
  'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=20&q=10&auto=format&fit=crop&blur=10',
  'https://images.unsplash.com/photo-1553413077-190dd305871c?w=20&q=10&auto=format&fit=crop&blur=10'
];

const CINEMATIC_PRESETS = [
  { startZoom: 1.15, endZoom: 1.15, startX: -35, endX: 35, startY: 0, endY: 0 },   // Left to Right
  { startZoom: 1.15, endZoom: 1.15, startX: 35, endX: -35, startY: 0, endY: 0 },   // Right to Left
  { startZoom: 1.18, endZoom: 1.18, startX: -30, endX: 30, startY: 0, endY: 0 },   // Left to Right (slower)
  { startZoom: 1.18, endZoom: 1.18, startX: 30, endX: -30, startY: 0, endY: 0 }    // Right to Left (slower)
];

export default function HeroWithBanner() {
  const [bannerImages, setBannerImages] = useState<string[]>(DEFAULT_IMAGES);
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  const heroRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const router = useRouter();

  // Track current slide and visibility in refs to avoid unnecessary React re-renders
  const currentSlideRef = useRef(0);
  const isHeroVisibleRef = useRef(true);
  const lastFrameTimeRef = useRef(0);

  const transitionStartTime = useRef<number>(0);
  const isTransitioning = useRef(false);
  const targetSlide = useRef(0);
  const slideStartTime = useRef<number>(Date.now());

  useEffect(() => {
    fetchBannerImages();
  }, []);

  useEffect(() => {
    if (bannerImages.length === 0) return;

    console.log('🖼️ Loading banner images:', bannerImages);

    const generatePlaceholderUrl = (src: string): string => {
      if (src.includes('unsplash.com')) {
        const url = src.replace(/w=\d+/, 'w=20').replace(/q=\d+/, 'q=10');
        return url.includes('blur=') ? url : url + '&blur=10';
      }
      return src;
    };

    const isUsingDefaultImages = JSON.stringify(bannerImages) === JSON.stringify(DEFAULT_IMAGES);
    console.log('🎯 Using default images?', isUsingDefaultImages);

    const placeholderUrls = isUsingDefaultImages
      ? PLACEHOLDER_IMAGES
      : bannerImages.map(generatePlaceholderUrl);

    const placeholderPromises = placeholderUrls.map((src) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        if (src.includes('unsplash.com')) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    });

    Promise.all(placeholderPromises)
      .then((placeholders) => {
        console.log('✅ Placeholder images loaded:', placeholders.length);
        setLoadedImages(placeholders); 
      })
      .catch((error) => {
        console.log('❌ Placeholder preload error:', error);
      });

    const highResPromises = bannerImages.map((src, index) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();

        if (src.includes('unsplash.com')) {
          img.crossOrigin = 'anonymous';
        }

        // Add priority hint for first image
        if (index === 0) {
          img.fetchPriority = 'high';
        }
        img.onload = () => {
          console.log(`✅ High-res image ${index + 1} loaded:`, src);
          resolve(img);
        };
        img.onerror = (error) => {
          console.log(`❌ Failed to load image ${index + 1}: ${src}`, error);
          reject(error);
        };
        img.src = src;
      });
    });

    Promise.all(highResPromises)
      .then((images) => {
        console.log('✅ All high-res images loaded successfully:', images.length);
        setLoadedImages(images); 
      })
      .catch((error) => {
        console.log('❌ High-res image preload error:', error);
      });
  }, [bannerImages]);

  useEffect(() => {
    if (loadedImages.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false
    });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const resizeCanvas = () => {
      // Slightly lower DPR cap to reduce fill rate cost
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Reset transform before applying new scale to avoid accumulation
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      if (!ctx || loadedImages.length === 0) return;

      const now = Date.now();

      // Throttle to ~30fps to reduce CPU/GPU load
      if (now - lastFrameTimeRef.current < 33) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTimeRef.current = now;
      const currentIndex = currentSlideRef.current;
      const currentImg = loadedImages[currentIndex];
      const nextImg = loadedImages[targetSlide.current];

      const slideProgress = Math.min((now - slideStartTime.current) / 10000, 1);
      const easeProgress = slideProgress; // Linear for video-like feel

      // If hero is not visible or tab is hidden, skip heavy drawing work
      if (!isHeroVisibleRef.current || typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const effectiveDpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const canvasWidth = canvas.width / effectiveDpr;
      const canvasHeight = canvas.height / effectiveDpr;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      if (isTransitioning.current) {
        const transitionDuration = 1500; // 1.5 seconds for seamless video-like transition
        const transitionProgress = Math.min((now - transitionStartTime.current) / transitionDuration, 1);
        const fadeProgress = transitionProgress; // Linear fade for video-like feel

        drawImageWithCinematicMovement(ctx, canvasWidth, canvasHeight, currentImg, currentIndex, easeProgress, 1 - fadeProgress);

        drawImageWithCinematicMovement(ctx, canvasWidth, canvasHeight, nextImg, targetSlide.current, 0, fadeProgress);

        if (transitionProgress >= 1) {
          isTransitioning.current = false;
          currentSlideRef.current = targetSlide.current;
          slideStartTime.current = now;
        }
      } else {
        drawImageWithCinematicMovement(ctx, canvasWidth, canvasHeight, currentImg, currentIndex, easeProgress, 1);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const slideInterval = setInterval(() => {
      if (!isTransitioning.current) {
        const nextIndex = (currentSlideRef.current + 1) % loadedImages.length;
        startTransition(nextIndex);
      }
    }, 10000);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearInterval(slideInterval);
    };
  }, [loadedImages]);

  // Track when the hero is actually visible in the viewport, to avoid heavy work when scrolled away
  useEffect(() => {
    if (!heroRef.current) return;

    const element = heroRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isHeroVisibleRef.current = entry.isIntersecting;
      },
      {
        threshold: 0.1
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const drawImageWithCinematicMovement = (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    img: HTMLImageElement,
    slideIndex: number,
    progress: number,
    opacity: number
  ) => {
    const preset = CINEMATIC_PRESETS[slideIndex % CINEMATIC_PRESETS.length];

    const currentZoom = preset.startZoom + (preset.endZoom - preset.startZoom) * progress;
    const currentX = preset.startX + (preset.endX - preset.startX) * progress;
    const currentY = preset.startY + (preset.endY - preset.startY) * progress;

    ctx.save();
    ctx.globalAlpha = opacity;

    const canvasAspect = canvasWidth / canvasHeight;
    const imgAspect = img.width / img.height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasAspect > imgAspect) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgAspect;
      offsetX = 0;
      offsetY = (canvasHeight - drawHeight) / 2;
    } else {
      drawWidth = canvasHeight * imgAspect;
      drawHeight = canvasHeight;
      offsetX = (canvasWidth - drawWidth) / 2;
      offsetY = 0;
    }

    const zoomedWidth = drawWidth * currentZoom;
    const zoomedHeight = drawHeight * currentZoom;
    const zoomOffsetX = offsetX - (zoomedWidth - drawWidth) / 2 + currentX;
    const zoomOffsetY = offsetY - (zoomedHeight - drawHeight) / 2 + currentY;

    ctx.drawImage(img, zoomOffsetX, zoomOffsetY, zoomedWidth, zoomedHeight);
    ctx.restore();
  };

  const startTransition = (nextIndex: number) => {
    if (isTransitioning.current) return;
    targetSlide.current = nextIndex;
    isTransitioning.current = true;
    transitionStartTime.current = Date.now();
  };

  const fetchBannerImages = async () => {
    try {
      console.log('🔄 Fetching banner images from API...');
      const response = await fetch('/api/banner-images');

      console.log('📡 API Response status:', response.status, response.statusText);

      const data = await response.json();
      console.log('📦 API Response data:', data);

      if (response.ok) {
        if (data.images && data.images.length > 0) {
          console.log('✅ Loaded custom banner images from API:', data.images.length);
          console.log('🖼️ Image URLs:', data.images);
          setBannerImages(data.images);
          return;
        } else {
          console.log('⚠️ API returned empty images array:', data);
        }
      } else {
        console.log('❌ API request failed:', response.status, data);
      }

      console.log('🎨 Using default banner images');
    } catch (error) {
      console.log('💥 API fetch error:', error);
      console.log('🎨 Falling back to default images');
    }
  };

  const scrollToNextSection = () => {
    const heroHeight = window.innerHeight;
    window.scrollTo({
      top: heroHeight,
      behavior: 'smooth'
    });
  };

  return (
    <section
      ref={heroRef}
      className="relative w-full h-screen min-h-[600px] max-h-[1080px] overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: 'block' }}
      />

      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Global vertical darkening for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/45"></div>

        {/* Stronger bottom fade so cards and lower text always read well */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 via-black/40 to-transparent"></div>

        {/* Subtle top fade to keep navbar area readable on bright skies */}
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-black/35 via-black/20 to-transparent"></div>

        {/* Focused center vignette behind headline + search for busy images */}
        <div className="absolute inset-x-[5%] top-[10%] bottom-[30%] bg-gradient-radial from-black/55 via-black/40 to-transparent opacity-95" />
      </div>

      <div className="absolute inset-0 z-20 flex flex-col justify-start items-center px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 md:pt-12 lg:pt-10">
        <div className="w-full max-w-7xl mx-auto space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5">

          <div className="text-center space-y-1.5 sm:space-y-2 md:space-y-2.5 animate-cinematic-entry">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 shadow-xl mb-2 sm:mb-3 hover:bg-white/15 hover:border-white/30 transition-all duration-300">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-medium text-white tracking-wide">
                India's Most Advanced Property Platform
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-white drop-shadow-2xl tracking-tight">
              List. Discover. Connect.
            </h1>

            <p className="text-xs sm:text-sm md:text-base lg:text-lg max-w-4xl mx-auto text-white/95 drop-shadow-lg font-normal">
              Properties by Owners, Agents & Builders – All in One Place
            </p>
          </div>

          {/* Search Section with responsive spacing */}
          <div className="w-full max-w-4xl mx-auto animate-slide-up-delayed-1 mt-1 py-3.5 sm:py-5 md:py-6 lg:py-[7.5rem]">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-orange-500/20 via-orange-400/30 to-orange-500/20 blur-xl opacity-60 rounded-3xl"></div>
              <div className="relative">
                <PropertySearch />
              </div>
            </div>
          </div>

          {/* Cards Section with tighter top spacing on large screens */}
          <div className="w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-3 animate-slide-up-delayed-2 py-3.5 sm:py-5 md:py-6 lg:pt-6 lg:pb-10 px-2 sm:px-0">

  <Card
    onClick={() => router.push('/property')}
    className="group relative border-2 border-blue-400/40 hover:border-orange-500 bg-white/10 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-400 cursor-pointer overflow-hidden hover:bg-white/15 transform hover:-translate-y-1.5 hover:scale-[1.02]"
  >
    {/* Glow effect */}
    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/25 group-hover:to-orange-500/25 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
    
    {/* Glossy top shine */}
    <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-xl"></div>

    <CardHeader className="pb-1 pt-2 px-2.5 sm:px-3.5">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl flex-shrink-0 border border-white/20">
          <Home className="h-3 w-3 sm:h-4 sm:w-4 text-white drop-shadow-lg" />
        </div>
        <CardTitle className="text-[11px] sm:text-sm md:text-base font-bold text-white group-hover:text-orange-200 transition-colors duration-300 text-left leading-tight">
          Property Owner
        </CardTitle>
      </div>
    </CardHeader>

    <CardContent className="pb-2 px-2.5 sm:px-3.5 space-y-0.5 sm:space-y-1">
      <CardDescription className="text-[9px] sm:text-xs leading-snug sm:leading-relaxed text-white/90 text-left line-clamp-2">
        List your warehouse or commercial property and connect with verified buyers
      </CardDescription>
      <div className="flex items-center text-orange-200 font-semibold text-[9px] sm:text-xs group-hover:gap-1.5 gap-1 transition-all duration-300 pt-0.5">
        <span>Get Started</span>
        <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 transform group-hover:translate-x-1 transition-transform duration-300" />
      </div>
    </CardContent>
  </Card>

  <Card
    onClick={() => router.push('/agent/join')}
    className="group relative border-2 border-blue-400/40 hover:border-orange-500 bg-white/10 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-400 cursor-pointer overflow-hidden hover:bg-white/15 transform hover:-translate-y-1.5 hover:scale-[1.02]"
  >
    {/* Glow effect */}
    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/25 group-hover:to-orange-500/25 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
    
    {/* Glossy top shine */}
    <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-xl"></div>

    <CardHeader className="pb-1 pt-2 px-2.5 sm:px-3.5">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl flex-shrink-0 border border-white/20">
          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white drop-shadow-lg" />
        </div>
        <CardTitle className="text-[11px] sm:text-sm md:text-base font-bold text-white group-hover:text-orange-200 transition-colors duration-300 text-left leading-tight">
          Real Estate Agent
        </CardTitle>
      </div>
    </CardHeader>

    <CardContent className="pb-2 px-2.5 sm:px-3.5 space-y-0.5 sm:space-y-1">
      <CardDescription className="text-[9px] sm:text-xs leading-snug sm:leading-relaxed text-white/90 text-left line-clamp-2">
        Manage multiple properties and connect with potential clients efficiently
      </CardDescription>
      <div className="flex items-center text-orange-200 font-semibold text-[9px] sm:text-xs group-hover:gap-1.5 gap-1 transition-all duration-300 pt-0.5">
        <span>Join Now</span>
        <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 transform group-hover:translate-x-1 transition-transform duration-300" />
      </div>
    </CardContent>
  </Card>

  <Card
    onClick={() => router.push('/customer')}
    className="group relative border-2 border-blue-400/40 hover:border-orange-500 bg-white/10 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-400 cursor-pointer overflow-hidden hover:bg-white/15 transform hover:-translate-y-1.5 hover:scale-[1.02] sm:col-span-2 lg:col-span-1"
  >
    {/* Glow effect */}
    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/25 group-hover:to-orange-500/25 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
    
    {/* Glossy top shine */}
    <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-xl"></div>

    <CardHeader className="pb-1 pt-2 px-2.5 sm:px-3.5">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl flex-shrink-0 border border-white/20">
          <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-white drop-shadow-lg" />
        </div>
        <CardTitle className="text-[11px] sm:text-sm md:text-base font-bold text-white group-hover:text-orange-200 transition-colors duration-300 text-left leading-tight">
          Company / Customer
        </CardTitle>
      </div>
    </CardHeader>

    <CardContent className="pb-2 px-2.5 sm:px-3.5 space-y-0.5 sm:space-y-1">
      <CardDescription className="text-[9px] sm:text-xs leading-snug sm:leading-relaxed text-white/90 text-left line-clamp-2">
        Find the perfect warehouse or commercial space for your business needs
      </CardDescription>
      <div className="flex items-center text-orange-200 font-semibold text-[9px] sm:text-xs group-hover:gap-1.5 gap-1 transition-all duration-300 pt-0.5">
        <span>Find Space</span>
        <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 transform group-hover:translate-x-1 transition-transform duration-300" />
      </div>
    </CardContent>
  </Card>

</div>
        </div>
      </div>

      <button
        onClick={scrollToNextSection}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 group cursor-pointer"
        aria-label="Scroll to next section"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-white/15 border-2 border-white/35 flex items-center justify-center group-hover:bg-white/25 group-hover:border-white/50 transition-all duration-300 group-hover:scale-110 shadow-xl">
            <ChevronDown className="w-6 h-6 text-white drop-shadow-lg" />
          </div>
          <span className="text-xs text-white/90 font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-md">
            Scroll Down
          </span>
        </div>
      </button>

      <style jsx>{`
        @keyframes cinematic-entry {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up-delayed {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes arrow-pulse {
          0%, 100% {
            opacity: 1;
            transform: translateY(0);
          }
          50% {
            opacity: 0.6;
            transform: translateY(5px);
          }
        }

        .animate-cinematic-entry {
          animation: cinematic-entry 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-slide-up-delayed-1 {
          animation: slide-up-delayed 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
        }

        .animate-slide-up-delayed-2 {
          animation: slide-up-delayed 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2.5s ease-in-out infinite;
        }

        .animate-arrow-pulse {
          animation: arrow-pulse 2s ease-in-out infinite;
        }

        /* Performance optimizations */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        canvas {
          image-rendering: auto;
          image-rendering: -webkit-optimize-contrast;
          will-change: transform;
          transform: translateZ(0);
        }

        /* (Glassmorphism blur on hero cards was reduced/removed for scroll performance) */
      `}</style>
    </section>
  );
}