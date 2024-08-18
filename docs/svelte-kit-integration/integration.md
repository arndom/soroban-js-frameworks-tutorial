---
sidebar_position: 2
---

# Integrate UI with contract

Connectting our **Interface** with our **Contract**

## Contract Functions

The contract has two functions which can be called by our application:

- `read_title`
- `set_title`

To be able to access these functions, we need the contract details:

```json
[
  {
    "contractId": "greeting",
    "networkPassphrase": "Test SDF Network ; September 2015",
    "contractAddress": "CDWGVPSUXXSGABQ663FVV4TZJH4Q2R3HVAKTKWFFFMWPF23O7KMNS4KU"
  }
]
```
This is our **`deployments.json`** that indicates the address unique to this contract alone, deployed on the **testnet**.

## Interacting with the contract

To interact with our contract we need to have a wallet on the stellar network, there are a few options but for this we will be using
[Freighter Wallet](https://www.freighter.app/).

We will also be working on the test network as this is where the contract was deployed to.

With the above two understood, these are steps to interacting with out contract:

- Being able to access the network we are working with, usually called a **`chain`**
  - The testnet
- Being able to connect our wallet to the app, to sign transactions
  - In our case the sending of a message
  - Signing simply means to identify its you that carried out that action on the blockchain
- Being able to read from the blockhain via our contract

## Preparing our App

For Svelte there really isn't any package we can just plug in that would allow us interact with our contract. To do that we will have to work directly with the  [@stellar/stellar-sdk](https://github.com/stellar/js-stellar-sdk) to create our means of interactions.

Going forward, due to the fact that the principles for our integration interface follow similar processes to `react` we will take inspiration from [soroban-react](https://soroban-react.paltalabs.io/) to create some stores that will make our application work.

### Stores

- `sorobanStore` allows us:
  - Define our intial details like:
    - The `chain(s)` we want our app to support
    - The  `contract(s)` our app will use to talk to blockhain
    - The `wallet(s)` our app will support
    - And our app name
  - Access variables & functions that enable us:
    - Connect/Disconnect our wallet
    - Sending a messgae
    - Fetch the last message
- `lastMessage` is where we have our last message string stored
- `registeredContract` allows us:
  - Choose an available contract from contracts  defined in `sorobanStore`
  - Access that contracts details and also makes calls to its public functions
- `contractID` is where will be keeping our contract name which is majorly used by `registeredContract`

> All these stroes work together to make the app function.

:::info

The code for these **stores** are available [**`here`**](https://github.com/arndom/sveletekit-soroban-app/tree/main/src/lib/store)

:::


## Connecting our App
The steps below are how will be creating our app.

### Initialize our app with needed data

```tsx
<script lang="ts">
  import ChainSelect from "$lib/components/ChainSelect.svelte";
  import ChatBlock from "$lib/components/ChatBlock.svelte";
  import ChatFooter from "$lib/components/ChatFooter.svelte";
  import ChatHeader from "$lib/components/ChatHeader.svelte";
  import ConnectWallet from "$lib/components/ConnectWallet.svelte";
  import { testnet } from '@soroban-react/chains';
  import { freighter } from '@soroban-react/freighter';
  import type { ChainMetadata, Connector } from "@soroban-react/types";
  import deployments from "$lib/contract-deployments.json";
  import { sorobanStore } from "$lib/store/soroban";
  import { contractID } from "$lib/store/contract";
  import { lastMessage } from "$lib/store/message";
  import {onMount } from "svelte"
  import SorobanProvider from "$lib/components/SorobanProvider.svelte";

  const chains: ChainMetadata[] = [testnet];
  const connectors: Connector[] = [freighter()];
  const appName = "Soroban Demo - Nuxt";

  const lastMsgUsername = "Anon";

  onMount(() => {
    sorobanStore.update((prev) => {
      return {
        ...prev,
        chains,
        appName,
        activeChain: testnet,
        connectors,
        deployments
      }
    })

    contractID.set('greeting')
  });
</script>

<svelte:head>
	<title>Soroban Demo - SvelteKit</title>
	<meta name="description" content="Soroban Demo - SvelteKit" />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
    rel="stylesheet"
  >
</svelte:head>

<main class="min-h-[100vh] flex flex-col items-center gap-4 justify-center">
  <SorobanProvider>
    <div class="flex gap-2 justify-center">
      <ChainSelect />
      <ConnectWallet />
    </div>

    <div class="relative w-80 md:w-1/2 max-w-lg">
      <ChatHeader />

      <div class="bg-black px-4 pb-4 max-h-[400px] min-h-[200px] overflow-y-auto chat-container rounded-b-lg">
        <div class="chat-block">
          <div class="chat chat-end">
            <div class="chat-header mb-1">Last msg sent via contract</div>
            <ChatBlock username={lastMsgUsername} lastMessage={$lastMessage} />
          </div>
        </div>

        <ChatFooter />
      </div>
    </div>
  </SorobanProvider>
</main>
```

:::info

The ***`SorobanProvider`*** here is a component where we set other initial
data needed by the `sorobanStore` store and run functions in lifecycle events when updates occur.  The code for this can be found [*`here`*](https://github.com/arndom/sveletekit-soroban-app/blob/main/src/lib/components/SorobanProvider.svelte)

:::


### Enable button to `Connect/Disconnet Wallet`
With `sorobanStore` we now have access to:
- Functions to connect & disconnect our wallet to/from our app.

- Our wallet address

```tsx
<script lang="ts">
  import { sorobanStore } from "$lib/store/soroban";
  import { getShortAddress } from "$lib/utils";

  $: ({ address, setActiveConnectorAndConnect, connectors: browserWallets, disconnect  } = $sorobanStore);

  const handleConnect = () => {
    if (!setActiveConnectorAndConnect) return;
    setActiveConnectorAndConnect(browserWallets[0]);
  }

  const handleDisconnect = async () => {
    console.log("Disconnecting");
    await disconnect();
  }

  $: shortAddress = getShortAddress(address)
</script>

{#if Boolean(!address)}
  <div>
    <button class="btn btn-accent" on:click={handleConnect}>
      Connect Wallet
    </button>
    <p class="text-[0.6rem] text-center mt-1">Freighter only</p>
  </div>
{:else}
  <button class="bg-primary p-4 rounded-2xl text-black" on:click={handleDisconnect}>
    Account: <span class="font-bold">{shortAddress}</span>
  </button>
{/if}
```

### Enable our select input to `Choose Chain/Network`

- With `sorobanStore` we now have access to the chains we defined earlier in our [initialization](/svelte-kit-integration/integration#initialize-our-app-with-needed-data).

- We are also able to change the chain we want to work with.

```tsx
<script lang="ts">
  import { sorobanStore } from "$lib/store/soroban";
  import { afterUpdate } from "svelte";

  $: ({ activeChain, setActiveChain, chains } = $sorobanStore);

  $: supportedChains = chains;
  $: selected = activeChain?.name;

  afterUpdate(() => {
    const chain = supportedChains.find((chain) => chain.name === selected);

    if (chain && activeChain?.name !== chain.name) {
      setActiveChain && setActiveChain(chain);
      alert(`Active chain changed to ${chain.name}`);
    }
  });
</script>

<select class="select select-primary" bind:value={selected}>
	{#each supportedChains as chain (chain.name)}
    <option value={chain.name}>{chain.name}</option>
	{/each}
</select>
```

### Calling `read_title`

- With the contract name we defined [earlier](/svelte-kit-integration/integration#initialize-our-app-with-needed-data) as `greeting` we can now access to the contract details and can call its `read_title` function.

```tsx
  import { registeredContract } from "$lib/store/contract";

  $: if ($registeredContract) {
    const getLastmessage = async () => await fetchLastMessage($registeredContract).then(res => lastMessage.set(res));

    getLastmessage();
  }
```

### Sending a message with `set_title`
- This component uses the user input as the argument for calling the contract's`set_title` function

```tsx
<script lang="ts">
  import { registeredContract } from "$lib/store/contract";
  import { sorobanStore } from "$lib/store/soroban";
  import { nativeToScVal } from "@stellar/stellar-sdk";
  import ChatAvatar from "./ChatAvatar.svelte";
  import { lastMessage } from "$lib/store/message";
  import { getShortAddress } from "$lib/utils";

  $: ({ address } = $sorobanStore);

  let isSending = false;
  let message = "";
  $: shortAddress = getShortAddress(address)

  const handleSend = async () => {
    isSending = true;

    try {
      const result = await $registeredContract?.invoke({
        method: "set_title",
        args: [nativeToScVal(message, { type: "string" })],
        signAndSend: true,
      });

      console.log("🚀 « result:", result);
      alert("New message published");

      lastMessage.set(message)
      message = "";
    } catch (e) {
      console.error(e);
      alert("Error while sending tx. Try again…");
    } finally {
      isSending = false;
    }
  }
</script>

<div class="bg-black absolute bottom-0 left-0 px-4 w-full rounded-b-lg">
  <div class="flex items-center gap-1 my-4">
    <div class="h-[40px]">
      <ChatAvatar username={shortAddress} />
    </div>

    <input type="text" placeholder="Type message here..." class="input w-full rounded-3xl" bind:value={message} />

    <button class="btn btn-primary rounded-3xl" disabled={!address || isSending} on:click={handleSend}>
      { !isSending ? "Send" : "Sending..."  }
    </button>
  </div>
</div>
```
## Summary

Combining the above components allows us to create a fully functioning dApp.

:::tip

- Here is the [GitHub Repo](https://github.com/arndom/sveletekit-soroban-app) for this tutorial.
- [Live Demo](https://sveltekit-soroban.netlify.app/)

:::
