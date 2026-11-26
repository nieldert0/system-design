<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'browser', label: 'User\'s browser', x: 20, y: 20, w: 150 },
		{ id: 'auth', label: 'Authorization server', x: 390, y: 20, w: 170 },
		{ id: 'app', label: 'App back end', x: 20, y: 150, w: 150 },
		{ id: 'api', label: 'API', x: 390, y: 150, w: 170 }
	];
	const steps: FlowStep[] = [
		{ caption: 'The app redirects the user to the authorization server.', moves: [{ from: 'browser', to: 'auth' }] },
		{ caption: 'The user logs in there and approves the requested scopes, such as read:calendar.', moves: [{ from: 'browser', to: 'auth' }] },
		{ caption: 'The server redirects back with a short-lived code, which reaches the app\'s back end.', moves: [{ from: 'auth', to: 'app' }] },
		{ caption: 'The app\'s back end swaps the code for an access token (and often a refresh token).', moves: [{ from: 'app', to: 'auth' }] },
		{ caption: 'The app calls the API with the access token.', moves: [{ from: 'app', to: 'api' }] }
	];
</script>

<FlowWalkthrough
	title="OAuth 2.0 authorization code flow"
	desc="The user's browser, the app's back end, the authorization server and the API that holds the user's data."
	viewBox="0 0 580 210"
	{boxes}
	{steps}
/>
