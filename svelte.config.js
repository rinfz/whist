import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

let paths = {};
if (process.env.NODE_ENV === 'production') {
	paths = { base: '/whist' };
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [preprocess({})],

	kit: {
		adapter: adapter(),

		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',
		paths,
	}
};

export default config;
