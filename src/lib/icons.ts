// One icon per outline section. Kept out of outline.ts so node scripts can import the outline.
import type { Component } from 'svelte';
import Compass from '@lucide/svelte/icons/compass';
import Globe from '@lucide/svelte/icons/globe';
import Terminal from '@lucide/svelte/icons/terminal';
import Split from '@lucide/svelte/icons/split';
import ShieldCheck from '@lucide/svelte/icons/shield-check';
import Database from '@lucide/svelte/icons/database';
import Zap from '@lucide/svelte/icons/zap';
import MessagesSquare from '@lucide/svelte/icons/messages-square';
import Boxes from '@lucide/svelte/icons/boxes';
import Lock from '@lucide/svelte/icons/lock';
import Infinity from '@lucide/svelte/icons/infinity';
import Briefcase from '@lucide/svelte/icons/briefcase';
import Layers from '@lucide/svelte/icons/layers';

const icons: Record<string, Component> = {
	'start-here': Compass,
	networking: Globe,
	linux: Terminal,
	edge: Split,
	availability: ShieldCheck,
	databases: Database,
	caching: Zap,
	communication: MessagesSquare,
	architecture: Boxes,
	security: Lock,
	devops: Infinity,
	'case-studies': Briefcase
};

export const sectionIcon = (slug: string): Component => icons[slug] ?? Layers;
