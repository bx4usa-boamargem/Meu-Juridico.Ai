import { cn } from "@/lib/utils";

/**
 * Interactive Brazil map with clickable states.
 * States are colored by region when active.
 */

interface BrazilMapProps {
  activeStates: Set<string>;
  onToggleState: (uf: string) => void;
  disabledStates?: Set<string>;
}

// Region color classes (tailwind)
const REGION_COLORS: Record<string, { active: string; label: string }> = {
  norte: { active: "fill-emerald-500", label: "Norte" },
  nordeste: { active: "fill-sky-500", label: "Nordeste" },
  centro_oeste: { active: "fill-amber-500", label: "Centro-Oeste" },
  sudeste: { active: "fill-violet-500", label: "Sudeste" },
  sul: { active: "fill-rose-500", label: "Sul" },
};

interface StateInfo {
  uf: string;
  name: string;
  region: string;
  // Simplified center coordinates for label placement (viewBox 0 0 600 600)
  cx: number;
  cy: number;
  // SVG path
  path: string;
}

// Simplified Brazil state paths (stylized polygons for each state)
const STATES: StateInfo[] = [
  // Norte
  { uf: "AM", name: "Amazonas", region: "norte", cx: 165, cy: 140, path: "M60,60 L260,50 L280,100 L270,180 L220,200 L140,210 L80,190 L50,140 Z" },
  { uf: "PA", name: "Pará", region: "norte", cx: 340, cy: 130, path: "M280,60 L440,55 L450,120 L420,180 L370,200 L280,190 L270,100 Z" },
  { uf: "AC", name: "Acre", region: "norte", cx: 75, cy: 225, path: "M30,200 L130,210 L135,240 L90,260 L30,250 Z" },
  { uf: "RO", name: "Rondônia", region: "norte", cx: 155, cy: 245, path: "M130,210 L200,215 L210,260 L170,280 L130,270 L120,240 Z" },
  { uf: "RR", name: "Roraima", region: "norte", cx: 195, cy: 35, path: "M160,10 L230,10 L240,55 L210,70 L160,60 Z" },
  { uf: "AP", name: "Amapá", region: "norte", cx: 370, cy: 35, path: "M340,10 L400,10 L410,55 L380,75 L340,60 Z" },
  { uf: "TO", name: "Tocantins", region: "norte", cx: 355, cy: 240, path: "M320,190 L390,190 L400,260 L380,310 L340,310 L310,260 Z" },
  // Nordeste
  { uf: "MA", name: "Maranhão", region: "nordeste", cx: 405, cy: 170, path: "M370,120 L450,120 L460,175 L440,210 L380,200 L370,165 Z" },
  { uf: "PI", name: "Piauí", region: "nordeste", cx: 430, cy: 230, path: "M405,180 L465,175 L475,240 L455,280 L410,275 L400,230 Z" },
  { uf: "CE", name: "Ceará", region: "nordeste", cx: 490, cy: 175, path: "M460,140 L530,140 L535,190 L510,210 L465,200 L455,170 Z" },
  { uf: "RN", name: "R.G. do Norte", region: "nordeste", cx: 530, cy: 165, path: "M510,145 L565,145 L565,180 L520,185 Z" },
  { uf: "PB", name: "Paraíba", region: "nordeste", cx: 535, cy: 195, path: "M510,185 L570,185 L570,210 L510,210 Z" },
  { uf: "PE", name: "Pernambuco", region: "nordeste", cx: 525, cy: 225, path: "M475,210 L575,210 L575,240 L475,240 Z" },
  { uf: "AL", name: "Alagoas", region: "nordeste", cx: 545, cy: 255, path: "M520,242 L575,242 L575,265 L525,265 Z" },
  { uf: "SE", name: "Sergipe", region: "nordeste", cx: 535, cy: 278, path: "M515,267 L560,267 L560,290 L520,290 Z" },
  { uf: "BA", name: "Bahia", region: "nordeste", cx: 460, cy: 320, path: "M400,260 L530,260 L540,300 L520,380 L440,400 L380,370 L370,310 Z" },
  // Centro-Oeste
  { uf: "MT", name: "Mato Grosso", region: "centro_oeste", cx: 245, cy: 300, path: "M170,250 L320,250 L330,310 L310,370 L200,370 L170,320 Z" },
  { uf: "GO", name: "Goiás", region: "centro_oeste", cx: 360, cy: 370, path: "M310,330 L400,330 L410,380 L390,420 L340,420 L300,390 Z" },
  { uf: "MS", name: "M.G. do Sul", region: "centro_oeste", cx: 250, cy: 400, path: "M200,370 L310,370 L320,420 L290,460 L220,460 L190,420 Z" },
  { uf: "DF", name: "Distrito Federal", region: "centro_oeste", cx: 380, cy: 345, path: "M370,338 L395,338 L395,355 L370,355 Z" },
  // Sudeste
  { uf: "MG", name: "Minas Gerais", region: "sudeste", cx: 430, cy: 410, path: "M370,370 L510,370 L520,420 L490,460 L390,460 L360,420 Z" },
  { uf: "ES", name: "Espírito Santo", region: "sudeste", cx: 520, cy: 400, path: "M510,375 L555,375 L555,420 L510,420 Z" },
  { uf: "RJ", name: "Rio de Janeiro", region: "sudeste", cx: 495, cy: 470, path: "M460,455 L540,445 L545,475 L500,490 L460,480 Z" },
  { uf: "SP", name: "São Paulo", region: "sudeste", cx: 390, cy: 475, path: "M320,450 L460,450 L470,480 L440,510 L340,510 L300,480 Z" },
  // Sul
  { uf: "PR", name: "Paraná", region: "sul", cx: 350, cy: 520, path: "M290,500 L430,500 L440,530 L400,555 L300,555 L270,530 Z" },
  { uf: "SC", name: "Santa Catarina", region: "sul", cx: 365, cy: 560, path: "M310,550 L410,550 L415,575 L370,590 L310,580 Z" },
  { uf: "RS", name: "R.G. do Sul", region: "sul", cx: 340, cy: 600, path: "M280,580 L390,580 L380,620 L340,650 L280,640 L260,610 Z" },
];

export function BrazilStateMap({ activeStates, onToggleState, disabledStates }: BrazilMapProps) {
  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px]">
        {Object.entries(REGION_COLORS).map(([key, { active, label }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={cn("h-3 w-3 rounded-sm", active.replace("fill-", "bg-"))} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Map */}
      <svg viewBox="0 0 600 670" className="w-full max-w-md mx-auto" style={{ height: "auto" }}>
        {STATES.map((state) => {
          const isActive = activeStates.has(state.uf);
          const isDisabled = disabledStates?.has(state.uf) ?? false;
          const regionColor = REGION_COLORS[state.region];

          return (
            <g key={state.uf} className="cursor-pointer" onClick={() => !isDisabled && onToggleState(state.uf)}>
              <path
                d={state.path}
                className={cn(
                  "stroke-background stroke-[1.5] transition-all duration-200",
                  isActive ? regionColor.active : "fill-muted",
                  !isActive && !isDisabled && "hover:fill-muted-foreground/30",
                  isDisabled && "opacity-40 cursor-not-allowed"
                )}
              />
              <text
                x={state.cx}
                y={state.cy}
                textAnchor="middle"
                dominantBaseline="central"
                className={cn(
                  "text-[10px] font-bold pointer-events-none select-none",
                  isActive ? "fill-white" : "fill-muted-foreground"
                )}
              >
                {state.uf}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Active count */}
      <p className="text-[10px] text-muted-foreground text-center">
        {activeStates.size} estado{activeStates.size !== 1 ? "s" : ""} ativo{activeStates.size !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
