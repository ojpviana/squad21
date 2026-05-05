import { Link } from "@tanstack/react-router";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean; 
}

export function Logo({ size = "md", className = "", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-10",
    md: "h-14",
    lg: "h-20 md:h-24",
  };

  const textClasses = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-4xl md:text-5xl",
  };

  // Ajuste fino: Margem negativa proporcional ao tamanho para compensar o espaço vazio da imagem
  const marginClasses = {
    sm: "-ml-2",
    md: "-ml-3", // Puxa o suficiente para o painel do Coach/Student sem atropelar
    lg: "-ml-8 md:-ml-10", // Puxa forte para a Landing Page onde a imagem é enorme
  };

  return (
    <Link 
      to="/" 
      search={{ invite: undefined }} 
      className={`flex items-center justify-center transition-opacity hover:opacity-90 ${className}`}
    >
      <img 
        src="/logo.png" 
        alt="Squad 21" 
        className={`${sizeClasses[size]} w-auto object-contain`} 
      />

      {showText && (
        <span className={`font-bold tracking-tight text-foreground ${textClasses[size]} ${marginClasses[size]}`}>
          Squad <span className="text-primary">21</span>
        </span>
      )}
    </Link>
  );
}