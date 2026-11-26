// Glossary: each term's definition, its source, and the module that teaches it.
export type GlossaryEntry = {
	id: string;
	term: string;
	definition: string;
	module: string;
	source: { title: string; url: string; license: string };
};

const primer = (anchor: string) => ({
	title: 'The System Design Primer',
	url: `https://github.com/donnemartin/system-design-primer#${anchor}`,
	license: 'CC BY 4.0'
});

export const glossary: GlossaryEntry[] = [
	{
		id: 'latency',
		term: 'Latency',
		definition: 'The time to perform some action or to produce some result.',
		module: 'latency-vs-throughput',
		source: primer('latency-vs-throughput')
	},
	{
		id: 'throughput',
		term: 'Throughput',
		definition: 'The number of actions or results per unit of time.',
		module: 'latency-vs-throughput',
		source: primer('latency-vs-throughput')
	},
	{
		id: 'bandwidth',
		term: 'Bandwidth',
		definition: 'The maximum achievable speed or capacity of a channel. Throughput is what is actually achieved, and is always less.',
		module: 'latency-vs-throughput',
		source: {
			title: 'Wikipedia, Network throughput',
			url: 'https://en.wikipedia.org/wiki/Network_throughput',
			license: 'CC BY-SA 4.0'
		}
	},
	{
		id: 'littles-law',
		term: "Little's law",
		definition:
			'The average number of items in a system equals their average arrival rate multiplied by the average time each spends in the system (L = λW).',
		module: 'latency-vs-throughput',
		source: {
			title: "Wikipedia, Little's law",
			url: 'https://en.wikipedia.org/wiki/Little%27s_law',
			license: 'CC BY-SA 4.0'
		}
	}
];
