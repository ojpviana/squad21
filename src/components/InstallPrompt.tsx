import { useState, useEffect } from "react";
import { X, Share, PlusSquare, MoreVertical, Smartphone } from "lucide-react";

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isMobile = isIos || isAndroid;
    const isDismissed = sessionStorage.getItem('install-prompt-dismissed');

    if (isIos) setPlatform("ios");
    else if (isAndroid) setPlatform("android");

    if (isMobile && !isStandalone && !isDismissed) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-5 shadow-2xl shadow-primary/10 backdrop-blur-xl">
        <button 
          onClick={() => { setShow(false); sessionStorage.setItem('install-prompt-dismissed', 'true'); }}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            {/* Adicionamos a "/" antes para garantir o carregamento da logo */}
            <img src="/logo.png" alt="Squad 21" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-foreground">Instale o Squad 21</h4>
            <p className="text-[11px] text-muted-foreground leading-tight">Acesse sua central de performance direto da tela inicial.</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 rounded-lg bg-secondary/40 p-3 text-[10px] text-muted-foreground leading-relaxed border border-border/50">
          {platform === "ios" ? (
            <p className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground text-xs">No seu iPhone:</span> toque em <Share size={14} className="inline text-primary" /> e selecione <span className="font-bold text-foreground italic">"Adicionar à Tela de Início"</span> <PlusSquare size={14} className="inline text-primary" />.
            </p>
          ) : (
            <p className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground text-xs">No seu Android:</span> toque nos três pontos <MoreVertical size={14} className="inline text-primary" /> no topo do Chrome e selecione <span className="font-bold text-foreground italic">"Instalar Aplicativo"</span> ou <Smartphone size={14} className="inline text-primary" />.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}