/**
 * @file: ParticlesAnimation.tsx
 * @description: Переиспользуемый компонент анимации частиц для фона
 * @created: 2026-01-27
 */

import { useEffect, useRef } from 'react';
import './ParticlesAnimation.css';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: { r: number; g: number; b: number };
}

interface ParticlesAnimationProps {
  className?: string;
  particleCount?: number;
  opacity?: number;
}

export function ParticlesAnimation({ 
  className = '', 
  particleCount = 80,
  opacity = 1 
}: ParticlesAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container && ctx) {
        // Используем devicePixelRatio для улучшения качества на Retina дисплеях
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        
        // Устанавливаем внутреннее разрешение canvas (высокое качество)
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        // Устанавливаем отображаемый размер (CSS размер)
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        
        // Сбрасываем трансформацию и масштабируем контекст для правильного отображения
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Сброс трансформации
        ctx.scale(dpr, dpr);
        
        // Включаем сглаживание для высокого качества
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
    };

    // Инициализация частиц после первого resize
    const initParticles = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.width / dpr;
      const displayHeight = canvas.height / dpr;
      
      particlesRef.current = Array.from({ length: particleCount }, (_, i) => {
        const color = colors[i % colors.length];
        return {
          id: i,
          x: Math.random() * displayWidth,
          y: Math.random() * displayHeight,
          size: Math.random() * 3 + 1.5, // Немного увеличенный размер для лучшей видимости
          speedX: (Math.random() - 0.5) * 0.4, // Замедлено в 3 раза (было 1.2)
          speedY: (Math.random() - 0.5) * 0.4, // Замедлено в 3 раза (было 1.2)
          opacity: Math.random() * 0.4 + 0.5, // Немного уменьшена непрозрачность
          color: color,
        };
      });
    };
    
    // Создание частиц - объявляем до использования
    const colors = [
      { r: 102, g: 126, b: 234 }, // Основной цвет
      { r: 118, g: 75, b: 162 }, // Фиолетовый
      { r: 255, g: 182, b: 0 },  // Оранжевый
      { r: 255, g: 140, b: 0 },  // Оранжевый
      { r: 0, g: 200, b: 255 },  // Голубой
    ];
    
    resizeCanvas();
    initParticles(); // Инициализируем частицы после первого resize
    window.addEventListener('resize', () => {
      resizeCanvas();
      initParticles(); // Переинициализируем при изменении размера
    });

    // Анимация частиц
    const animate = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.width / dpr;
      const displayHeight = canvas.height / dpr;
      
      // Очищаем canvas с учетом масштаба
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      
      // Включаем сглаживание для более плавного рендеринга
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      particlesRef.current.forEach((particle) => {
        // Обновление позиции (медленнее)
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Отскок от краев с учетом отображаемого размера
        if (particle.x < 0 || particle.x > displayWidth) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > displayHeight) particle.speedY *= -1;

        // Ограничение позиций
        particle.x = Math.max(0, Math.min(displayWidth, particle.x));
        particle.y = Math.max(0, Math.min(displayHeight, particle.y));

        // Рисование частицы с улучшенным градиентом для более плавного вида
        const gradientSize = particle.size * 2.5; // Увеличенный градиент для более плавного перехода
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, gradientSize
        );
        gradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${Math.min(particle.opacity * 1.3, 1) * opacity})`);
        gradient.addColorStop(0.3, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.opacity * 0.9 * opacity})`);
        gradient.addColorStop(0.6, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.opacity * 0.5 * opacity})`);
        gradient.addColorStop(1, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0)`);
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Рисование связей между близкими частицами
        particlesRef.current.forEach((otherParticle) => {
          if (particle.id >= otherParticle.id) return;

          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 180) { // Увеличена дистанция для связей
            const lineOpacity = 0.4 * (1 - distance / 180) * opacity; // Немного уменьшена непрозрачность
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            
            const lineGradient = ctx.createLinearGradient(
              particle.x, particle.y,
              otherParticle.x, otherParticle.y
            );
            lineGradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${lineOpacity * 1.2})`);
            lineGradient.addColorStop(0.5, `rgba(${Math.floor((particle.color.r + otherParticle.color.r) / 2)}, ${Math.floor((particle.color.g + otherParticle.color.g) / 2)}, ${Math.floor((particle.color.b + otherParticle.color.b) / 2)}, ${lineOpacity * 1.0})`);
            lineGradient.addColorStop(1, `rgba(${otherParticle.color.r}, ${otherParticle.color.g}, ${otherParticle.color.b}, ${lineOpacity * 1.2})`);
            
            ctx.strokeStyle = lineGradient;
            ctx.lineWidth = 1.5; // Уменьшена толщина линии для более тонкого вида
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
          }
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [particleCount, opacity]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`particles-animation-canvas ${className}`}
    />
  );
}
