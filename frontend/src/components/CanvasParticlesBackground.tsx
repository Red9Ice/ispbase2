/**
 * @file: CanvasParticlesBackground.tsx
 * @description: Компонент фона с анимированными частицами на Canvas (как в WelcomeScreen)
 * @created: 2026-01-27
 */

import { useEffect, useRef } from 'react';
import './CanvasParticlesBackground.css';

interface CanvasParticlesBackgroundProps {
  className?: string;
}

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

export function CanvasParticlesBackground({ className = '' }: CanvasParticlesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();

  // Инициализация и анимация частиц (точная копия из WelcomeScreen)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Создание частиц (те же параметры, что в WelcomeScreen)
    const particleCount = 80; // Увеличено количество частиц для большей яркости
    const colors = [
      { r: 102, g: 126, b: 234 }, // Основной цвет (более яркий)
      { r: 118, g: 75, b: 162 }, // Фиолетовый
      { r: 255, g: 182, b: 0 },  // Более яркий оранжевый
      { r: 255, g: 140, b: 0 },  // Оранжевый
      { r: 0, g: 200, b: 255 },  // Голубой для контраста
    ];

    particlesRef.current = Array.from({ length: particleCount }, (_, i) => {
      const color = colors[i % colors.length];
      return {
        id: i,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1, // Уменьшен размер частиц (1-3 вместо 2.5-7.5)
        speedX: (Math.random() - 0.5) * 1.2, // Увеличена скорость движения
        speedY: (Math.random() - 0.5) * 1.2,
        opacity: Math.random() * 0.5 + 0.6, // Увеличена непрозрачность (0.6-1.1 вместо 0.3-0.7)
        color: color,
      };
    });

    // Анимация частиц
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        // Обновление позиции
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Отскок от краев
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

        // Ограничение позиций
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));

        // Рисование частицы с более ярким градиентом
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 1.5 // Увеличен радиус градиента для более яркого свечения
        );
        // Более яркий центр с максимальной непрозрачностью
        gradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${Math.min(particle.opacity * 1.2, 1)})`);
        gradient.addColorStop(0.5, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.opacity * 0.8})`);
        gradient.addColorStop(1, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0)`);

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Рисование более ярких связей между близкими частицами
        particlesRef.current.forEach((otherParticle) => {
          if (particle.id >= otherParticle.id) return;

          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) { // Увеличено расстояние для связей (120 -> 150)
            // Более яркая и контрастная непрозрачность
            const opacity = 0.5 * (1 - distance / 150); // Увеличена базовая непрозрачность для большей контрастности
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);

            // Более яркий и контрастный градиент для линии
            const lineGradient = ctx.createLinearGradient(
              particle.x, particle.y,
              otherParticle.x, otherParticle.y
            );
            // Увеличена яркость и контрастность цветов в градиенте
            lineGradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${opacity * 1.4})`);
            lineGradient.addColorStop(0.5, `rgba(${Math.floor((particle.color.r + otherParticle.color.r) / 2)}, ${Math.floor((particle.color.g + otherParticle.color.g) / 2)}, ${Math.floor((particle.color.b + otherParticle.color.b) / 2)}, ${opacity * 1.2})`);
            lineGradient.addColorStop(1, `rgba(${otherParticle.color.r}, ${otherParticle.color.g}, ${otherParticle.color.b}, ${opacity * 1.4})`);

            ctx.strokeStyle = lineGradient;
            ctx.lineWidth = 3; // Увеличена толщина линии для большей контрастности
            ctx.lineCap = 'round'; // Скругленные концы для более четкого вида
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
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`canvas-particles-background ${className}`}
    />
  );
}
