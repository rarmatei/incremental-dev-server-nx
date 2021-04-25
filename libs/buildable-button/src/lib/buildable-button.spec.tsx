import { render } from '@testing-library/react';

import BuildableButton from './buildable-button';

describe('BuildableButton', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<BuildableButton />);
    expect(baseElement).toBeTruthy();
  });
});
