/**
 * @file: ParticlesBackground.tsx
 * @description: Компонент фона с анимированными частицами, соединенными линиями, реагирующими на движение курсора
 * @created: 2026-01-27
 */

import { useEffect, useState, useRef, useMemo } from 'react';
import './ParticlesBackground.css';

interface ParticlesBackgroundProps {
  particleCount?: number;
  className?: string;
  connectionDistance?: number; // Максимальное расстояние для соединения частиц
}

interface ParticleBase {
  id: number;
  x: number;
  y: number;
  delay: number;
  size: number;
  glowDelay: number;
  color: string; // Цвет частицы
  vx: number; // Скорость по X
  vy: number; // Скорость по Y
  baseSpeed: number; // Исходная скорость частицы
}

interface Connection {
  from: ParticleBase;
  to: ParticleBase;
  distance: number;
}

// Цветовая палитра для частиц
const PARTICLE_COLORS = [
  { main: 'rgba(102, 126, 234, 0.8)', glow: 'rgba(102, 126, 234, 1)' }, // Синий
  { main: 'rgba(59, 130, 246, 0.8)', glow: 'rgba(59, 130, 246, 1)' }, // Голубой
  { main: 'rgba(255, 140, 0, 0.8)', glow: 'rgba(255, 140, 0, 1)' }, // Оранжевый
  { main: 'rgba(251, 191, 36, 0.8)', glow: 'rgba(251, 191, 36, 1)' }, // Желтый
  { main: 'rgba(118, 75, 162, 0.8)', glow: 'rgba(118, 75, 162, 1)' }, // Фиолетовый
];

// Простой генератор псевдослучайных чисел с фиксированным seed
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

// Фиксированный seed для стабильной генерации частиц
const PARTICLES_SEED = 12345;

// Генерируем частицы один раз и сохраняем в памяти
let cachedParticles: ParticleBase[] | null = null;

function generateParticles(particleCount: number): ParticleBase[] {
  // Если частицы уже сгенерированы, возвращаем их
  if (cachedParticles && cachedParticles.length === particleCount) {
    return cachedParticles;
  }

  const rng = new SeededRandom(PARTICLES_SEED);
  const particles: ParticleBase[] = Array.from({ length: particleCount }, (_, i) => {
    const colorIndex = Math.floor(rng.next() * PARTICLE_COLORS.length);
    // Генерируем случайную скорость для движения частиц (равномерная скорость)
    const speed = 0.18; // Постоянная скорость для всех частиц (немного замедлена)
    const angle = rng.next() * Math.PI * 2; // Случайное направление
    return {
      id: i,
      x: rng.next() * 100,
      y: rng.next() * 100,
      delay: rng.next() * 3,
      glowDelay: rng.next() * 4,
      size: rng.next() * 3 + 2,
      color: PARTICLE_COLORS[colorIndex].main,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      baseSpeed: speed, // Сохраняем исходную скорость
    };
  });

  cachedParticles = particles;
  return particles;
}

export function ParticlesBackground({ 
  particleCount = 60, 
  className = '',
  connectionDistance = 15 
}: ParticlesBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [particlesBase, setParticlesBase] = useState<ParticleBase[]>([]);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number>();

  // Инициализируем частицы один раз с фиксированным seed
  useEffect(() => {
    const initialParticles = generateParticles(particleCount);
    setParticlesBase(initialParticles);
  }, [particleCount]);

  // Анимация движения частиц с отталкиванием от курсора
  useEffect(() => {
    if (particlesBase.length === 0) return;

    let isRunning = true;

    const animate = () => {
      if (!isRunning) return;

      setParticlesBase(prevParticles => {
        if (prevParticles.length === 0) return prevParticles;
        
        return prevParticles.map(particle => {
          let newVx = particle.vx;
          let newVy = particle.vy;
          // Используем фиксированную скорость для всех частиц
          const baseSpeed = 0.18; // Всегда одинаковая скорость для всех частиц

          // Отталкивание от курсора (если курсор присутствует)
          if (mousePosition) {
            const dx = particle.x - mousePosition.x;
            const dy = particle.y - mousePosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Максимальное расстояние влияния курсора
            const maxInfluenceDistance = 15;
            
            if (distance < maxInfluenceDistance && distance > 0) {
              // Сила отталкивания обратно пропорциональна расстоянию (более плавная)
              const force = (1 - distance / maxInfluenceDistance) * 0.12;
              const angle = Math.atan2(dy, dx);
              
              // Применяем силу отталкивания
              newVx += Math.cos(angle) * force;
              newVy += Math.sin(angle) * force;
            }
          }

          // ВСЕГДА нормализуем скорость к базовой, чтобы она была постоянной
          const currentSpeed = Math.sqrt(newVx * newVx + newVy * newVy);
          if (currentSpeed > 0) {
            newVx = (newVx / currentSpeed) * baseSpeed;
            newVy = (newVy / currentSpeed) * baseSpeed;
          } else {
            // Если скорость равна нулю (не должно происходить, но на всякий случай)
            const angle = Math.random() * Math.PI * 2;
            newVx = Math.cos(angle) * baseSpeed;
            newVy = Math.sin(angle) * baseSpeed;
          }

          // Применяем скорость
          let newX = particle.x + newVx;
          let newY = particle.y + newVy;

          // Отскок от краев экрана (без потери скорости)
          if (newX <= 0 || newX >= 100) {
            newVx = -newVx; // Сохраняем скорость, только меняем направление
            newX = Math.max(0, Math.min(100, newX));
            // Нормализуем после отскока
            const speedAfterBounce = Math.sqrt(newVx * newVx + newVy * newVy);
            if (speedAfterBounce > 0) {
              newVx = (newVx / speedAfterBounce) * baseSpeed;
              newVy = (newVy / speedAfterBounce) * baseSpeed;
            }
          }
          if (newY <= 0 || newY >= 100) {
            newVy = -newVy; // Сохраняем скорость, только меняем направление
            newY = Math.max(0, Math.min(100, newY));
            // Нормализуем после отскока
            const speedAfterBounce = Math.sqrt(newVx * newVx + newVy * newVy);
            if (speedAfterBounce > 0) {
              newVx = (newVx / speedAfterBounce) * baseSpeed;
              newVy = (newVy / speedAfterBounce) * baseSpeed;
            }
          }

          return {
            ...particle,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            baseSpeed: particle.baseSpeed || 0.18, // Гарантируем сохранение baseSpeed
          };
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [particlesBase.length, mousePosition]);

  // Отслеживаем движение мыши
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
      }
    };

    const handleMouseLeave = () => {
      setMousePosition(null);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove, { passive: true });
      container.addEventListener('mouseleave', handleMouseLeave, { passive: true });
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  // Вычисляем соединения между частицами с интенсивностью на основе расстояния
  const connectionsWithIntensity = useMemo(() => {
    const conns: Array<Connection & { intensity: number }> = [];
    for (let i = 0; i < particlesBase.length; i++) {
      for (let j = i + 1; j < particlesBase.length; j++) {
        const p1 = particlesBase[i];
        const p2 = particlesBase[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
          // Линия появляется плавно при приближении частиц
        if (distance < connectionDistance) {
          // Интенсивность от 0 до 1 в зависимости от расстояния
          // Чем ближе частицы, тем ярче линия (увеличена контрастность)
          const proximity = 1 - (distance / connectionDistance);
          const intensity = Math.max(0, Math.min(1, proximity * 1.0)); // Максимальная интенсивность 1.0 (было 0.9)
          conns.push({ from: p1, to: p2, distance, intensity });
        }
      }
    }
    return conns;
  }, [particlesBase, connectionDistance]);

  // Вычисляем интенсивность для каждой частицы (увеличена контрастность)
  const particlesWithIntensity = useMemo(() => {
    if (!mousePosition) {
      return particlesBase.map(p => ({ ...p, intensity: 0.65, scale: 1 })); // Увеличена базовая интенсивность
    }

    return particlesBase.map((particle) => {
      // Вычисляем расстояние от курсора до частицы
      const dx = mousePosition.x - particle.x;
      const dy = mousePosition.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Максимальное расстояние влияния (в процентах экрана)
      const maxDistance = 20;
      
      // Вычисляем интенсивность: чем ближе к курсору, тем ярче
      let intensity = 0.65; // Базовая интенсивность увеличена для контрастности
      let scale = 1; // Базовый масштаб
      
      if (distance < maxDistance) {
        const proximity = 1 - distance / maxDistance;
        // Интенсивность от 0.65 до 1.0 (более контрастная)
        intensity = Math.min(1.0, 0.65 + proximity * 0.35);
        // Масштаб от 1x до 3x для частиц рядом с курсором
        scale = 1 + proximity * 2; // От 1x до 3x
      }
      
      return { ...particle, intensity, scale };
    });
  }, [particlesBase, mousePosition]);


  // Получаем цвета для частиц
  const getParticleColor = (color: string) => {
    const colorObj = PARTICLE_COLORS.find(c => c.main === color) || PARTICLE_COLORS[0];
    return colorObj;
  };

  // Получаем размеры контейнера для правильного вычисления координат
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`particles-background ${className}`}
    >
      {/* SVG для линий с градиентами */}
      {containerSize.width > 0 && containerSize.height > 0 && (
        <svg 
          className="particles-connections" 
          viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
          preserveAspectRatio="none"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <defs>
            {connectionsWithIntensity
              .filter(conn => conn.intensity > 0.05) // Создаем градиенты только для видимых линий
              .map((conn) => {
                const fromColor = getParticleColor(conn.from.color);
                const toColor = getParticleColor(conn.to.color);
                const gradientId = `gradient-${conn.from.id}-${conn.to.id}`;
                
                return (
                  <linearGradient key={gradientId} id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={fromColor.glow} stopOpacity={conn.intensity} />
                    <stop offset="100%" stopColor={toColor.glow} stopOpacity={conn.intensity} />
                  </linearGradient>
                );
              })}
          </defs>
          {connectionsWithIntensity
            .filter(conn => conn.intensity > 0.05) // Показываем только видимые линии
            .map((conn) => {
              const gradientId = `gradient-${conn.from.id}-${conn.to.id}`;
              const x1 = (conn.from.x / 100) * containerSize.width;
              const y1 = (conn.from.y / 100) * containerSize.height;
              const x2 = (conn.to.x / 100) * containerSize.width;
              const y2 = (conn.to.y / 100) * containerSize.height;
              
              return (
                <line
                  key={`${conn.from.id}-${conn.to.id}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={`url(#${gradientId})`}
                  strokeWidth="1"
                  opacity={conn.intensity}
                  className="particle-connection"
                />
              );
            })}
        </svg>
      )}

      {/* Плавающие частицы с эффектом подсветки */}
      {particlesWithIntensity.map((particle) => {
        const colorObj = getParticleColor(particle.color);
        // Вычисляем размер свечения в зависимости от интенсивности (увеличена контрастность)
        const baseIntensity = 0.65;
        const maxGlowSize = 70; // Увеличено для большей контрастности
        const minGlowSize = 4; // Увеличено для большей видимости
        const intensityRange = 1.0 - baseIntensity;
        const normalizedIntensity = (particle.intensity - baseIntensity) / intensityRange;
        const glowSize = minGlowSize + normalizedIntensity * (maxGlowSize - minGlowSize);
        
        const scale = particle.scale || 1;
        const blurAmount = Math.max(0.1, 1 - particle.intensity * 0.8); // Меньше blur для большей контрастности
        
        return (
          <div
            key={particle.id}
            className="floating-particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: Math.min(1, particle.intensity * 1.4), // Увеличено для большей контрастности
              transform: `translateZ(0) scale(${scale})`,
              boxShadow: `0 0 ${glowSize}px ${colorObj.glow}, 0 0 ${glowSize * 1.5}px ${colorObj.glow}95, 0 0 ${glowSize * 2}px ${colorObj.glow}70, 0 0 ${glowSize * 2.5}px ${colorObj.glow}40`,
              filter: `blur(${blurAmount}px)`,
            }}
          />
        );
      })}
    </div>
  );
}
