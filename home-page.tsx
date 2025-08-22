import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Navigation } from "@/components/ui/navigation";
import { Dashboard } from "@/components/sections/dashboard";
import { Timesheet } from "@/components/sections/timesheet";
import { Invoices } from "@/components/sections/invoices";
import { Materials } from "@/components/sections/materials";
import { Tools } from "@/components/sections/tools";
import { Vacations } from "@/components/sections/vacations";
import { Vehicles } from "@/components/sections/vehicles";
import TemplateSelectionPage from "@/pages/template-selection-page";

export type Section = 'dashboard' | 'timesheet' | 'invoices' | 'materials' | 'tools' | 'vacations' | 'vehicles' | 'templates';

export default function HomePage() {
  const [currentSection, setCurrentSection] = useState<Section>('dashboard');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Listen for navigation events from dashboard buttons
  useEffect(() => {
    const handleNavigateSection = (event: CustomEvent<Section>) => {
      setCurrentSection(event.detail);
    };

    document.addEventListener('navigate-section', handleNavigateSection as EventListener);
    return () => {
      document.removeEventListener('navigate-section', handleNavigateSection as EventListener);
    };
  }, []);

  const renderSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'timesheet':
        return <Timesheet selectedTemplate={selectedTemplate} />;
      case 'invoices':
        return <Invoices />;
      case 'materials':
        return <Materials />;
      case 'tools':
        return <Tools />;
      case 'vacations':
        return <Vacations />;
      case 'vehicles':
        return <Vehicles />;
      case 'templates':
        return (
          <TemplateSelectionPage
            onTemplateSelect={(template) => {
              setSelectedTemplate(template);
              setCurrentSection('timesheet');
            }}
            onBack={() => setCurrentSection('dashboard')}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2 text-white hover:bg-white/20 transition-colors"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar Navigation */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-black/40 backdrop-blur-xl border-r border-gray-800/50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full pt-16 lg:pt-8 px-4">
          <h2 className="text-2xl font-bold text-white mb-8 text-center tracking-tight">Sistema</h2>
          
          <nav className="space-y-2 flex-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
              { id: 'timesheet', label: 'Folhas de Horas', icon: '⏰' },
              { id: 'templates', label: 'Templates', icon: '📋' },
              { id: 'invoices', label: 'Faturas', icon: '💰' },
              { id: 'materials', label: 'Materiais', icon: '📦' },
              { id: 'tools', label: 'Ferramentas', icon: '🔧' },
              { id: 'vacations', label: 'Férias', icon: '🏖️' },
              { id: 'vehicles', label: 'Veículos', icon: '🚗' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentSection(item.id as Section);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                  currentSection === item.id
                    ? 'bg-blue-500/20 text-white border border-blue-500/30'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
