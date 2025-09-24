import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { imageMap } from '../assets/imageMap';

const loadScript = (url: string) => {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.body.appendChild(script);
  });
};

interface Meal {
  id: string;
  title: string;
  ingredients: Array<{ name: string; amount: number; unit: string }>;
  kcal: number;
  fat: number;
  carbs: number;
  protein: number;
  preparation: string;
  image: string;
  color: string;
}

interface WeekMeal {
  meal?: Meal;
  servings: number;
}

type WeekMeals = {
  [K in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']: WeekMeal;
};

interface ExportDialogProps {
  weekMeals: WeekMeals;
  onClose: () => void;
}

const DAYS = [
  { key: 'monday', name: 'Lunes' },
  { key: 'tuesday', name: 'Martes' },
  { key: 'wednesday', name: 'Miércoles' },
  { key: 'thursday', name: 'Jueves' },
  { key: 'friday', name: 'Viernes' },
  { key: 'saturday', name: 'Sábado' },
  { key: 'sunday', name: 'Domingo' },
] as const;

const ExportDialog = ({ weekMeals, onClose }: ExportDialogProps) => {
  const { toast } = useToast();
  const [isJspdfLoaded, setIsJspdfLoaded] = useState(false);

  useEffect(() => {
    const loadLibraries = async () => {
      try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        setIsJspdfLoaded(true);
      } catch (error) {
        console.error('Error loading jsPDF', error);
      }
    };
    loadLibraries();
  }, []);

  const copyIngredients = () => {
    let ingredientsList = '';
    for (const day of DAYS) {
      const weekMeal = weekMeals[day.key];
      if (weekMeal.meal) {
        ingredientsList += `--- ${day.name} - ${weekMeal.meal.title} ---\n`;
        const adjustedIngredients = weekMeal.meal.ingredients.map(ing => ({
          ...ing,
          amount: ing.amount * weekMeal.servings,
        }));
        adjustedIngredients.forEach((ing) => {
          ingredientsList += `- ${ing.name}: ${ing.amount} ${ing.unit}\n`;
        });
        ingredientsList += '\n';
      }
    }

    navigator.clipboard.writeText(ingredientsList).then(() => {
      toast({
        title: "Lista de ingredientes copiada",
        description: "La lista se ha copiado al portapapeles.",
      });
    });
  };

  const getImageBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Failed to convert image to base64:", url, error);
      return '';
    }
  };

  const exportPDF = async () => {
    if (!isJspdfLoaded || !(window as any).jspdf) {
      toast({
        title: "Error",
        description: "La biblioteca de PDF no está cargada.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // @ts-ignore
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF();
      
      // Configurar fuentes y márgenes
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      // Definir márgenes
      const marginLeft = 15;
      const marginRight = 15;
      const marginTop = 20;
      const pageWidth = 210;
      const contentWidth = pageWidth - marginLeft - marginRight;
      let yPosition = marginTop;

      // Función para agregar texto con saltos de línea automáticos
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 5) => {
        const lines = pdf.splitTextToSize(text, maxWidth);
        lines.forEach((line: string, index: number) => {
          if (y + (index * lineHeight) > 280) {
            pdf.addPage();
            y = marginTop;
          }
          pdf.text(line, x, y + (index * lineHeight));
        });
        return y + (lines.length * lineHeight);
      };

      // Función para verificar si necesita nueva página
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > 280) {
          pdf.addPage();
          yPosition = marginTop;
          return true;
        }
        return false;
      };

      // Obtener todas las comidas que tienen datos
      const validMeals = DAYS.map(day => ({
        day: day.name,
        weekMeal: weekMeals[day.key]
      })).filter(item => item.weekMeal.meal);

      // Cargar imágenes para todas las comidas
      const imagesPromises = validMeals.map(async (item) => {
        const filename = item.weekMeal.meal!.image.split('/').pop() || '';
        const imageUrl = imageMap[filename as keyof typeof imageMap];
        const base64 = await getImageBase64(imageUrl);
        return { 
          id: item.weekMeal.meal!.id, 
          base64,
          day: item.day,
          weekMeal: item.weekMeal
        };
      });

      const loadedMeals = await Promise.all(imagesPromises);

      // Crear página de portada
      pdf.setFontSize(24);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Plan Semanal de Comidas', 105, 80, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Libro de Recetas', 105, 100, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text(`Total de recetas: ${validMeals.length}`, 105, 120, { align: 'center' });
      pdf.text('Generado por Hi Plate', 105, 140, { align: 'center' });

      pdf.addPage();

      // Crear una página para cada comida
      for (let i = 0; i < loadedMeals.length; i++) {
        const { day, weekMeal, base64 } = loadedMeals[i];
        const meal = weekMeal.meal!;

        // Nueva página para cada comida (excepto la primera que ya es la portada)
        if (i > 0) {
          pdf.addPage();
        }

        yPosition = marginTop;

        // Encabezado de la página
        pdf.setFontSize(18);
        pdf.setTextColor(40, 40, 40);
        pdf.setFont('helvetica', 'bold');
        pdf.text(meal.title, 105, yPosition, { align: 'center' });
        yPosition += 10;

        pdf.setFontSize(12);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Día: ${day} | Porciones: ${weekMeal.servings}`, 105, yPosition, { align: 'center' });
        yPosition += 15;

        // Línea separadora
        pdf.setDrawColor(200, 200, 200);
        pdf.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
        yPosition += 10;

        // Imagen de la comida
        if (base64) {
          checkPageBreak(90);
          const imgWidth = 80;
          const imgHeight = 80;
          const imgX = (pageWidth - imgWidth) / 2; // Centrar la imagen
          pdf.addImage(base64, 'JPEG', imgX, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 15;
        }

        // Información nutricional
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(60, 60, 60);
        pdf.text('Información Nutricional (por porción):', marginLeft, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80, 80, 80);
        
        const nutritionInfo = [
          `• Calorías: ${meal.kcal} kcal`,
          `• Proteínas: ${meal.protein}g`,
          `• Carbohidratos: ${meal.carbs}g`,
          `• Grasas: ${meal.fat}g`
        ];

        nutritionInfo.forEach(info => {
          checkPageBreak(5);
          pdf.text(info, marginLeft + 5, yPosition);
          yPosition += 5;
        });

        yPosition += 5;

        // Ingredientes
        checkPageBreak(15);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(60, 60, 60);
        pdf.text('Ingredientes:', marginLeft, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80, 80, 80);

        const adjustedIngredients = meal.ingredients.map(ing => ({
          ...ing,
          amount: ing.amount * weekMeal.servings,
        }));

        adjustedIngredients.forEach((ing) => {
          const ingredientText = `• ${ing.name}: ${ing.amount} ${ing.unit}`;
          yPosition = addWrappedText(ingredientText, marginLeft + 5, yPosition, contentWidth - 5);
          yPosition += 2; // Espacio entre ingredientes
        });

        yPosition += 5;

        // Preparación
        checkPageBreak(15);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(60, 60, 60);
        pdf.text('Preparación:', marginLeft, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80, 80, 80);

        // Limpiar y formatear el texto de preparación
        const cleanPreparation = meal.preparation
          .replace(/\s+/g, ' ') // Eliminar espacios múltiples
          .trim();

        yPosition = addWrappedText(cleanPreparation, marginLeft, yPosition, contentWidth, 5);

      }

      pdf.save('libro-recetas-semanal.pdf');
      
      toast({
        title: "PDF Exportado!",
        description: `El libro de recetas con ${validMeals.length} páginas se ha descargado correctamente.`,
      });
    } catch (error) {
      toast({
        title: "Fallo en la exportación",
        description: "No se pudo generar el PDF. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Opciones de Exportación</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Button
            onClick={copyIngredients}
            variant="outline"
            className="w-full flex items-center gap-2 justify-start"
          >
            <Copy className="h-4 w-4" />
            Copiar Lista de Recetas
            <span className="text-sm text-muted-foreground ml-auto">
              Platos e ingredientes
            </span>
          </Button>
          
          <Button
            onClick={exportPDF}
            variant="outline"
            className="w-full flex items-center gap-2 justify-start"
            disabled={!isJspdfLoaded}
          >
            <FileText className="h-4 w-4" />
            Exportar como PDF
            <span className="text-sm text-muted-foreground ml-auto">
              Una página por comida
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;