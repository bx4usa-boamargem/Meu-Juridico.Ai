import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, User, Mail, Phone, Building2, Briefcase } from "lucide-react";

interface Profile {
  full_name: string;
  avatar_url: string;
  phone: string;
  cargo: string;
  orgao: string;
}

export default function Perfil() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    avatar_url: "",
    phone: "",
    cargo: "",
    orgao: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, avatar_url, phone, cargo, orgao")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (data) {
          setProfile({
            full_name: data.full_name ?? "",
            avatar_url: data.avatar_url ?? "",
            phone: data.phone ?? "",
            cargo: data.cargo ?? "",
            orgao: data.orgao ?? "",
          });
        } else if (error && error.code === "PGRST116") {
          // Profile doesn't exist yet, create it
          supabase.from("profiles").insert({ id: user.id }).then(() => {});
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        cargo: profile.cargo,
        orgao: profile.orgao,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Erro ao salvar perfil");
    } else {
      toast.success("Perfil salvo com sucesso!");
    }
    setSaving(false);
  };

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{profile.full_name || "Sem nome"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-1.5 text-sm">
                <User className="h-3.5 w-3.5" /> Nome completo
              </Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5 text-sm">
                <Mail className="h-3.5 w-3.5" /> E-mail
              </Label>
              <Input id="email" value={user?.email ?? ""} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1.5 text-sm">
                <Phone className="h-3.5 w-3.5" /> Telefone
              </Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo" className="flex items-center gap-1.5 text-sm">
                <Briefcase className="h-3.5 w-3.5" /> Cargo
              </Label>
              <Input
                id="cargo"
                value={profile.cargo}
                onChange={(e) => setProfile({ ...profile, cargo: e.target.value })}
                placeholder="Seu cargo"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="orgao" className="flex items-center gap-1.5 text-sm">
                <Building2 className="h-3.5 w-3.5" /> Órgão
              </Label>
              <Input
                id="orgao"
                value={profile.orgao}
                onChange={(e) => setProfile({ ...profile, orgao: e.target.value })}
                placeholder="Nome do órgão"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
