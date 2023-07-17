import React from 'react';

import { CarousalNavigation } from './mui_extensions/Navigation';
import FtStep3_1 from './FtStep3_1';
import FtStep3_2 from './FtStep3_2';

export const FtStep3 = (props: any): JSX.Element => {
  const showStep = (): JSX.Element | null => {
    switch (props.carouselStep) {
      case 1:
        return (
          <FtStep3_1
            frameTimingResult={props.frameTimingResult}
            calcInitialized={props.calcInitialized}
          />
        );

      case 2:
        return <FtStep3_2 />;

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100% - 48px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {showStep()}
      <CarousalNavigation
        steps={2}
        onStepClick={(step: number) => props.setCarouselStep(step)}
        sx={{ position: 'absolute', bottom: 0 }}
      />
    </div>
  );
};

export default FtStep3;
