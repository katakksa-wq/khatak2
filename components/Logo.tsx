import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
  linkTo?: string;
}

export default function Logo({ 
  width = 40, 
  height = 40, 
  showText = false,
  className = '',
  linkTo = '/'
}: LogoProps) {
  const logoComponent = (
    <div className={`d-flex align-items-center ${className}`}>
      <Image 
        src="/logo1.svg" 
        alt="Khatak Logo" 
        width={width} 
        height={height}
        priority
      />
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="text-decoration-none text-dark">
        {logoComponent}
      </Link>
    );
  }

  return logoComponent;
} 