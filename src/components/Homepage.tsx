import { useState, useEffect } from 'react';
import WeekFood from './WeekFood';

const Homepage = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'fadeAndSlide' | 'showWeekFood'>('initial');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setAnimationPhase('fadeAndSlide');
    }, 1200);

    const timer2 = setTimeout(() => {
      setAnimationPhase('showWeekFood');
      setShowIntro(false);
    }, 2300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!showIntro) {
    return <WeekFood />;
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Stripes*/}
      <div className="absolute inset-0 flex items-center justify-center">
        {[
          'bg-gradient-monday',
          'bg-gradient-tuesday',
          'bg-gradient-wednesday',
          'bg-gradient-thursday',
          'bg-gradient-friday',
          'bg-gradient-saturday',
          'bg-gradient-sunday',
        ].map((gradient, index) => (
          <div
            key={index}
            className={`flex-1 h-[150vh] ${gradient} rounded-full transition-transform duration-[2100ms] ease-in-out ${
              animationPhase === 'fadeAndSlide' ? 'transform -translate-y-full' : ''
            }`}
            style={{
              transitionDelay: `${index * 110}ms`
            }}
          />
        ))}
      </div>

      {/* Title */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <h1
          className={`text-6xl md:text-8xl font-bold text-white drop-shadow-2xl transition-opacity duration-500 ${
            animationPhase === 'fadeAndSlide' ? 'opacity-0' : 'opacity-100'
          }`}
        >
          Hi Plate
        </h1>
      </div>

      {/* WeekFood */}
      {animationPhase === 'showWeekFood' && (
        <div className="absolute inset-0 animate-fade-in">
          <WeekFood />
        </div>
      )}
    </div>
  );
};

export default Homepage;
