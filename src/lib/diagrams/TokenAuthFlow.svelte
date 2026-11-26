<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'client', label: 'Client', x: 20, y: 80, w: 120 },
		{ id: 'auth', label: 'Auth server', x: 220, y: 20, w: 130 },
		{ id: 'api', label: 'API', x: 420, y: 140, w: 120 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Log in: the client sends the user\'s credentials to the auth server (authentication).', moves: [{ from: 'client', to: 'auth' }] },
		{ caption: 'Token issued: the auth server checks them and returns a signed, short-lived access token (a JWT).', moves: [{ from: 'auth', to: 'client' }] },
		{ caption: 'Call the API: every request carries the token, usually in the Authorization header.', moves: [{ from: 'client', to: 'api' }] },
		{ caption: 'Allowed: the API verifies the signature and expiry locally, then checks the user\'s role may do this (authorization).', moves: [{ from: 'api', to: 'client' }] },
		{ caption: 'Denied: an expired token gets 401; a valid token without permission gets 403.', moves: [{ from: 'api', to: 'client', fail: true }] }
	];
</script>

<FlowWalkthrough
	title="Token-based login: from credentials to allowed or denied"
	desc="A client, an auth server that issues tokens, and an API that checks them."
	viewBox="0 0 560 200"
	{boxes}
	{steps}
/>
