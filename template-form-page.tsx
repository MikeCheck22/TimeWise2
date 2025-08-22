import { useParams } from "wouter";
import TrabalhoNormalForm from "@/components/templates/trabalho-normal-form";
import TrabalhoReduzidoForm from "@/components/templates/trabalho-reduzido-form";
import TrabalhoFimSemanaForm from "@/components/templates/trabalho-fim-semana-form";
import FeriasForm from "@/components/templates/ferias-form";
import FaltaForm from "@/components/templates/falta-form";
import BaixaForm from "@/components/templates/baixa-form";

export default function TemplateFormPage() {
  const { templateType } = useParams<{ templateType: string }>();

  const renderForm = () => {
    switch (templateType) {
      case "trabalho-normal":
        return <TrabalhoNormalForm />;
      case "trabalho-reduzido":
        return <TrabalhoReduzidoForm />;
      case "trabalho-fim-semana":
        return <TrabalhoFimSemanaForm />;
      case "ferias":
        return <FeriasForm />;
      case "falta":
        return <FaltaForm />;
      case "baixa":
        return <BaixaForm />;
      default:
        return <div>Template não encontrado</div>;
    }
  };

  return renderForm();
}