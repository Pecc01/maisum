
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Package, MapPin, Clock, Users, Share2, Settings } from "lucide-react";
import { 
  getAllTrackingData, 
  saveTrackingData, 
  deleteTrackingData, 
  TrackingData, 
  TrackingStep 
} from "@/lib/tracking";
import { getUsers, createUser, deleteUser, User } from "@/lib/auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { buildShareLink } from "@/lib/utils";
import { saveTrackingToCloud } from "@/lib/cloud";

const AdminDashboard = () => {
  const [packages, setPackages] = useState<TrackingData[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<TrackingData | null>(null);
  
  // User Management State
  const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();

  // Form states
  const [code, setCode] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [status, setStatus] = useState("");

  // New Step Form states
  const [newStepStatus, setNewStepStatus] = useState("");
  const [newStepLocation, setNewStepLocation] = useState("");
  const [newStepDate, setNewStepDate] = useState("");
  const [newStepTime, setNewStepTime] = useState("");
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [publicBaseUrl, setPublicBaseUrl] = useState<string>("");

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = () => {
    setPackages(getAllTrackingData());
  };

  const handleOpenUsers = () => {
    setUsers(getUsers());
    setNewUsername("");
    setNewPassword("");
    setIsUsersDialogOpen(true);
  };
  const handleOpenConfig = () => {
    if (typeof window !== "undefined" && window.localStorage) {
      setPublicBaseUrl(window.localStorage.getItem("publicBaseUrl") || "");
    } else {
      setPublicBaseUrl("");
    }
    setIsConfigDialogOpen(true);
  };
  const handleSaveConfig = () => {
    if (!publicBaseUrl) {
      toast({ title: "Informe a URL pública", variant: "destructive" });
      return;
    }
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("publicBaseUrl", publicBaseUrl);
    }
    setIsConfigDialogOpen(false);
    toast({ title: "URL pública configurada" });
  };

  const handleCreateUser = () => {
    if (!newUsername || !newPassword) {
      toast({ title: "Preencha usuário e senha", variant: "destructive" });
      return;
    }
    
    const success = createUser({
      username: newUsername,
      password: newPassword,
      createdAt: new Date().toLocaleDateString('pt-BR'),
    });

    if (success) {
      toast({ title: "Usuário criado com sucesso" });
      setUsers(getUsers());
      setNewUsername("");
      setNewPassword("");
    } else {
      toast({ title: "Usuário já existe", variant: "destructive" });
    }
  };

  const handleDeleteUser = (username: string) => {
    if (confirm(`Tem certeza que deseja remover o usuário ${username}?`)) {
      const success = deleteUser(username);
      if (success) {
        toast({ title: "Usuário removido" });
        setUsers(getUsers());
      } else {
        toast({ title: "Não é possível remover o último usuário", variant: "destructive" });
      }
    }
  };

  const handleLogout = () => {
    navigate("/login");
  };

  const openNewPackageDialog = () => {
    setCurrentPackage(null);
    setCode("");
    setOrigin("");
    setDestination("");
    setCurrentLocation("");
    setEstimatedDelivery("");
    setStatus("Postado");
    setIsDialogOpen(true);
  };

  const openEditPackageDialog = (pkg: TrackingData) => {
    setCurrentPackage(pkg);
    setCode(pkg.code);
    setOrigin(pkg.origin);
    setDestination(pkg.destination);
    setCurrentLocation(pkg.currentLocation || "");
    setEstimatedDelivery(pkg.estimatedDelivery);
    setStatus(pkg.status);
    setIsDialogOpen(true);
  };

  const handleDelete = (pkgCode: string) => {
    if (confirm("Tem certeza que deseja excluir este rastreio?")) {
      deleteTrackingData(pkgCode);
      loadPackages();
      toast({ title: "Rastreio excluído com sucesso" });
    }
  };

  const handleSavePackage = () => {
    if (!code || !origin || !destination) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    const newPackage: TrackingData = currentPackage ? { ...currentPackage } : {
      code,
      origin,
      destination,
      estimatedDelivery,
      status,
      steps: [],
    };

    // Update basic info
    newPackage.code = code;
    newPackage.origin = origin;
    newPackage.destination = destination;
    newPackage.currentLocation = currentLocation;
    newPackage.estimatedDelivery = estimatedDelivery;
    newPackage.status = status;

    saveTrackingData(newPackage);
    saveTrackingToCloud(newPackage);
    loadPackages();
    setIsDialogOpen(false);
    toast({ title: currentPackage ? "Rastreio atualizado" : "Rastreio criado" });
  };

  const handleShare = (pkg: TrackingData) => {
    const link = buildShareLink(pkg);
    type NavigatorWithShare = Navigator & { share?: (data: { title?: string; text?: string; url?: string }) => Promise<void> };
    const nav = navigator as NavigatorWithShare;
    if (nav.share) {
      nav.share({ title: "Rastreio", text: "Acompanhe seu pedido", url: link })
        .then(() => {
          toast({ title: "Link compartilhado" });
        })
        .catch(() => {
          navigator.clipboard.writeText(link)
            .then(() => toast({ title: "Link copiado", description: link }))
            .catch(() => toast({ title: "Copie este link", description: link, variant: "destructive" }));
        });
      return;
    }
    navigator.clipboard.writeText(link)
      .then(() => toast({ title: "Link copiado", description: link }))
      .catch(() => toast({ title: "Copie este link", description: link, variant: "destructive" }));
  };

  const handleAddStep = () => {
    if (!currentPackage || !newStepStatus || !newStepLocation) return;

    const newStep: TrackingStep = {
      id: Date.now().toString(),
      status: newStepStatus,
      location: newStepLocation,
      date: newStepDate || new Date().toLocaleDateString('pt-BR'),
      time: newStepTime || new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
      isCompleted: true,
      isCurrent: true,
    };

    // Mark previous current step as not current
    const updatedSteps = currentPackage.steps.map(s => ({ ...s, isCurrent: false }));
    updatedSteps.push(newStep);

    // Sort steps? Usually latest last. 
    // Assuming simple append is fine for now, user can manage dates.

    const updatedPackage = { 
      ...currentPackage, 
      steps: updatedSteps,
      status: newStepStatus // Update main status to match latest step
    };

    saveTrackingData(updatedPackage);
    saveTrackingToCloud(updatedPackage);
    setCurrentPackage(updatedPackage);
    loadPackages(); // Refresh list
    
    // Reset step form
    setNewStepStatus("");
    setNewStepLocation("");
    setNewStepDate("");
    setNewStepTime("");
    
    toast({ title: "Movimentação adicionada" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="container mx-auto py-8 px-4 flex-1 pt-24 lg:pt-28">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
            <p className="text-gray-500">Gerencie suas encomendas e rastreios</p>
          </div>
          <div className="space-x-4">
             <Button variant="outline" onClick={handleOpenUsers}>
              <Users className="mr-2 h-4 w-4" /> Gerenciar Admins
             </Button>
             <Button variant="outline" onClick={handleOpenConfig}>
              <Settings className="mr-2 h-4 w-4" /> Configurar Link
             </Button>
             <Button variant="outline" onClick={handleLogout}>Sair</Button>
             <Button onClick={openNewPackageDialog} className="bg-[#ff5e1e] hover:bg-[#ff5e1e]/90">
              <Plus className="mr-2 h-4 w-4" /> Novo Rastreio
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.code}>
                  <TableCell className="font-medium">{pkg.code}</TableCell>
                  <TableCell>{pkg.status}</TableCell>
                  <TableCell>{pkg.origin}</TableCell>
                  <TableCell>{pkg.destination}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditPackageDialog(pkg)}>
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleShare(pkg)}>
                      <Share2 className="h-4 w-4 text-emerald-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(pkg.code)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {packages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Nenhum rastreio encontrado. Crie um novo!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentPackage ? "Editar Rastreio" : "Novo Rastreio"}</DialogTitle>
            <DialogDescription>
              Preencha as informações da encomenda abaixo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código de Rastreio</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} disabled={!!currentPackage} />
              </div>
              <div className="space-y-2">
                <Label>Status Atual</Label>
                <Input value={status} onChange={(e) => setStatus(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Localização Atual (Onde está)</Label>
                <Input value={currentLocation} onChange={(e) => setCurrentLocation(e.target.value)} placeholder="Ex: Centro de Distribuição SP" />
              </div>
              <div className="space-y-2">
                <Label>Origem</Label>
                <Input value={origin} onChange={(e) => setOrigin(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Destino (Para onde vai)</Label>
                <Input value={destination} onChange={(e) => setDestination(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Previsão de Entrega</Label>
                <Input value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} />
              </div>
            </div>

            {currentPackage && (
              <>
                <Separator className="my-4" />
                <h3 className="text-lg font-semibold">Histórico de Movimentações</h3>
                
                <div className="bg-slate-50 p-4 rounded-md space-y-4">
                  <h4 className="font-medium text-sm text-gray-600">Adicionar Nova Movimentação</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Status (ex: Saiu para entrega)" value={newStepStatus} onChange={e => setNewStepStatus(e.target.value)} />
                    <Input placeholder="Localização (ex: São Paulo, SP)" value={newStepLocation} onChange={e => setNewStepLocation(e.target.value)} />
                    <Input type="date" value={newStepDate} onChange={e => setNewStepDate(e.target.value)} />
                    <Input type="time" value={newStepTime} onChange={e => setNewStepTime(e.target.value)} />
                  </div>
                  <Button onClick={handleAddStep} size="sm" variant="secondary" className="w-full">
                    Adicionar Movimentação
                  </Button>
                </div>

                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                  <div className="space-y-4">
                    {currentPackage.steps.slice().reverse().map((step) => (
                      <div key={step.id} className="flex items-start gap-3 text-sm">
                        <div className="mt-1">
                          {step.isCompleted ? <Package className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-gray-400" />}
                        </div>
                        <div className="grid gap-1">
                          <p className="font-medium">{step.status}</p>
                          <p className="text-gray-500">{step.location}</p>
                          <p className="text-xs text-gray-400">{step.date} - {step.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePackage} className="bg-[#ff5e1e]">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUsersDialogOpen} onOpenChange={setIsUsersDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Administradores</DialogTitle>
            <DialogDescription>Adicione ou remova acesso ao painel.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-slate-50 p-4 rounded-md space-y-3">
              <h4 className="font-medium text-sm">Adicionar Novo Admin</h4>
              <div className="space-y-2">
                <Input placeholder="Usuário" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
                <Input type="password" placeholder="Senha" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <Button onClick={handleCreateUser} className="w-full bg-[#ff5e1e]">Criar Usuário</Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Usuários Existentes</h4>
              <div className="border rounded-md divide-y">
                {users.map((user) => (
                  <div key={user.username} className="flex items-center justify-between p-3 text-sm">
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-xs text-gray-500">Criado em: {user.createdAt}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.username)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar URL Pública</DialogTitle>
            <DialogDescription>Defina o domínio para gerar links de compartilhamento</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>URL pública (ex: https://lalamovee-brasil.vercel.app)</Label>
              <Input
                placeholder="https://seu-dominio.vercel.app"
                value={publicBaseUrl}
                onChange={(e) => setPublicBaseUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveConfig} className="bg-[#ff5e1e]">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
