import {addons} from '@storybook/addons';
import {create} from '@storybook/theming/create';

const theme = create({
  base: 'dark',
  brandTitle: 'Sentry Styleguide',
  brandUrl: '#',
  // To control appearance:
  // brandImage: 'http://url.of/some.svg',
});

console.log('manager');
addons.setConfig({
  showRoots: true,
  panelPosition: 'bottom',
  theme,
});
