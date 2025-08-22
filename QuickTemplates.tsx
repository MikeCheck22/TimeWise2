import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Clock, Users, Wrench } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function QuickTemplates() {
  const templates = [
    {
      id: 'normal-day',
      title: 'Dia Normal Obra',
      description: '8h trabalho • 1h almoço • Deslocação incluída',
      icon: Building,
      color: 'bg-blue-500 hover:bg-blue-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600',
      data: {
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
        workType: 'Obra',
        description: 'Dia normal de trabalho em obra'
      }
    },
    {
      id: 'half-day',
      title: 'Meio Dia',
      description: '4h trabalho • Manhã ou tarde',
      icon: Clock,
      color: 'bg-green-500 hover:bg-green-600',
      iconBg: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600',
      data: {
        startTime: '08:00',
        endTime: '12:00',
        breakMinutes: 0,
        workType: 'Meio período',
        description: 'Meio período de trabalho'
      }
    },
    {
      id: 'client-meeting',
      title: 'Reunião Cliente',
      description: '2h reunião • Deslocação • Orçamento',
      icon: Users,
      color: 'bg-purple-500 hover:bg-purple-600',
      iconBg: 'bg-purple-100 dark:bg-purple-900',
      iconColor: 'text-purple-600',
      data: {
        startTime: '14:00',
        endTime: '16:00',
        breakMinutes: 0,
        workType: 'Reunião',
        description: 'Reunião com cliente para discussão de projeto'
      }
    },
    {
      id: 'maintenance',
      title: 'Manutenção',
      description: '3h manutenção • Ferramentas',
      icon: Wrench,
      color: 'bg-orange-500 hover:bg-orange-600',
      iconBg: 'bg-orange-100 dark:bg-orange-900',
      iconColor: 'text-orange-600',
      data: {
        startTime: '09:00',
        endTime: '12:00',
        breakMinutes: 0,
        workType: 'Manutenção',
        description: 'Manutenção preventiva de equipamentos'
      }
    }
  ];

  const useTemplate = (template: typeof templates[0]) => {
    // In a real app, this would populate the timesheet form
    toast({
      title: "Template Aplicado",
      description: `Template "${template.title}" aplicado ao formulário`
    });
    
    // Scroll to form section
    const formSection = document.querySelector('#form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {templates.map((template) => {
        const Icon = template.icon;
        return (
          <Card 
            key={template.id}
            className="bg-glass border-glass backdrop-blur-sm hover:shadow-glow transition-smooth cursor-pointer group"
            onClick={() => useTemplate(template)}
          >
            <CardContent className="p-6 text-center">
              <div className={`w-16 h-16 ${template.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-8 h-8 ${template.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {template.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {template.description}
              </p>
              <Button 
                className={`w-full transition-colors ${template.color}`}
                onClick={(e) => {
                  e.stopPropagation();
                  useTemplate(template);
                }}
              >
                Usar Template
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
