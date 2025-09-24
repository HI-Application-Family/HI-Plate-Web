import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import MealSelector from './MealSelector';
import { imageMap } from '../assets/imageMap';

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

interface WeekStripeProps {
  day: string;
  gradientClass: string;
  meal?: Meal;
  servings: number;
  onMealSelect: (meal: Meal) => void;
  onServingsChange: (servings: number) => void;
  onRandomize: () => void;
  meals: Meal[];
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getRandomUniqueMeals(meals: Meal[], n: number): Meal[] {
  if (n > meals.length) {
    throw new Error('No hay suficientes comidas para seleccionar sin repeticiones');
  }
  const shuffled = shuffleArray(meals);
  return shuffled.slice(0, n);
}

const WeekStripe = ({
  day,
  gradientClass,
  meal,
  servings,
  onMealSelect,
  onServingsChange,
  onRandomize,
  meals
}: WeekStripeProps) => {
  const [showSelector, setShowSelector] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const adjustedIngredients = meal?.ingredients.map(ingredient => ({
    ...ingredient,
    amount: ingredient.amount * servings
  }));

  const stripeStyle = meal?.color
    ? { backgroundColor: meal.color }
    : {};

  const getImageSrc = (imagePath: string) => {
    const filename = imagePath.split('/').pop() || '';
    return imageMap[filename] || imagePath;
  };

  return (
    <div className="flex flex-col items-center">
      {/* Day label above stripe */}
      <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8">
        <h3 className="text-lg font-bold text-foreground">{day}</h3>
      </div>

      <div
        className="relative h-[600px] w-[300px] overflow-hidden shadow-lg group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
        style={{ borderRadius: '150px 150px 0 0' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => !meal && setShowSelector(true)}
      >
        <div
          className={`h-full w-full p-6 flex flex-col transition-all duration-500 ${meal ? '' : 'bg-striped-gray'}`}
          style={meal ? stripeStyle : {}}
        >

          {meal ? (
            <>
              {/* Food image */}
              <div className="relative mb-4 transition-transform duration-500 ease-out">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-white shadow-lg">
                  <img
                    src={getImageSrc(meal.image)}
                    alt={meal.title}
                    className="w-full h-full object-cover transition-transform duration-300"
                  />
                </div>
              </div>

              {/* Meal info */}
              <div className="flex-1 text-white/90 space-y-3">
                <h4 className="font-bold text-lg">{meal.title}</h4>

                <div>
                  <h5 className="font-semibold mb-1">Ingredients</h5>
                  <p className="text-sm text-white/80">
                    {adjustedIngredients?.slice(0, 3).map(ing => ing.name).join(', ')}
                    {adjustedIngredients && adjustedIngredients.length > 3 && '...'}
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold mb-1">Macro</h5>
                  <div className="text-sm text-white/80 space-y-1">
                    <div>Proteínas ({(meal.protein * servings).toFixed(0)}g)</div>
                    <div>Carbohidratos ({(meal.carbs * servings).toFixed(0)}g)</div>
                    <div>Grasas ({(meal.fat * servings).toFixed(0)}g)</div>
                  </div>
                </div>

                <div className="text-lg font-bold">
                  {meal.kcal} Kcal/100g
                </div>

                {/* Servings control */}
                <div className="mt-auto">
                  <h5 className="font-semibold mb-2">Plates</h5>
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 p-2 transition-all duration-300 ease-out hover:scale-110 active:scale-95"
                      onClick={(e) => {
                        e.stopPropagation();
                        onServingsChange(Math.max(1, servings - 1));
                      }}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-xl font-bold transition-all duration-300 ease-out transform hover:scale-105">{servings}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 p-2 transition-all duration-300 ease-out hover:scale-110 active:scale-95"
                      onClick={(e) => {
                        e.stopPropagation();
                        onServingsChange(servings + 1);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Change button */}
              <div
                className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 transition-all duration-500 ease-out ${
                  isHovered
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
                }`}
              >
                <Button
                  variant="ghost"
                  className="text-white/80 hover:bg-white/20 transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSelector(true);
                  }}
                >
                  Change
                </Button>
              </div>
            </>
          ) : (
            // Empty state
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-white/80 transition-all duration-300 group-hover:scale-110">
                <div className="text-4xl mb-2">+</div>
                <div className="text-sm">Añadir</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Meal selector modal */}
      {showSelector && (
        <MealSelector
          meals={meals}
          onSelect={(selectedMeal) => {
            onMealSelect(selectedMeal);
            setShowSelector(false);
          }}
          onRandomize={onRandomize}
          onClose={() => setShowSelector(false)}
        />
      )}
    </div>
  );
};

export default WeekStripe;
