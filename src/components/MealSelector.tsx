import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RotateCcw, Search } from 'lucide-react';
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

interface MealSelectorProps {
  meals: Meal[];
  onSelect: (meal: Meal) => void;
  onRandomize: () => void;
  onClose: () => void;
}

const MealSelector = ({ meals, onSelect, onRandomize, onClose }: MealSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMeals = meals.filter(meal =>
    meal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meal.ingredients.some(ing => 
      ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getImageSrc = (imagePath: string) => {
    const filename = imagePath.split('/').pop() || '';
    return imageMap[filename] || imagePath;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[80vh] overflow-hidden bg-card pt-6 pb-8 px-6 box-border"
      >
        <DialogHeader>
          <DialogTitle>Select a Meal</DialogTitle>
        </DialogHeader>
        
        <div>
          {/* Controls */}
          <div className="flex gap-4 mb-4">
            <Button
              onClick={() => {
                onRandomize();
                onClose();
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Randomizar
            </Button>
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar comidas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Meals Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-h-[60vh] overflow-y-auto p-4 scrollbar-hide">
            {filteredMeals.map((meal) => (
              <div
                key={meal.id}
                className="rounded-2xl p-5 cursor-pointer hover:scale-105 transition-all duration-300 ease-out border border-border hover:shadow-lg"
                style={{ backgroundColor: `${meal.color}70` }}
                onClick={() => onSelect(meal)}
              >
                <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-white">
                  <img 
                    src={getImageSrc(meal.image)} 
                    alt={meal.title}
                    className="w-full h-full object-cover transition-transform duration-300"
                  />
                </div>
                <h4 className="font-semibold text-sm text-center mb-1">{meal.title}</h4>
                <p className="text-xs text-muted-foreground text-center">{meal.kcal} Kcal</p>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MealSelector;
