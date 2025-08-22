import { useAuth } from "@/hooks/use-auth";
import { Button } from "./button";
import { 
  Building, LayoutDashboard, Clock, FileText, Package, 
  Wrench, Calendar, Car, LogOut, User 
} from "lucide-react";
import type { Section } from "@/pages/home-page";

interface NavigationProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
}

export function Navigation({ currentSection, onSectionChange }: NavigationProps) {
  const { user, logoutMutation } = useAuth();

  const navItems = [
    { id: 'dashboard' as Section, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'timesheet' as Section, label: 'Folha de Horas', icon: Clock },
    { id: 'invoices' as Section, label: 'Faturas', icon: FileText },
    { id: 'materials' as Section, label: 'Materiais', icon: Package },
    { id: 'tools' as Section, label: 'Ferramentas', icon: Wrench },
    { id: 'vacations' as Section, label: 'Férias', icon: Calendar },
    { id: 'vehicles' as Section, label: 'Veículos', icon: Car },
  ];

  const getUserInitials = (fullName: string | null | undefined, username: string) => {
    if (fullName) {
      return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-glass border-r border-glass z-30">
      <div className="flex flex-col h-full p-6">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Gestão Pro</h1>
            <p className="text-xs text-blue-200">Sistema Empresarial</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`nav-item w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-smooth ${
                  currentSection === item.id 
                    ? 'bg-gradient-primary text-white shadow-glow' 
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="mt-auto">
          <div className="flex items-center space-x-3 p-4 bg-glass rounded-lg mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {getUserInitials(user?.fullName, user?.username || '')}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">
                {user?.fullName || user?.username}
              </p>
              <p className="text-xs text-blue-200 capitalize">
                {user?.role === 'admin' ? 'Administrador' : 'Técnico'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="text-blue-300 hover:text-white p-2"
              disabled={logoutMutation.isPending}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
