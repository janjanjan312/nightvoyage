import React, { useEffect, useRef } from 'react';

const StarField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    
    // Definition for a star
    interface Star {
      x: number;
      y: number;
      r: number;       // Radius
      s: number;       // Speed (vertical)
      a: number;       // Alpha (Current Opacity)
      ta: number;      // Target Alpha (for twinkling)
      ts: number;      // Twinkle Speed
    }

    let stars: Star[] = [];

    const initStars = () => {
      const { innerWidth: w, innerHeight: h } = window;
      const dpr = window.devicePixelRatio || 1;
      
      // Handle High DPI displays for crisp stars
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      
      // Normalize coordinate system
      ctx.scale(dpr, dpr);

      // Increase density: previously /5000, now /800 for ~6x more stars
      // On 1920x1080: ~2500 stars. On Mobile: ~400-500 stars.
      const count = Math.floor((w * h) / 800); 
      
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          // Mix of many tiny stars and fewer larger ones
          r: Math.random() < 0.9 ? Math.random() * 0.8 + 0.2 : Math.random() * 1.5 + 0.5, 
          s: Math.random() * 0.2 + 0.05, // Speed
          a: Math.random(), // Current alpha
          ta: Math.random(), // Target alpha for twinkle
          ts: Math.random() * 0.015 + 0.002 // Slow twinkle speed
        });
      }
    };

    const animate = () => {
      if (!canvas || !ctx) return;
      
      const { innerWidth: w, innerHeight: h } = window;
      
      // Clear canvas (using logic width/height)
      ctx.clearRect(0, 0, w, h);
      
      ctx.fillStyle = '#FFF';
      
      stars.forEach(star => {
        // 1. Move Star Upwards
        star.y -= star.s;
        
        // Wrap around
        if (star.y < 0) {
          star.y = h;
          star.x = Math.random() * w;
        }

        // 2. Twinkle Logic
        // Smoothly transition alpha towards target alpha
        if (star.a > star.ta) {
            star.a -= star.ts;
            if (star.a <= star.ta) {
                star.a = star.ta;
                star.ta = Math.random(); // Pick new target
            }
        } else {
            star.a += star.ts;
            if (star.a >= star.ta) {
                star.a = star.ta;
                star.ta = Math.random(); // Pick new target
            }
        }

        // 3. Draw
        // Use globalAlpha for performance
        ctx.globalAlpha = Math.max(0, Math.min(1, star.a));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    initStars();
    animate();

    const handleResize = () => initStars();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="star-field" />;
};

export default StarField;