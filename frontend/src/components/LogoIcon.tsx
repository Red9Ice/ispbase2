/**
 * @file: LogoIcon.tsx
 * @description: SVG логотип компании Imlight Show Production
 * @created: 2026-01-27
 */

import './LogoIcon.css';

interface LogoIconProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  showText?: boolean; // Показывать ли текст "Imlight Show Production"
}

export function LogoIcon({ width = 80, height = 80, className = '', showText = false }: LogoIconProps) {
  // Если нужно показать только иконку (сетку 3x3), используем упрощенный viewBox
  // Сетка находится в координатах: 
  // - x: от 51.6 до 180.2 (51.6 + 34.4*3 + 34.4 = 180.2), ширина = 128.6
  // - y: от 42.8 до 171.4 (42.8 + 34.4*3 + 34.4 = 171.4), высота = 128.6
  // Для равных отступов добавляем по 20 единиц со всех сторон
  // viewBox: x = 51.6 - 20 = 31.6, y = 42.8 - 20 = 22.8, width = 128.6 + 40 = 168.6, height = 128.6 + 40 = 168.6
  const iconViewBox = "31.6 22.8 168.6 168.6"; // Область сетки 3x3 с равными отступами (20 единиц со всех сторон)
  // Полный логотип с текстом - обрезаем пустое пространство снизу
  // Логотип заканчивается примерно на y=180, добавляем небольшой отступ снизу (20 единиц)
  const fullViewBox = "0 0 595.3 200"; // Обрезанный viewBox без пустого пространства снизу
  
  // Обрабатываем "auto" для height - не передаем в SVG атрибут, используем только CSS
  const svgHeight = height === 'auto' ? undefined : height;
  const cssHeight = height === 'auto' ? 'auto' : (typeof height === 'number' ? `${height}px` : height);
  
  return (
    <svg 
      width={width} 
      height={svgHeight}
      viewBox={showText ? fullViewBox : iconViewBox}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`logo-icon ${className}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ 
        display: 'block', 
        width: typeof width === 'number' ? `${width}px` : width,
        height: cssHeight,
        margin: '0',
        padding: '0',
        flexShrink: 0
      }}
    >
      <style>
        {`
          .logo-square {
            fill: var(--logo-square-color, #F8B600);
            transition: fill 0.3s ease;
          }
          .logo-text {
            fill: var(--logo-text-color, #333333);
            transition: fill 0.3s ease;
          }
        `}
      </style>
      
      {/* Сетка 3x3 из квадратов с легкой анимацией */}
      <rect x="51.6" y="42.8" className="logo-square" width="34.4" height="34.4"/>
      <rect x="98.7" y="42.8" className="logo-square" width="34.4" height="34.4"/>
      <rect x="145.8" y="42.8" className="logo-square" width="34.4" height="34.4"/>
      <rect x="51.6" y="89.3" className="logo-square" width="34.4" height="34.4"/>
      <rect x="98.7" y="89.3" className="logo-square" width="34.4" height="34.4"/>
      <rect x="145.8" y="89.3" className="logo-square" width="34.4" height="34.4"/>
      <rect x="51.6" y="135.9" className="logo-square" width="34.4" height="34.4"/>
      <rect x="98.7" y="135.9" className="logo-square" width="34.4" height="34.4"/>
      <rect x="145.8" y="135.9" className="logo-square" width="34.4" height="34.4"/>
      
      {/* Текст "Imlight Show Production" - показывается только если showText=true */}
      {showText && (
        <g className="logo-text">
          <g>
            <path className="logo-text" d="M222.8,43.5V74h-8.1V43.5H222.8z"/>
            <path className="logo-text" d="M238.3,43.5l9.5,20.3h0.2l10.3-20.3h9.8V74h-8.1V54.8L251.1,74h-6.5l-8.7-19.2V74H228V43.5H238.3z"/>
            <path className="logo-text" d="M281.3,43.5v23.2h20.1V74h-28.2V43.5H281.3z"/>
            <path className="logo-text" d="M313.6,43.5V74h-8.1V43.5H313.6z"/>
            <path className="logo-text" d="M351.5,55.9V74h-5l-1-1.9c-2.9,1.8-5.9,2.7-10,2.7c-9.5,0-17.1-6.1-17.1-16c0-9.8,7.5-16,17.1-16
              c7.2,0,12.1,2.6,15.7,8.1l-6.4,3.6c-2.4-3.1-4.4-4.4-9.3-4.4c-5.5,0-9,3.2-9,8.6c0,5.5,3.4,8.6,9,8.6c3.8,0,6-0.6,8.3-2v-2.5
              l-7.5-0.3v-6.7H351.5z"/>
            <path className="logo-text" d="M365.2,43.5v11.1h14.9V43.5h8.2V74h-8.2V61.9h-14.9V74h-8.1V43.5H365.2z"/>
            <path className="logo-text" d="M424.4,43.5v7.3h-11.9V74h-8.2V50.8h-11.9v-7.3H424.4z"/>
          </g>
          <g>
            <path className="logo-text" d="M241.8,101.4c-3.5-2.6-7.2-3.6-12-3.6c-5.2,0-6.3,1.2-6.3,2.5c0,1.3,1.3,1.5,3.1,1.7l8.9,1
              c6.7,0.8,10.9,3.5,10.9,9.4c0,7-6.9,10.1-16.1,10.1c-6.3,0-11.1-1.4-16.1-5.2l3.8-6.3c4.1,2.9,8.3,4.4,13,4.4c4.2,0,7.5-0.9,7.5-3
              c0-1-0.3-1.6-2.2-1.8l-10.5-1.2c-6.4-0.8-10.3-3.3-10.3-9.2c0-6.7,6.4-9.8,14.3-9.8c5.8,0,11,1.1,15.9,4.9L241.8,101.4z"/>
            <path className="logo-text" d="M259.2,91.3v11.1h14.9V91.3h8.2v30.5h-8.2v-12.1h-14.9v12.1h-8.1V91.3H259.2z"/>
            <path className="logo-text" d="M304.4,122.5c-9.1,0-17.1-6.4-17.1-16c0-9.5,8-16,17.1-16c9.1,0,17.1,6.5,17.1,16
              C321.5,116.1,313.5,122.5,304.4,122.5z M304.4,115.6c5,0,9-3.5,9-9.1c0-5.6-4-9.1-9-9.1c-5.1,0-9,3.5-9,9.1
              C295.3,112.1,299.3,115.6,304.4,115.6z"/>
          </g>
          <g>
            <path className="logo-text" d="M331.9,91.3l7,23.6h0.2l6-23.6h9.2l5.9,23.6h0.2l7.2-23.6h8.5l-11.1,30.5h-10.5l-5-21.3l-5.2,21.3h-10.4
              l-10.6-30.5H331.9z"/>
          </g>
          <g>
            <g>
              <path className="logo-text" d="M232.7,139.1c7.3,0,12.7,4.9,12.7,12.1s-5.4,11.9-12.7,11.9h-9.9v6.5h-8.1v-30.5H232.7z M222.8,155.6h9.6
                c2.9,0,4.9-1.5,4.9-4.5c0-2.9-2-4.7-4.9-4.7h-9.6V155.6z"/>
              <path className="logo-text" d="M268,139.1c7.3,0,12.7,4.9,12.7,12.1c0,4.5-2.1,8-5.5,10l4.6,8.3h-8.8l-3.5-6.5h-9.5v6.5H250v-30.5H268z
                 M258.1,155.6h9.6c2.9,0,4.9-1.5,4.9-4.5c0-2.9-2-4.7-4.9-4.7h-9.6V155.6z"/>
              <path className="logo-text" d="M301.8,170.3c-9.1,0-17.1-6.5-17.1-16c0-9.5,8-16,17.1-16c9.1,0,17.1,6.4,17.1,16
                C319,163.9,310.9,170.3,301.8,170.3z M301.8,163.4c5,0,9-3.5,9-9.1c0-5.6-4-9.1-9-9.1c-5.1,0-9,3.5-9,9.1
                C292.8,159.9,296.8,163.4,301.8,163.4z"/>
              <path className="logo-text" d="M339.9,139.1c8.2,0,16.4,6.2,16.4,15.2c0,9-8.2,15.3-16.4,15.3h-16v-30.5H339.9z M332,162.1h8
                c4.6,0,8.2-3.4,8.2-7.8c0-4.4-3.6-7.9-8.2-7.9h-8V162.1z"/>
              <path className="logo-text" d="M369,139.1v15.6c0,5.4,2.4,8.5,7.6,8.5c5.2,0,7.6-3.1,7.6-8.5v-15.6h8.2v15.5c0,10.1-6.1,15.7-15.7,15.7
                s-15.7-5.6-15.7-15.7v-15.5H369z"/>
              <path className="logo-text" d="M423.4,150.6c-2.3-3.3-4.9-5.1-9.6-5.1c-5.4,0-9,3.4-9,8.8c0,5.3,3.7,8.8,9,8.8c4.6,0,7.4-1.8,9.5-5l6.3,3.5
                c-3.1,5.8-8.4,8.7-15.7,8.7c-9.8,0-17.1-6.1-17.1-16c0-9.8,7.5-16,17.1-16c7.4,0,12.6,2.9,15.8,8.7L423.4,150.6z"/>
              <path className="logo-text" d="M465.3,139.1v7.3h-11.9v23.2h-8.2v-23.2h-11.9v-7.3H465.3z"/>
              <path className="logo-text" d="M477.7,139.1v30.5h-8.1v-30.5H477.7z"/>
              <path className="logo-text" d="M499.8,170.3c-9.1,0-17.1-6.5-17.1-16c0-9.5,8-16,17.1-16c9.1,0,17.1,6.4,17.1,16
                C516.9,163.9,508.9,170.3,499.8,170.3z M499.8,163.4c5,0,9-3.5,9-9.1c0-5.6-4-9.1-9-9.1c-5.1,0-9,3.5-9,9.1
                C490.8,159.9,494.7,163.4,499.8,163.4z"/>
              <path className="logo-text" d="M529.3,139.1l16.3,18.4v-18.4h8v30.5h-7.4l-16.3-18.4v18.4h-8v-30.5H529.3z"/>
            </g>
          </g>
        </g>
      )}
    </svg>
  );
}
