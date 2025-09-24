import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Upload } from 'lucide-react';
import WeekStripe from './WeekStripe';
import ExportDialog from './ExportDialog';
import mealsData from '@/data/meals.json';

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

const DAYS = [
  { key: 'monday', name: 'Lunes', gradient: 'bg-gradient-monday' },
  { key: 'tuesday', name: 'Martes', gradient: 'bg-gradient-tuesday' },
  { key: 'wednesday', name: 'Miércoles', gradient: 'bg-gradient-wednesday' },
  { key: 'thursday', name: 'Jueves', gradient: 'bg-gradient-thursday' },
  { key: 'friday', name: 'Viernes', gradient: 'bg-gradient-friday' },
  { key: 'saturday', name: 'Sábado', gradient: 'bg-gradient-saturday' },
  { key: 'sunday', name: 'Domingo', gradient: 'bg-gradient-sunday' },
] as const;

const WeekFood = () => {
  const [weekMeals, setWeekMeals] = useState<WeekMeals>({
    monday: { servings: 1 },
    tuesday: { servings: 1 },
    wednesday: { servings: 1 },
    thursday: { servings: 1 },
    friday: { servings: 1 },
    saturday: { servings: 1 },
    sunday: { servings: 1 },
  });

  const [showExport, setShowExport] = useState(false);
  const [meals] = useState<Meal[]>(mealsData);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const scrollVelocityRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const smoothScroll = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;

    container.scrollLeft += scrollVelocityRef.current;

    scrollVelocityRef.current *= 0.95;

    if (Math.abs(scrollVelocityRef.current) > 0.1) {
      rafRef.current = requestAnimationFrame(smoothScroll);
    } else {
      scrollVelocityRef.current = 0;
      rafRef.current = null;
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      scrollVelocityRef.current += e.deltaY * 0.5;

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(smoothScroll);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Obtener comidas ya asignadas en la semana
  const getAssignedMealIds = (): string[] => {
    return Object.values(weekMeals)
      .map(dayMeal => dayMeal.meal?.id)
      .filter(Boolean) as string[];
  };

  // Obtener comidas disponibles (no asignadas)
  const getAvailableMeals = (): Meal[] => {
    const assignedIds = getAssignedMealIds();
    return meals.filter(meal => !assignedIds.includes(meal.id));
  };

  // Obtener una comida aleatoria de las disponibles
  const getRandomMeal = (): Meal | null => {
    const availableMeals = getAvailableMeals();
    if (availableMeals.length === 0) return null;
    return availableMeals[Math.floor(Math.random() * availableMeals.length)];
  };

  // Obtener una comida aleatoria sin restricciones (para cuando no hay suficientes comidas)
  const getRandomMealUnrestricted = (): Meal => {
    return meals[Math.floor(Math.random() * meals.length)];
  };

  const handleMealSelect = (day: keyof WeekMeals, meal: Meal) => {
    setWeekMeals(prev => ({
      ...prev,
      [day]: { ...prev[day], meal }
    }));
  };

  const handleServingsChange = (day: keyof WeekMeals, servings: number) => {
    setWeekMeals(prev => ({
      ...prev,
      [day]: { ...prev[day], servings }
    }));
  };

  const handleRandomizeDay = (day: keyof WeekMeals) => {
    const randomMeal = getRandomMeal();
    if (randomMeal) {
      handleMealSelect(day, randomMeal);
    } else {
      // Si no hay comidas disponibles, usar una aleatoria sin restricciones
      const unrestrictedMeal = getRandomMealUnrestricted();
      handleMealSelect(day, unrestrictedMeal);
    }
  };

  const handleRandomizeAll = () => {
    // Crear una copia de las comidas disponibles
    let availableMeals = [...meals];
    const newWeekMeals = { ...weekMeals };

    DAYS.forEach(({ key }) => {
      if (availableMeals.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableMeals.length);
        const randomMeal = availableMeals[randomIndex];
        
        newWeekMeals[key] = {
          ...newWeekMeals[key],
          meal: randomMeal
        };

        // Remover la comida seleccionada de las disponibles
        availableMeals = availableMeals.filter(meal => meal.id !== randomMeal.id);
      } else {
        // Si no hay más comidas disponibles, usar una aleatoria
        newWeekMeals[key] = {
          ...newWeekMeals[key],
          meal: getRandomMealUnrestricted()
        };
      }
    });

    setWeekMeals(newWeekMeals);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header controls */}
      <div className="flex justify-between items-center p-6 pb-0">
        <h1 className="text-3xl font-bold text-foreground">Hi Plate</h1>

        <div className="flex gap-4">
          <Button
            onClick={handleRandomizeAll}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Randomizar
          </Button>

          <Button
            onClick={() => setShowExport(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="flex-1" /> 

      {/* Week stripes */}
      <div className="p-6 pt-0">
        <div 
          ref={scrollContainerRef}
          className="w-full overflow-x-auto scrollbar-hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
            {DAYS.map(({ key, name, gradient }) => (
              <WeekStripe
                key={key}
                day={name}
                gradientClass={gradient}
                meal={weekMeals[key].meal}
                servings={weekMeals[key].servings}
                onMealSelect={(meal) => handleMealSelect(key, meal)}
                onServingsChange={(servings) => handleServingsChange(key, servings)}
                onRandomize={() => handleRandomizeDay(key)}
                meals={meals}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Export Pop */}
      {showExport && (
        <ExportDialog
          weekMeals={weekMeals}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};

export default WeekFood;