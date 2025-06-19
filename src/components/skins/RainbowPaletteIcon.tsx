
import type React from 'react';
import { cn } from '@/lib/utils';

// A simple SVG component for the rainbow palette icon
// The cn utility is included if you want to pass className for sizing, but the SVG has fixed size here.
const RainbowPaletteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg 
      width="32" 
      height="32" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn(props.className)} // Allows passing className for sizing if needed
      {...props} // Spread other SVG props
    >
      <defs>
        <radialGradient id="paint0_radial_rainbow_icon" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(12 12) rotate(90) scale(12)">
          <stop stopColor="#FF0000"/>
          <stop offset="0.16" stopColor="#FF7F00"/>
          <stop offset="0.33" stopColor="#FFFF00"/>
          <stop offset="0.5" stopColor="#00FF00"/>
          <stop offset="0.67" stopColor="#0000FF"/>
          <stop offset="0.83" stopColor="#4B0082"/>
          <stop offset="1" stopColor="#9400D3"/>
        </radialGradient>
      </defs>
      <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22Z" fill="url(#paint0_radial_rainbow_icon)"/>
      <path d="M15.5 8C15.5 7.72386 15.2761 7.5 15 7.5H9C8.72386 7.5 8.5 7.72386 8.5 8V8.5C8.5 8.77614 8.72386 9 9 9H10V12.5C10 14.1569 11.3431 15.5 13 15.5C14.6569 15.5 16 14.1569 16 12.5V8Z" fill="white" transform="translate(0 -0.5)"/>
    </svg>
  );
};

export default RainbowPaletteIcon;
