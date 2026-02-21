import { useState } from "react";
import { ChevronDown, ChevronRight, Check, Lock, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SectionDef, FieldDef } from "@/lib/document-sections";
import { calculateSectionCompletion } from "@/lib/document-sections";

interface Props {
  section: SectionDef;
  data: Record<string, any>;
  processoData?: Record<string, any>;
  inheritedKeys?: Set<string>;
  onChange: (key: string, value: string) => void;
  isActive: boolean;
  isUnlocked: boolean;
  onActivate: () => void;
  sectionRef?: React.RefObject<HTMLDivElement>;
}

export function SectionCard({
  section,
  data,
  processoData,
  inheritedKeys,
  onChange,
  isActive,
  isUnlocked,
  onActivate,
  sectionRef,
}: Props) {
  const [expanded, setExpanded] = useState(isActive);
  const { filled, total, complete } = calculateSectionCompletion(section, data);

  const handleToggle = () => {
    if (!isUnlocked) return;
    setExpanded(!expanded);
    onActivate();
  };

  const getFieldValue = (field: FieldDef) => {
    if (field.source === "processo" && processoData) {
      return processoData[field.key] ?? "";
    }
    return data[field.key] ?? "";
  };

  return (
    <div ref={sectionRef}>
      <Card
        className={cn(
          "transition-all",
          !isUnlocked && "opacity-50",
          isActive && "ring-1 ring-primary/30",
        )}
      >
        <button
          onClick={handleToggle}
          className="flex items-center justify-between w-full px-4 py-3 text-left"
          disabled={!isUnlocked}
        >
          <div className="flex items-center gap-2">
            {!isUnlocked ? (
              <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
            ) : complete ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-yellow-500" />
            )}
            <span className="text-sm font-medium">{section.label}</span>
            {section.required && (
              <Badge variant="outline" className="text-[9px] px-1 py-0">
                Obrigatório
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              {filled}/{total}
            </span>
            {isUnlocked && (
              expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
            )}
          </div>
        </button>

        {expanded && isUnlocked && (
          <CardContent className="pt-0 pb-4 px-4 space-y-3">
            {section.fields.map((field) => {
              const value = getFieldValue(field);
              const isInherited = inheritedKeys?.has(field.key);

              return (
                <div key={field.key} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs">{field.label}</Label>
                    {isInherited && (
                      <Badge variant="secondary" className="text-[8px] px-1 py-0 bg-blue-50 text-blue-600 border-blue-200">
                        herdado
                      </Badge>
                    )}
                  </div>
                  {field.type === "textarea" ? (
                    <Textarea
                      value={value}
                      onChange={(e) => onChange(field.key, e.target.value)}
                      readOnly={field.readOnly}
                      className={cn(
                        "text-sm min-h-[80px]",
                        field.readOnly && "bg-muted cursor-not-allowed",
                        isInherited && "border-blue-200 bg-blue-50/30"
                      )}
                    />
                  ) : field.type === "select" ? (
                    <Select
                      value={value}
                      onValueChange={(v) => onChange(field.key, v)}
                      disabled={field.readOnly}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={value}
                      onChange={(e) => onChange(field.key, e.target.value)}
                      readOnly={field.readOnly}
                      className={cn(
                        "text-sm",
                        field.readOnly && "bg-muted cursor-not-allowed",
                        isInherited && "border-blue-200 bg-blue-50/30"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
