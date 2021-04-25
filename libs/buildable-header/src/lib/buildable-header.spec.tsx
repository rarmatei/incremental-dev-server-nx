import { render } from '@testing-library/react';

import BuildableHeader from './buildable-header';

describe('BuildableHeader', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<BuildableHeader />);
    expect(baseElement).toBeTruthy();
  });
});
